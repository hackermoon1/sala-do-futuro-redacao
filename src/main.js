const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743849431/menu.js',
    TEMPERATURE: 0.85
};

async function hackMUITextarea(textareaElement, textToInsert) {
    const textarea = textareaElement.querySelector('textarea');
    if (!textarea) return false;

    const methods = [
        async () => {
            const reactProps = Object.keys(textarea).filter(prop => prop.startsWith('__reactProps$') || prop.includes('__reactEventHandlers$'));
            for (const prop of reactProps) {
                const handler = textarea[prop];
                if (handler?.onChange) {
                    handler.onChange({ target: { value: textToInsert }, preventDefault: () => {}, stopPropagation: () => {} });
                    return textarea.value === textToInsert;
                }
            }
            return false;
        },
        async () => {
            textarea.value = textToInsert;
            textarea.dispatchEvent(new InputEvent('input', { bubbles: true, data: textToInsert }));
            return textarea.value === textToInsert;
        }
    ];

    for (const method of methods) {
        try {
            if (await method()) return true;
        } catch (error) {}
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
}

async function getAiResponse(prompt, modelIndex = 0) {
    const model = config.GEMINI_MODELS[modelIndex];
    const url = `${config.GEMINI_API_BASE}${model}?key=${config.API_KEY}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: config.TEMPERATURE, topP: 0.9, maxOutputTokens: 8192 }
            })
        });
        if (!response.ok) throw new Error('Erro na API');
        const data = await response.json();
        if (!data.candidates?.[0]?.content?.parts) throw new Error('Resposta inválida');
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (modelIndex < config.GEMINI_MODELS.length - 1) return await getAiResponse(prompt, modelIndex + 1);
        throw error;
    }
}

function showNotification(message, progress) {
    let notification = document.querySelector('.hck-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'hck-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(37, 37, 37, 0.9);
            color: #fff;
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            backdrop-filter: blur(5px);
            z-index: 10001;
            font-size: 14px;
            font-family: 'Inter', Arial, sans-serif;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    notification.textContent = `${message} - ${progress}%`;
    notification.style.opacity = '1';
    setTimeout(() => notification.style.opacity = '0', 2000);
}

async function generateAndAdaptEssay(theme, essayInfo) {
    const generationPrompt = `
        Você é um estudante brasileiro escrevendo uma redação escolar de forma natural e autêntica:
        - **Estrutura**: Introdução (tema e tese), Desenvolvimento (2 parágrafos com argumentos claros e exemplos concretos), Conclusão (resumo e solução/reflexão).
        - **Estilo**: 
          - Use linguagem simples, objetiva e fluida, como um estudante real.
          - Use palavras comuns e fáceis, sem gírias (ex.: "legal", "mano") ou termos difíceis (ex.: "paradigma", "epistemológico").
          - Inclua visão pessoal (ex.: "Eu penso que...") e exemplos reais (ex.: "Na minha escola...").
          - Use pontuação correta: apenas "." e "," para pausas naturais, sem "!" ou "?", quebras de linha após cada ideia completa.
          - Evite erros de IA: sem repetições, frases longas demais, vocabulário artificial ou generalizações vagas.
        - **Gênero textual**: "${essayInfo.generoTextual}".
        - **Critérios**: Siga rigorosamente "${essayInfo.criteriosAvaliacao}" (respeite cada ponto).
        - **Tamanho**: 25-30 linhas, como redação de vestibular.
        - **Base**: "${essayInfo.coletanea}" e "${essayInfo.enunciado}".

        Formato da resposta:
        TITULO: [Título curto, até 5 palavras, resumindo o texto]
        TEXTO: [Redação completa]
    `;

    showNotification('Gerando redação', 20);
    const aiResponse = await getAiResponse(generationPrompt);
    if (!aiResponse.includes('TITULO:') || !aiResponse.includes('TEXTO:')) {
        showNotification('Erro no formato', 0);
        throw new Error('Formato inválido');
    }

    const essayTitle = aiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
    const essayText = aiResponse.split('TEXTO:')[1].trim();

    const adaptationPrompt = `
        Adapte o texto abaixo para soar como escrito por um estudante humano brasileiro, corrigindo falhas de IA:
        - Mantenha o conteúdo e o significado original.
        - Use tom natural, com visão pessoal e exemplos concretos.
        - Use palavras simples e comuns, sem gírias ou termos complexos.
        - Corrija pontuação: use apenas "." e "," adequadamente, remova "!" ou "?", garanta quebras de linha após cada ideia completa.
        - Elimine padrões de IA: repetições, frases longas, vocabulário artificial ou transições forçadas.
        - Respeite os critérios: "${essayInfo.criteriosAvaliacao}".
        Texto para adaptar: "${essayText}"
    `;

    showNotification('Adaptando texto', 50);
    const humanizedText = await getAiResponse(adaptationPrompt);

    return { title: essayTitle, text: humanizedText };
}

async function checkAiScore(text) {
    showNotification('Verificando autenticidade', 70);
    const detectorPrompt = `
        Analise o texto abaixo e estime a probabilidade (%) de ser IA, com base nestas categorias:
        - **Repetições**: Uso excessivo de palavras ou frases (ex.: "Além disso" várias vezes).
        - **Pontuação**: Uso de "!" ou "?", vírgulas ilógicas, quebras de linha inadequadas.
        - **Estrutura**: Frases longas e uniformes, transições forçadas ou vagas.
        - **Vocabulário**: Gírias (ex.: "mano") ou termos complexos (ex.: "paradigma") fora de contexto.
        - **Conteúdo**: Generalizações sem exemplos concretos ou visão pessoal.
        - **Plágio**: Similaridade com textos conhecidos de IA ou falta de originalidade.
        - Retorne apenas um número entre 0 e 100 (0 = humano, 100 = IA).
        Texto: "${text}"
    `;
    const score = await getAiResponse(detectorPrompt);
    return parseInt(score, 10) || 50;
}

async function clearFields() {
    showNotification('Limpando campos', 10);
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (firstTextarea) await hackMUITextarea(firstTextarea, '');

    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (lastTextarea) await hackMUITextarea(lastTextarea, '');

    showNotification('Campos limpos', 100);
}

async function generateEssay() {
    const activityElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
    if (!activityElement || !activityElement.textContent.includes('Redação')) {
        showNotification('Erro: página inválida', 0);
        return;
    }

    showNotification('Coletando informações', 10);
    const essayInfo = {
        coletanea: document.querySelector('.css-1pvvm3t')?.innerText || '',
        enunciado: document.querySelector('.ql-align-justify')?.innerHTML || '',
        generoTextual: document.querySelector('.css-1cq7p20')?.innerHTML || '',
        criteriosAvaliacao: document.querySelector('.ql-editor')?.innerHTML || ''
    };
    const theme = essayInfo.enunciado.split(' ').slice(0, 5).join(' ');

    const { title, text } = await generateAndAdaptEssay(theme, essayInfo);

    const initialScore = await checkAiScore(text);
    showNotification(`Inicial: ${initialScore}% IA`, 80);

    const finalScore = await checkAiScore(text);
    showNotification(`Final: ${finalScore}% IA`, 90);

    showNotification('Inserindo título', 95);
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (!firstTextarea || !await hackMUITextarea(firstTextarea, title)) {
        showNotification('Erro no título', 0);
        return;
    }

    showNotification('Inserindo texto', 98);
    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (!lastTextarea || !await hackMUITextarea(lastTextarea, text)) {
        showNotification('Erro no texto', 0);
        return;
    }

    showNotification(`Concluído: ${100 - finalScore}% humano`, 100);
}

const script = document.createElement('script');
script.src = config.UI_SCRIPT_URL;
script.onload = () => console.log('[HCK REDAÇÃO] Menu carregado!');
script.onerror = () => showNotification('Erro ao carregar menu', 0);
document.head.appendChild(script);

console.log('[HCK REDAÇÃO] Iniciado!');
window.generateEssay = generateEssay;
window.clearFields = clearFields;

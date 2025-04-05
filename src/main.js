const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743847525/menu.js',
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
        alert(`HCK REDAÇÃO\n[ERROR] Falha na API Gemini: ${error.message}`);
        throw error;
    }
}

async function generateAndAdaptEssay(theme, essayInfo) {
    const generationPrompt = `
        Você é um estudante brasileiro escrevendo uma redação escolar de forma natural e autêntica:
        - **Estrutura**: Introdução (tema e tese), Desenvolvimento (2 parágrafos com argumentos claros e exemplos concretos), Conclusão (resumo e solução/reflexão).
        - **Estilo**: 
          - Use linguagem simples, objetiva e fluida, como um estudante real.
          - Inclua visão pessoal (ex.: "Eu vejo que...") e exemplos reais (ex.: "Na minha cidade...").
          - Use pontuação moderada: misture frases curtas e médias, evite "!" ou "?" excessivos, prefira pausas naturais com "." e ",".
          - Evite erros de IA: sem repetições (ex.: "Além disso" várias vezes), frases longas demais, vocabulário artificial ou generalizações vagas.
        - **Gênero textual**: "${essayInfo.generoTextual}".
        - **Critérios**: "${essayInfo.criteriosAvaliacao}".
        - **Tamanho**: 25-30 linhas, como redação de vestibular.
        - **Base**: "${essayInfo.coletanea}" e "${essayInfo.enunciado}".

        Formato da resposta:
        TITULO: [Título curto, até 8 palavras, resumindo o tema]
        TEXTO: [Redação completa]
    `;

    alert('HCK REDAÇÃO\n[INFO] Gerando redação com IA...');
    const aiResponse = await getAiResponse(generationPrompt);
    if (!aiResponse.includes('TITULO:') || !aiResponse.includes('TEXTO:')) {
        alert('HCK REDAÇÃO\n[ERROR] Formato inválido da resposta da IA');
        throw new Error('Formato inválido');
    }

    const essayTitle = aiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
    const essayText = aiResponse.split('TEXTO:')[1].trim();

    const adaptationPrompt = `
        Adapte o texto abaixo para soar como escrito por um estudante humano brasileiro, corrigindo falhas de IA:
        - Mantenha o conteúdo e o significado original.
        - Use tom natural, com visão pessoal e exemplos concretos.
        - Corrija pontuação: evite "!" ou "?" excessivos, use "." e "," para pausas naturais, misture frases curtas e médias.
        - Elimine padrões de IA: repetições, frases longas, vocabulário artificial ou transições forçadas.
        Texto para adaptar: "${essayText}"
    `;

    alert('HCK REDAÇÃO\n[INFO] Adaptando texto para escrita humana...');
    const humanizedText = await getAiResponse(adaptationPrompt);

    return { title: essayTitle, text: humanizedText };
}

async function checkAiScore(text) {
    alert('HCK REDAÇÃO\n[INFO] Verificando autenticidade...');
    const detectorPrompt = `
        Analise o texto abaixo e estime a probabilidade (em %) de ser IA, com base nestas categorias:
        - **Repetições**: Uso excessivo de palavras ou frases (ex.: "Além disso" várias vezes).
        - **Pontuação**: Excesso de "!" ou "?", vírgulas ilógicas, falta de pausas naturais.
        - **Estrutura**: Frases longas e uniformes, transições forçadas ou vagas.
        - **Conteúdo**: Generalizações sem exemplos concretos ou visão pessoal.
        - **Plágio**: Similaridade com textos conhecidos de IA (ex.: estilo robótico).
        - Retorne apenas um número entre 0 e 100 (0 = humano, 100 = IA).
        Texto: "${text}"
    `;
    const score = await getAiResponse(detectorPrompt);
    return parseInt(score, 10) || 50;
}

async function clearFields() {
    alert('HCK REDAÇÃO\n[INFO] Limpando campos...');
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (firstTextarea) await hackMUITextarea(firstTextarea, '');

    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (lastTextarea) await hackMUITextarea(lastTextarea, '');

    alert('HCK REDAÇÃO\n[SUCESSO] Campos limpos!');
}

async function generateEssay() {
    const activityElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
    if (!activityElement || !activityElement.textContent.includes('Redação')) {
        alert('HCK REDAÇÃO\n[ERROR] Use em uma página de redação!');
        return;
    }

    alert('HCK REDAÇÃO\n[INFO] Coletando informações...');
    const essayInfo = {
        coletanea: document.querySelector('.css-1pvvm3t')?.innerText || '',
        enunciado: document.querySelector('.ql-align-justify')?.innerHTML || '',
        generoTextual: document.querySelector('.css-1cq7p20')?.innerHTML || '',
        criteriosAvaliacao: document.querySelector('.ql-editor')?.innerHTML || ''
    };
    const theme = essayInfo.enunciado.split(' ').slice(0, 5).join(' ');

    const { title, text } = await generateAndAdaptEssay(theme, essayInfo);

    const initialScore = await checkAiScore(text);
    alert(`HCK REDAÇÃO\n[INFO] Verificação inicial: ${initialScore}% de chance de ser IA`);

    const finalScore = await checkAiScore(text);
    alert(`HCK REDAÇÃO\n[INFO] Verificação final: ${finalScore}% de chance de ser IA`);

    alert('HCK REDAÇÃO\n[INFO] Inserindo título...');
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (!firstTextarea || !await hackMUITextarea(firstTextarea, title)) {
        alert('HCK REDAÇÃO\n[ERROR] Falha ao inserir título');
        return;
    }

    alert('HCK REDAÇÃO\n[INFO] Inserindo texto...');
    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (!lastTextarea || !await hackMUITextarea(lastTextarea, text)) {
        alert('HCK REDAÇÃO\n[ERROR] Falha ao inserir texto');
        return;
    }

    alert(`HCK REDAÇÃO\n[SUCESSO] Redação inserida! Humanidade estimada: ${100 - finalScore}%`);
}

const script = document.createElement('script');
script.src = config.UI_SCRIPT_URL;
script.onload = () => console.log('[HCK REDAÇÃO] Menu carregado!');
script.onerror = () => alert('HCK REDAÇÃO\n[ERROR] Falha ao carregar o menu');
document.head.appendChild(script);

console.log('[HCK REDAÇÃO] Iniciado!');
window.generateEssay = generateEssay;
window.clearFields = clearFields;

const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743805356/menu.js',
    TEMPERATURE: 0.9,
    WIKIPEDIA_API: 'https://en.wikipedia.org/w/api.php'
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
        alert(`[ERROR] Falha na API Gemini: ${error.message}`);
        throw error;
    }
}

async function fetchHumanTextFromWikipedia(theme) {
    alert('[INFO] Buscando texto humano na Wikipedia...');
    try {
        const url = `${config.WIKIPEDIA_API}?action=query&list=search&srsearch=${encodeURIComponent(theme)}&format=json&origin=*`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro na Wikipedia API');
        const data = await response.json();
        const topResult = data.query.search[0]?.title;
        if (!topResult) throw new Error('Nenhum resultado encontrado');

        const contentUrl = `${config.WIKIPEDIA_API}?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(topResult)}&format=json&origin=*`;
        const contentResponse = await fetch(contentUrl);
        const contentData = await contentResponse.json();
        const page = Object.values(contentData.query.pages)[0];
        return page.extract || "A educação é essencial. Muitas escolas enfrentam dificuldades. Isso impacta os alunos.";
    } catch (error) {
        alert('[INFO] Falha na Wikipedia, usando exemplo padrão');
        return "A tecnologia avança rápido. As pessoas usam ferramentas digitais diariamente. Isso traz benefícios e desafios.";
    }
}

async function adaptFromWikipedia(text, theme) {
    const humanText = await fetchHumanTextFromWikipedia(theme);
    alert('[INFO] Adaptando texto com base em exemplo humano da Wikipedia...');
    return await getAiResponse(`
        Adapte o texto abaixo para soar como escrito por um estudante humano, usando o exemplo como referência de estilo:
        - Mantenha o conteúdo e o significado original
        - Use um tom natural, claro e fluido, com pontuação moderada (evite excesso de "!" ou "?")
        - Evite padrões de IA como frases longas demais, repetições ou vocabulário artificial
        Exemplo de escrita humana: "${humanText}"
        Texto para adaptar: "${text}"
    `);
}

async function checkAiScore(text) {
    alert('[INFO] Verificando autenticidade com Gemini...');
    const detectorPrompt = `
        Analise o texto abaixo e estime a probabilidade (em porcentagem) de ele ter sido escrito por IA:
        - Considere padrões como frases longas e uniformes, repetições excessivas ou vocabulário artificial como sinais de IA
        - Compare com escrita humana natural, que tem pontuação moderada e tom fluido
        - Retorne apenas um número entre 0 e 100, onde 0 é totalmente humano e 100 é totalmente IA
        Texto: "${text}"
    `;
    const score = await getAiResponse(detectorPrompt);
    return parseInt(score, 10) || 50;
}

async function clearFields() {
    alert('[INFO] Limpando campos...');
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (firstTextarea) await hackMUITextarea(firstTextarea, '');

    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (lastTextarea) await hackMUITextarea(lastTextarea, '');

    alert('[SUCESSO] Campos limpos!');
}

async function generateEssay() {
    const activityElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
    if (!activityElement || !activityElement.textContent.includes('Redação')) {
        alert('[ERROR] Use em uma página de redação!');
        return;
    }

    alert('[INFO] Coletando informações...');
    const essayInfo = {
        coletanea: document.querySelector('.css-1pvvm3t')?.innerText || '',
        enunciado: document.querySelector('.ql-align-justify')?.innerHTML || '',
        generoTextual: document.querySelector('.css-1cq7p20')?.innerHTML || '',
        criteriosAvaliacao: document.querySelector('.ql-editor')?.innerHTML || ''
    };
    const theme = essayInfo.enunciado.split(' ').slice(0, 5).join(' '); // Tema baseado nas primeiras 5 palavras

    const aiPrompt = `
        Você é um estudante brasileiro escrevendo uma redação escolar de forma natural e autêntica:
        - **Estrutura**: Introdução (apresente o tema e sua tese), Desenvolvimento (2 parágrafos com argumentos claros e exemplos reais), Conclusão (resuma e sugira uma solução ou reflexão).
        - **Estilo**: Use linguagem simples, objetiva e fluida, com pontuação moderada (evite excesso de "!" ou "?", prefira tom neutro).
        - **Gênero textual**: Adapte ao tipo "${essayInfo.generoTextual}".
        - **Critérios**: Siga "${essayInfo.criteriosAvaliacao}".
        - **Tamanho**: Aproximadamente 25-30 linhas, como uma redação típica de vestibular.
        - **Base**: Use "${essayInfo.coletanea}" e "${essayInfo.enunciado}" para embasar os argumentos.

        Formato da resposta:
        TITULO: [Título criativo e relacionado ao tema]
        TEXTO: [Redação completa]
    `;

    alert('[INFO] Gerando redação com IA...');
    let aiResponse;
    try {
        aiResponse = await getAiResponse(aiPrompt);
    } catch (error) {
        return;
    }
    if (!aiResponse.includes('TITULO:') || !aiResponse.includes('TEXTO:')) {
        alert('[ERROR] Formato inválido da resposta da IA');
        return;
    }

    const essayTitle = aiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
    let essayText = aiResponse.split('TEXTO:')[1].trim();

    const initialScore = await checkAiScore(essayText);
    alert(`[INFO] Verificação inicial: ${initialScore}% de chance de ser IA`);

    alert('[INFO] Adaptando texto com base na Wikipedia...');
    const humanizedText = await adaptFromWikipedia(essayText, theme);
    const finalScore = await checkAiScore(humanizedText);
    alert(`[INFO] Verificação final: ${finalScore}% de chance de ser IA`);

    alert('[INFO] Inserindo título...');
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (!firstTextarea || !await hackMUITextarea(firstTextarea, essayTitle)) {
        alert('[ERROR] Falha ao inserir título');
        return;
    }

    alert('[INFO] Inserindo texto...');
    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (!lastTextarea || !await hackMUITextarea(lastTextarea, humanizedText)) {
        alert('[ERROR] Falha ao inserir texto');
        return;
    }

    alert(`[SUCESSO] Redação inserida! Humanidade estimada: ${100 - finalScore}%`);
}

const script = document.createElement('script');
script.src = config.UI_SCRIPT_URL;
script.onload = () => console.log('[HCK REDAÇÃO] Menu carregado!');
script.onerror = () => alert('[ERROR] Falha ao carregar o menu');
document.head.appendChild(script);

console.log('[HCK REDAÇÃO] Iniciado!');
window.generateEssay = generateEssay;
window.clearFields = clearFields;

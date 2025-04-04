const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743802683/menu.js',
    TEMPERATURE: 0.8
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
        },
        async () => {
            textarea.focus();
            document.execCommand('insertText', false, textToInsert);
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
                generationConfig: {
                    temperature: config.TEMPERATURE,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 8192
                }
            })
        });
        if (!response.ok) throw new Error('Erro na API');
        const data = await response.json();
        if (!data.candidates?.[0]?.content?.parts) throw new Error('Resposta inválida');
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (modelIndex < config.GEMINI_MODELS.length - 1) return await getAiResponse(prompt, modelIndex + 1);
        alert(`[ERROR] Falha na API: ${error.message}`);
        throw error;
    }
}

async function humanizeText(text) {
    const apis = [
        async () => {
            const response = await fetch(`https://api.paraphrase-online.com/paraphrase?text=${encodeURIComponent(text)}`, {
                method: 'GET'
            });
            const data = await response.text();
            return data || text;
        },
        async () => {
            return await getAiResponse(`
                Reescreva o texto para parecer escrito por um estudante humano:
                - Mantenha o conteúdo e argumentos principais
                - Use linguagem natural, com imperfeições e coloquialismos ("tipo", "bem", "na real")
                - Varie o tamanho das frases
                Texto: ${text}
            `);
        }
    ];

    for (const api of apis) {
        try {
            const result = await api();
            if (result && result !== text) return result;
        } catch (error) {}
    }
    return text;
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

    const aiPrompt = `
    Você é um estudante brasileiro escrevendo uma redação escolar. Gere uma redação completa e natural com base nas informações fornecidas:
    - **Estrutura**: Introdução (apresente o tema e tese), Desenvolvimento (2 parágrafos com argumentos e exemplos), Conclusão (resuma e proponha algo).
    - **Estilo**: Use linguagem simples e coloquial ("tipo", "bem", "na real", "mano"), com variações naturais e pequenas imperfeições (repetições ou frases menos polidas).
    - **Gênero textual**: Adapte ao tipo ${essayInfo.generoTextual}.
    - **Critérios**: Siga ${essayInfo.criteriosAvaliacao}.
    - **Tamanho**: Aproximadamente 25-30 linhas, como uma redação típica de vestibular.
    - **Referências**: Use a coletânea ${essayInfo.coletanea} e o enunciado ${essayInfo.enunciado} para embasar os argumentos.

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

    alert('[INFO] Humanizando redação...');
    const humanizedText = await humanizeText(essayText);

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

    alert('[SUCESSO] Redação inserida com sucesso!');
}

const script = document.createElement('script');
script.src = config.UI_SCRIPT_URL;
script.onload = () => console.log('[HCK REDAÇÃO] Menu carregado!');
script.onerror = () => alert('[ERROR] Falha ao carregar o menu');
document.head.appendChild(script);

console.log('[HCK REDAÇÃO] Iniciado!');
window.generateEssay = generateEssay;

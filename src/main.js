const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODEL: 'gemini-pro:generateContent',
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743801918/menu.js',
    TEMPERATURE: 0.7
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

async function getAiResponse(prompt) {
    const url = `${config.GEMINI_API_BASE}${config.GEMINI_MODEL}?key=${config.API_KEY}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: config.TEMPERATURE,
                    topP: 0.95,
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
        alert(`[ERROR] Falha na API: ${error.message}`);
        throw error;
    }
}

async function generateEssay() {
    const activityElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
    if (!activityElement || !activityElement.textContent.includes('Redação')) {
        alert('[ERROR] Use em uma página de redação!');
        return;
    }

    alert('[INFO] Iniciando processo...');
    const essayInfo = {
        coletanea: document.querySelector('.css-1pvvm3t')?.innerText || '',
        enunciado: document.querySelector('.ql-align-justify')?.innerHTML || '',
        generoTextual: document.querySelector('.css-1cq7p20')?.innerHTML || '',
        criteriosAvaliacao: document.querySelector('.ql-editor')?.innerHTML || ''
    };

    const aiPrompt = `
    Gere uma redação natural para um estudante:
    - Estruture com introdução, 2 parágrafos de desenvolvimento e conclusão
    - Use linguagem simples e coloquial ("tipo", "bem", "na real")
    - Adapte ao gênero: ${essayInfo.generoTextual}
    - Siga os critérios: ${essayInfo.criteriosAvaliacao}
    Formato:
    TITULO: [Título]
    TEXTO: [Texto]
    Informações: ${JSON.stringify(essayInfo)}`;

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
    const essayText = aiResponse.split('TEXTO:')[1].trim();

    const humanizePrompt = `
    Reescreva o texto para parecer escrito por um estudante humano:
    - Mantenha o conteúdo intacto
    - Adicione imperfeições naturais ("tipo", "bem", "na real")
    - Varie frases
    Texto: ${essayText}`;

    alert('[INFO] Humanizando redação...');
    const humanizedText = await getAiResponse(humanizePrompt);

    alert('[INFO] Inserindo título...');
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (!await hackMUITextarea(firstTextarea, essayTitle)) {
        alert('[ERROR] Falha ao inserir título');
        return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    alert('[INFO] Inserindo texto...');
    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (!await hackMUITextarea(lastTextarea, humanizedText)) {
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

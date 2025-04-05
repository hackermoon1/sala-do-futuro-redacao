const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743847525/menu.js',
    TEMPERATURE: 0.9,
    WIKIPEDIA_API: 'https://en.wikipedia.org/w/api.php',
    OPEN_LIBRARY_API: 'https://openlibrary.org/api/books',
    GUTENBERG_API: 'https://gutendex.com/books'
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

async function fetchHumanText(theme) {
    const apis = [
        async () => {
            const url = `${config.WIKIPEDIA_API}?action=query&list=search&srsearch=${encodeURIComponent(theme)}&format=json&origin=*`;
            const response = await fetch(url);
            const data = await response.json();
            const topResult = data.query.search[0]?.title;
            if (!topResult) throw new Error('Sem resultado');
            const contentUrl = `${config.WIKIPEDIA_API}?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(topResult)}&format=json&origin=*`;
            const contentResponse = await fetch(contentUrl);
            const contentData = await contentResponse.json();
            return Object.values(contentData.query.pages)[0].extract;
        },
        async () => {
            const url = `${config.OPEN_LIBRARY_API}?bibkeys=ISBN:${Math.floor(Math.random() * 1000000000)}&format=json&jscmd=data`;
            const response = await fetch(url);
            const data = await response.json();
            const book = Object.values(data)[0];
            return book?.preview_text || book?.title || "Texto padrão de livro.";
        },
        async () => {
            const url = `${config.GUTENBERG_API}?search=${encodeURIComponent(theme)}`;
            const response = await fetch(url);
            const data = await response.json();
            return data.results[0]?.title || "Texto clássico em domínio público.";
        }
    ];

    for (const api of apis) {
        try {
            const text = await api();
            if (text && text.length > 50) {
                alert(`HCK REDAÇÃO\n[INFO] Texto obtido de ${api.name || 'fonte externa'}`);
                return text;
            }
        } catch (error) {
            console.log(`Falha em uma API: ${error.message}`);
        }
    }
    alert('HCK REDAÇÃO\n[INFO] Nenhuma API respondeu, usando exemplo padrão');
    return "A educação é essencial. Muitas escolas têm poucos recursos. Isso afeta o futuro.";
}

async function adaptText(text, theme) {
    const humanText = await fetchHumanText(theme);
    alert('HCK REDAÇÃO\n[INFO] Adaptando texto com base em fonte humana...');
    return await getAiResponse(`
        Adapte o texto abaixo para soar como escrito por um estudante humano brasileiro:
        - Mantenha o conteúdo e o significado original
        - Use um tom natural, claro e fluido, com pontuação moderada (evite excesso de "!" ou "?")
        - Traduza ou ajuste para português brasileiro, se necessário
        - Evite padrões de IA como frases longas, repetições ou vocabulário artificial
        Exemplo de escrita humana: "${humanText}"
        Texto para adaptar: "${text}"
    `);
}

async function checkAiScore(text) {
    alert('HCK REDAÇÃO\n[INFO] Verificando autenticidade...');
    const detectorPrompt = `
        Analise o texto abaixo e estime a probabilidade (em porcentagem) de ele ter sido escrito por IA:
        - Considere padrões como frases longas e uniformes, repetições ou vocabulário artificial como sinais de IA
        - Compare com escrita humana natural, com pontuação moderada e tom fluido
        - Retorne apenas um número entre 0 e 100, onde 0 é totalmente humano e 100 é totalmente IA
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

    alert('HCK REDAÇÃO\n[INFO] Gerando redação com IA...');
    let aiResponse;
    try {
        aiResponse = await getAiResponse(aiPrompt);
    } catch (error) {
        return;
    }
    if (!aiResponse.includes('TITULO:') || !aiResponse.includes('TEXTO:')) {
        alert('HCK REDAÇÃO\n[ERROR] Formato inválido da resposta da IA');
        return;
    }

    const essayTitle = aiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
    let essayText = aiResponse.split('TEXTO:')[1].trim();

    const initialScore = await checkAiScore(essayText);
    alert(`HCK REDAÇÃO\n[INFO] Verificação inicial: ${initialScore}% de chance de ser IA`);

    const humanizedText = await adaptText(essayText, theme);
    const finalScore = await checkAiScore(humanizedText);
    alert(`HCK REDAÇÃO\n[INFO] Verificação final: ${finalScore}% de chance de ser IA`);

    alert('HCK REDAÇÃO\n[INFO] Inserindo título...');
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (!firstTextarea || !await hackMUITextarea(firstTextarea, essayTitle)) {
        alert('HCK REDAÇÃO\n[ERROR] Falha ao inserir título');
        return;
    }

    alert('HCK REDAÇÃO\n[INFO] Inserindo texto...');
    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (!lastTextarea || !await hackMUITextarea(lastTextarea, humanizedText)) {
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

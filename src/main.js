const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyA97GWoG7AZOVDK5uXQFa0oMf5olNxMyrQ',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743499848/ui.js', // menu.js hospedado
    TIMEOUT: 15000,
    MAX_RETRIES: 3,
    TEMPERATURE: 0.7,
    USER_AGENTS: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 HCK-V5/1.0',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
    ],
    CORS_PROXIES: [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.codetabs.com/v1/proxy/?quest=',
        'https://thingproxy.freeboard.io/fetch/',
        'https://yacdn.org/proxy/',
        'https://cors.bridged.cc/',
        'https://proxy.cors.sh/',
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://cors.eu.org/'
    ]
};

function getRandomProxy() {
    return config.CORS_PROXIES[Math.floor(Math.random() * config.CORS_PROXIES.length)];
}

function getRandomUserAgent() {
    return config.USER_AGENTS[Math.floor(Math.random() * config.USER_AGENTS.length)];
}

async function fetchWithRetry(url, options, retries = config.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUT);
            const response = await fetch(url, { 
                ...options, 
                signal: controller.signal, 
                headers: { 
                    'User-Agent': getRandomUserAgent(),
                    'Origin': window.location.origin,
                    'Referer': window.location.href
                } 
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Erro ${response.status}`);
            return await response.json();
        } catch (error) {
            if (i === retries - 1) {
                return await fetchJSONP(url, options);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

async function fetchJSONP(url, options) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_' + Math.round(100000 * Math.random());
        window[callbackName] = data => {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };
        const script = document.createElement('script');
        script.src = `${url}&callback=${callbackName}`;
        script.onerror = () => reject(new Error('JSONP falhou'));
        document.body.appendChild(script);
    });
}

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
            const success = await method();
            if (success) return true;
        } catch (error) {}
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
}

async function getAiResponse(prompt, modelIndex = 0) {
    const proxy = getRandomProxy();
    const model = config.GEMINI_MODELS[modelIndex];
    const url = `${proxy}${config.GEMINI_API_BASE}${model}?key=${config.API_KEY}`;

    const options = {
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
    };

    try {
        const data = await fetchWithRetry(url, options);
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (modelIndex < config.GEMINI_MODELS.length - 1) {
            return await getAiResponse(prompt, modelIndex + 1);
        }
        throw error;
    }
}

async function analyzeText(text) {
    const url = `${getRandomProxy()}https://api.textrazor.com/`;
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-TextRazor-Key': 'SUA_CHAVE' },
        body: `text=${encodeURIComponent(text)}&extractors=entities,topics`
    };
    try {
        const data = await fetchWithRetry(url, options);
        return {
            entities: data.response.entities || [],
            topics: data.response.topics || []
        };
    } catch (error) {
        return { entities: [], topics: [] };
    }
}

async function humanizeText(text) {
    const analysis = await analyzeText(text);
    const enhancedPrompt = `
    Reescreva o texto para parecer escrito por um estudante humano:
    - Mantenha o conteúdo e argumentos principais
    - Use linguagem natural e coloquial ("tipo", "bem", "na real")
    - Varie o comprimento das frases
    - Incorpore temas detectados: ${JSON.stringify(analysis.topics.map(t => t.label))}
    - Mantenha entidades: ${JSON.stringify(analysis.entities.map(e => e.entityId))}
    Texto: ${text}`;

    const apis = [
        async () => await getAiResponse(enhancedPrompt),
        async () => {
            const url = `${getRandomProxy()}https://api.paraphraser.io/paraphrase?text=${encodeURIComponent(text)}&mode=fluent`;
            const response = await fetchWithRetry(url, { method: 'GET' });
            return response.paraphrased_text || text;
        },
        async () => {
            const url = `${getRandomProxy()}https://rewriter-api.com/rewrite?text=${encodeURIComponent(text)}&style=informal`;
            const response = await fetchWithRetry(url, { method: 'GET' });
            return response.rewritten_text || text;
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

    const essayInfo = {
        coletanea: document.querySelector('.css-1pvvm3t')?.innerText || '',
        enunciado: document.querySelector('.ql-align-justify')?.innerHTML || '',
        generoTextual: document.querySelector('.css-1cq7p20')?.innerHTML || '',
        criteriosAvaliacao: document.querySelector('.ql-editor')?.innerHTML || ''
    };

    const aiPrompt = `
    Gere uma redação natural e humanizada para um estudante:
    - Estruture com introdução, desenvolvimento (2 parágrafos) e conclusão
    - Use linguagem simples, com variações naturais e coloquialismos ("tipo", "bem", "na real")
    - Adapte ao gênero textual: ${essayInfo.generoTextual}
    - Siga os critérios: ${essayInfo.criteriosAvaliacao}
    Formato:
    TITULO: [Título]
    TEXTO: [Texto]
    Informações: ${JSON.stringify(essayInfo)}`;

    alert('[INFO] Gerando redação...');
    const aiResponse = await getAiResponse(aiPrompt);
    const [titlePart, textPart] = aiResponse.split('TEXTO:');
    const essayTitle = titlePart.split('TITULO:')[1].trim();
    const essayText = textPart.trim();

    alert('[INFO] Humanizando texto...');
    const humanizedText = await humanizeText(essayText);

    const firstTextarea = document.querySelector('textarea')?.parentElement;
    const lastTextarea = document.querySelectorAll('textarea')[document.querySelectorAll('textarea').length - 1]?.parentElement;

    await hackMUITextarea(firstTextarea, essayTitle);
    await new Promise(resolve => setTimeout(resolve, 500));
    await hackMUITextarea(lastTextarea, humanizedText);

    alert('[SUCESSO] Redação inserida!');
}

const script = document.createElement('script');
script.src = config.UI_SCRIPT_URL;
document.head.appendChild(script);

console.log('[HCK REDAÇÃO] Iniciado!');

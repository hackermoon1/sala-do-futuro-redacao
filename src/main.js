const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY', // Usada apenas para Gemini
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743499848/ui.js',
    TEMPERATURE: 0.8,
    HUMANIZE_APIS: [
        { name: 'Paraphrase (freeapi.app)', url: 'https://api.freeapi.app/api/v1/public/paraphrase', method: 'POST' },
        { name: 'Text Rewriter', url: 'https://text-rewriter.vercel.app/api/rewrite', method: 'POST' }
    ],
    DETECTOR_APIS: [
        { name: 'Hugging Face AI Detector', url: 'https://api-inference.huggingface.co/models/roberta-base-openai-detector', method: 'POST' },
        { name: 'Text Analysis (freeapi.app)', url: 'https://api.freeapi.app/api/v1/public/text-analysis', method: 'POST' }
    ]
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

async function humanizeText(text) {
    const results = [];
    for (const api of config.HUMANIZE_APIS) {
        try {
            const response = await fetch(api.url, {
                method: api.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!response.ok) throw new Error(`Erro na ${api.name}`);
            const data = await response.json();
            const humanizedText = data.paraphrased || data.result || text;
            results.push({ name: api.name, text: humanizedText });
            alert(`[INFO] Humanizado com ${api.name}`);
        } catch (error) {
            alert(`[INFO] Falha na ${api.name}: ${error.message}`);
        }
    }
    if (!results.length) {
        const fallbackText = await getAiResponse(`
            Reescreva o texto para soar natural e humano, sem gírias forçadas:
            - Mantenha o conteúdo e tom neutro
            - Use frases variadas e vocabulário comum
            Texto: ${text}
        `);
        results.push({ name: 'Fallback Gemini', text: fallbackText });
    }
    return results;
}

async function checkAiScore(text) {
    let bestScore = 50; // Valor padrão simulado
    for (const api of config.DETECTOR_APIS) {
        try {
            const response = await fetch(api.url, {
                method: api.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputs: text })
            });
            if (!response.ok) throw new Error(`Erro na ${api.name}`);
            const data = await response.json();
            const score = api.name.includes('Hugging Face') 
                ? Math.round((data[0]?.find(d => d.label === 'POSITIVE')?.score || 0.5) * 100) 
                : Math.round((data.ai_probability || 0.5) * 100);
            bestScore = Math.min(bestScore, score);
            alert(`[INFO] ${api.name}: ${score}% de chance de ser IA`);
        } catch (error) {
            alert(`[INFO] Falha na ${api.name}: ${error.message}`);
        }
    }
    return bestScore;
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
    Você é um estudante brasileiro escrevendo uma redação escolar de forma natural:
    - **Estrutura**: Introdução (tema e tese), Desenvolvimento (2 parágrafos com argumentos e exemplos), Conclusão (resumo e solução).
    - **Estilo**: Linguagem clara, objetiva e natural, sem gírias ou exageros.
    - **Gênero textual**: ${essayInfo.generoTextual}.
    - **Critérios**: ${essayInfo.criteriosAvaliacao}.
    - **Tamanho**: 25-30 linhas.
    - **Base**: Use ${essayInfo.coletanea} e ${essayInfo.enunciado}.

    Formato:
    TITULO: [Título relevante]
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

    alert('[INFO] Humanizando redação com APIs gratuitas...');
    const humanizedResults = await humanizeText(essayText);

    let bestResult = { name: '', text: essayText, score: initialScore };
    for (const result of humanizedResults) {
        const score = await checkAiScore(result.text);
        alert(`[INFO] ${result.name}: ${score}% de chance de ser IA`);
        if (score < bestResult.score) bestResult = { name: result.name, text: result.text, score };
    }

    alert(`[INFO] Melhor opção: ${bestResult.name} com ${bestResult.score}% de chance de ser IA`);
    const humanizedText = bestResult.text;

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

    alert(`[SUCESSO] Redação inserida! Humanizada por ${bestResult.name} (${bestResult.score}% IA)`);
}

const script = document.createElement('script');
script.src = config.UI_SCRIPT_URL;
script.onload = () => console.log('[HCK REDAÇÃO] Menu carregado!');
script.onerror = () => alert('[ERROR] Falha ao carregar o menu');
document.head.appendChild(script);

console.log('[HCK REDAÇÃO] Iniciado!');
window.generateEssay = generateEssay;

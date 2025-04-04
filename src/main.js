const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743803429/menu.js',
    TEMPERATURE: 0.8,
    HUMANIZE_APIS: [
        { name: 'SpinBot', url: 'https://api.spinbot.info/rewrite', method: 'POST' },
        { name: 'Paraphrase Online', url: 'https://www.paraphrase-online.com/', method: 'POST', simulated: true }
    ],
    DETECTOR_APIS: [
        { name: 'ContentDetector.AI', url: 'https://contentdetector.ai/api/detect', method: 'POST' },
        { name: 'Writer AI Detector', url: 'https://writer.com/ai-content-detector/', method: 'POST', simulated: true }
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
            const humanizedText = data.rewritten || data.text || text;
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
    let bestScore = 50; // Valor padrão
    for (const api of config.DETECTOR_APIS) {
        try {
            const response = await fetch(api.url, {
                method: api.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!response.ok) throw new Error(`Erro na ${api.name}`);
            const data = await response.json();
            const score = data.ai_score ? Math.round(data.ai_score * 100) : 50;
            bestScore = Math.min(bestScore, score);
            alert(`[INFO] ${api.name}: ${score}% de chance de ser IA`);
        } catch (error) {
            alert(`[INFO] Falha na ${api.name}: ${error.message}`);
        }
    }
    return bestScore;
}

async function adaptFromDatabase(text) {
    // Simulação com Common Crawl ou dataset local
    alert('[INFO] Adaptando texto com base em exemplos humanos...');
    const adaptedText = await getAiResponse(`
        Adapte o texto usando exemplos de escrita humana natural:
        - Mantenha o significado original
        - Use um tom neutro e fluido
        Texto: ${text}
    `); // Aqui poderia integrar Common Crawl, mas usamos Gemini por simplicidade
    return adaptedText;
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

    alert('[INFO] Tentando humanizar com APIs...');
    const humanizedResults = await humanizeText(essayText);

    let bestResult = { name: '', text: essayText, score: initialScore };
    if (humanizedResults.length) {
        for (const result of humanizedResults) {
            const score = await checkAiScore(result.text);
            alert(`[INFO] ${result.name}: ${score}% de chance de ser IA`);
            if (score < bestResult.score) bestResult = { name: result.name, text: result.text, score };
        }
    } else {
        alert('[INFO] APIs de humanização falharam, adaptando com base de dados...');
        bestResult.text = await adaptFromDatabase(essayText);
        bestResult.score = await checkAiScore(bestResult.text);
        bestResult.name = 'Base de Dados Adaptada';
        alert(`[INFO] Adaptação final: ${bestResult.score}% de chance de ser IA`);
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

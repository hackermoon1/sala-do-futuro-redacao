const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743803429/menu.js',
    TEMPERATURE: 0.9
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

// Simulação de uma base de dados de exemplos humanos
const textDatabase = [
    "A educação no Brasil enfrenta muitos desafios, como a falta de recursos nas escolas públicas. Muitos alunos não têm acesso a materiais básicos, o que dificulta o aprendizado. Além disso, os professores muitas vezes trabalham em condições ruins, com salários baixos e turmas lotadas. Isso tudo afeta a qualidade do ensino e o futuro dos jovens.",
    "O meio ambiente está em risco por causa do desmatamento e da poluição. As florestas estão sendo derrubadas para dar lugar a fazendas, e os rios estão cheios de lixo. A gente precisa mudar isso urgente, porque o planeta não aguenta mais. Cada um pode ajudar com pequenas ações, como reciclar ou economizar água.",
    "A tecnologia mudou muito a vida das pessoas nos últimos anos. Hoje, quase todo mundo usa celular pra tudo, desde falar com amigos até trabalhar. Mas também tem o lado ruim, tipo passar tempo demais nas redes sociais. É importante encontrar um equilíbrio pra aproveitar o que ela oferece sem exagerar."
];

async function adaptFromDatabase(text) {
    const randomExample = textDatabase[Math.floor(Math.random() * textDatabase.length)];
    alert('[INFO] Adaptando texto com base em exemplos humanos...');
    return await getAiResponse(`
        Adapte o texto abaixo para soar como escrito por um estudante humano, usando o exemplo como referência de estilo:
        - Mantenha o conteúdo e o significado original
        - Use um tom natural, claro e fluido, sem gírias exageradas
        - Ajuste o vocabulário e a estrutura das frases para parecer autêntico
        Exemplo de escrita humana: "${randomExample}"
        Texto para adaptar: "${text}"
    `);
}

async function checkAiScore(text) {
    alert('[INFO] Verificando autenticidade com Gemini...');
    const detectorPrompt = `
        Analise o texto abaixo e estime a probabilidade (em porcentagem) de ele ter sido escrito por um humano ou por IA:
        - Considere padrões como repetições, vocabulário artificial ou fluidez excessiva como sinais de IA
        - Baseie-se em exemplos de escrita humana natural para comparação
        - Retorne apenas um número entre 0 e 100, onde 0 é totalmente humano e 100 é totalmente IA
        Texto: "${text}"
    `;
    const score = await getAiResponse(detectorPrompt);
    return parseInt(score, 10) || 50; // Valor padrão se falhar
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
        Você é um estudante brasileiro escrevendo uma redação escolar de forma natural e autêntica:
        - **Estrutura**: Introdução (apresente o tema e sua tese), Desenvolvimento (2 parágrafos com argumentos claros e exemplos reais), Conclusão (resuma e sugira uma solução ou reflexão).
        - **Estilo**: Use linguagem simples, objetiva e fluida, como um estudante escreveria, evitando gírias forçadas ou vocabulário artificial.
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

    alert('[INFO] Adaptando texto com base de dados humana...');
    const humanizedText = await adaptFromDatabase(essayText);
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

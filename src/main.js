const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743805356/menu.js',
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

// Base de dados expandida pra 10 exemplos
const textDatabase = [
    "A educação no Brasil tem muitos problemas sérios. As escolas públicas, por exemplo, quase nunca têm o material que os alunos precisam pra estudar direito. Os professores também sofrem com salários baixos e salas cheias, o que deixa tudo mais difícil. Isso acaba prejudicando muito o futuro da juventude.",
    "O meio ambiente tá precisando de ajuda urgente. O desmatamento tá destruindo as florestas pra fazer fazenda, e os rios estão ficando cheios de sujeira. Se continuar assim, o planeta não vai aguentar. Todo mundo pode fazer algo simples, como separar o lixo ou gastar menos água.",
    "A tecnologia mudou tudo na nossa vida. Hoje, o celular serve pra falar com os outros, trabalhar e até estudar. Só que às vezes a gente exagera, fica horas nas redes sociais e esquece o resto. Acho que o segredo é usar com moderação.",
    "A violência nas cidades é um problema que não para de crescer. Tem assalto, briga e até coisa pior acontecendo todo dia. A polícia tenta ajudar, mas falta estrutura e mais segurança pras pessoas. Talvez investir em educação e emprego resolva um pouco isso.",
    "A saúde pública no Brasil deixa muita gente na mão. Os hospitais estão lotados, e às vezes falta remédio ou médico pra atender. Quem depende do SUS sofre pra conseguir consulta. Isso mostra como o governo precisa olhar mais pra essa área.",
    "O transporte público é uma confusão em vários lugares. Os ônibus vivem cheios, atrasam e quebram fácil. Quem trabalha ou estuda acaba perdendo tempo todo dia. Se tivesse mais investimento, talvez melhorasse a vida de muita gente.",
    "A desigualdade social é algo que a gente vê em todo canto. Tem gente com muito dinheiro e outros que não têm nem o básico pra viver. Isso vem de anos de políticas ruins e pouca oportunidade. Mudar isso leva tempo, mas é necessário.",
    "O acesso à cultura no Brasil é bem limitado. Museus e teatros são caros ou ficam só nas cidades grandes. Muita gente nunca teve chance de conhecer essas coisas. Levar cultura pra todos seria um jeito de abrir a cabeça das pessoas.",
    "O desemprego tá afetando um monte de famílias. Sem trabalho, fica difícil pagar as contas ou colocar comida em casa. As empresas dizem que tá tudo caro pra contratar. O governo podia ajudar mais com cursos ou incentivos.",
    "A alimentação saudável é um desafio hoje em dia. Comida boa, tipo fruta e verdura, custa caro, enquanto o fast food é mais barato. Isso faz as pessoas comerem mal e terem problema de saúde. Campanhas pra ensinar a comer melhor poderiam ajudar."
];

async function adaptFromDatabase(text) {
    const randomExample = textDatabase[Math.floor(Math.random() * textDatabase.length)];
    alert('[INFO] Adaptando texto com base em exemplos humanos...');
    return await getAiResponse(`
        Adapte o texto abaixo para soar como escrito por um estudante humano, usando o exemplo como referência de estilo:
        - Mantenha o conteúdo e o significado original
        - Use um tom natural, claro e fluido, com quebras de texto naturais (pontuação variada)
        - Evite padrões de IA como frases longas demais, repetições ou vocabulário artificial
        Exemplo de escrita humana: "${randomExample}"
        Texto para adaptar: "${text}"
    `);
}

async function checkAiScore(text) {
    alert('[INFO] Verificando autenticidade com Gemini...');
    const detectorPrompt = `
        Analise o texto abaixo e estime a probabilidade (em porcentagem) de ele ter sido escrito por IA:
        - Considere padrões como frases longas e uniformes, repetições excessivas ou vocabulário artificial como sinais de IA
        - Compare com escrita humana natural, que tem quebras de texto variadas e tom fluido
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

    const aiPrompt = `
        Você é um estudante brasileiro escrevendo uma redação escolar de forma natural e autêntica:
        - **Estrutura**: Introdução (apresente o tema e sua tese), Desenvolvimento (2 parágrafos com argumentos claros e exemplos reais), Conclusão (resuma e sugira uma solução ou reflexão).
        - **Estilo**: Use linguagem simples, objetiva e fluida, com quebras de texto naturais (pontuação variada: frases curtas e médias misturadas), evitando gírias forçadas, repetições ou vocabulário artificial.
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
window.clearFields = clearFields;

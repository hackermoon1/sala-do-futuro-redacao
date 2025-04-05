const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743857607/menu.js',
    TEMPERATURE: 0.7
};

const HUMAN_WRITER_PRO = {
    API_SETTINGS: {
        TEMPERATURE: 0.7,
        TOP_P: 0.85,
        MAX_TOKENS: 2800
    },

    generatePrompt: (essayInfo) => {
        return `
        Escreva uma redação ENEM com estas características HUMANAS:

        ▼▼ ESTRUTURA COMPROVADA ▼▼
        1) INTRODUÇÃO (5-6 linhas):
           - [Contexto atual] + [Dado da coletânea ou "pesquisas mostram"]
           - [Tese clara] sem "É necessário"
           - [Encaminhamento] com "Para entender..." ou "Analisando..."

        2) DESENVOLVIMENTO (2 parágrafos de 8-10 linhas):
           • Parágrafo 1:
             - [Argumento principal] (ex.: "O conhecimento científico ajuda a entender fenômenos")  
             - [Exemplo VEROSSÍMIL]  
             - [Comparação] com outro contexto  
             - [Análise] com "Isso demonstra que..."  

           • Parágrafo 2:
             - [Contraponto] ou [Complemento]  
             - [Causa/consequência] + [Dado aproximado]  
             - [Síntese] com "Portanto,..."

        3) CONCLUSÃO (5 linhas):
           - [Retomada da tese] sem repetir  
           - [Proposta CONCRETA] com agente (Ministério da Educação, escolas...)  
           - [Final memorável] com analogia simples

        ▼▼ TÉCNICAS DE HUMANIZAÇÃO ▼▼
        • Variação de frases:
          - 70% médias (12-20 palavras)
          - 20% curtas (≤8 palavras)
          - 10% longas (21-25 palavras)

        • Pontuação natural:
          - 1 vírgula por frase (no máximo)
          - 1 ponto-e-vírgula a cada 2 parágrafos
          - Zero travessões/parentêses

        • Vocabulário:
          - 3 sinônimos para termos-chave
          - 1 termo técnico explicado entre vírgulas
          - Expressões formais ("Em outras palavras")

        ▼▼ REGRAS DE OURO ▼▼
        × Nada de "É notório que" ou "Vide"
        × Máximo 1 citação indireta
        × Dados só da coletânea ou "estudos indicam"
        × Proposta com agente + ação + detalhe

        ▼▼ REGRAS ESPECÍFICAS DO CONTEXTO ▼▼
        - Use linguagem simples, objetiva e formal, como uma redação escolar.
        - Use palavras comuns e fáceis, sem gírias (ex.: "legal", "mano", "pra", "né") ou termos difíceis (ex.: "paradigma", "epistemológico").
        - Use "para" em vez de "pra", "as pessoas" em vez de "a gente", e evite tom conversacional (ex.: "virar esse jogo").
        - Use pontuação moderada: menos pontos finais, mais frases compostas com conjunções ("e", "mas", "porque"), apenas "." e "," para pausas naturais, sem "!" ou "?", quebras de linha após cada ideia completa.
        - Evite repetições de palavras ou ideias.
        - Não inclua tags HTML ou formatação (ex.: <p>, <strong>, <u>) no texto final.
        - Evite erros de IA: repetições, frases longas demais, vocabulário artificial ou generalizações vagas.
        - Não use opiniões pessoais (ex.: "Eu penso que...") ou exemplos da vida (ex.: "Na minha escola...").
        - **Gênero textual**: "${essayInfo.generoTextual || "dissertativo-argumentativo"}"
        - **Critérios**: Siga rigorosamente "${essayInfo.criteriosAvaliacao}" (ex.: explique como o conhecimento científico ajuda a entender fenômenos, mostre as características que diferenciam a ciência, tire conclusões baseadas em evidências). Não seja vago (ex.: "ciência ajuda a entender"), mas também não seja muito específico (ex.: citar fenômenos como "aquecimento global").
        - **Tamanho**: 28-32 linhas, com 1700 a 3080 caracteres (média de 2400 caracteres, considerando 60-70 caracteres por linha).
        - **Base**: "${essayInfo.coletanea.substring(0, 150)}..."
        - **Tema**: "${essayInfo.enunciado.split(' ').slice(0, 5).join(' ')}"

        Formato:
        TÍTULO: [3-4 palavras em maiúsculas]
        TEXTO: [28-32 linhas, 1700-3080 caracteres, média de 2400]
        `;
    },

    humanizeText: async (text) => {
        const fixes = {
            "É necessário": "Requer-se",
            "Por exemplo": "Como visto em",
            "Além disso": "Ademais",
            "No entanto": "Contudo"
        };
        
        return Object.entries(fixes).reduce((str, [from, to]) => 
            str.replace(new RegExp(from, 'g'), to), text);
    }
};

async function hackMUITextarea(textareaElement, textToInsert) {
    const textarea = textareaElement?.querySelector('textarea');
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
                generationConfig: { 
                    temperature: HUMAN_WRITER_PRO.API_SETTINGS.TEMPERATURE, 
                    topP: HUMAN_WRITER_PRO.API_SETTINGS.TOP_P, 
                    maxOutputTokens: HUMAN_WRITER_PRO.API_SETTINGS.MAX_TOKENS 
                }
            })
        });
        if (!response.ok) throw new Error('Erro na API');
        const data = await response.json();
        if (!data.candidates?.[0]?.content?.parts) throw new Error('Resposta inválida');
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (modelIndex < config.GEMINI_MODELS.length - 1) return await getAiResponse(prompt, modelIndex + 1);
        throw error;
    }
}

function showNotification(message, progress) {
    let notification = document.querySelector('.hck-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'hck-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(37, 37, 37, 0.9);
            color: #fff;
            padding: 10px 20px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            z-index: 10001;
            font-size: 14px;
            font-family: 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    notification.textContent = `${message} - ${progress}%`;
    notification.style.opacity = '1';
    setTimeout(() => notification.style.opacity = '0', 2000);
}

async function generateAndAdaptEssay(theme, essayInfo) {
    const prompt = HUMAN_WRITER_PRO.generatePrompt(essayInfo);
    showNotification('Gerando redação', 20);
    let essay = await getAiResponse(prompt);
    
    if (!essay.includes('TÍTULO:') || !essay.includes('TEXTO:')) {
        showNotification('Erro no formato', 0);
        throw new Error('Formato inválido');
    }

    const essayTitle = essay.split('TÍTULO:')[1].split('TEXTO:')[0].trim();
    let essayText = essay.split('TEXTO:')[1].trim();

    // Pós-processamento
    essayText = await HUMAN_WRITER_PRO.humanizeText(essayText);

    // Verificação de tamanho
    if (essayText.length < 1700) {
        const additionalPrompt = `
            Expanda o texto abaixo para garantir que tenha pelo menos 1700 caracteres, mantendo o tom formal e objetivo, e seguindo as mesmas regras de estrutura e humanização:
            Texto: "${essayText}"
        `;
        essayText = await getAiResponse(additionalPrompt);
    } else if (essayText.length > 3080) {
        essayText = essayText.substring(0, 3080).replace(/\s+\S*$/, '');
    }

    return { title: essayTitle, text: essayText };
}

async function checkAiScore(text) {
    showNotification('Verificando autenticidade', 70);
    const detectorPrompt = `
        Analise o texto abaixo e estime a probabilidade (%) de ser IA, com base nestas categorias:
        - **Repetições**: Uso excessivo de palavras ou frases.
        - **Pontuação**: Uso de "!" ou "?", mais de 1 vírgula por frase, presença de travessões/parentêses, falta de ponto-e-vírgula.
        - **Estrutura**: Frases longas, falta de frases ultra-curtas, ausência de variação entre períodos simples e compostos.
        - **Vocabulário**: Gírias (ex.: "pra", "né") ou termos complexos sem explicação.
        - **Conteúdo**: Generalizações vagas (ex.: "entender o mundo"), dados não mencionados, falta de argumentos objetivos.
        - **Plágio**: Similaridade com textos conhecidos de IA ou falta de originalidade.
        - **Formato**: Presença de tags HTML (ex.: <p>, <strong>) ou formatação inadequada.
        - **Tom**: Uso de tom conversacional (ex.: "a gente", "virar esse jogo").
        - **Padrões humanos**: Falta de frases ultra-curtas, variação de períodos, ou linguagem com níveis de formalidade.
        - Retorne apenas um número entre 0 e 100 (0 = humano, 100 = IA).
        Texto: "${text}"
    `;
    const score = await getAiResponse(detectorPrompt);
    return parseInt(score, 10) || 50;
}

async function clearTitle() {
    showNotification('Limpando título', 10);
    const allTextareas = document.querySelectorAll('textarea');
    if (allTextareas.length === 0) {
        showNotification('Nenhum campo de título encontrado', 0);
        return;
    }
    const firstTextarea = allTextareas[0]?.parentElement;
    if (firstTextarea && await hackMUITextarea(firstTextarea, '')) {
        showNotification('Título limpo', 100);
    } else {
        showNotification('Erro ao limpar título', 0);
    }
}

async function clearText() {
    showNotification('Limpando texto', 10);
    const allTextareas = document.querySelectorAll('textarea');
    if (allTextareas.length < 2) {
        showNotification('Nenhum campo de texto encontrado', 0);
        return;
    }
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (lastTextarea && await hackMUITextarea(lastTextarea, '')) {
        showNotification('Texto limpo', 100);
    } else {
        showNotification('Erro ao limpar texto', 0);
    }
}

async function clearAll() {
    showNotification('Limpando tudo', 10);
    const allTextareas = document.querySelectorAll('textarea');
    if (allTextareas.length === 0) {
        showNotification('Nenhum campo encontrado', 0);
        return;
    }
    let success = true;
    const firstTextarea = allTextareas[0]?.parentElement;
    if (firstTextarea) {
        success = success && await hackMUITextarea(firstTextarea, '');
    }
    if (allTextareas.length > 1) {
        const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
        if (lastTextarea) {
            success = success && await hackMUITextarea(lastTextarea, '');
        }
    }
    if (success) {
        showNotification('Tudo limpo', 100);
    } else {
        showNotification('Erro ao limpar campos', 0);
    }
}

async function generateEssay() {
    const activityElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
    if (!activityElement || !activityElement.textContent.includes('Redação')) {
        showNotification('Erro: página inválida', 0);
        return;
    }

    showNotification('Coletando informações', 10);
    const essayInfo = {
        coletanea: document.querySelector('.css-1pvvm3t')?.innerText || '',
        enunciado: document.querySelector('.ql-align-justify')?.innerHTML || '',
        generoTextual: document.querySelector('.css-1cq7p20')?.innerHTML || '',
        criteriosAvaliacao: document.querySelector('.ql-editor')?.innerHTML || ''
    };
    const theme = essayInfo.enunciado.split(' ').slice(0, 5).join(' ');

    const { title, text } = await generateAndAdaptEssay(theme, essayInfo);

    const initialScore = await checkAiScore(text);
    showNotification(`Inicial: ${initialScore}% IA`, 80);

    const finalScore = await checkAiScore(text);
    showNotification(`Final: ${finalScore}% IA`, 90);

    showNotification('Inserindo título', 95);
    const allTextareas = document.querySelectorAll('textarea');
    if (allTextareas.length === 0) {
        showNotification('Nenhum campo de título encontrado', 0);
        return;
    }
    const firstTextarea = allTextareas[0]?.parentElement;
    if (!firstTextarea || !await hackMUITextarea(firstTextarea, title)) {
        showNotification('Erro no título', 0);
        return;
    }

    showNotification('Inserindo texto', 98);
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (!lastTextarea || !await hackMUITextarea(lastTextarea, text)) {
        showNotification('Erro no texto', 0);
        return;
    }

    showNotification(`Concluído: ${100 - finalScore}% humano`, 100);
}

const script = document.createElement('script');
script.src = config.UI_SCRIPT_URL;
script.onload = () => console.log('[HCK REDAÇÃO] Menu carregado!');
script.onerror = () => showNotification('Erro ao carregar menu', 0);
document.head.appendChild(script);

console.log('[HCK REDAÇÃO] Iniciado!');
window.generateEssay = generateEssay;
window.clearTitle = clearTitle;
window.clearText = clearText;
window.clearAll = clearAll;

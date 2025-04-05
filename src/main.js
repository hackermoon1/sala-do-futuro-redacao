const config = {
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
    GEMINI_MODELS: ['gemini-2.0-flash:generateContent', 'gemini-pro:generateContent'],
    API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
    UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743849431/menu.js',
    TEMPERATURE: 0.85
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
            bottom: 60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(37, 37, 37, 0.9);
            color: #fff;
            padding: 8px 16px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            backdrop-filter: blur(5px);
            z-index: 10001;
            font-size: 14px;
            font-family: 'Inter', Arial, sans-serif;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    notification.textContent = `${message} - ${progress}%`;
    notification.style.opacity = '1';
    setTimeout(() => notification.style.opacity = '0', 2000);
}

async function generateAndAdaptEssay(theme, essayInfo) {
    const generationPrompt = `
        Você é um estudante brasileiro escrevendo uma redação escolar com marcas sutis de escrita humana, seguindo este algoritmo:

        ▼▼ 1. ANÁLISE DA COLETÂNEA ▼▼
        • Extraia 2-3 conceitos-chave (ex.: "conhecimento científico", "educação", "desinformação").
        • Identifique 1 contradição ou ironia presente (ex.: "Embora a ciência seja essencial, poucos a compreendem").
        • Selecione 1 dado real (se houver) ou use um dado aproximado (ex.: "cerca de 70%").

        ▼▼ 2. ESTRUTURA DINÂMICA ▼▼
        • **Introdução** (4-5 linhas):
          - [Contexto] + [Ironia/Contradição] (ex.: "A ciência avança, mas a sociedade, ironicamente, permanece desinformada").
          - [Tese] sem verbos no infinitivo (ex.: "A educação científica torna-se uma necessidade urgente").
        • **Desenvolvimento** (2 parágrafos):
          - Parágrafo 1: 
            [Argumento] + [Exemplo da coletânea, genérico] (ex.: "Em comunidades carentes, a falta de acesso é evidente") + [Análise] com comparação cultural (ex.: "Diferente de países onde a ciência é valorizada...").
          - Parágrafo 2: 
            [Contraponto] (ex.: "Por outro lado...") + [Referência histórica/artística] (ex.: "Na Idade Média, o conhecimento era restrito...") + [Consequência] + [Dado, se existir].
        • **Conclusão** (4 linhas):
          - [Solução] com agente específico (ex.: "O governo deve investir em educação científica").
          - [Final] com analogia inesperada (ex.: "como um farol que guia na escuridão").

        ▼▼ 3. TÉCNICAS ANTI-DETECÇÃO ▼▼
        • **Pontuação**:
          - Máximo 2 vírgulas por frase (ex.: "A ciência, essencial, ajuda a sociedade").
          - 1 ponto-e-vírgula a cada 10 frases (ex.: "A educação avança; a desinformação persiste").
          - Zero travessões.
        • **Sintaxe**:
          - 60% frases diretas (ex.: "A ciência ajuda as pessoas").
          - 30% inversões (ex.: "Preocupante é a falta de educação").
          - 10% frases nominais (ex.: "Necessidade urgente").
        • **Vocabulário**:
          - 3 sinônimos para cada termo-chave (ex.: "ciência" → "conhecimento", "pesquisa", "estudo").
          - 1 repetição estratégica (ex.: "A educação é essencial. Essencial para o futuro").

        ▼▼ 4. TESTE FINAL ▼▼
        • Nenhuma frase com mais de 25 palavras.
        • Nenhum dado não mencionado na coletânea (ou use dados aproximados).
        • Nenhuma citação direta (apenas reconstruída).
        • Variação de comprimento de parágrafos.

        ▼▼ 5. REGRAS ESPECÍFICAS DO CONTEXTO ▼▼
        - Use linguagem simples, objetiva e formal, como uma redação escolar.
        - Use palavras comuns e fáceis, sem gírias (ex.: "legal", "mano", "pra", "né") ou termos difíceis (ex.: "paradigma", "epistemológico").
        - Use "para" em vez de "pra", "as pessoas" em vez de "a gente", e evite tom conversacional (ex.: "virar esse jogo").
        - Use pontuação correta: apenas "." e "," para pausas naturais, sem "!" ou "?", quebras de linha após cada ideia completa.
        - Evite repetições de palavras ou ideias (exceto a repetição estratégica).
        - Não inclua tags HTML ou formatação (ex.: <p>, <strong>, <u>) no texto final.
        - Evite erros de IA: repetições, frases longas demais, vocabulário artificial ou generalizações vagas.
        - Não use opiniões pessoais (ex.: "Eu penso que...") ou exemplos da vida (ex.: "Na minha escola...").
        - **Gênero textual**: "${essayInfo.generoTextual}".
        - **Critérios**: Siga rigorosamente "${essayInfo.criteriosAvaliacao}" (ex.: explique como o conhecimento científico ajuda a entender fenômenos, mostre as características que diferenciam a ciência, tire conclusões baseadas em evidências). Não seja vago (ex.: "ciência ajuda a entender"), mas também não seja muito específico (ex.: citar fenômenos como "aquecimento global").
        - **Tamanho**: 25-30 linhas, com variação de comprimento de parágrafos.
        - **Base**: "${essayInfo.coletanea}" e "${essayInfo.enunciado}".

        Formato da resposta:
        TITULO: [Frase nominal de 3-4 palavras, sem verbo]
        TEXTO: [Redação completa, sem tags HTML]
    `;

    showNotification('Gerando redação', 20);
    const aiResponse = await getAiResponse(generationPrompt);
    if (!aiResponse.includes('TITULO:') || !aiResponse.includes('TEXTO:')) {
        showNotification('Erro no formato', 0);
        throw new Error('Formato inválido');
    }

    const essayTitle = aiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
    const essayText = aiResponse.split('TEXTO:')[1].trim();

    const adaptationPrompt = `
        Adapte o texto abaixo para soar como escrito por um estudante humano brasileiro, corrigindo falhas de IA:
        - Mantenha o conteúdo e o significado original.
        - Use tom formal e objetivo, sem opiniões pessoais (ex.: "Eu penso que...") ou exemplos da vida (ex.: "Na minha escola...").
        - Use palavras simples e comuns, sem gírias (ex.: "legal", "pra", "né") ou termos complexos (ex.: "paradigma").
        - Corrija sintaxe: use "para" em vez de "pra", "as pessoas" em vez de "a gente", evite tom conversacional (ex.: "virar esse jogo").
        - Corrija pontuação: use apenas "." e "," adequadamente, remova "!" ou "?", garanta quebras de linha após cada ideia completa.
        - Elimine padrões de IA: repetições, frases longas, vocabulário artificial ou transições forçadas.
        - Remova qualquer tag HTML (ex.: <p>, <strong>, <u>) do texto final.
        - Respeite os critérios: "${essayInfo.criteriosAvaliacao}" (ex.: explique como o conhecimento científico ajuda a entender fenômenos, mostre as características que diferenciam a ciência). Não seja vago, mas também não seja muito específico.
        - **Pontuação**: Máximo 2 vírgulas por frase, 1 ponto-e-vírgula a cada 10 frases, zero travessões.
        - **Sintaxe**: 60% frases diretas, 30% inversões, 10% frases nominais.
        - **Vocabulário**: 3 sinônimos para conceitos-chave, 1 repetição estratégica.
        - **Teste final**: Nenhuma frase com mais de 25 palavras, nenhum dado fora da coletânea, nenhuma citação direta, variação de comprimento de parágrafos.
        Texto para adaptar: "${essayText}"
    `;

    showNotification('Adaptando texto', 50);
    const humanizedText = await getAiResponse(adaptationPrompt);

    return { title: essayTitle, text: humanizedText };
}

async function checkAiScore(text) {
    showNotification('Verificando autenticidade', 70);
    const detectorPrompt = `
        Analise o texto abaixo e estime a probabilidade (%) de ser IA, com base nestas categorias:
        - **Repetições**: Uso excessivo de palavras ou frases (ex.: "letramento científico" várias vezes).
        - **Pontuação**: Uso de "!" ou "?", mais de 2 vírgulas por frase, presença de travessões, falta de ponto-e-vírgula.
        - **Estrutura**: Frases longas (>25 palavras), parágrafos de comprimento uniforme, transições forçadas.
        - **Vocabulário**: Gírias (ex.: "pra", "né") ou termos complexos (ex.: "paradigma") sem explicação.
        - **Conteúdo**: Generalizações vagas (ex.: "entender o mundo"), dados fora da coletânea, citações diretas.
        - **Plágio**: Similaridade com textos conhecidos de IA ou falta de originalidade.
        - **Formato**: Presença de tags HTML (ex.: <p>, <strong>) ou formatação inadequada.
        - **Tom**: Uso de tom conversacional (ex.: "a gente", "virar esse jogo").
        - **Padrões humanos**: Falta de inversions (30%), frases nominais (10%), ou repetição estratégica.
        - Retorne apenas um número entre 0 e 100 (0 = humano, 100 = IA).
        Texto: "${text}"
    `;
    const score = await getAiResponse(detectorPrompt);
    return parseInt(score, 10) || 50;
}

async function clearFields() {
    showNotification('Limpando campos', 10);
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (firstTextarea) await hackMUITextarea(firstTextarea, '');

    const allTextareas = document.querySelectorAll('textarea');
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (lastTextarea) await hackMUITextarea(lastTextarea, '');

    showNotification('Campos limpos', 100);
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
    const firstTextarea = document.querySelector('textarea')?.parentElement;
    if (!firstTextarea || !await hackMUITextarea(firstTextarea, title)) {
        showNotification('Erro no título', 0);
        return;
    }

    showNotification('Inserindo texto', 98);
    const allTextareas = document.querySelectorAll('textarea');
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
window.clearFields = clearFields;

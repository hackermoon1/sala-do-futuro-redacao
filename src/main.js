const config = {
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
  GEMINI_MODELS: [
    'gemini-2.0-flash:generateContent',
    'gemini-pro:generateContent'
  ],
  API_KEY: 'AIzaSyBwEiziXQ79LP7IKq93pmLM8b3qnwXn6bQ',
  UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1744108166/menu.js',
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
      Escreva uma redação ENEM no formato **dissertativo-argumentativo**, com linguagem formal, mas acessível, imitando o estilo de um aluno nota 1000 do ensino médio. Priorize fluidez textual, coesão argumentativa e um tom natural, como se fosse escrita por um estudante jovem e engajado. Siga as instruções abaixo:

      ▼ ESTILO PERSONALIZADO
      - Título direto (3-4 palavras) que dialogue com o tema, com apenas a primeira letra da primeira palavra em maiúscula (ex.: "Ciência para todos").
      - Frases curtas e médias, com no máximo 18 palavras.
      - Use apenas aspas " ", vírgula "," e ponto "." como pontuação. Proíba o uso de parênteses "()", exclamação "!" e interrogação "?".
      - Inclua 1 erro ortográfico sutil a cada 2 parágrafos (ex.: "pra" no lugar de "para").
      - Linguagem formal, mas com 2-3 expressões coloquiais controladas (ex.: "vem passando por", "é fato", "aí não tem jeito", "não à toa", "tipo").
      - Não invente dados numéricos. Use informações qualitativas ou baseadas na coletânea fornecida.

      ▼ ESTRUTURA HUMANIZADA
      INTRODUÇÃO (4-5 linhas):
      - [Contexto atual] + [Problema específico] + [Tese simplificada]
      - Exemplo: "Nos últimos tempos, a ciência vem virando alvo. Muitos duvidam dela. Diante disso, é preciso ensinar ciência de forma clara."

      DESENVOLVIMENTO (8-9 linhas cada):
      ▸ Parágrafo 1:
      - [Frase-impacto] + [Exemplo histórico/cotidiano baseado na coletânea] + [Informação qualitativa]
      - Exemplo: "Muita gente já caiu em fake news. Na pandemia, notícias falsas atrapalharam a vacinação. Não à toa, a desconfiança cresceu."
      - Inclua o erro ortográfico sutil aqui (ex.: "pra").

      ▸ Parágrafo 2:
      - [Contraste] + [Falha sistêmica] + [Consequência]
      - Exemplo: "Mas o problema não é só do povo. O governo não investe em educação. Resultado, a ciência fica distante."

      CONCLUSÃO (4 linhas):
      - [Retomada da tese] + [Ação concreta] + [Analogia simples]
      - Exemplo: "Fica claro que ciência precisa ser acessível. O MEC deve criar aulas práticas, como uma receita simples."

      ▼ ORIENTAÇÕES GERAIS
      - Gênero textual: "${essayInfo.generoTextual || "dissertativo-argumentativo"}"
      - Tema: "${essayInfo.enunciado.split(' ').slice(0, 7).join(' ')}"
      - Coletânea (resumo): "${essayInfo.coletanea.substring(0, 150)}..."
      - Critérios de avaliação: "${essayInfo.criteriosAvaliacao}"
      - Use a coletânea para embasar os argumentos, como o "bombardeio de notícias falsas sobre as vacinas" e a desconfiança de parte da população.

      ▼ EVITE (PARA PARECER HUMANO):
      - Frases clichês: "É notório que", "Pode-se dizer que", "Na minha escola."
      - Exemplos pessoais ou gírias pesadas (ex.: "legal", "mano", "né").
      - Repetições de palavras ou ideias próximas (ex.: usar "educação" 5 vezes no mesmo parágrafo).
      - Frases artificiais ou muito rebuscadas (ex.: "A ciência propicia uma miríade de benefícios", "neglacionismo", "letramento").
      - Padrões de IA: repetições de estrutura, generalizações vagas (ex.: "ciência ajuda a entender o mundo"), ou tom robótico.

      ▼ FORMATO DE SAÍDA (OBRIGATÓRIO)
      - O texto deve ser retornado EXATAMENTE no formato abaixo, sem omitir ou alterar as palavras "TÍTULO:" e "TEXTO:". Siga rigorosamente:
      TÍTULO: [Título com 3-4 palavras, apenas primeira letra da primeira palavra em maiúscula]
      TEXTO: [O texto da redação, entre 28 e 32 linhas, ~2400 caracteres, margem 1800 a 3080]

      Exemplo de formato:
      TÍTULO: Ciência para todos
      TEXTO: Nos últimos tempos, a ciência vem virando alvo...

      Gere o texto completo com coesão e progressão clara de ideias. Evite qualquer marca de inteligência artificial ou inconsistência gramatical. Adote o estilo de um aluno nota 1000, com ritmo de escrita realista.
    `;
  },

  humanizeText: async (text) => {
    const fixes = {
      "É necessário": "Precisa",
      "Por exemplo": "Tipo",
      "Além disso": "Fora isso",
      "No entanto": "Mas"
    };

    return Object.entries(fixes).reduce(
      (str, [from, to]) => str.replace(new RegExp(from, 'g'), to),
      text
    );
  }
};

async function hackMUITextarea(textareaElement, textToInsert) {
  const textarea = textareaElement?.querySelector('textarea');
  if (!textarea) return false;

  const methods = [
    async () => {
      const reactProps = Object.keys(textarea).filter(
        (prop) => prop.startsWith('__reactProps$') || prop.includes('__reactEventHandlers$')
      );
      for (const prop of reactProps) {
        const handler = textarea[prop];
        if (handler?.onChange) {
          handler.onChange({
            target: { value: textToInsert },
            preventDefault: () => {},
            stopPropagation: () => {}
          });
          return textarea.value === textToInsert;
        }
      }
      return false;
    },
    async () => {
      textarea.value = textToInsert;
      textarea.dispatchEvent(
        new InputEvent('input', { bubbles: true, data: textToInsert })
      );
      return textarea.value === textToInsert;
    }
  ];

  for (const method of methods) {
    try {
      if (await method()) return true;
    } catch (error) {
      console.error('Erro ao tentar hackMUITextarea:', error);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
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

    if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts) throw new Error('Resposta inválida');
    const text = data.candidates[0].content.parts[0].text;
    console.log('[getAiResponse] Resposta da API:', text);
    return text;
  } catch (error) {
    console.error(`[getAiResponse] Erro no modelo ${model}:`, error);
    if (modelIndex < config.GEMINI_MODELS.length - 1) {
      return await getAiResponse(prompt, modelIndex + 1);
    }
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
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
  }

  notification.textContent = `${message} - ${progress}%`;
  notification.style.opacity = '1';
  setTimeout(() => (notification.style.opacity = '0'), 2000);
}

async function generateAndAdaptEssay(theme, essayInfo, attempt = 1) {
  const maxAttempts = 3;
  const prompt = HUMAN_WRITER_PRO.generatePrompt(essayInfo);
  showNotification('Gerando redação com estilo humanizado', 20);

  try {
    let essay = await getAiResponse(prompt);
    console.log('[generateAndAdaptEssay] Texto bruto:', essay);

    if (!essay.includes('TÍTULO:') || !essay.includes('TEXTO:')) {
      if (attempt < maxAttempts) {
        console.warn(`[generateAndAdaptEssay] Formato inválido na tentativa ${attempt}. Tentando novamente...`);
        showNotification('Formato incorreto, tentando novamente', 20);
        return await generateAndAdaptEssay(theme, essayInfo, attempt + 1);
      } else {
        console.warn('[generateAndAdaptEssay] Máximo de tentativas atingido. Forçando formato básico.');
        showNotification('Erro persistente, ajustando formato', 20);
        const fallbackTitle = theme.split(' ').slice(0, 3).map((word, index) => 
          index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
        ).join(' ');
        return {
          title: fallbackTitle,
          text: essay
        };
      }
    }

    let essayTitle = essay.split('TÍTULO:')[1].split('TEXTO:')[0].trim();
    let essayText = essay.split('TEXTO:')[1].trim();

    // Garantir que o título siga o formato "Ciência para todos"
    essayTitle = essayTitle.split(' ').map((word, index) => 
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
    ).join(' ');
    console.log('[generateAndAdaptEssay] Título ajustado:', essayTitle);

    essayText = await HUMAN_WRITER_PRO.humanizeText(essayText);

    // Verificação de tamanho (caracteres e linhas)
    const lines = essayText.split('\n').length;
    if (essayText.length < 1800 || lines < 28) {
      const additionalPrompt = `
        Expanda o texto abaixo para garantir que tenha pelo menos 1800 caracteres e 28 linhas, mantendo o tom acessível e objetivo, e seguindo as mesmas regras de estrutura e humanização:
        Texto: "${essayText}"
      `;
      essayText = await getAiResponse(additionalPrompt);
    } else if (essayText.length > 3080 || lines > 32) {
      essayText = essayText.substring(0, 3080).replace(/\s+\S*$/, '');
    }

    console.log('[generateAndAdaptEssay] Texto final:', essayText);
    console.log('[generateAndAdaptEssay] Número de linhas:', essayText.split('\n').length);
    console.log('[generateAndAdaptEssay] Número de caracteres:', essayText.length);

    return { title: essayTitle, text: essayText };
  } catch (error) {
    console.error('[generateAndAdaptEssay] Erro:', error);
    showNotification('Erro ao gerar redação', 0);
    throw error;
  }
}

async function checkAiScore(text) {
  showNotification('Verificando autenticidade', 70);

  const detectorPrompt = `
    Analise o texto abaixo e estime a probabilidade (%) de ser IA, com base nestas categorias:
    - **Repetições**: Uso excessivo de palavras ou frases.
    - **Pontuação**: Uso de "!" ou "?", mais de 1 vírgula por frase, presença de travessões/parentêses, falta de ponto-e-vírgula.
    - **Estrutura**: Frases longas, falta de frases ultra-curtas, ausência de variação entre períodos simples e compostos.
    - **Vocabulário**: Gírias pesadas (ex.: "mano", "né") ou termos complexos sem explicação.
    - **Conteúdo**: Generalizações vagas (ex.: "entender o mundo"), dados não mencionados, falta de argumentos objetivos.
    - **Plágio**: Similaridade com textos conhecidos de IA ou falta de originalidade.
    - **Formato**: Presença de tags HTML (ex.: <p>, <strong>) ou formatação inadequada.
    - **Tom**: Uso de tom conversacional excessivo (ex.: "a gente", "virar esse jogo") ou tom robótico.
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
  if (firstTextarea && (await hackMUITextarea(firstTextarea, ''))) {
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
  if (lastTextarea && (await hackMUITextarea(lastTextarea, ''))) {
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
    success = success && (await hackMUITextarea(firstTextarea, ''));
  }

  if (allTextareas.length > 1) {
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (lastTextarea) {
      success = success && (await hackMUITextarea(lastTextarea, ''));
    }
  }

  if (success) {
    showNotification('Tudo limpo', 100);
  } else {
    showNotification('Erro ao limpar campos', 0);
  }
}

async function generateEssay() {
  const activityElement = document.querySelector(
    'p.MuiTypography-root.MuiTypography-body1.css-m576f2'
  );
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

  try {
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
    if (!firstTextarea || !(await hackMUITextarea(firstTextarea, title))) {
      showNotification('Erro no título', 0);
      return;
    }

    showNotification('Inserindo texto', 98);
    const lastTextarea = allTextareas[allTextareas.length - 1]?.parentElement;
    if (!lastTextarea || !(await hackMUITextarea(lastTextarea, text))) {
      showNotification('Erro no texto', 0);
      return;
    }

    showNotification(`Concluído: ${100 - finalScore}% humano`, 100);
  } catch (error) {
    console.error('[generateEssay] Erro:', error);
    showNotification('Erro ao gerar redação', 0);
  }
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

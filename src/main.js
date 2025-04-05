const config = {
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
  GEMINI_MODELS: [
    'gemini-2.0-flash:generateContent',
    'gemini-pro:generateContent'
  ],
  API_KEY: 'AIzaSyBhli8mGA1-1ZrFYD1FZzMFkHhDrdYCXwY',
  UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1743862237/menu.js',
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
      Escreva uma redação ENEM no formato **dissertativo-argumentativo**, com linguagem formal, natural e objetiva. Siga a estrutura e estilo descritos abaixo, priorizando fluidez textual e coesão argumentativa:

      ▼ ESTRUTURA ORIENTADORA

      1. INTRODUÇÃO (5 a 6 linhas):
      - Contextualize o tema com um recorte atual, histórico ou cultural (dados, citações ou exemplos da coletânea).
      - Apresente a **tese com clareza**, evitando clichês como "É notório que".
      - Indique o percurso argumentativo de forma fluida ("Ao considerar..." ou "Nesse contexto...").

      2. DESENVOLVIMENTO (2 parágrafos de 8 a 10 linhas cada):
      - Parágrafo 1:
        • Desenvolva um argumento central com causa e consequência.
        • Traga um exemplo relevante e contextualizado (histórico, social, científico ou cultural).
        • Relacione o exemplo com a tese e finalize com uma análise crítica.
      - Parágrafo 2:
        • Apresente um segundo ponto de vista, complementar ou antagônico.
        • Insira novos dados, estatísticas ou fenômenos sociais.
        • Conecte com a tese, usando síntese reflexiva ("Isso evidencia que...").

      3. CONCLUSÃO (4 a 5 linhas):
      - Retome a tese com outras palavras.
      - Proponha uma **solução completa**: agente, ação, modo de execução, efeito esperado.
      - Finalize com uma analogia leve, metáfora simples ou frase de impacto suave.

      ▼ ESTILO E LINGUAGEM

      - Fluidez frasal:
        • 70% frases médias (12-20 palavras)
        • 20% curtas (até 8 palavras)
        • 10% longas (21-25), com pontuação precisa

      - Vocabulário:
        • Use palavras claras e bem colocadas — sem termos rebuscados ou gírias
        • Varie conceitos-chave com sinônimos contextuais (ex.: "educação", "formação", "ensino")
        • Inclua 1 termo técnico com explicação simples

      - Pontuação:
        • Use pontuação natural (vírgulas moderadas, ponto-e-vírgula com critério)
        • Evite travessões e parênteses

      ▼ EVITE:
      × Frases clichês: "É notório que", "Pode-se dizer que", "Na minha escola..."
      × Exemplos pessoais, gírias ou expressões informais
      × Repetições de ideias ou termos próximos
      × Frases artificiais ou muito rebuscadas

      ▼ ORIENTAÇÕES GERAIS
      - Gênero textual: "${essayInfo.generoTextual || "dissertativo-argumentativo"}"
      - Tema: "${essayInfo.enunciado.split(' ').slice(0, 7).join(' ')}"
      - Coletânea (resumo): "${essayInfo.coletanea.substring(0, 150)}..."
      - Critérios de avaliação: "${essayInfo.criteriosAvaliacao}"

      ▼ FORMATO DE SAÍDA
      - TÍTULO: 3 a 4 palavras em caixa alta
      - TEXTO: entre 28 e 32 linhas (~2400 caracteres, margem 1700 a 3080)

      Gere o texto completo com coesão e progressão clara de ideias. Evite qualquer marca de inteligência artificial ou inconsistência gramatical. Adote o estilo de um aluno nota 1000, com ritmo de escrita realista.
    `;
  },

  humanizeText: async (text) => {
    const fixes = {
      "É necessário": "Requer-se",
      "Por exemplo": "Como visto em",
      "Além disso": "Ademais",
      "No entanto": "Contudo"
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
      // Ignorar erros e tentar o próximo método
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

    if (!response.ok) throw new Error('Erro na API');
    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts) throw new Error('Resposta inválida');
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
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

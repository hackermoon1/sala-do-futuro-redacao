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
      Escreva uma redação ENEM no formato **dissertativo-argumentativo**, com linguagem formal, natural e objetiva, imitando o estilo de um aluno nota 1000. Priorize fluidez textual, coesão argumentativa e um tom que balanceie formalidade com acessibilidade, como se fosse escrita por um estudante humano. Siga as instruções abaixo:

      ▼ ESTRUTURA ORIENTADORA

      1. INTRODUÇÃO (5 a 6 linhas):
      - Contextualize o tema com um recorte atual, histórico ou cultural, usando dados ou exemplos da coletânea (ex.: "No Brasil do século XXI" ou "Na Revolução Industrial").
      - Apresente a **tese com clareza**, sem clichês como "É notório que" ou "É necessário". Use uma afirmação direta e original (ex.: "A educação é um pilar para o progresso").
      - Indique o percurso argumentativo de forma fluida, com expressões como "Nesse contexto", "Ao considerar" ou "Dessa forma, percebe-se que".

      2. DESENVOLVIMENTO (2 parágrafos de 8 a 10 linhas cada):
      - Parágrafo 1:
        • Desenvolva um argumento central com causa e consequência, usando conectivos variados (ex.: "por isso", "dessa forma", "em razão disso").
        • Traga um exemplo relevante e contextualizado (ex.: Revolução Industrial, abolição da escravatura, ou políticas públicas recentes no Brasil).
        • Relacione o exemplo com a tese e finalize com uma análise crítica, usando expressões como "Isso demonstra que" ou "Fica evidente que".
      - Parágrafo 2:
        • Apresente um segundo ponto de vista, complementar ou antagônico, com transições suaves (ex.: "Por outro lado", "Em contrapartida").
        • Insira dados ou fenômenos sociais verossímeis (ex.: "Segundo especialistas, cerca de 70% das escolas públicas carecem de laboratórios").
        • Conecte com a tese, usando síntese reflexiva (ex.: "Isso evidencia que" ou "Portanto, percebe-se que").

      3. CONCLUSÃO (4 a 5 linhas):
      - Retome a tese com outras palavras, sem repeti-la literalmente.
      - Proponha uma **solução completa**: agente (ex.: Ministério da Educação), ação (ex.: criar programas), modo de execução (ex.: com oficinas itinerantes), efeito esperado (ex.: maior inclusão social).
      - Finalize com uma analogia leve, metáfora simples ou frase de impacto suave (ex.: "como uma ponte que une margens distantes").

      ▼ ESTILO E LINGUAGEM (HUMANIZAÇÃO)

      - Fluidez frasal:
        • 70% frases médias (12-20 palavras), 20% curtas (até 8 palavras), 10% longas (21-25 palavras).
        • Varie o ritmo das frases para imitar a escrita humana, alternando entre períodos simples e compostos.
        • Use conectivos variados para transições suaves (ex.: "dessa forma", "por outro lado", "em contrapartida", "assim").

      - Vocabulário:
        • Use palavras claras e bem colocadas, típicas de um estudante do ensino médio (ex.: "educação", "formação", "ensino"; "desafio", "obstáculo", "dificuldade").
        • Varie conceitos-chave com sinônimos contextuais, evitando repetições (ex.: "ciência", "conhecimento", "sabedoria").
        • Inclua 1 termo técnico com explicação simples (ex.: "alfabetização científica, ou seja, a capacidade de compreender conceitos básicos da ciência").

      - Pontuação:
        • Use pontuação natural: vírgulas moderadas (máximo 1 por frase), ponto-e-vírgula a cada 2 parágrafos, sem travessões ou parênteses.
        • Evite excesso de pontos finais; prefira frases compostas com conjunções ("e", "mas", "porque").

      - Tom:
        • Adote um tom formal, mas acessível, como o de um estudante do ensino médio escrevendo para o ENEM.
        • Evite tom conversacional (ex.: "a gente", "virar esse jogo") ou excessivamente acadêmico (ex.: "paradigma", "epistemológico").

      ▼ EVITE (PARA PARECER HUMANO):
      × Frases clichês: "É notório que", "Pode-se dizer que", "Na minha escola..."
      × Exemplos pessoais ou gírias (ex.: "legal", "pra", "né").
      × Repetições de palavras ou ideias próximas (ex.: usar "educação" 5 vezes no mesmo parágrafo).
      × Frases artificiais ou muito rebuscadas (ex.: "A ciência propicia uma miríade de benefícios").
      × Padrões de IA: repetições de estrutura (ex.: começar todas as frases com "Além disso"), generalizações vagas (ex.: "ciência ajuda a entender o mundo"), ou tom robótico.

      ▼ ORIENTAÇÕES GERAIS
      - Gênero textual: "${essayInfo.generoTextual || "dissertativo-argumentativo"}"
      - Tema: "${essayInfo.enunciado.split(' ').slice(0, 7).join(' ')}"
      - Coletânea (resumo): "${essayInfo.coletanea.substring(0, 150)}..."
      - Critérios de avaliação: "${essayInfo.criteriosAvaliacao}"

      ▼ FORMATO DE SAÍDA (OBRIGATÓRIO)
      - O texto deve ser retornado EXATAMENTE no formato abaixo, sem omitir ou alterar as palavras "TÍTULO:" e "TEXTO:". Siga rigorosamente:
      TÍTULO: [3 a 4 palavras em caixa alta]
      TEXTO: [o texto da redação, entre 28 e 32 linhas, ~2400 caracteres, margem 1700 a 3080]

      Exemplo de formato:
      TÍTULO: EXEMPLO DE TÍTULO
      TEXTO: Aqui começa o texto da redação, com introdução, desenvolvimento e conclusão...

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
  showNotification('Gerando redação', 20);

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
        const fallbackTitle = theme.toUpperCase().slice(0, 20);
        return {
          title: fallbackTitle,
          text: essay
        };
      }
    }

    const essayTitle = essay.split('TÍTULO:')[1].split('TEXTO:')[0].trim();
    let essayText = essay.split('TEXTO:')[1].trim();

    essayText = await HUMAN_WRITER_PRO.humanizeText(essayText);

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

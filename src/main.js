const config = {
  GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
  GEMINI_MODELS: [
    'gemini-2.0-flash:generateContent',
    'gemini-pro:generateContent'
  ],
  API_KEY: 'AIzaSyBwEiziXQ79LP7IKq93pmLM8b3qnwXn6bQ',
  UI_SCRIPT_URL: 'https://res.cloudinary.com/dctxcezsd/raw/upload/v1744120063/menu.js',
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
      Escreva uma redação ENEM no formato **dissertativo-argumentativo**, com linguagem formal, mas acessível e versátil, imitando o estilo de um aluno nota 1000 do ensino médio. Priorize fluidez textual, coesão argumentativa e um tom natural, com variações (ex.: frases reflexivas seguidas de frases diretas), como se fosse escrita por um estudante jovem e engajado. Siga as instruções abaixo:

      ▼ ESTILO PERSONALIZADO
      - Título criativo e impactante (3-4 palavras) que dialogue com o tema, com apenas a primeira letra da primeira palavra em maiúscula (ex.: "Ciência ao alcance").
      - Frases curtas e médias, com no máximo 18 palavras.
      - Use apenas aspas " ", vírgula "," e ponto "." como pontuação. Proíba o uso de parênteses "()", exclamação "!" e interrogação "?".
      - Inclua 1 erro ortográfico sutil a cada 2 parágrafos (ex.: "pra" no lugar de "para").
      - Linguagem formal, mas com 2-3 expressões coloquiais controladas (ex.: "vem passando por", "é fato", "aí não tem jeito", "não à toa", "tipo").
      - Não invente dados numéricos. Use informações qualitativas ou baseadas na coletânea fornecida.
      - Mostre conhecimento médio do tema, com conceitos que um estudante do ensino médio dominaria (ex.: ciência na saúde, no meio ambiente).

      ▼ ESTRUTURA HUMANIZADA (OBRIGATÓRIA)
      INTRODUÇÃO (4-5 linhas):
      - Comece com um exemplo ou dado da coletânea para contextualizar, de forma envolvente.
      - Apresente o problema com tom versátil (ex.: uma frase reflexiva, seguida de uma direta).
      - Finalize com uma tese clara e objetiva.
      - Exemplo: "A coletânea diz que 'teorias são propostas e novas tecnologias são desenvolvidas'. Mas poucos têm acesso a isso. Diante disso, é preciso democratizar a ciência."

      DESENVOLVIMENTO (8-9 linhas cada):
      ▸ Parágrafo 1:
      - [Frase-impacto] + [Citação ou paráfrase da coletânea] + [Exemplo cotidiano com conhecimento médio]
      - Exemplo: "A ciência pode mudar vidas. A coletânea fala que 'novas tecnologias são desenvolvidas', mas muitos não sabem disso. Tipo, remédios novos salvam vidas."
      - Inclua o erro ortográfico sutil aqui (ex.: "pra").

      ▸ Parágrafo 2:
      - [Contraste] + [Falha sistêmica conectada à coletânea] + [Consequência detalhada]
      - Exemplo: "Mas o problema não é só do povo. A coletânea diz que a ciência deve be 'acessível a todos', mas falta investimento. Resultado, a desinformação cresce."

      CONCLUSÃO (4-5 linhas):
      - [Retomada da tese] + [Proposta de intervenção detalhada: agente, ação, modo, efeito] + [Analogia simples]
      - Exemplo: "Fica claro que ciência precisa ser acessível. O MEC deve criar projetos educativos, com oficinas práticas, pra incluir todos. Tipo uma semente que cresce com cuidado."

      ▼ ORIENTAÇÕES GERAIS
      - Gênero textual: "${essayInfo.generoTextual || "dissertativo-argumentativo"}"
      - Tema: "${essayInfo.enunciado.split(' ').slice(0, 7).join(' ')}"
      - Coletânea (resumo): "${essayInfo.coletanea.substring(0, 150)}..."
      - Critérios de avaliação: "${essayInfo.criteriosAvaliacao}"
      - Use a coletânea para embasar os argumentos, como "teorias são propostas e novas tecnologias são desenvolvidas" e "ciência seja valorizada, respeitada e acessível a todos".
      - O texto deve ter cerca de 2400 caracteres (mínimo 1800, máximo 3080).

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
      TÍTULO: Ciência ao alcance
      TEXTO: A coletânea diz que "teorias são propostas e novas tecnologias são desenvolvidas"...

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

function showNotification(message, progress, persistent = false) {
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
      padding: 8px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(8px);
      z-index: 10001;
      font-size: 13px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(notification);
  }

  notification.textContent = `${message}${progress !== undefined ? ` - ${progress}%` : ''}`;
  notification.style.opacity = '1';
  if (!persistent) {
    setTimeout(() => (notification.style.opacity = '0'), 2000);
  }
}

async function adjustTextIfAiDetected(text, essayInfo) {
  const adjustPrompt = `
    Ajuste o texto abaixo para torná-lo mais humano e menos detectável como IA, seguindo estas orientações:
    - Reduza repetições de palavras ou ideias.
    - Simplifique o vocabulário, usando palavras que um estudante do ensino médio usaria.
    - Aumente o uso da coletânea fornecida para embasar os argumentos.
    - Garanta que a proposta de intervenção seja detalhada (agente, ação, modo, efeito).
    - Mantenha o tom formal, mas acessível, com 2-3 expressões coloquiais controladas (ex.: "não à toa", "aí não tem jeito").
    - Mantenha o texto entre 1800 e 3080 caracteres, com cerca de 2400 caracteres.
    - Use apenas aspas " ", vírgula "," e ponto "." como pontuação.

    Coletânea (resumo): "${essayInfo.coletanea.substring(0, 150)}..."
    Texto: "${text}"

    Retorne o texto ajustado no mesmo formato:
    TÍTULO: [Título]
    TEXTO: [Texto ajustado]
  `;

  const adjustedText = await getAiResponse(adjustPrompt);
  const adjustedTitle = adjustedText.split('TÍTULO:')[1].split('TEXTO:')[0].trim();
  const adjustedEssayText = adjustedText.split('TEXTO:')[1].trim();

  return { title: adjustedTitle, text: adjustedEssayText };
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

    // Garantir que o título siga o formato "Ciência ao alcance"
    essayTitle = essayTitle.split(' ').map((word, index) => 
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
    ).join(' ');
    console.log('[generateAndAdaptEssay] Título ajustado:', essayTitle);

    essayText = await HUMAN_WRITER_PRO.humanizeText(essayText);

    // Verificação de tamanho (caracteres e linhas)
    const lines = essayText.split('\n').length;
    const targetLength = 2400;
    if (essayText.length < 1800 || lines < 28) {
      const additionalPrompt = `
        Expanda o texto abaixo para que tenha cerca de ${targetLength} caracteres e 28-32 linhas, mantendo o tom acessível e objetivo, e seguindo as mesmas regras de estrutura e humanização:
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
    Analise o texto abaixo e estime a probabilidade (%) de ser IA, com base nestes critérios:
    - **Repetições**: Uso excessivo de palavras ou frases (ex.: repetir "ciência" mais de 3 vezes por parágrafo).
    - **Estrutura**: Frases longas (acima de 18 palavras), falta de variação entre frases curtas e médias.
    - **Vocabulário**: Uso de termos rebuscados (ex.: "neglacionismo", "letramento") ou gírias pesadas (ex.: "mano").
    - **Tom**: Tom excessivamente formal ou conversacional (ex.: "a gente", "virar esse jogo").
    - **Coletânea**: Falta de uso da coletânea para embasar os argumentos.
    - **Proposta de Intervenção**: Ausência de uma proposta detalhada (agente, ação, modo, efeito).
    - **Padrões de IA**: Generalizações vagas (ex.: "ciência ajuda a sociedade"), repetições de estrutura (ex.: começar todas as frases com "Além disso").
    - Retorne apenas um número entre 0 e 100 (0 = humano, 100 = IA).
    Texto: "${text}"
  `;

  const score = await getAiResponse(detectorPrompt);
  return parseInt(score, 10) || 50;
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

async function copyText() {
  showNotification('Copiando texto', 10);

  const allTextareas = document.querySelectorAll('textarea');
  if (allTextareas.length < 2) {
    showNotification('Nenhum texto encontrado', 0);
    return;
  }

  const lastTextarea = allTextareas[allTextareas.length - 1];
  const textToCopy = lastTextarea.value;

  try {
    await navigator.clipboard.writeText(textToCopy);
    showNotification('Texto copiado', 100);
  } catch (error) {
    console.error('[copyText] Erro ao copiar texto:', error);
    showNotification('Erro ao copiar texto', 0);
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
    let { title, text } = await generateAndAdaptEssay(theme, essayInfo);

    // Verificar probabilidade de ser IA
    let aiScore = await checkAiScore(text);
    showNotification(`Probabilidade de ser IA: ${aiScore}%`, 80);

    // Se a probabilidade for maior que 50%, ajustar o texto
    if (aiScore > 50) {
      showNotification('Ajustando texto para parecer mais humano', 85);
      const adjustedResult = await adjustTextIfAiDetected(text, essayInfo);
      title = adjustedResult.title;
      text = adjustedResult.text;

      // Verificar novamente após o ajuste
      aiScore = await checkAiScore(text);
      showNotification(`Nova probabilidade de ser IA: ${aiScore}%`, 90);
    }

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

    // Exibir notificação persistente com a porcentagem de ser IA
    showNotification(`Concluído. Probabilidade de ser IA: ${aiScore}%`, undefined, true);
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
window.clearAll = clearAll;
window.copyText = copyText;

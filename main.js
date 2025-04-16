(async () => {

    const config = {
        API_KEY: 'AIzaSyBwEiziXQ79LP7IKq93pmLM8b3qnwXn6bQ',
        GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
        GEMINI_MODELS: [
            'gemini-2.0-flash:generateContent',
            'gemini-pro:generateContent'
        ]
    };

    const HUMAN_WRITER_PRO = {
        API_SETTINGS: {
            temperature: 0.7, // Reduzido levemente para diminuir aleatoriedade
            topP: 0.9,      // Ajustado levemente
            maxOutputTokens: 3500 // Aumentado para dar margem à IA para o tamanho
        },
        MIN_CHARS: 1600,
        MAX_CHARS: 3080,
        MIN_LINES: 25,    // Ajustado proporcionalmente
        MAX_LINES: 32,

        generatePrompt: (essayInfo) => {
            const safeColetanea = essayInfo.coletanea.substring(0, 800);
            const safeEnunciado = essayInfo.enunciado.substring(0, 300);
            const safeCriterios = essayInfo.criteriosAvaliacao.substring(0, 500);

            // Adapta a meta de caracteres baseado no mínimo real da plataforma
            const targetChars = Math.max(2400, HUMAN_WRITER_PRO.MIN_CHARS + 400);
            const minPromptChars = HUMAN_WRITER_PRO.MIN_CHARS;
            const maxPromptChars = HUMAN_WRITER_PRO.MAX_CHARS;


            return `
**Tarefa:** Simule a escrita de um estudante do ensino médio brasileiro, nota 1000 no ENEM. Escreva uma redação **dissertativo-argumentativa** sobre o tema proposto, seguindo RIGOROSAMENTE as instruções. A prioridade MÁXIMA é o formato de saída e as restrições de pontuação.

**Tema Central:** "${safeEnunciado}..."
**Gênero:** ${essayInfo.generoTextual || "dissertativo-argumentativo"}
**Coletânea (Resumo):** "${safeColetanea}..."
**Critérios Relevantes:** "${safeCriterios}..."

**▼ DIRETRIZES DE ESTILO E TOM (OBRIGATÓRIO):**
1.  **Título:** Crie um título curto (3-4 palavras), criativo. Apenas a primeira letra da primeira palavra maiúscula (ex: "Ciência para evoluir").
2.  **Linguagem:** Formal, acessível, vocabulário de bom aluno (evite "hodiernamente", "salutar", "outrossim", "mitigar").
3.  **Tom:** Objetivo e argumentativo, baseado nos fatos e na coletânea. **EVITE** opiniões pessoais fortes ou julgamentos morais não derivados diretamente dos argumentos/coletânea. Foque em analisar o problema e propor soluções conectadas ao tema.
4.  **Fluidez:** Frases curtas/médias (máximo 18 palavras), varie o ritmo. Transições claras.
5.  **PONTUAÇÃO (REGRA RÍGIDA):** É TERMINANTEMENTE PROIBIDO o uso de ponto de exclamação (!), ponto de interrogação (?), ponto e vírgula (;) ou reticências (...). Use APENAS ponto final (.), vírgula (,) e aspas duplas (" ") quando estritamente necessário para citações (que devem ser raras).
6.  **Coloquialismo:** Inclua 1-2 expressões coloquiais MUITO comuns e sutis (ex: "é fato que", "ou seja", "acaba sendo"). Nada de gírias.
7.  **Coletânea:** Fundamente os argumentos com ideias da coletânea, citando indiretamente ("Segundo um dos textos...", "A coletânea aponta..."). **NÃO invente dados.**
8.  **Conhecimento:** Nível de ensino médio, focado em impactos sociais, educacionais, etc., relacionados ao tema.

**▼ ESTRUTURA DETALHADA (OBRIGATÓRIA):**
*   **INTRODUÇÃO (4-5 linhas):** Contextualize com coletânea/fato. Apresente problema/tensão. Tese clara no final.
*   **DESENVOLVIMENTO 1 (8-9 linhas):** Tópico frasal (1ª ideia). Fundamentação (coletânea/paráfrase). Aprofundamento (explique, exemplifique SUTILMENTE ou mostre causa/consequência).
*   **DESENVOLVIMENTO 2 (8-9 linhas):** Tópico frasal (2ª ideia, pode ser contraponto/outro aspecto). Fundamentação. Aprofundamento.
*   **CONCLUSÃO (4-5 linhas):** Retome tese (sem repetir). Proposta COMPLETA (Agente claro, Ação concreta, Meio/Modo detalhado, Finalidade explícita). Frase curta de fechamento.

**▼ EVITAR ABSOLUTAMENTE:** Clichês ("Nos dias de hoje..."). Repetições. Voz passiva excessiva. Generalizações. Estruturas repetitivas. Tom professoral ou excessivamente emotivo. Listas.

**▼ TAMANHO E FORMATO DE SAÍDA (PRIORIDADE MÁXIMA):**
*   **Tamanho:** O texto final (apenas o conteúdo de TEXTO:) DEVE ter **MAIS de ${minPromptChars} caracteres** e **MENOS de ${maxPromptChars} caracteres**. Tente mirar em torno de ${targetChars} caracteres.
*   **Formato:** Sua resposta DEVE começar EXATAMENTE com 'TÍTULO:' e conter 'TEXTO:'. Sem NADA antes, depois ou entre eles, exceto o conteúdo pedido.

TÍTULO: [Título aqui, 3-4 palavras, só primeira letra maiúscula]
TEXTO: [Texto da redação aqui, entre ${minPromptChars} e ${maxPromptChars} caracteres]

**Instrução Final:** Gere a redação. Revise TODAS as regras antes de responder, especialmente PONTUAÇÃO, TAMANHO e FORMATO DE SAÍDA.
`;
        }
    };

    function cleanText(text) {
        let cleaned = text;
        cleaned = cleaned.replace(/[?!;]+/g, ''); // Remove !, ?, ;
        cleaned = cleaned.replace(/\.{2,}/g, '.'); // Replace .. ou ... com .
        cleaned = cleaned.replace(/ \./g, '.');     // Remove espaço antes do ponto
        cleaned = cleaned.replace(/ ,/g, ',');     // Remove espaço antes da vírgula
        cleaned = cleaned.replace(/(\r\n|\n|\r){3,}/g, '\n\n'); // Limita linhas em branco
        return cleaned.trim();
    }


    async function hackMUITextarea(textareaContainer, textToInsert) {
        const textarea = textareaContainer?.querySelector('textarea');
        if (!textarea) return false;
        try {
            const reactPropsKey = Object.keys(textarea).find(key => key.startsWith('__reactProps$'));
            if (reactPropsKey && textarea[reactPropsKey]?.onChange) {
                const event = { target: { value: textToInsert }, preventDefault: () => {}, stopPropagation: () => {} };
                textarea[reactPropsKey].onChange(event);
                await new Promise(resolve => setTimeout(resolve, 50));
                if (textarea.value === textToInsert) return true;
            }
        } catch (e) {}
        try {
            textarea.focus();
            textarea.value = textToInsert;
            const inputEvent = new Event('input', { bubbles: true, composed: true });
            textarea.dispatchEvent(inputEvent);
            await new Promise(resolve => setTimeout(resolve, 50));
            if (textarea.value === textToInsert) return true;
        } catch (e) {}
        try {
            textarea.value = textToInsert;
            if (textarea.value === textToInsert) return true;
        } catch (e) {}
        console.error('HackMUI: Falha ao inserir texto no textarea:', textareaContainer);
        return false;
    }

    async function getAiResponse(prompt, modelIndex = 0) {
        const model = config.GEMINI_MODELS[modelIndex];
        if (!model) {
            throw new Error('Nenhum modelo de IA disponível ou todos falharam.');
        }
        const url = `${config.GEMINI_API_BASE}${model}?key=${config.API_KEY}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: HUMAN_WRITER_PRO.API_SETTINGS.temperature,
                        topP: HUMAN_WRITER_PRO.API_SETTINGS.topP,
                        maxOutputTokens: HUMAN_WRITER_PRO.API_SETTINGS.maxOutputTokens
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                    ]
                })
            });
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Erro na API (${model}): ${response.status} ${errorData}`);
            }
            const data = await response.json();
             if (!data.candidates || data.candidates.length === 0) {
                 if (data.promptFeedback?.blockReason) {
                     throw new Error(`API bloqueou (${model}): ${data.promptFeedback.blockReason}`);
                 } else {
                     const finishReason = data.candidates?.[0]?.finishReason;
                     const safetyRatings = data.candidates?.[0]?.safetyRatings;
                     console.warn(`[API Warning] Resposta vazia/bloqueada (${model}). FinishReason: ${finishReason}`, safetyRatings);
                      if(finishReason === 'OTHER' || finishReason === 'MAX_TOKENS') { // Também tenta extrair se cortou por tokens
                         const partialText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                         if (partialText) return partialText;
                     }
                     throw new Error(`Resposta inválida ou vazia da API (${model})`);
                 }
             }
            if (!data.candidates[0]?.content?.parts?.[0]?.text) {
                console.error(`[API Error] Estrutura de resposta inesperada ou sem texto (${model}):`, data);
                throw new Error(`Estrutura de resposta inesperada ou sem texto (${model})`);
            }
            const text = data.candidates[0].content.parts[0].text;
            return text;
        } catch (error) {
            console.error(`[API Exception] Erro ao chamar ${model}:`, error);
            if (modelIndex < config.GEMINI_MODELS.length - 1) {
                 showNotification(`Erro no modelo ${model.split(':')[0]}, tentando próximo...`, 'warning', 3000);
                return await getAiResponse(prompt, modelIndex + 1);
            }
            throw error;
        }
    }

    function showNotification(message, type = 'info', duration = 3000) {
        let existingNotification = document.querySelector('.hck-notification-ios');
        if (existingNotification) {
            if (existingNotification.timer) clearTimeout(existingNotification.timer);
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `hck-notification-ios ${type}`;
        notification.innerHTML = `<span class="hck-notification-message">${message}</span>`;
        document.body.appendChild(notification);
        void notification.offsetWidth;

        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';

        if (duration > 0) {
            notification.timer = setTimeout(() => {
                const currentNotif = document.getElementById(notification.id); // Re-fetch by potential ID if needed
                if (currentNotif) {
                    currentNotif.style.opacity = '0';
                    currentNotif.style.transform = 'translateY(20px)';
                    setTimeout(() => currentNotif.remove(), 300);
                }
            }, duration);
        } else {
            notification.timer = null; // Persistent
        }
         // Add an ID for potential later removal if needed
         notification.id = 'hck-persistent-notification-' + Date.now();
    }

    async function adjustTextIfAiDetected(originalTitle, originalText, essayInfo, aiScore) {
        showNotification(`Ajustando (IA: ${aiScore}%)`, 'warning', 4000);
        const adjustPrompt = `
**Tarefa:** Refine o texto da redação abaixo para torná-lo **MAIS HUMANO** e **MENOS DETECTÁVEL como IA**, mantendo a nota 1000 do ENEM e o tom objetivo. O texto atual foi sinalizado como ${aiScore}% provável de ser IA.
**Foco do Refinamento:** Naturalidade, Variação de frases, Vocabulário mais simples (1-2 coloquialismos SUTIS), Melhor Integração da Coletânea, Proposta Completa. Manter regras originais (PONTUAÇÃO APENAS . , " ", TAMANHO: ${HUMAN_WRITER_PRO.MIN_CHARS}-${HUMAN_WRITER_PRO.MAX_CHARS} chars). EVITAR OPINIÃO PESSOAL FORTE.
**Coletânea (Resumo):** "${essayInfo.coletanea.substring(0,500)}..."
**Texto Original:**
TÍTULO: ${originalTitle}
TEXTO: ${originalText}
**Formato de Saída (OBRIGATÓRIO):** Retorne EXATAMENTE no formato abaixo, sem NADA a mais:
TÍTULO: [Título refinado ou original]
TEXTO: [Texto da redação REFINADO]
`;
        try {
            const adjustedResponse = await getAiResponse(adjustPrompt);
            console.log('[Adjust Raw Response]:\n', adjustedResponse);

            const titleMatch = adjustedResponse.match(/TÍTULO:\s*([\s\S]*?)\s*TEXTO:/i);
            const textMatch = adjustedResponse.match(/TEXTO:\s*([\s\S]*)/i);

            if (!titleMatch || !textMatch || !titleMatch[1] || !textMatch[1]) {
                showNotification('Falha ao processar ajuste (formato), usando original.', 'error');
                return { title: originalTitle, text: originalText };
            }
            const adjustedTitle = titleMatch[1].trim();
            let adjustedEssayText = textMatch[1].trim();
            adjustedEssayText = cleanText(adjustedEssayText); // Limpa pontuação

            if (adjustedEssayText.length < HUMAN_WRITER_PRO.MIN_CHARS / 1.2) { // Ajustado limiar
                showNotification('Falha no ajuste (curto), usando original.', 'error');
                return { title: originalTitle, text: originalText };
            }
            if (adjustedEssayText.length > HUMAN_WRITER_PRO.MAX_CHARS) {
                 showNotification('Ajuste resultou em texto longo, truncando...', 'warning', 3000);
                 adjustedEssayText = adjustedEssayText.substring(0, HUMAN_WRITER_PRO.MAX_CHARS);
                 adjustedEssayText = adjustedEssayText.substring(0, adjustedEssayText.lastIndexOf('.') + 1);
             }

            showNotification('Texto refinado!', 'success');
            return { title: adjustedTitle, text: adjustedEssayText };
        } catch (error) {
            showNotification('Erro ao refinar texto.', 'error');
            return { title: originalTitle, text: originalText };
        }
    }

    async function checkAiScore(text) {
        showNotification('Verificando autenticidade...', 'info', 2000);
        const detectorPrompt = `Analise o texto: "${text.substring(0, 1500)}...". Estime a probabilidade (%) de ser IA (0=humano, 100=IA) baseado em repetições, clichês, formalidade excessiva, falta de erros/coloquialismos, transições, generalidade, variação de frase. Retorne **APENAS UM NÚMERO INTEIRO**.`;
        try {
            const scoreResponse = await getAiResponse(detectorPrompt);
            const score = parseInt(scoreResponse.match(/\d+/)?.[0] || '50', 10);
            return score;
        } catch (error) {
            showNotification('Erro na verificação de IA', 'error');
            return 50;
        }
    }

    async function generateAndAdaptEssay(essayInfo) {
        const prompt = HUMAN_WRITER_PRO.generatePrompt(essayInfo);
        showNotification('Gerando redação...', 'info', 0);
        try {
            let rawEssay = await getAiResponse(prompt);
            console.log('[Raw API Response]:\n', rawEssay);
            showNotification('Processando texto...', 'info', 3000);

            const titleMatch = rawEssay.match(/TÍTULO:\s*([\s\S]*?)\s*TEXTO:/i);
            const textMatch = rawEssay.match(/TEXTO:\s*([\s\S]*)/i);

            if (!titleMatch || !textMatch || !titleMatch[1] || !textMatch[1]) {
                console.error('[Generate] Falha ao parsear TÍTULO/TEXTO da resposta:', rawEssay);
                 // Tenta limpar a resposta bruta caso o formato esteja totalmente quebrado
                let cleanedFallbackText = cleanText(rawEssay.replace(/TÍTULO:|TEXTO:/gi, ''));
                 if (cleanedFallbackText.length > 50) { // Se sobrou algum texto útil
                    showNotification('Formato T/T inválido, usando texto limpo como fallback.', 'warning', 5000);
                    const fallbackTitle = "Título (Verificar)";
                    return { title: fallbackTitle, text: cleanedFallbackText, aiScore: 85 };
                 } else {
                    throw new Error('Formato T/T inválido e sem texto recuperável.');
                 }
            }

            let essayTitle = titleMatch[1].trim();
            let essayText = textMatch[1].trim();
            essayText = cleanText(essayText); // Limpa pontuação aqui!

            essayTitle = essayTitle.split(' ').map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()).join(' ');
            const chars = essayText.length;

            // Verificação de tamanho MAIS RIGOROSA
            if (chars < HUMAN_WRITER_PRO.MIN_CHARS) {
                showNotification(`Texto MUITO CURTO (${chars}/${HUMAN_WRITER_PRO.MIN_CHARS}). Verifique!`, 'error', 6000);
                 // Não prossegue se muito curto, pois a IA ignorou instrução crítica
                 throw new Error(`Texto gerado abaixo do mínimo (${chars} caracteres).`);
            } else if (chars > HUMAN_WRITER_PRO.MAX_CHARS) {
                showNotification(`Texto longo (${chars}/${HUMAN_WRITER_PRO.MAX_CHARS}), truncando...`, 'warning', 3000);
                essayText = essayText.substring(0, HUMAN_WRITER_PRO.MAX_CHARS);
                essayText = essayText.substring(0, essayText.lastIndexOf('.') + 1); // Corta na última frase
            }

            let aiScore = await checkAiScore(essayText);
            if (aiScore > 55) {
                const adjustedResult = await adjustTextIfAiDetected(essayTitle, essayText, essayInfo, aiScore);
                essayTitle = adjustedResult.title;
                essayText = adjustedResult.text; // Já vem limpo de adjustTextIfAiDetected
            } else {
                showNotification(`Autenticidade OK (IA: ${aiScore}%)`, 'success', 3000);
            }
            return { title: essayTitle, text: essayText, aiScore: aiScore };
        } catch (error) {
            const persistentNotification = document.querySelector('.hck-notification-ios:not([style*="opacity: 0"])');
            if(persistentNotification && !persistentNotification.timer) persistentNotification.remove(); // Remove 'Gerando...' se houver erro
            showNotification(`Erro: ${error.message}`, 'error', 5000);
            throw error;
        }
    }

     async function actionGenerateEssay() {
        const hckButton = document.getElementById('hck-btn-generate');
        if (hckButton) hckButton.disabled = true;
        try {
            const isEditorPresent = !!document.querySelector('.ql-editor');
            const pageTitleElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
            const urlPathRelevant = window.location.pathname.toLowerCase().includes('/atividade/');

            if (!isEditorPresent || !(pageTitleElement || urlPathRelevant)) {
                 showNotification('Página não parece ser de redação.', 'error', 4000);
                 if (hckButton) hckButton.disabled = false;
                 return;
             }

            showNotification('Coletando informações...', 'info', 2000);

             const essayInfo = {
                coletanea: pageTitleElement?.textContent ||
                           document.querySelector('.coletanea-container')?.innerText ||
                           document.querySelector('[data-testid="coletanea"]')?.innerText ||
                           '',
                enunciado: document.querySelector('.css-1pvvm3t')?.innerText ||
                           document.querySelector('.enunciado-container')?.innerText ||
                           document.querySelector('.ql-editor')?.innerText ||
                           '',
                generoTextual: document.querySelector('.css-1cq7p20')?.innerText ||
                               document.querySelector('.genero-textual')?.innerText ||
                              'dissertativo-argumentativo',
                criteriosAvaliacao: document.querySelector('.ql-align-justify')?.innerText ||
                                    document.querySelector('.criterios-avaliacao')?.innerText ||
                                    document.querySelector('.css-kf35ou .ql-editor')?.innerHTML ||
                                    ''
            };

            essayInfo.enunciado = essayInfo.enunciado.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            essayInfo.coletanea = essayInfo.coletanea.replace(/\s+/g, ' ').trim();
            essayInfo.criteriosAvaliacao = essayInfo.criteriosAvaliacao.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

            if (!essayInfo.enunciado && !essayInfo.coletanea) {
                showNotification('Dados (enunciado/coletânea) não encontrados.', 'error', 4000);
                if (hckButton) hckButton.disabled = false;
                return;
            }

            const { title, text, aiScore } = await generateAndAdaptEssay(essayInfo);
            const allTextareas = document.querySelectorAll('textarea');

            if (allTextareas.length === 0) {
                 showNotification('Nenhum campo de texto encontrado.', 'error', 4000);
                 if (hckButton) hckButton.disabled = false;
                 return;
            }

            let titleTextareaContainer = null;
            let essayTextareaContainer = null;

            if (allTextareas.length > 1) {
                 titleTextareaContainer = allTextareas[0]?.closest('div.MuiFormControl-root') || allTextareas[0]?.parentElement;
                 essayTextareaContainer = allTextareas[allTextareas.length - 1]?.closest('div.MuiFormControl-root') || allTextareas[allTextareas.length - 1]?.parentElement;
            } else {
                 essayTextareaContainer = allTextareas[0]?.closest('div.MuiFormControl-root') || allTextareas[0]?.parentElement;
            }

            if (titleTextareaContainer) {
                showNotification('Inserindo título...', 'info', 1500);
                let titleSuccess = await hackMUITextarea(titleTextareaContainer, title);
                 if (!titleSuccess) {
                    showNotification('Falha ao inserir título.', 'warning', 3000);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            } else if (allTextareas.length > 1) {
                 showNotification('Campo de título não encontrado, pulando.', 'warning', 2000);
             }

             if (essayTextareaContainer) {
                 showNotification('Inserindo redação...', 'info', 1500);
                 let textSuccess = await hackMUITextarea(essayTextareaContainer, text);
                 if (!textSuccess) {
                     showNotification('Falha ao inserir texto da redação.', 'error', 4000);
                     if (hckButton) hckButton.disabled = false;
                     return;
                 }
                 // Remove notificação de progresso antes da final
                 const progressNotification = document.querySelector('.hck-notification-ios:not([style*="opacity: 0"])');
                 if(progressNotification && !progressNotification.timer) progressNotification.remove();

                 showNotification(`Concluído! (IA: ${aiScore}%)`, 'success', 0);
             } else {
                 showNotification('Campo de texto da redação não encontrado.', 'error', 4000);
                 if (hckButton) hckButton.disabled = false;
                 return;
             }

        } catch (error) {
            console.error('[actionGenerateEssay] Erro:', error);
            // Erro já deve ter sido notificado, apenas garante reativar botão
        } finally {
            if (hckButton) hckButton.disabled = false;
        }
    }


    async function actionClearAll() {
        showNotification('Limpando campos...', 'info', 1500);
        const allTextareas = document.querySelectorAll('textarea');
        if (allTextareas.length === 0) {
            showNotification('Nenhum campo encontrado.', 'warning', 3000);
            return;
        }
        let clearedCount = 0;
        for (const textarea of allTextareas) {
            const container = textarea?.closest('div.MuiFormControl-root') || textarea?.parentElement;
            if (container && await hackMUITextarea(container, '')) {
                clearedCount++;
            }
        }
        if (clearedCount > 0) {
            showNotification(`Campos limpos (${clearedCount}).`, 'success'); // Feedback da imagem
        } else {
            showNotification('Falha ao limpar campos.', 'error');
        }
    }

    async function actionCopyText() {
        showNotification('Copiando texto...', 'info', 1000); // Feedback rápido
        const allTextareas = document.querySelectorAll('textarea');
         if (allTextareas.length === 0) {
             showNotification('Nenhum campo de texto encontrado.', 'warning', 3000);
             return;
         }
        // Assume o último textarea como o principal para cópia
        const targetTextarea = allTextareas[allTextareas.length - 1];
        const textToCopy = targetTextarea.value;

        if (!textToCopy) {
            showNotification('Campo de redação está vazio.', 'warning', 3000);
            return;
        }
        try {
            await navigator.clipboard.writeText(textToCopy);
            showNotification('Texto da redação copiado!', 'success', 2500); // Feedback de sucesso
        } catch (error) {
            showNotification('Erro ao copiar texto.', 'error', 3000); // Feedback de erro
            console.error('[copyText] Erro:', error);
        }
    }

    function loadUI() {
        if (document.getElementById('hck-menu-ios')) return;
        const styles = `
:root { --hck-menu-bg: rgba(248, 248, 248, 0.85); --hck-menu-blur: 12px; --hck-menu-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); --hck-border-radius: 16px; --hck-text-color: #333; --hck-button-bg: rgba(255, 255, 255, 0.9); --hck-button-hover-bg: rgba(235, 235, 235, 0.9); --hck-button-active-bg: rgba(220, 220, 220, 0.9); --hck-accent-color: #007AFF; --hck-close-color: #8e8e93; }
@media (prefers-color-scheme: dark) { :root { --hck-menu-bg: rgba(44, 44, 46, 0.85); --hck-text-color: #EAEAEA; --hck-button-bg: rgba(68, 68, 70, 0.9); --hck-button-hover-bg: rgba(88, 88, 90, 0.9); --hck-button-active-bg: rgba(108, 108, 110, 0.9); --hck-close-color: #8e8e93; } }
#hck-menu-toggle-ios { position: fixed; bottom: 20px; right: 20px; background-color: var(--hck-accent-color); color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; font-size: 14px; font-weight: 600; padding: 8px 14px; border-radius: 50px; cursor: pointer; box-shadow: var(--hck-menu-shadow); z-index: 10000; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s ease; user-select: none; }
#hck-menu-toggle-ios:hover { transform: scale(1.05); filter: brightness(1.1); }
#hck-menu-toggle-ios:active { transform: scale(0.95); filter: brightness(0.9); }
#hck-menu-ios { position: fixed; bottom: 75px; right: 20px; background-color: var(--hck-menu-bg); backdrop-filter: blur(var(--hck-menu-blur)); -webkit-backdrop-filter: blur(var(--hck-menu-blur)); border-radius: var(--hck-border-radius); box-shadow: var(--hck-menu-shadow); padding: 12px; z-index: 10000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; color: var(--hck-text-color); min-width: 180px; display: flex; flex-direction: column; gap: 8px; opacity: 0; transform: translateY(15px) scale(0.95); transform-origin: bottom right; transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1); pointer-events: none; }
#hck-menu-ios.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
#hck-menu-ios-header { position: relative; display: flex; align-items: center; padding-bottom: 8px; border-bottom: 1px solid rgba(128, 128, 128, 0.2); margin-bottom: 4px; }
#hck-menu-ios-title { flex-grow: 1; text-align: center; font-size: 16px; font-weight: 600; margin: 0 20px; }
#hck-menu-ios-close { position: absolute; top: -2px; right: -2px; font-size: 18px; font-weight: normal; color: var(--hck-close-color); cursor: pointer; padding: 2px 6px; border-radius: 50%; line-height: 1; transition: background-color 0.2s ease; }
#hck-menu-ios-close:hover { background-color: rgba(128, 128, 128, 0.15); }
#hck-menu-ios-close:active { background-color: rgba(128, 128, 128, 0.3); }
.hck-menu-button { background-color: var(--hck-button-bg); color: var(--hck-text-color); border: none; border-radius: 10px; padding: 10px 12px; width: 100%; font-size: 14px; font-weight: 500; text-align: left; cursor: pointer; transition: background-color 0.15s ease, transform 0.1s ease; display: flex; align-items: center; gap: 8px; }
.hck-menu-button:hover { background-color: var(--hck-button-hover-bg); }
.hck-menu-button:active { background-color: var(--hck-button-active-bg); transform: scale(0.98); }
.hck-menu-button:disabled { opacity: 0.5; cursor: not-allowed; background-color: var(--hck-button-bg); }
.hck-notification-ios { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px); background-color: var(--hck-menu-bg); backdrop-filter: blur(var(--hck-menu-blur)); -webkit-backdrop-filter: blur(var(--hck-menu-blur)); color: var(--hck-text-color); padding: 10px 20px; border-radius: var(--hck-border-radius); box-shadow: var(--hck-menu-shadow); z-index: 10001; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease; max-width: 90%; text-align: center; pointer-events: none; }
.hck-notification-ios.success { background-color: rgba(52, 199, 89, 0.85); color: white; font-weight: 500; }
.hck-notification-ios.warning { background-color: rgba(255, 149, 0, 0.85); color: white; font-weight: 500; }
.hck-notification-ios.error { background-color: rgba(255, 59, 48, 0.85); color: white; font-weight: 500; }
`;
        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);
        const menuHTML = `<div id="hck-menu-ios"><div id="hck-menu-ios-header"><span id="hck-menu-ios-title">HCK Redação</span><span id="hck-menu-ios-close">✕</span></div><button id="hck-btn-generate" class="hck-menu-button">Gerar Redação</button><button id="hck-btn-copy" class="hck-menu-button">Copiar Texto</button><button id="hck-btn-clear" class="hck-menu-button">Limpar Campos</button></div>`;
        const toggleHTML = `<div id="hck-menu-toggle-ios">HCK</div>`;
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        document.body.insertAdjacentHTML('beforeend', toggleHTML);
        const menu = document.getElementById('hck-menu-ios');
        const toggleButton = document.getElementById('hck-menu-toggle-ios');
        const closeButton = document.getElementById('hck-menu-ios-close');
        toggleButton.addEventListener('click', () => {
            menu.classList.add('visible');
            toggleButton.style.opacity = '0';
            toggleButton.style.pointerEvents = 'none';
        });
        closeButton.addEventListener('click', () => {
            menu.classList.remove('visible');
            toggleButton.style.opacity = '1';
            toggleButton.style.pointerEvents = 'auto';
        });
        document.getElementById('hck-btn-generate').addEventListener('click', window.actionGenerateEssay);
        document.getElementById('hck-btn-clear').addEventListener('click', window.actionClearAll);
        document.getElementById('hck-btn-copy').addEventListener('click', window.actionCopyText);
    }

    // --- Inicialização ---
    showNotification('HCK Redação por Hackermoon', 'info', 4000); // Créditos iniciais

    window.actionGenerateEssay = actionGenerateEssay;
    window.actionClearAll = actionClearAll;
    window.actionCopyText = actionCopyText;

    loadUI();

})().catch(error => {
    console.error('[HCK Redação] Erro:', error);
    try { showNotification(`Erro: ${error.message}`, 'error', 5000); } catch(e){}
});

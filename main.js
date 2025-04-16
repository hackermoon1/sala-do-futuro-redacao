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
            temperature: 0.75, // Mantido, mas pode ser reduzido (ex: 0.7) se a aleatoriedade persistir
            topP: 0.85,
            maxOutputTokens: 3000
        },
        TARGET_CHARS: 2400,
        MIN_CHARS: 1800,
        MAX_CHARS: 3080,
        MIN_LINES: 28,
        MAX_LINES: 32,

        generatePrompt: (essayInfo) => {
            const safeColetanea = essayInfo.coletanea.substring(0, 800);
            const safeEnunciado = essayInfo.enunciado.substring(0, 300);
            const safeCriterios = essayInfo.criteriosAvaliacao.substring(0, 500);

            return `
**Tarefa:** Aja como um estudante do ensino médio brasileiro, nota 1000 no ENEM. Escreva uma redação **dissertativo-argumentativa** sobre o tema proposto, seguindo RIGOROSAMENTE as instruções abaixo. A prioridade MÁXIMA é o formato de saída.

**Tema Central:** "${safeEnunciado}..."
**Gênero:** ${essayInfo.generoTextual || "dissertativo-argumentativo"}
**Coletânea (Resumo):** "${safeColetanea}..."
**Critérios Relevantes:** "${safeCriterios}..."

**▼ DIRETRIZES DE ESTILO E TOM (OBRIGATÓRIO):**
1.  **Título:** Crie um título curto (3-4 palavras), criativo. Apenas a primeira letra da primeira palavra maiúscula (ex: "Caminhos da ciência").
2.  **Linguagem:** Formal, porém acessível e dinâmica, vocabulário de bom aluno de ensino médio (evite "hodiernamente", "salutar", "precípuo", "mitigar").
3.  **Fluidez:** Frases curtas/médias (MÁXIMO 18 palavras), varie o ritmo. Transições suaves.
4.  **Pontuação:** Use APENAS vírgula (,), ponto (.) e aspas (" "). **PROIBIDO:** (), !, ?, ;, —.
5.  **Coloquialismo Controlado:** Inclua 2-3 expressões coloquiais comuns de forma natural (ex: "é fato que", "não é à toa", "acaba sendo"). Evite gírias.
6.  **Coletânea:** Use ideias da coletânea nos argumentos, citando indiretamente ("A coletânea menciona...", "Um dos textos de apoio diz..."). **NÃO invente dados numéricos.**
7.  **Conhecimento:** Compatível com visão de estudante (impactos sociais, educacionais).

**▼ ESTRUTURA DETALHADA (OBRIGATÓRIA):**
*   **INTRODUÇÃO (4-5 linhas):** Contextualize com coletânea. Apresente problema. Tese objetiva no final.
*   **DESENVOLVIMENTO 1 (8-9 linhas):** Tópico frasal. Fundamentação (coletânea/paráfrase). Aprofundamento (exemplos/causas/consequências).
*   **DESENVOLVIMENTO 2 (8-9 linhas):** Tópico frasal. Fundamentação (coletânea/conhecimento geral). Aprofundamento e relevância.
*   **CONCLUSÃO (4-5 linhas):** Retome tese. Proposta COMPLETA (Agente, Ação, Meio/Modo, Finalidade/Efeito - DETALHADOS). Fechamento curto.

**▼ EVITAR ABSOLUTAMENTE:** Clichês ("É notório que..."). Repetições excessivas. Voz passiva excessiva. Generalizações vagas. Estruturas repetitivas. Tom robótico. Listas/Marcadores.

**▼ FORMATO DE SAÍDA (PRIORIDADE MÁXIMA - Siga EXATAMENTE):**
*   Texto entre ${HUMAN_WRITER_PRO.MIN_CHARS} e ${HUMAN_WRITER_PRO.MAX_CHARS} caracteres, ${HUMAN_WRITER_PRO.MIN_LINES} e ${HUMAN_WRITER_PRO.MAX_LINES} linhas.
*   Retorne APENAS o título e o texto, neste formato exato, sem NADA antes ou depois:
TÍTULO: [Título aqui]
TEXTO: [Texto da redação completo aqui]

**Instrução Final:** Gere a redação completa seguindo TODAS as regras, especialmente o FORMATO DE SAÍDA. Sua resposta DEVE começar EXATAMENTE com 'TÍTULO:' e conter 'TEXTO:'. Não inclua NENHUMA outra palavra, explicação ou formatação fora desses marcadores.
`;
        }
    };

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
                    // Adicionando configurações de segurança para bloquear menos (Use com cautela)
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

            // Verifica bloqueio mesmo com safetySettings=NONE (pode ocorrer por outros motivos)
             if (!data.candidates || data.candidates.length === 0) {
                 if (data.promptFeedback?.blockReason) {
                     throw new Error(`API bloqueou (${model}): ${data.promptFeedback.blockReason}`);
                 } else {
                     // Verifica se há texto em 'finishReason: OTHER' que pode ser útil
                     const finishReason = data.candidates?.[0]?.finishReason;
                     const safetyRatings = data.candidates?.[0]?.safetyRatings;
                     console.warn(`[API Warning] Resposta vazia ou bloqueada (${model}). FinishReason: ${finishReason}`, safetyRatings);
                     // Tenta extrair algo se for OTHER, senão lança erro
                     if(finishReason === 'OTHER') {
                         console.warn("Tentando extrair texto de resposta parcial (finishReason: OTHER)");
                         // Esta parte é especulativa, a estrutura exata pode variar
                         const partialText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                         if (partialText) return partialText; // Retorna o que tiver
                     }
                     throw new Error(`Resposta inválida ou vazia da API (${model})`);
                 }
             }


            if (!data.candidates[0]?.content?.parts?.[0]?.text) {
                 // Se chegou aqui sem texto, algo está estranho
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
        let notification = document.querySelector('.hck-notification-ios');
        if (notification && notification.timer) { // Limpa timer apenas se existir
            clearTimeout(notification.timer);
            notification.remove(); // Remove imediatamente para nova notificação
        }
        // Cria a nova notificação
        notification = document.createElement('div');
        notification.className = `hck-notification-ios ${type}`;
        notification.innerHTML = `<span class="hck-notification-message">${message}</span>`;
        document.body.appendChild(notification);
        void notification.offsetWidth;

        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';

        if (duration > 0) {
            notification.timer = setTimeout(() => {
                if (notification) { // Verifica se ainda existe antes de animar/remover
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateY(20px)';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        } else {
            notification.timer = null; // Indica que é persistente
        }
    }


    async function adjustTextIfAiDetected(originalTitle, originalText, essayInfo, aiScore) {
        showNotification(`Ajustando (IA: ${aiScore}%)`, 'warning', 4000);
        const adjustPrompt = `
**Tarefa:** Refine o texto da redação abaixo para torná-lo **MAIS HUMANO** e **MENOS DETECTÁVEL como IA**, mantendo a nota 1000 do ENEM. O texto atual foi sinalizado como ${aiScore}% provável de ser IA.
**Foco do Refinamento:** Naturalidade, Variação, Vocabulário Simples (+ 2-3 coloquialismos sutis), Melhor Integração da Coletânea, Proposta Completa. Manter regras originais (pontuação, estrutura, tamanho: ${HUMAN_WRITER_PRO.MIN_CHARS}-${HUMAN_WRITER_PRO.MAX_CHARS} chars, ${HUMAN_WRITER_PRO.MIN_LINES}-${HUMAN_WRITER_PRO.MAX_LINES} linhas).
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
            console.log('[Adjust Raw Response]:\n', adjustedResponse); // Log da resposta do ajuste

            const titleMatch = adjustedResponse.match(/TÍTULO:\s*([\s\S]*?)\s*TEXTO:/i);
            const textMatch = adjustedResponse.match(/TEXTO:\s*([\s\S]*)/i);

            if (!titleMatch || !textMatch || !titleMatch[1] || !textMatch[1]) {
                showNotification('Falha ao processar ajuste (formato), usando original.', 'error');
                return { title: originalTitle, text: originalText };
            }
            const adjustedTitle = titleMatch[1].trim();
            const adjustedEssayText = textMatch[1].trim();

            if (adjustedEssayText.length < HUMAN_WRITER_PRO.MIN_CHARS / 1.5) {
                showNotification('Falha no ajuste (curto), usando original.', 'error');
                return { title: originalTitle, text: originalText };
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
            const rawEssay = await getAiResponse(prompt);
            console.log('[Raw API Response]:\n', rawEssay); // Log da resposta bruta
            showNotification('Processando texto...', 'info', 3000);

            // --- Parsing Robusto ---
            const titleMatch = rawEssay.match(/TÍTULO:\s*([\s\S]*?)\s*TEXTO:/i);
            const textMatch = rawEssay.match(/TEXTO:\s*([\s\S]*)/i);

            if (!titleMatch || !textMatch || !titleMatch[1] || !textMatch[1]) {
                console.error('[Generate] Falha ao parsear TÍTULO/TEXTO da resposta:', rawEssay);
                showNotification('Erro ao processar resposta da IA (formato T/T).', 'error', 5000);
                throw new Error('Formato de resposta da IA inválido (TÍTULO/TEXTO não encontrados).');
            }

            let essayTitle = titleMatch[1].trim();
            let essayText = textMatch[1].trim();
            // --- Fim Parsing Robusto ---

            essayTitle = essayTitle.split(' ').map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()).join(' ');
            const lines = essayText.split('\n').length;
            const chars = essayText.length;

            if (chars < HUMAN_WRITER_PRO.MIN_CHARS || lines < HUMAN_WRITER_PRO.MIN_LINES) {
                showNotification('Texto curto, verifique.', 'warning', 4000);
            } else if (chars > HUMAN_WRITER_PRO.MAX_CHARS || lines > HUMAN_WRITER_PRO.MAX_LINES) {
                showNotification('Texto longo, ajustando...', 'warning', 3000);
                essayText = essayText.substring(0, HUMAN_WRITER_PRO.MAX_CHARS);
                essayText = essayText.substring(0, essayText.lastIndexOf('.') + 1);
            }
            let aiScore = await checkAiScore(essayText);
            if (aiScore > 55) {
                const adjustedResult = await adjustTextIfAiDetected(essayTitle, essayText, essayInfo, aiScore);
                essayTitle = adjustedResult.title;
                essayText = adjustedResult.text;
            } else {
                showNotification(`Autenticidade OK (IA: ${aiScore}%)`, 'success', 3000);
            }
            return { title: essayTitle, text: essayText, aiScore: aiScore };
        } catch (error) {
             // Garante que a notificação de erro seja exibida mesmo se getAiResponse já tiver mostrado uma
            showNotification(`Erro final: ${error.message}`, 'error', 5000);
            throw error; // Propaga o erro para o catch principal
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

            // Verifica se coletou dados essenciais
            if (!essayInfo.enunciado && !essayInfo.coletanea) {
                showNotification('Dados essenciais (enunciado/coletânea) não encontrados.', 'error', 4000);
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
                 const progressNotification = document.querySelector('.hck-notification-ios');
                 if (progressNotification && !progressNotification.timer) { // Se for persistente
                     progressNotification.remove();
                 }
                 showNotification(`Concluído! (IA: ${aiScore}%)`, 'success', 0);
             } else {
                 showNotification('Campo de texto da redação não encontrado.', 'error', 4000);
                 if (hckButton) hckButton.disabled = false;
                 return;
             }

        } catch (error) {
            // Erro já notificado em generateAndAdaptEssay, apenas garante reativar botão
            console.error('[actionGenerateEssay] Erro:', error);
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
            showNotification(`Campos limpos (${clearedCount}).`, 'success');
        } else {
            showNotification('Falha ao limpar campos.', 'error');
        }
    }

    async function actionCopyText() {
        showNotification('Copiando texto...', 'info', 1500);
        const allTextareas = document.querySelectorAll('textarea');
         if (allTextareas.length === 0) {
             showNotification('Nenhum campo de texto encontrado.', 'warning', 3000);
             return;
         }
        const lastTextarea = allTextareas[allTextareas.length - 1];
        const textToCopy = lastTextarea.value;
        if (!textToCopy) {
            showNotification('Campo vazio.', 'warning', 3000);
            return;
        }
        try {
            await navigator.clipboard.writeText(textToCopy);
            showNotification('Texto copiado!', 'success');
        } catch (error) {
            showNotification('Erro ao copiar.', 'error');
            console.error('[copyText] Erro ao copiar:', error);
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

    window.actionGenerateEssay = actionGenerateEssay;
    window.actionClearAll = actionClearAll;
    window.actionCopyText = actionCopyText;

    loadUI();

})().catch(error => {
    console.error('[HCK Redação] Erro:', error);
    // Tenta mostrar notificação mesmo em erro geral
    try { showNotification(`Erro: ${error.message}`, 'error', 5000); } catch(e){}
});

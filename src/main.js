// Função para manipular textareas MUI (Material-UI)
async function hackMUITextarea(textareaElement, textToInsert) {
    const textarea = textareaElement.querySelector('textarea');
    if (!textarea) return false;

    try {
        // Tenta encontrar handlers React no elemento
        const reactProps = Object.keys(textarea)
            .filter(prop => prop.startsWith('__reactProps$') || prop.includes('__reactEventHandlers$') || prop.includes('__reactFiber$'));
        
        if (reactProps.length > 0) {
            for (const prop of reactProps) {
                const handler = textarea[prop];
                if (handler && typeof handler.onChange === 'function') {
                    console.log('[DEBUG] Manipulador onChange encontrado em:', prop);
                    const fakeEvent = {
                        target: { value: textToInsert },
                        currentTarget: { value: textToInsert },
                        preventDefault: () => {},
                        stopPropagation: () => {}
                    };
                    handler.onChange(fakeEvent);
                    setTimeout(() => {
                        textarea.value === textToInsert 
                            ? console.log('[SUCCESS] tudo norma') 
                            : console.log('[DEBUG]');
                    }, 100);
                    return true;
                }
            }
        }
    } catch (error) {
        console.error('[ERROR]', error);
    }

    // Tenta métodos alternativos se o primeiro falhar
    try {
        textarea.value = '';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => {
            textarea.value = textToInsert;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            textarea.dispatchEvent(new Event('blur', { bubbles: true }));
            console.log('[DEBUG] Valor após InputEvent:', textarea.value);
        }, 50);
    } catch (error) {
        console.error('[ERROR]', error);
    }

    // Método de fallback usando execCommand (antigo)
    setTimeout(() => {
        if (textarea.value !== textToInsert) {
            try {
                textarea.focus();
                textarea.select();
                document.designMode = 'on';
                document.execCommand('insertText', false, textToInsert);
                console.log('[DEBUG] Valor após execCommand:', textarea.value);
            } catch (error) {
                console.error('[ERROR] Erro no método execCommand:', error);
            }
        }
    }, 150);

    // Último método de fallback
    setTimeout(() => {
        if (textarea.value !== textToInsert) {
            console.log('[DEBUG] Tentando método InputEvent');
            try {
                textarea.focus();
                textarea.value = '';
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    data: textToInsert,
                    inputType: 'insertText'
                });
                textarea.value = textToInsert;
                textarea.dispatchEvent(inputEvent);
                console.log('[DEBUG] Valor após InputEvent:', textarea.value);
            } catch (error) {
                console.error('[ERROR] Erro no método InputEvent:', error);
            }
        }
    }, 250);

    // Verificação final
    setTimeout(() => {
        console.log('[DEBUG] Verificação final - valor do textarea:', textarea.value);
        textarea.value === textToInsert 
            ? console.log('[SUCCESS] Texto inserido com sucesso!') 
            : console.log('[ERROR] Falha ao inserir texto. Valor atual:', textarea.value);
    }, 500);

    return true;
}

// Função para obter resposta da API Gemini
async function get_ai_response(prompt) {
    const apiKey = 'AIzaSyBmQYkaY_EUy4fM6PVj8l0H6QrzuD5ZWus';
    const model = 'gemini-1.5-flash';
    
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 1,
                        topP: 0.95,
                        topK: 40,
                        maxOutputTokens: 8192
                    }
                })
            }
        );

        if (!response.ok) throw new Error(`Erro na API do Gemini: ${response.status}`);
        
        const data = await response.json();
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
            throw new Error('Resposta inválida da API do Gemini');
        }
        
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('[ERROR] Falha ao obter resposta da IA:', error);
        throw error;
    }
}

// Função principal que orquestra tudo
async function verificarRedacao() {
    const activityElement = document.querySelector('p.MuiTypography-root.MuiTypography-body1.css-m576f2');
    
    if (activityElement && activityElement.textContent.includes('Redação')) {
        // Mensagem de créditos/contato
        const infoMessage = '[INFO] script feito por marcos10pc | discord.gg/platformdestroyer';
        alert(infoMessage);
        
        // Obtém ID da atividade da URL
        const currentUrl = new URL(window.location.href);
        const pathParts = currentUrl.pathname.split('/');
        const activityId = pathParts.includes('atividade') ? pathParts[pathParts.indexOf('atividade') + 1] : null;
        console.log('[DEBUG] ID DA REDAÇÃO:', activityId);
        
        // Coleta informações da página
        const title = document.querySelector('.css-1pvvm3t').innerText;
        const promptText = document.querySelector('.ql-align-justify').innerHTML;
        const textType = document.querySelector('.css-1cq7p20').innerHTML;
        const criteria = document.querySelector('.ql-editor').innerHTML;
        
        const essayInfo = {
            coletanea: title,
            enunciado: promptText,
            generoTextual: textType,
            criteriosAvaliacao: criteria
        };
        
        // Prompt para a IA
        const aiPrompt = `
        Usando as informações a seguir sobre uma tarefa de redação, você precisa me fornecer:
        1. Um título para a redação
        2. O texto completo da redação
        
        **Formate sua resposta exatamente assim:**
        TITULO: [Título da redação]
        
        TEXTO: [Texto da redação]
        
        Informações da redação: ${JSON.stringify(essayInfo)}`;
        
        alert('[INFO] Gerando redação com IA...');
        const aiResponse = await get_ai_response(aiPrompt);
        
        if (!aiResponse.includes('TITULO:') || !aiResponse.includes('TEXTO:')) {
            throw new Error('Formato de resposta da IA inválido. A resposta não contém "TITULO:" ou "TEXTO:".');
        }
        
        // Processa a resposta da IA
        const essayTitle = aiResponse.split('TITULO:')[1].split('TEXTO:')[0].trim();
        const essayText = aiResponse.split('TEXTO:')[1].trim();
        
        // Prompt para humanizar o texto
        const humanizePrompt = `
        Reescreva o seguinte texto acadêmico em português para que pareça escrito por um estudante humano, não por IA.
        
        Regras importantes:
        1. Mantenha o conteúdo e os argumentos principais intactos
        2. Adicione pequenas imperfeições naturais como ocasionais repetições de palavras ou construções frasais variadas
        3. Use linguagem mais natural e menos robótica, com algumas expressões coloquiais
        4. Varie o comprimento das frases para criar um ritmo mais natural
        5. Preserve os parágrafos e a estrutura geral
        6. Mantenha todas as referências e exemplos usados, apenas reescrevendo-os de forma mais natural
        7. Ocasionalmente adicione palavras como "tipo", "bem", "na real" para dar um tom mais humano
        8. Evite linguagem artificial ou muito técnica que um estudante normalmente não usaria
        
        Texto para reescrever:
        ${essayText}
        
        Lembre-se: devolva APENAS o texto reescrito, sem comentários ou explicações adicionais.`;
        
        alert('[INFO] Humanizando redação...');
        const humanizedText = await get_ai_response(humanizePrompt);
        
        console.log('Redação Gerada:', aiResponse);
        console.log('Redação Humanizada:', humanizedText);
        console.log('[DEBUG] Iniciando inserção de título e texto');
        
        // Insere o texto na página
        const firstTextarea = document.querySelector('textarea').parentElement;
        const titleInserted = await hackMUITextarea(firstTextarea, essayTitle);
        
        setTimeout(async () => {
            const allTextareas = document.querySelectorAll('textarea');
            const lastTextarea = allTextareas[allTextareas.length - 1].parentElement;
            const textInserted = await hackMUITextarea(lastTextarea, humanizedText);
            
            setTimeout(() => {
                alert('[SUCESSO] Redação inserida com sucesso!');
            }, 1000);
        }, 1000);
    } else {
        alert('[ERROR] Você precisa usar o script em uma redação >:(');
    }
}

// Inicia o processo
verificarRedacao();
console.log('[DEBUG] Hello World!');

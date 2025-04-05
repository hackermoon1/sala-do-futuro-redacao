(function() {
    if (document.getElementById('hck-menu-toggle')) return;

    // Botão de abrir (HCK RDC)
    const toggleButton = document.createElement('div');
    toggleButton.id = 'hck-menu-toggle';
    toggleButton.textContent = 'HCK RDC';
    toggleButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(37, 37, 37, 0.9);
        color: #fff;
        padding: 10px 20px;
        border-radius: 15px;
        font-size: 14px;
        font-family: 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        z-index: 10000;
        transition: transform 0.3s ease;
    `;
    toggleButton.onmouseover = () => toggleButton.style.transform = 'scale(1.05)';
    toggleButton.onmouseout = () => toggleButton.style.transform = 'scale(1)';
    document.body.appendChild(toggleButton);

    // Menu principal
    const menu = document.createElement('div');
    menu.id = 'hck-menu';
    menu.style.cssText = `
        position: fixed;
        bottom: 70px;
        right: 20px;
        background: rgba(37, 37, 37, 0.9);
        border-radius: 20px;
        padding: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        z-index: 10000;
        font-family: 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
        display: none;
        flex-direction: column;
        gap: 10px;
        min-width: 200px;
        max-width: 90vw;
        color: #fff;
    `;

    // Título do menu (HCK REDAÇÃO)
    const title = document.createElement('div');
    title.textContent = 'HCK REDAÇÃO';
    title.style.cssText = `
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        text-align: center;
        margin-bottom: 5px;
    `;
    menu.appendChild(title);

    // Botão de fechar (X)
    const closeButton = document.createElement('div');
    closeButton.innerHTML = '✕';
    closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        color: #fff;
        font-size: 16px;
        cursor: pointer;
        transition: transform 0.3s ease;
    `;
    closeButton.onmouseover = () => closeButton.style.transform = 'scale(1.2)';
    closeButton.onmouseout = () => closeButton.style.transform = 'scale(1)';
    closeButton.onclick = () => {
        menu.style.display = 'none';
        toggleButton.style.display = 'block';
    };
    menu.appendChild(closeButton);

    // Botões do menu
    const buttons = [
        { text: 'Gerar', action: 'generateEssay' },
        { text: 'Limpar Tudo', action: 'clearAll' },
        { text: 'Limpar Título', action: 'clearTitle' },
        { text: 'Limpar Texto', action: 'clearText' }
    ];

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.style.cssText = `
            background: #fff;
            color: #000;
            border: none;
            border-radius: 15px;
            padding: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.3s ease, transform 0.1s ease;
        `;
        button.onmouseover = () => button.style.background = '#e0e0e0';
        button.onmouseout = () => button.style.background = '#fff';
        button.onmousedown = () => button.style.transform = 'scale(0.95)';
        button.onmouseup = () => button.style.transform = 'scale(1)';
        button.onclick = () => window[btn.action]();
        menu.appendChild(button);
    });

    // Créditos
    const credits = document.createElement('div');
    credits.textContent = 'Desenvolvido por [Seu Nome]';
    credits.style.cssText = `
        font-size: 12px;
        color: #ccc;
        text-align: center;
        margin-top: 10px;
    `;
    menu.appendChild(credits);

    document.body.appendChild(menu);

    // Alternar visibilidade do menu
    toggleButton.onclick = () => {
        menu.style.display = 'flex';
        toggleButton.style.display = 'none';
    };

    const style = document.createElement('style');
    style.textContent = `
        button:hover {
            background: #e0e0e0 !important;
        }
        button:active {
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(style);
})();

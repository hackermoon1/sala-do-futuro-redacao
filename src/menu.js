(function() {
    if (document.getElementById('hck-menu')) return;

    const menu = document.createElement('div');
    menu.id = 'hck-menu';
    menu.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 20px;
        padding: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', sans-serif;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 200px;
    `;

    const title = document.createElement('div');
    title.textContent = 'HCK REDAÇÃO';
    title.style.cssText = `
        font-size: 16px;
        font-weight: 600;
        color: #000;
        text-align: center;
        margin-bottom: 5px;
    `;
    menu.appendChild(title);

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
            background: #007AFF;
            color: #fff;
            border: none;
            border-radius: 12px;
            padding: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.3s ease, transform 0.1s ease;
        `;
        button.onmouseover = () => button.style.background = '#005BB5';
        button.onmouseout = () => button.style.background = '#007AFF';
        button.onmousedown = () => button.style.transform = 'scale(0.95)';
        button.onmouseup = () => button.style.transform = 'scale(1)';
        button.onclick = () => window[btn.action]();
        menu.appendChild(button);
    });

    document.body.appendChild(menu);

    const style = document.createElement('style');
    style.textContent = `
        button:hover {
            background: #005BB5 !important;
        }
        button:active {
            transform: scale(0.95);
        }
    `;
    document.head.appendChild(style);
})();

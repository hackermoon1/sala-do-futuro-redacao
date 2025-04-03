const styles = `
    .hck-menu {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        max-width: 90vw;
        background: #1e1e1e;
        color: #fff;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 6px 15px rgba(0,0,0,0.5);
        z-index: 10000;
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
        transform: translateY(150%);
        opacity: 0;
    }
    .hck-menu.open {
        transform: translateY(0);
        opacity: 1;
    }
    .hck-menu h3 {
        margin: 0 0 15px;
        font-size: clamp(16px, 5vw, 20px);
        text-align: center;
        color: #ff4444;
    }
    .hck-menu button {
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        background: #ff4444;
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: clamp(12px, 4vw, 14px);
        cursor: pointer;
        transition: background 0.2s ease, transform 0.1s ease;
    }
    .hck-menu button:hover {
        background: #ff6666;
        transform: translateY(-2px);
    }
    .hck-menu button:active {
        transform: translateY(1px);
    }
    .hck-credits {
        font-size: clamp(10px, 3vw, 12px);
        text-align: center;
        margin-top: 15px;
        color: #bbb;
        transition: color 0.2s ease;
    }
    .hck-credits:hover {
        color: #fff;
    }
    @media (max-width: 768px) {
        .hck-menu {
            bottom: 10px;
            right: 10px;
            padding: 15px;
        }
    }
`;

const menu = document.createElement('div');
menu.className = 'hck-menu';
menu.innerHTML = `
    <h3>HCK REDAÇÃO</h3>
    <button onclick="window.generateEssay()">Gerar Redação</button>
    <button onclick="alert('HCK Redação v5.0\\nFeito por Hackermoon\\n2025')">Sobre</button>
    <button onclick="document.querySelector('.hck-menu').classList.toggle('open')">Abrir/Fechar</button>
    <div class="hck-credits">Feito por Hackermoon - 2025</div>
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

document.body.appendChild(menu);
setTimeout(() => menu.classList.add('open'), 200);

const styles = `
    .hck-menu {
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 200px;
        max-width: 80vw;
        background: #1e1e1e;
        color: #fff;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        z-index: 10000;
        transition: transform 0.3s ease, opacity 0.3s ease;
        transform: translateY(100%);
        opacity: 0;
    }
    .hck-menu.open {
        transform: translateY(0);
        opacity: 1;
    }
    .hck-menu.closed {
        width: auto;
        padding: 5px 10px;
        cursor: pointer;
    }
    .hck-menu h3 {
        margin: 0 0 10px;
        font-size: clamp(14px, 4vw, 16px);
        text-align: center;
        color: #ff4444;
    }
    .hck-menu button {
        width: 100%;
        padding: 8px;
        margin: 5px 0;
        background: #ff4444;
        border: none;
        border-radius: 4px;
        color: #fff;
        font-size: clamp(12px, 3vw, 14px);
        cursor: pointer;
        transition: background 0.2s ease;
    }
    .hck-menu button:hover {
        background: #ff6666;
    }
    .hck-credits {
        font-size: clamp(10px, 2.5vw, 12px);
        text-align: center;
        margin-top: 10px;
        color: #bbb;
    }
    .hck-icon {
        font-size: clamp(14px, 4vw, 16px);
        color: #ff4444;
    }
    @media (max-width: 768px) {
        .hck-menu {
            bottom: 5px;
            right: 5px;
        }
    }
`;

const menu = document.createElement('div');
menu.className = 'hck-menu closed';
menu.innerHTML = `<span class="hck-icon">HCK REDAÇÃO</span>`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

document.body.appendChild(menu);

function toggleMenu() {
    if (menu.classList.contains('closed')) {
        menu.classList.remove('closed');
        menu.classList.add('open');
        menu.innerHTML = `
            <h3>HCK REDAÇÃO</h3>
            <button onclick="window.generateEssay()">Gerar Redação</button>
            <button onclick="alert('HCK Redação v5.0\\nFeito por Hackermoon\\n2025')">Sobre</button>
            <button onclick="toggleMenu()">Fechar</button>
           mentation<div class="hck-credits">Feito por Hackermoon - 2025</div>
        `;
    } else {
        menu.classList.remove('open');
        menu.classList.add('closed');
        menu.innerHTML = `<span class="hck-icon">HCK REDAÇÃO</span>`;
    }
}

menu.addEventListener('click', () => {
    if (menu.classList.contains('closed')) toggleMenu();
});

setTimeout(() => toggleMenu(), 200);

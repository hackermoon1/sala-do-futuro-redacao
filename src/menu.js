const styles = `
    .hck-menu {
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 150px;
        max-width: 55vw;
        background: #252525;
        color: #fff;
        border-radius: 6px;
        padding: 5px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        z-index: 10000;
        transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55), opacity 0.3s ease;
        transform: translateY(120%);
        opacity: 0;
    }
    .hck-menu.open {
        transform: translateY(0);
        opacity: 1;
    }
    .hck-menu.closed {
        width: auto;
        padding: 3px 8px;
        background: #303030;
        border-radius: 4px;
        cursor: pointer;
        transform: translateY(0);
        opacity: 1;
    }
    .hck-menu h3 {
        margin: 0 0 5px;
        font-size: clamp(11px, 3vw, 13px);
        text-align: center;
        color: #fff;
        font-weight: 500;
    }
    .hck-menu button {
        width: 100%;
        padding: 4px;
        margin: 2px 0;
        background: #404040;
        border: none;
        border-radius: 3px;
        color: #fff;
        font-size: clamp(9px, 2.5vw, 11px);
        cursor: pointer;
        transition: background 0.2s ease;
    }
    .hck-menu button:hover {
        background: #505050;
    }
    .hck-icon {
        font-size: clamp(11px, 3vw, 13px);
        color: #fff;
        font-weight: 500;
    }
    .hck-credits {
        margin-top: 5px;
        font-size: clamp(8px, 2vw, 10px);
        text-align: center;
        color: #888;
        background: linear-gradient(90deg, #404040, #505050);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        transition: color 0.3s ease;
    }
    .hck-credits:hover {
        color: #bbb;
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
            <button onclick="window.generateEssay()">Gerar</button>
            <button onclick="alert('v5.0 - Hackermoon 2025')">Sobre</button>
            <button onclick="toggleMenu()">Fechar</button>
            <div class="hck-credits">Hackermoon 2025</div>
        `;
    } else {
        menu.classList.remove('open');
        menu.classList.add('closed');
        menu.innerHTML = `<span class="hck-icon">HCK REDAÇÃO</span>`;
    }
}

menu.addEventListener('click', (e) => {
    if (menu.classList.contains('closed') && e.target.className === 'hck-icon') {
        toggleMenu();
    }
});

setTimeout(() => menu.classList.remove('closed') || menu.classList.add('open') || toggleMenu(), 200);

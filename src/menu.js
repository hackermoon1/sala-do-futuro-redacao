const styles = `
    .hck-menu {
        position: fixed;
        bottom: 10px;
        right: 10px;
        width: 180px;
        max-width: 70vw;
        background: #222;
        color: #ddd;
        border-radius: 6px;
        padding: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        z-index: 10000;
        transition: transform 0.3s ease, opacity 0.2s ease;
        transform: translateY(100%);
        opacity: 0;
    }
    .hck-menu.open {
        transform: translateY(0);
        opacity: 1;
    }
    .hck-menu.closed {
        width: auto;
        padding: 4px 8px;
        background: #333;
        cursor: pointer;
    }
    .hck-menu h3 {
        margin: 0 0 8px;
        font-size: clamp(12px, 3.5vw, 14px);
        text-align: center;
        color: #fff;
    }
    .hck-menu button {
        width: 100%;
        padding: 6px;
        margin: 4px 0;
        background: #444;
        border: none;
        border-radius: 4px;
        color: #fff;
        font-size: clamp(10px, 3vw, 12px);
        cursor: pointer;
        transition: background 0.2s ease;
    }
    .hck-menu button:hover {
        background: #555;
    }
    .hck-icon {
        font-size: clamp(12px, 3.5vw, 14px);
        color: #fff;
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
menu.innerHTML = `<span class="hck-icon">HCK</span>`;

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
        `;
    } else {
        menu.classList.remove('open');
        menu.classList.add('closed');
        menu.innerHTML = `<span class="hck-icon">HCK</span>`;
    }
}

menu.addEventListener('click', () => {
    if (menu.classList.contains('closed')) toggleMenu();
});

setTimeout(() => toggleMenu(), 200);

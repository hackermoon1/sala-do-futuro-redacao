const styles = `
    .hck-menu {
        position: fixed;
        bottom: 10px;
        right: 20px;
        width: clamp(180px, 25vw, 200px);
        max-width: 60vw;
        background: #252525;
        color: #fff;        
        border-radius: 12px;
        padding: 8px;
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
        padding: 4px 10px;
        background: #303030;
        border-radius: 10px;
        cursor: pointer;
        transform: translateY(0);
        opacity: 1;
    }
    .hck-menu h3 {
        margin: 0 0 6px;
        font-size: clamp(14px, 4vw, 16px);
        text-align: center;
        color: #fff;
        font-weight: 600;
        background: linear-gradient(90deg, #ff4444, #ff6666);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: 1px;
    }
    .hck-menu button {
        width: 100%;
        padding: 6px;
        margin: 3px 0;
        background: #404040;
        border: none;
        border-radius: 6px;
        color: #fff;
        font-size: clamp(11px, 3vw, 13px);
        cursor: pointer;
        transition: background 0.2s ease;
    }
    .hck-menu button:hover {
        background: #505050;
    }
    .hck-icon {
        font-size: clamp(13px, 3.5vw, 15px);
        color: #fff;
        font-weight: 500;
    }
    .hck-credits {
        margin-top: 6px;
        font-size: clamp(11px, 2.5vw, 13px);
        text-align: center;
        color: #fff;
        background: linear-gradient(90deg, #ff4444, #ff6666);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: bold;
    }
    @media (max-width: 768px) {
        .hck-menu {
            bottom: 5px;
            right: 10px;
            width: clamp(160px, 30vw, 180px);
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
            <h3>HCK REDAÇÃO v5</h3>
            <button onclick="window.generateEssay()">Gerar</button>
            <button onclick="window.clearFields()">Limpar</button>
            <button onclick="toggleMenu()">Fechar</button>
            <div class="hck-credits">Hackermoon</div>
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

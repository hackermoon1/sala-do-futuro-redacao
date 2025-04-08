(function () {
  // Evitar duplicatas
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
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    z-index: 10000;
    transition: transform 0.3s ease, background 0.3s ease;
  `;
  toggleButton.onmouseover = () => (toggleButton.style.transform = 'scale(1.05)');
  toggleButton.onmouseout = () => (toggleButton.style.transform = 'scale(1)');
  document.body.appendChild(toggleButton);

  // Menu principal
  const menu = document.createElement('div');
  menu.id = 'hck-menu';
  menu.style.cssText = `
    position: fixed;
    bottom: 60px;
    right: 20px;
    background: rgba(37, 37, 37, 0.9);
    border-radius: 16px;
    padding: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    z-index: 10000;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: none;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 180px;
    max-width: 90vw;
    color: #fff;
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;

  // Título do menu (HCK REDAÇÃO)
  const title = document.createElement('div');
  title.textContent = 'HCK REDAÇÃO';
  title.style.cssText = `
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    text-align: center;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  `;
  menu.appendChild(title);

  // Botão de fechar (X)
  const closeButton = document.createElement('div');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.3s ease;
  `;
  closeButton.onmouseover = () => (closeButton.style.transform = 'scale(1.2)');
  closeButton.onmouseout = () => (closeButton.style.transform = 'scale(1)');
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

  buttons.forEach((btn) => {
    const button = document.createElement('button');
    button.textContent = btn.text;
    button.style.cssText = `
      background: #fff;
      color: #000;
      border: none;
      border-radius: 12px;
      padding: 8px;
      width: 100%;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s ease, transform 0.1s ease;
    `;
    button.onmouseover = () => (button.style.background = '#f0f0f0');
    button.onmouseout = () => (button.style.background = '#fff');
    button.onmousedown = () => (button.style.transform = 'scale(0.97)');
    button.onmouseup = () => (button.style.transform = 'scale(1)');
    button.onclick = () => window[btn.action]();
    menu.appendChild(button);
  });

  // Créditos
  const credits = document.createElement('div');
  credits.textContent = 'Desenvolvido por Hackermoon';
  credits.style.cssText = `
    font-size: 11px;
    color: #ccc;
    text-align: center;
    margin-top: 8px;
  `;
  menu.appendChild(credits);

  document.body.appendChild(menu);

  // Alternar visibilidade do menu
  toggleButton.onclick = () => {
    menu.style.display = 'flex';
    menu.style.opacity = '1';
    menu.style.transform = 'translateY(0)';
    toggleButton.style.display = 'none';
  };

  // Estilização adicional
  const style = document.createElement('style');
  style.textContent = `
    button:hover {
      background: #f0f0f0 !important;
    }
    button:active {
      transform: scale(0.97);
    }
    #hck-menu[style*="display: none"] {
      opacity: 0;
      transform: translateY(10px);
    }
  `;
  document.head.appendChild(style);
})();

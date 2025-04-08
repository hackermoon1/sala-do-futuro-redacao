(function () {
  if (document.getElementById('hck-menu-toggle')) return;

  const toggleButton = document.createElement('div');
  toggleButton.id = 'hck-menu-toggle';
  toggleButton.textContent = 'HCK';
  toggleButton.style.cssText = `
    position: fixed;
    bottom: 15px;
    right: 15px;
    background: rgba(37, 37, 37, 0.9);
    color: #fff;
    padding: 6px 12px;
    border-radius: 10px;
    font-size: 12px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    z-index: 10000;
    transition: transform 0.3s ease, background 0.3s ease;
  `;
  toggleButton.onmouseover = () => (toggleButton.style.transform = 'scale(1.05)');
  toggleButton.onmouseout = () => (toggleButton.style.transform = 'scale(1)');
  document.body.appendChild(toggleButton);

  const menu = document.createElement('div');
  menu.id = 'hck-menu';
  menu.style.cssText = `
    position: fixed;
    bottom: 50px;
    right: 15px;
    background: rgba(37, 37, 37, 0.9);
    border-radius: 12px;
    padding: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    z-index: 10000;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: none;
    flex-direction: column;
    gap: 6px;
    min-width: 140px;
    max-width: 90vw;
    color: #fff;
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;

  const closeButton = document.createElement('div');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    position: absolute;
    top: 6px;
    right: 6px;
    color: #fff;
    font-size: 12px;
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

  const buttons = [
    { text: 'Gerar Redação', action: 'generateEssay' },
    { text: 'Limpar Tudo', action: 'clearAll' },
    { text: 'Copiar Texto', action: 'copyText' }
  ];

  buttons.forEach((btn) => {
    const button = document.createElement('button');
    button.textContent = btn.text;
    button.style.cssText = `
      background: #fff;
      color: #000;
      border: none;
      border-radius: 8px;
      padding: 6px;
      width: 100%;
      font-size: 12px;
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

  document.body.appendChild(menu);

  toggleButton.onclick = () => {
    menu.style.display = 'flex';
    menu.style.opacity = '1';
    menu.style.transform = 'translateY(0)';
    toggleButton.style.display = 'none';
  };

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

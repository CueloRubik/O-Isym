document.getElementById('save-colors-btn').addEventListener('click', () => {
    const colors = {
      bg: document.getElementById('c-bg').value,
      card: document.getElementById('c-card').value,
      text: document.getElementById('c-text').value,
      accent: document.getElementById('c-accent').value,
      cell: document.getElementById('c-cell').value
    };
  
    document.documentElement.style.setProperty('--bg-app', colors.bg);
    document.documentElement.style.setProperty('--card-bg', colors.card);
    document.documentElement.style.setProperty('--text-main', colors.text);
    document.documentElement.style.setProperty('--accent-color', colors.accent);
    document.documentElement.style.setProperty('--cell-bg', colors.cell);
  
    localStorage.setItem('oisym_colors', JSON.stringify(colors));
    alert('Paleta de colores aplicada correctamente.');
    switchView('calendar-view');
  });
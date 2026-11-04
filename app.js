function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
  }
  
  document.getElementById('nav-settings-btn').addEventListener('click', () => switchView('settings-view'));
  document.getElementById('settings-back-btn').addEventListener('click', () => switchView('calendar-view'));
  document.getElementById('planner-back-btn').addEventListener('click', () => switchView('calendar-view'));
  document.getElementById('nav-timer-btn').addEventListener('click', () => switchView('timer-view'));
  document.getElementById('timer-back-btn').addEventListener('click', () => switchView('planner-view'));
  
  window.addEventListener('DOMContentLoaded', () => {
    const savedColors = JSON.parse(localStorage.getItem('oisym_colors'));
    if (savedColors) {
      document.documentElement.style.setProperty('--bg-app', savedColors.bg);
      document.documentElement.style.setProperty('--card-bg', savedColors.card);
      document.documentElement.style.setProperty('--text-main', savedColors.text);
      document.documentElement.style.setProperty('--accent-color', savedColors.accent);
      document.documentElement.style.setProperty('--cell-bg', savedColors.cell);
    }
  });
let currentViewDate = new Date();

function renderCalendar() {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  document.getElementById('cal-month-title').textContent = currentViewDate.toLocaleString('es', { month: 'long' });
  document.getElementById('cal-year-title').textContent = year;

  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  for (let i = 1; i <= totalDays; i++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';

    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

    if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      cell.classList.add('today');
    }

    const score = localStorage.getItem(`score_${dateKey}`);
    cell.innerHTML = `
      <span class="day-number">${i}</span>
      <span class="day-score">${score ? score + '% Rendimiento' : 'Sin evaluar'}</span>
    `;

    cell.addEventListener('click', () => {
      openPlanner(dateKey);
    });

    grid.appendChild(cell);
  }
}

document.getElementById('cal-prev-btn').addEventListener('click', () => {
  currentViewDate.setMonth(currentViewDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('cal-next-btn').addEventListener('click', () => {
  currentViewDate.setMonth(currentViewDate.getMonth() + 1);
  renderCalendar();
});

document.getElementById('cal-today-btn').addEventListener('click', () => {
  currentViewDate = new Date();
  renderCalendar();
});

renderCalendar();
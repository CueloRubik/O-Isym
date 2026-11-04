let currentViewDate = new Date();

function renderCalendar() {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  document.getElementById('cal-month-title').textContent =
    currentViewDate.toLocaleString('es-MX', { month: 'long' });
  document.getElementById('cal-year-title').textContent = year;

  const grid = document.getElementById('calendar-grid');
  grid.replaceChildren();

  // Coloca el día 1 en su columna correcta (domingo = 0).
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-empty';
    emptyCell.setAttribute('aria-hidden', 'true');
    grid.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';

    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add('today');
    }

    const dayNumber = document.createElement('span');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;

    const dayScore = document.createElement('span');
    dayScore.className = 'day-score';
    const score = localStorage.getItem(`score_${dateKey}`);
    dayScore.textContent = score !== null ? `${score}% Rendimiento` : 'Sin evaluar';

    cell.append(dayNumber, dayScore);
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('aria-label', `Abrir agenda del día ${day}`);

    const openDay = () => openPlanner(dateKey);
    cell.addEventListener('click', openDay);
    cell.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDay();
      }
    });

    grid.appendChild(cell);
  }
}

document.getElementById('cal-prev-btn').addEventListener('click', () => {
  currentViewDate = new Date(
    currentViewDate.getFullYear(),
    currentViewDate.getMonth() - 1,
    1
  );
  renderCalendar();
});

document.getElementById('cal-next-btn').addEventListener('click', () => {
  currentViewDate = new Date(
    currentViewDate.getFullYear(),
    currentViewDate.getMonth() + 1,
    1
  );
  renderCalendar();
});

document.getElementById('cal-today-btn').addEventListener('click', () => {
  currentViewDate = new Date();
  renderCalendar();
});

renderCalendar();

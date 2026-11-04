const monthDisplay = document.getElementById('month-display');
const yearDisplay = document.getElementById('year-display');
const daysGrid = document.getElementById('days-grid');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const todayJumpBtn = document.getElementById('today-jump-btn');
const statusInfo = document.getElementById('status-info');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.getElementById('close-modal');
const resetSettings = document.getElementById('reset-settings');

const bgColorInput = document.getElementById('bg-color');
const cardColorInput = document.getElementById('card-color');
const textColorInput = document.getElementById('text-color');
const accentColorInput = document.getElementById('accent-color');
const highlightColorInput = document.getElementById('highlight-color');

const today = new Date();
let currentViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

function loadSavedTheme() {
  const savedTheme = JSON.parse(localStorage.getItem('oisym_theme'));
  if (savedTheme) {
    document.documentElement.style.setProperty('--bg-app', savedTheme.bg);
    document.documentElement.style.setProperty('--card-bg', savedTheme.card);
    document.documentElement.style.setProperty('--text-main', savedTheme.text);
    document.documentElement.style.setProperty('--accent-color', savedTheme.accent);
    document.documentElement.style.setProperty('--highlight-color', savedTheme.highlight);

    bgColorInput.value = savedTheme.bg;
    cardColorInput.value = savedTheme.card;
    textColorInput.value = savedTheme.text;
    accentColorInput.value = savedTheme.accent;
    highlightColorInput.value = savedTheme.highlight;
  }
}

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderCalendar() {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  monthDisplay.textContent = currentViewDate.toLocaleString('es', { month: 'long' });
  yearDisplay.textContent = year;

  daysGrid.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDayCurrentMonth = new Date(year, month + 1, 0).getDate();
  const lastDayPrevMonth = new Date(year, month, 0).getDate();

  // Días del mes anterior
  for (let i = firstDayIndex; i > 0; i--) {
    const dayNum = lastDayPrevMonth - i + 1;
    const prevMonthDate = new Date(year, month - 1, dayNum);
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('day-cell', 'other-month');
    dayDiv.setAttribute('data-date', formatDateKey(prevMonthDate));
    
    const span = document.createElement('span');
    span.classList.add('day-number');
    span.textContent = dayNum;
    dayDiv.appendChild(span);

    dayDiv.addEventListener('click', () => {
      currentViewDate.setMonth(currentViewDate.getMonth() - 1);
      renderCalendar();
    });
    daysGrid.appendChild(dayDiv);
  }

  // Días del mes actual
  for (let day = 1; day <= lastDayCurrentMonth; day++) {
    const currentCellDate = new Date(year, month, day);
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('day-cell');
    dayDiv.setAttribute('data-date', formatDateKey(currentCellDate));

    const span = document.createElement('span');
    span.classList.add('day-number');
    span.textContent = day;
    dayDiv.appendChild(span);

    const dayOfWeek = currentCellDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayDiv.classList.add('weekend');
    }

    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      dayDiv.classList.add('today');
    }

    if (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    ) {
      dayDiv.classList.add('selected');
    }

    dayDiv.addEventListener('click', () => {
      selectedDate = new Date(year, month, day);
      updateStatusText();
      renderCalendar();
    });

    daysGrid.appendChild(dayDiv);
  }

  // Días del mes siguiente para completar la cuadrícula estricta de 6 filas
  const totalCellsRendered = firstDayIndex + lastDayCurrentMonth;
  const remainingCells = (totalCellsRendered <= 35) ? (35 - totalCellsRendered) : (42 - totalCellsRendered);

  for (let j = 1; j <= remainingCells; j++) {
    const nextMonthDate = new Date(year, month + 1, j);
    const dayDiv = document.createElement('div');
    dayDiv.classList.add('day-cell', 'other-month');
    dayDiv.setAttribute('data-date', formatDateKey(nextMonthDate));

    const span = document.createElement('span');
    span.classList.add('day-number');
    span.textContent = j;
    dayDiv.appendChild(span);

    dayDiv.addEventListener('click', () => {
      currentViewDate.setMonth(currentViewDate.getMonth() + 1);
      renderCalendar();
    });
    daysGrid.appendChild(dayDiv);
  }

  updateStatusText();
}

function updateStatusText() {
  statusInfo.textContent = `Seleccionado: ${selectedDate.toLocaleString('es', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`;
}

prevBtn.addEventListener('click', () => {
  currentViewDate.setMonth(currentViewDate.getMonth() - 1);
  renderCalendar();
});

nextBtn.addEventListener('click', () => {
  currentViewDate.setMonth(currentViewDate.getMonth() + 1);
  renderCalendar();
});

todayJumpBtn.addEventListener('click', () => {
  currentViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
  selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  renderCalendar();
});

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
  const theme = {
    bg: bgColorInput.value,
    card: cardColorInput.value,
    text: textColorInput.value,
    accent: accentColorInput.value,
    highlight: highlightColorInput.value
  };

  document.documentElement.style.setProperty('--bg-app', theme.bg);
  document.documentElement.style.setProperty('--card-bg', theme.card);
  document.documentElement.style.setProperty('--text-main', theme.text);
  document.documentElement.style.setProperty('--accent-color', theme.accent);
  document.documentElement.style.setProperty('--highlight-color', theme.highlight);

  localStorage.setItem('oisym_theme', JSON.stringify(theme));
  settingsModal.classList.add('hidden');
});

resetSettings.addEventListener('click', () => {
  localStorage.removeItem('oisym_theme');
  location.reload();
});

loadSavedTheme();
renderCalendar();
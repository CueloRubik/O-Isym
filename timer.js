let timer = null;
let timeLeft = 25 * 60;

function updateTimerUI() {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const disp = document.getElementById('timer-display');
  if (disp) {
    disp.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}

document.getElementById('timer-start').addEventListener('click', () => {
  if (timer) return;
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerUI();
    } else {
      clearInterval(timer);
      timer = null;
      alert('Bloque de tiempo finalizado.');
    }
  }, 1000);
});

document.getElementById('timer-pause').addEventListener('click', () => {
  clearInterval(timer);
  timer = null;
});

document.getElementById('timer-reset').addEventListener('click', () => {
  clearInterval(timer);
  timer = null;
  timeLeft = 25 * 60;
  updateTimerUI();
});
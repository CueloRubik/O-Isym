let activeDateKey = '';

function openPlanner(dateKey) {
  activeDateKey = dateKey;
  document.getElementById('planner-date-title').textContent = `Agenda: ${dateKey}`;
  switchView('planner-view');
  renderActivities();
  updateTimeIndicator();
}

function updateTimeIndicator() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('current-time-indicator').textContent = `Hora actual del sistema: ${timeStr}`;
}

function getActivities() {
  return JSON.parse(localStorage.getItem(`acts_${activeDateKey}`)) || [];
}

function saveActivities(acts) {
  localStorage.setItem(`acts_${activeDateKey}`, JSON.stringify(acts));
}

document.getElementById('add-act-btn').addEventListener('click', () => {
  const name = document.getElementById('act-name').value;
  const goal = document.getElementById('act-goal').value;
  const start = document.getElementById('act-start').value;
  const end = document.getElementById('act-end').value;

  if (!name) return;

  const acts = getActivities();
  acts.push({ id: Date.now(), name, goal, start, end, completed: false, rating: 5 });
  saveActivities(acts);

  document.getElementById('act-name').value = '';
  document.getElementById('act-goal').value = '';
  renderActivities();
});

function renderActivities() {
  const container = document.getElementById('activities-list');
  container.innerHTML = '';
  const acts = getActivities();

  acts.forEach(act => {
    const card = document.createElement('div');
    card.className = 'activity-card';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
        <strong>${act.name}</strong>
        <span style="font-size: 0.8rem; color: var(--cell-muted);">${act.start} - ${act.end}</span>
      </div>
      <div style="font-size: 0.85rem; color: var(--accent-color);">Meta: ${act.goal || 'Sin meta especificada'}</div>
      <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
        <label><input type="checkbox" ${act.completed ? 'checked' : ''} onchange="toggleComplete(${act.id})"> Cumplida</label>
        <select onchange="updateRating(${act.id}, this.value)" style="width: auto; padding: 2px;">
          <option value="5" ${act.rating == 5 ? 'selected' : ''}>★★★★★</option>
          <option value="4" ${act.rating == 4 ? 'selected' : ''}>★★★★☆</option>
          <option value="3" ${act.rating == 3 ? 'selected' : ''}>★★★☆☆</option>
          <option value="2" ${act.rating == 2 ? 'selected' : ''}>★★☆☆☆</option>
          <option value="1" ${act.rating == 1 ? 'selected' : ''}>★☆☆☆☆</option>
        </select>
        <button class="btn btn-secondary" onclick="deleteActivity(${act.id})" style="padding: 2px 8px; font-size: 0.75rem;">Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });

  const savedScore = localStorage.getItem(`score_${activeDateKey}`);
  if (savedScore) {
    document.getElementById('score-display').textContent = `${savedScore} %`;
  }
}

window.toggleComplete = function(id) {
  let acts = getActivities();
  acts = acts.map(a => a.id === id ? { ...a, completed: !a.completed } : a);
  saveActivities(acts);
};

window.updateRating = function(id, rating) {
  let acts = getActivities();
  acts = acts.map(a => a.id === id ? { ...a, rating: parseInt(rating) } : a);
  saveActivities(acts);
};

window.deleteActivity = function(id) {
  let acts = getActivities();
  acts = acts.filter(a => a.id !== id);
  saveActivities(acts);
  renderActivities();
};

document.getElementById('evaluate-btn').addEventListener('click', () => {
  const acts = getActivities();
  if (acts.length === 0) {
    alert('No hay actividades registradas para evaluar.');
    return;
  }

  let totalPoints = 0;
  acts.forEach(a => {
    if (a.completed) {
      totalPoints += (a.rating / 5) * 100;
    }
  });

  const finalScore = Math.round(totalPoints / acts.length);
  document.getElementById('score-display').textContent = `${finalScore} %`;
  document.getElementById('feedback-box').textContent = `Evaluación completada con rigor. Puntuación basada en cumplimiento y estrellas otorgadas.`;
  
  localStorage.setItem(`score_${activeDateKey}`, finalScore);
  renderCalendar();
});
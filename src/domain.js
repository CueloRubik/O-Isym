(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OIsymDomain = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
const SCHEMA_VERSION = 1;
const AUTONOMY_MODES = ['manual', 'suggested', 'hybrid', 'automatic'];
const AVATAR_IDS = ['initials', 'leaf', 'book', 'compass', 'spark', 'wave', ...Array.from({ length: 18 }, (_, index) => 'profile-' + (index + 1))];
const THEME_IDS = ['classic', 'warm', 'sky', 'playful'];
const APPEARANCE_MODES = ['light', 'dark', 'system'];
const APPEARANCE_PALETTES = ['forest','ocean','midnight','aurora','orchid','lavender','rose','ember','sand','citrus','slate','graphite','cobalt','sage','coral','amber','plum','glacier'];
const APPEARANCE_COLOR_KEYS = ['accent','page','surface','text','sidebar','field','border','muted'];
const APPEARANCE_DENSITIES = ['comfortable','compact'];
const APPEARANCE_RADII = ['soft','rounded','square'];
const ICON_MODES = ['vector','image','none'];
const ICON_VARIANTS = ['outline','bold','duotone','filled'];
const ICON_TONES = ['automatic','accent','custom'];
const ICON_BACKGROUNDS = ['none','soft','filled'];
const CARD_STYLES = ['elevated','soft','outlined'];
const normalizeModeHex = (value) => {
  const src = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return Object.fromEntries(['light','dark'].map(mode => [mode,hexColor(src[mode]) ? src[mode].toLowerCase() : '']));
};
const hexColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
function normalizeAppearanceColors(colors, legacyColor = '') {
  const source = colors && typeof colors === 'object' && !Array.isArray(colors) ? colors : {};
  const normalized = {};
  for (const key of APPEARANCE_COLOR_KEYS) normalized[key] =
    hexColor(source[key]) ? source[key].toLowerCase() : '';
  if (colors === undefined && hexColor(legacyColor) && legacyColor.toLowerCase() !== '#27856b') {
    normalized.accent = legacyColor.toLowerCase();
  }
  return normalized;
}
const legacyPalette = theme => theme === 'sky' ? 'ocean' : theme === 'warm' ? 'sand' : theme === 'playful' ? 'aurora' : 'forest';
function normalizePalettes(palettes, fallback) {
  const source=palettes && typeof palettes==='object' && !Array.isArray(palettes) ? palettes : {};
  return Object.fromEntries(['light','dark'].map(mode=>[mode,
    APPEARANCE_PALETTES.includes(source[mode]) ? source[mode] : fallback]));
}
function normalizeColorsByMode(allColors, previousColors, avatarColor) {
  const source=allColors && typeof allColors==='object' && !Array.isArray(allColors) ? allColors : {};
  const legacy=normalizeAppearanceColors(previousColors,avatarColor);
  return Object.fromEntries(['light','dark'].map(mode=>[
    mode,normalizeAppearanceColors(Object.prototype.hasOwnProperty.call(source,mode) ? source[mode] : legacy)
  ]));
}
const FOCUS_ALARM_TONES = ['clock', 'digital', 'funny', 'ringtone1', 'ringtone2', 'ringtone3', 'ringtone4', 'ringtone5', 'ringtone6', 'tititi'];
const FOCUS_MUSIC_TRACKS = ['focus1', 'focus2', 'focus3', 'focus4', 'focus5', 'focus6', 'focus7', 'focus8', 'focus9', 'focus10', 'focus11', 'focus12', 'focus13', 'focus14'];
const FOCUS_REMINDER_INTERVALS = [0, 5, 10, 15, 20, 25, 30, 45, 60];
function normalizeAlarmTone(value, fallback) {
  const legacy = { chime: 'ringtone2', bell: 'clock', soft: 'ringtone3' };
  const tone = legacy[value] || value;
  return tone === 'off' || FOCUS_ALARM_TONES.includes(tone) ? tone : fallback;
}
function getAgeBand(age) { const value=Number(age); if(!Number.isInteger(value)||value<1||value>120)return 'general'; if(value<=12)return 'child'; if(value<=17)return 'teen'; return 'adult'; }
function getDefaultThemeForAge(age) { const band=getAgeBand(age); return band==='child'?'playful':band==='teen'?'sky':'classic'; }

function makeId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  return prefix + '-' + Date.now().toString(36) + '-' + random;
}

function localDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function shiftDate(dateKey, amount) {
  const parts = dateKey.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2] + amount);
  return localDate(date);
}

function createProfile(name, color = '#27856b', age = null) {
  const now = new Date().toISOString();
  return {
    id: makeId('profile'),
    name: String(name).trim().slice(0, 60),
    age: Number.isInteger(Number(age)) && Number(age)>=1 && Number(age)<=120 ? Number(age) : null,
    color,
    avatarId: 'initials',
    createdAt: now,
    updatedAt: now,
    preferences: {
      autonomy: 'suggested',
      weekStartsOn: 1,
      focusMinutes: 25,
      breakMinutes: 5,
      focusNotifications: true,
      taskNotificationsEnabled: true,
      taskNotificationScope: 'all',
      taskNotificationLeadMinutes: 0,
      taskNotificationSound: true,
      taskNotificationMissed: 'notify',
      launchAtLogin: false,
      focusEndAlarmEnabled: true,
      focusEndTone: 'clock',
      focusAlarmVolume: 70,
      focusAlarmRepeats: 3,
      focusAlarmIntervalSeconds: 2,
      focusAlarmMaxSeconds: 30,
      focusMusicTrack: '',
      focusMusicVolume: 35,
      theme: getDefaultThemeForAge(age),
      appearanceMode: 'light',
      appearancePalette: legacyPalette(getDefaultThemeForAge(age)),
      appearanceColors: normalizeAppearanceColors(undefined, color),
      appearancePalettes: normalizePalettes(null,legacyPalette(getDefaultThemeForAge(age))),
      appearanceColorsByMode: normalizeColorsByMode(null,undefined,color),
      appearanceDensity: 'comfortable',
      appearanceRadius: 'soft',
      appearanceIconMode: 'vector',
      appearanceIconVariant: 'outline',
      appearanceIconTone: 'automatic',
      appearanceIconBackground: 'none',
      appearanceIconColorsByMode: normalizeModeHex(null),
      appearanceIconBackgroundColorsByMode: normalizeModeHex(null),
      appearanceCardStyle: 'elevated',
      ageBand: getAgeBand(age),
      motionEnabled: true,
      workingDayStart: '09:00',
      workingDayEnd: '17:00'
    },
    activities: [],
    ideaBoards: [],
    dayTemplates: [],
    tasks: [],
    goals: [],
    focusSessions: [],
    activeFocus: null,
    legacyImportedAt: null
  };
}

function normalizeProfile(profile) {
  const base = createProfile(profile && profile.name ? profile.name : 'Mi espacio');
  const value = profile && typeof profile === 'object' ? profile : {};
  const preferences = value.preferences && typeof value.preferences === 'object' ? value.preferences : {};
  return {
    ...base,
    ...value,
    id: typeof value.id === 'string' && value.id ? value.id : base.id,
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim().slice(0, 60) : base.name,
    age: Number.isInteger(Number(value.age)) && Number(value.age)>=1 && Number(value.age)<=120 ? Number(value.age) : null,
    color: /^#[0-9a-f]{6}$/i.test(value.color || '') ? value.color : base.color,
    avatarId: AVATAR_IDS.includes(value.avatarId) ? value.avatarId : 'initials',
    preferences: {
      ...base.preferences,
      ...preferences,
      autonomy: AUTONOMY_MODES.includes(preferences.autonomy) ? preferences.autonomy : 'suggested',
      focusMinutes: clampNumber(preferences.focusMinutes, 5, 180, 25),
      breakMinutes: clampNumber(preferences.breakMinutes, 1, 60, 5),
      focusNotifications: preferences.focusNotifications !== false,
      taskNotificationsEnabled: preferences.taskNotificationsEnabled !== false,
      taskNotificationScope: ['all', 'activity', 'high'].includes(preferences.taskNotificationScope) ? preferences.taskNotificationScope : 'all',
      taskNotificationLeadMinutes: [0, 5, 10, 15, 30, 60].includes(Number(preferences.taskNotificationLeadMinutes)) ? Number(preferences.taskNotificationLeadMinutes) : 0,
      taskNotificationSound: preferences.taskNotificationSound !== false,
      taskNotificationMissed: preferences.taskNotificationMissed === 'skip' ? 'skip' : 'notify',
      launchAtLogin: preferences.launchAtLogin === true,
      focusEndAlarmEnabled: preferences.focusEndAlarmEnabled === undefined ? preferences.focusSound !== false && normalizeAlarmTone(preferences.focusEndTone, 'clock') !== 'off' : preferences.focusEndAlarmEnabled !== false,
      focusEndTone: normalizeAlarmTone(preferences.focusEndTone, 'clock') === 'off' ? 'clock' : normalizeAlarmTone(preferences.focusEndTone, 'clock'),
      focusAlarmVolume: clampNumber(preferences.focusAlarmVolume, 0, 100, 70),
      focusAlarmRepeats: Math.round(clampNumber(preferences.focusAlarmRepeats, 1, 10, 3)),
      focusAlarmIntervalSeconds: Math.round(clampNumber(preferences.focusAlarmIntervalSeconds, 1, 15, 2)),
      focusAlarmMaxSeconds: Math.round(clampNumber(preferences.focusAlarmMaxSeconds, 5, 120, 30)),
      focusMusicTrack: FOCUS_MUSIC_TRACKS.includes(preferences.focusMusicTrack) ? preferences.focusMusicTrack : '',
      focusMusicVolume: clampNumber(preferences.focusMusicVolume, 0, 100, 35),
      theme: THEME_IDS.includes(preferences.theme) ? preferences.theme : getDefaultThemeForAge(value.age),
      appearanceMode: APPEARANCE_MODES.includes(preferences.appearanceMode) ? preferences.appearanceMode : 'light',
      appearancePalette: APPEARANCE_PALETTES.includes(preferences.appearancePalette) ? preferences.appearancePalette : legacyPalette(preferences.theme),
      appearanceColors: normalizeAppearanceColors(preferences.appearanceColors, value.color),
      appearancePalettes: normalizePalettes(preferences.appearancePalettes,
        APPEARANCE_PALETTES.includes(preferences.appearancePalette) ? preferences.appearancePalette : legacyPalette(preferences.theme)),
      appearanceColorsByMode: normalizeColorsByMode(preferences.appearanceColorsByMode, preferences.appearanceColors, value.color),
      appearanceDensity: APPEARANCE_DENSITIES.includes(preferences.appearanceDensity) ? preferences.appearanceDensity : 'comfortable',
      appearanceRadius: APPEARANCE_RADII.includes(preferences.appearanceRadius) ? preferences.appearanceRadius : 'soft',
      appearanceIconMode: ICON_MODES.includes(preferences.appearanceIconMode) ? preferences.appearanceIconMode : 'vector',
      appearanceIconVariant: ICON_VARIANTS.includes(preferences.appearanceIconVariant) ? preferences.appearanceIconVariant : 'outline',
      appearanceIconTone: ICON_TONES.includes(preferences.appearanceIconTone) ? preferences.appearanceIconTone : 'automatic',
      appearanceIconBackground: ICON_BACKGROUNDS.includes(preferences.appearanceIconBackground) ? preferences.appearanceIconBackground : 'none',
      appearanceIconColorsByMode: normalizeModeHex(preferences.appearanceIconColorsByMode),
      appearanceIconBackgroundColorsByMode: normalizeModeHex(preferences.appearanceIconBackgroundColorsByMode),
      appearanceCardStyle: CARD_STYLES.includes(preferences.appearanceCardStyle) ? preferences.appearanceCardStyle : 'elevated',
      ageBand: getAgeBand(value.age),
      motionEnabled: preferences.motionEnabled !== false
    },
    activities: Array.isArray(value.activities) ? value.activities : [],
    ideaBoards: normalizeIdeaBoards(value.ideaBoards),
    dayTemplates: Array.isArray(value.dayTemplates) ? value.dayTemplates : [],
    tasks: Array.isArray(value.tasks) ? value.tasks : [],
    goals: Array.isArray(value.goals) ? value.goals : [],
    focusSessions: Array.isArray(value.focusSessions) ? value.focusSessions : [],
    activeFocus: normalizeActiveFocus(value.activeFocus, preferences.focusMinutes)
  };
}

function validateImportedProfile(profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) throw new TypeError('El perfil importado no es un objeto válido.');
  if (typeof profile.name !== 'string' || !profile.name.trim() || profile.name.length > 60) throw new TypeError('El nombre del perfil importado no es válido.');
  if (profile.preferences !== undefined && (!profile.preferences || typeof profile.preferences !== 'object' || Array.isArray(profile.preferences))) throw new TypeError('Las preferencias del perfil no son válidas.');

  const appearance = profile.preferences || {};
  if (appearance.appearanceMode !== undefined && !APPEARANCE_MODES.includes(appearance.appearanceMode)) throw new TypeError('Modo de apariencia no válido.');
  if (appearance.appearancePalette !== undefined && !APPEARANCE_PALETTES.includes(appearance.appearancePalette)) throw new TypeError('Paleta de apariencia no válida.');
  if (appearance.appearanceColors !== undefined) {
    const colors = appearance.appearanceColors;
    if (!colors || typeof colors !== 'object' || Array.isArray(colors) ||
      Object.keys(colors).some(key => !APPEARANCE_COLOR_KEYS.includes(key) || colors[key] !== '' && !hexColor(colors[key])))
      throw new TypeError('Los colores personalizados no son válidos.');
  }
  if (appearance.appearancePalettes !== undefined) {
    const values=appearance.appearancePalettes;
    if (!values || typeof values!=='object' || Array.isArray(values) ||
      Object.keys(values).some(mode=>!['light','dark'].includes(mode) || !APPEARANCE_PALETTES.includes(values[mode])))
      throw new TypeError('Las paletas de cada modo no son válidas.');
  }
  if (appearance.appearanceColorsByMode !== undefined) {
    const colors=appearance.appearanceColorsByMode;
    if (!colors || typeof colors!=='object' || Array.isArray(colors) ||
      Object.entries(colors).some(([mode,values])=>!['light','dark'].includes(mode) ||
        !values || typeof values!=='object' || Array.isArray(values) ||
        Object.entries(values).some(([key,value])=>!APPEARANCE_COLOR_KEYS.includes(key) || value!=='' && !hexColor(value))))
      throw new TypeError('Los colores por modo no son válidos.');
  }
  if (appearance.appearanceDensity !== undefined && !APPEARANCE_DENSITIES.includes(appearance.appearanceDensity))
    throw new TypeError('Densidad de interfaz no válida.');
  if (appearance.appearanceRadius !== undefined && !APPEARANCE_RADII.includes(appearance.appearanceRadius))
    throw new TypeError('Estilo de esquinas no válido.');
  for (const [key, options] of [
    ['appearanceIconMode', ICON_MODES],
    ['appearanceIconVariant', ICON_VARIANTS],
    ['appearanceIconTone', ICON_TONES],
    ['appearanceIconBackground', ICON_BACKGROUNDS],
    ['appearanceCardStyle', CARD_STYLES]
  ]) {
    if (appearance[key] !== undefined && !options.includes(appearance[key]))
      throw new TypeError('Preferencia visual no válida: ' + key);
  }
  for (const key of ['appearanceIconColorsByMode','appearanceIconBackgroundColorsByMode']) {
    if (appearance[key] !== undefined) {
      const colors=appearance[key];
      if (!colors || typeof colors !== 'object' || Array.isArray(colors) ||
        Object.entries(colors).some(([mode,color])=> !['light','dark'].includes(mode) ||
          (color !== '' && !hexColor(color))))
        throw new TypeError('Los colores de iconos no son válidos.');
    }
  }
  const limits = { tasks: 10000, activities: 1000, goals: 1000, focusSessions: 10000 };
  const collections = ['tasks', 'activities', 'goals', 'focusSessions'];
  for (const key of collections) {
    const items = profile[key] === undefined ? [] : profile[key];
    if (!Array.isArray(items) || items.length > limits[key]) throw new TypeError('La colección ' + key + ' del perfil no es válida.');
    const ids = new Set();
    for (const item of items) {
      if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.id !== 'string' || !item.id || ids.has(item.id)) {
        throw new TypeError('Hay registros inválidos o identificadores repetidos en ' + key + '.');
      }
      ids.add(item.id);
      if (key === 'tasks') {
        if (typeof item.title !== 'string' || !item.title.trim() || item.title.length > 140) throw new TypeError('Una tarea importada tiene un título inválido.');
        if (!['pending', 'done'].includes(item.status) || !['low', 'medium', 'high'].includes(item.priority)) throw new TypeError('Una tarea importada tiene un estado o prioridad inválidos.');
        validateTaskSchedule(item);
      } else if (key === 'activities') {
        if (typeof item.name !== 'string' || !item.name.trim() || item.name.length > 90) throw new TypeError('Una actividad importada tiene un nombre inválido.');
      } else if (key === 'goals') {
        if (typeof item.title !== 'string' || !item.title.trim() || item.title.length > 100 || !Number.isFinite(Number(item.target)) || Number(item.target) < 1) throw new TypeError('Un objetivo importado no es válido.');
        if (item.dueDate && !isValidDateKey(item.dueDate)) throw new TypeError('Un objetivo importado tiene una fecha inválida.');
      } else {
        if (!isValidTimestamp(item.startedAt) || !isValidTimestamp(item.endedAt) || !Number.isFinite(Number(item.durationSeconds)) || Number(item.durationSeconds) < 0) throw new TypeError('Una sesión Focus importada no es válida.');
      }
    }
  }
  normalizeIdeaBoards(profile.ideaBoards);
  if (profile.dayTemplates !== undefined) {
    if (!Array.isArray(profile.dayTemplates) || profile.dayTemplates.length > 100) throw new TypeError('La colección de plantillas no es válida.');
    const templateIds = new Set();
    for (const template of profile.dayTemplates) {
      if (!template || typeof template.id !== 'string' || !template.id || templateIds.has(template.id) ||
          typeof template.name !== 'string' || !template.name.trim() || template.name.length > 90 ||
          !Array.isArray(template.entries) || template.entries.length < 1 || template.entries.length > 30 ||
          !template.recurrence || !Array.isArray(template.recurrence.weekdays)) throw new TypeError('La plantilla de día no es válida.');
      templateIds.add(template.id);
      if (!template.recurrence.weekdays.length || template.recurrence.weekdays.some(day => !Number.isInteger(day) || day < 0 || day > 6) ||
          (template.recurrence.startDate && !isValidDateKey(template.recurrence.startDate)) ||
          (template.recurrence.endDate && !isValidDateKey(template.recurrence.endDate)) ||
          (template.recurrence.startDate && template.recurrence.endDate && template.recurrence.endDate < template.recurrence.startDate) ||
          !Array.isArray(template.recurrence.exceptions) ||
          template.recurrence.exceptions.length > 500 ||
          template.recurrence.exceptions.some(date => !isValidDateKey(date))) throw new TypeError('La recurrencia de plantilla no es válida.');
      const entryIds = new Set();
      for (const entry of template.entries) {
        if (!entry || typeof entry.id !== 'string' || !entry.id || entryIds.has(entry.id) ||
            typeof entry.title !== 'string' || !entry.title.trim() || entry.title.length > 140 ||
            !isValidTimeKey(entry.startTime) || !entry.startTime || !isValidTimeKey(entry.endTime) ||
            !entry.endTime || entry.endTime <= entry.startTime) throw new TypeError('La plantilla contiene un bloque inválido.');
        entryIds.add(entry.id);
      }
    }
  }
  if (profile.activeFocus !== undefined && profile.activeFocus !== null && (!profile.activeFocus || typeof profile.activeFocus !== 'object' || Array.isArray(profile.activeFocus))) {
    throw new TypeError('La sesión Focus activa del perfil no es válida.');
  }
  return true;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function isValidTimestamp(value) {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

function normalizeActiveFocus(focus, fallbackMinutes = 25) {
  if (!focus || typeof focus !== 'object' || Array.isArray(focus)) return null;
  if (!isValidTimestamp(focus.startedAt)) return null;
  const durationSeconds = clampNumber(focus.durationSeconds, 300, 10800, clampNumber(fallbackMinutes, 5, 180, 25) * 60);
  const sessionStartedAt = isValidTimestamp(focus.sessionStartedAt) ? focus.sessionStartedAt : focus.startedAt;
  const pausedAt = isValidTimestamp(focus.pausedAt) ? focus.pausedAt : null;
  return {
    taskId: typeof focus.taskId === 'string' && focus.taskId ? focus.taskId : null,
    activityId: typeof focus.activityId === 'string' && focus.activityId ? focus.activityId : null,
    activityTitle: typeof focus.activityTitle === 'string' ? focus.activityTitle.slice(0, 90) : '',
    isBreak: focus.isBreak === true,
    startedAt: focus.startedAt,
    sessionStartedAt,
    pausedAt,
    elapsedBeforePause: clampNumber(focus.elapsedBeforePause, 0, durationSeconds, 0),
    durationSeconds
  };
}

function getSuggestedFocusMinutes(profile, taskId, activityId) {
  const task = (profile && Array.isArray(profile.tasks) ? profile.tasks : []).find(item => item.id === taskId);
  const linkedActivityId = activityId || (task && task.activityId);
  const activity = linkedActivityId && (profile.activities || []).find(item => item.id === linkedActivityId && !item.archived);
  const preferred = activity ? activity.durationMinutes : profile?.preferences?.focusMinutes;
  return clampNumber(preferred, 5, 180, 25);
}

function getFocusElapsedSeconds(focus, now = Date.now()) {
  if (!focus || typeof focus !== 'object') return 0;
  const duration = clampNumber(focus.durationSeconds, 1, 10800, 0);
  const beforePause = clampNumber(focus.elapsedBeforePause, 0, duration, 0);
  const started = Date.parse(focus.startedAt);
  const runningSeconds = focus.pausedAt || !Number.isFinite(started) ? 0 : Math.max(0, Math.floor((Number(now) - started) / 1000));
  return Math.min(duration, beforePause + runningSeconds);
}

function getFocusRemainingSeconds(focus, now = Date.now()) {
  if (!focus || typeof focus !== 'object') return 0;
  return Math.max(0, clampNumber(focus.durationSeconds, 1, 10800, 0) - getFocusElapsedSeconds(focus, now));
}

function createFocusSession(focus, taskTitle = '', endedAt = new Date().toISOString()) {
  const endedMs = Date.parse(endedAt);
  const safeEndedAt = Number.isFinite(endedMs) ? new Date(endedMs).toISOString() : new Date().toISOString();
  const elapsed = getFocusElapsedSeconds(focus, Date.parse(safeEndedAt));
  let actualEnd = safeEndedAt;
  if (!focus.pausedAt && elapsed >= focus.durationSeconds && isValidTimestamp(focus.startedAt)) {
    const completionMs = Date.parse(focus.startedAt) + Math.max(0, focus.durationSeconds - clampNumber(focus.elapsedBeforePause, 0, focus.durationSeconds, 0)) * 1000;
    actualEnd = new Date(completionMs).toISOString();
  }
  return {
    id: makeId('focus'),
    taskId: typeof focus.taskId === 'string' && focus.taskId ? focus.taskId : null,
    taskTitle: String(taskTitle || '').slice(0, 140),
    activityTitle: String(focus.activityTitle || '').slice(0, 90),
    startedAt: isValidTimestamp(focus.sessionStartedAt) ? focus.sessionStartedAt : focus.startedAt,
    endedAt: actualEnd,
    durationSeconds: elapsed
  };
}

function createActivity(input) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Escribe un nombre para la actividad.');
  return {
    id: makeId('activity'),
    name: name.slice(0, 90),
    category: String(input.category || 'Personal').trim().slice(0, 40),
    description: String(input.description || '').trim().slice(0, 500),
    durationMinutes: clampNumber(input.durationMinutes, 5, 600, 30),
    frequency: String(input.frequency || 'Cuando lo necesite').slice(0, 50),
    archived: false,
    createdAt: new Date().toISOString()
  };
}

function isValidDateKey(value) {
  if (!value) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isValidTimeKey(value) {
  return !value || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

function validateTaskSchedule(task) {
  if (!isValidDateKey(task.scheduledDate) || !isValidDateKey(task.dueDate)) {
    throw new Error('Las fechas de la tarea no son válidas.');
  }
  if (!isValidTimeKey(task.startTime) || !isValidTimeKey(task.endTime)) {
    throw new Error('La hora debe tener un formato válido.');
  }
  if (Boolean(task.startTime) !== Boolean(task.endTime)) {
    throw new Error('Indica tanto la hora de inicio como la de fin.');
  }
  if (task.startTime && task.endTime <= task.startTime) {
    throw new Error('La hora de fin debe ser posterior al inicio.');
  }
  if (task.reminderEnabled !== undefined && typeof task.reminderEnabled !== 'boolean') {
    throw new Error('La preferencia de notificación de la tarea no es válida.');
  }
}

function createTask(input) {
  if (input.reminderEnabled !== undefined && typeof input.reminderEnabled !== 'boolean') throw new Error('La preferencia de notificación debe ser booleana.');
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Escribe un título para la tarea.');
  const task = {
    id: makeId('task'),
    title: title.slice(0, 140),
    description: String(input.description || '').trim().slice(0, 1000),
    status: 'pending',
    priority: ['low', 'medium', 'high'].includes(input.priority) ? input.priority : 'medium',
    estimatedMinutes: clampNumber(input.estimatedMinutes, 5, 1440, 30),
    dueDate: input.dueDate || '',
    scheduledDate: input.scheduledDate || '',
    startTime: input.startTime || '',
    endTime: input.endTime || '',
    reminderEnabled: input.reminderEnabled !== false,
    locked: Boolean(input.locked),
    activityId: input.activityId || null,
    templateId: typeof input.templateId === 'string' && input.templateId ? input.templateId : null,
    templateEntryId: typeof input.templateEntryId === 'string' && input.templateEntryId ? input.templateEntryId : null,
    templateOccurrenceDate: typeof input.templateOccurrenceDate === 'string' && input.templateOccurrenceDate ? input.templateOccurrenceDate : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null
  };
  validateTaskSchedule(task);
  return task;
}

function updateTask(task, patch) {
  const next = { ...task, ...patch, updatedAt: new Date().toISOString() };
  if (patch.title !== undefined) {
    next.title = String(patch.title).trim().slice(0, 140);
    if (!next.title) throw new Error('El título no puede quedar vacío.');
  }
  if (patch.status !== undefined && !['pending', 'done'].includes(patch.status)) {
    throw new Error('El estado de la tarea no es válido.');
  }
  if (patch.priority !== undefined && !['low', 'medium', 'high'].includes(patch.priority)) {
    throw new Error('La prioridad de la tarea no es válida.');
  }
  if (patch.estimatedMinutes !== undefined) next.estimatedMinutes = clampNumber(patch.estimatedMinutes, 5, 1440, 30);
  if (patch.locked !== undefined) next.locked = Boolean(patch.locked);
  if (patch.reminderEnabled !== undefined) {
    if (typeof patch.reminderEnabled !== 'boolean') throw new Error('La preferencia de notificación debe ser booleana.');
    next.reminderEnabled = patch.reminderEnabled;
  }
  if (patch.activityId !== undefined) next.activityId = patch.activityId || null;
  validateTaskSchedule(next);
  if (patch.status === 'done') next.completedAt = new Date().toISOString();
  if (patch.status === 'pending') next.completedAt = null;
  return next;
}

function updateActivity(activity, patch) {
  const next = { ...activity, ...patch, updatedAt: new Date().toISOString() };
  if (patch.name !== undefined) {
    next.name = String(patch.name).trim().slice(0, 90);
    if (!next.name) throw new Error('El nombre de la actividad no puede quedar vacío.');
  }
  if (patch.category !== undefined) next.category = String(patch.category || 'Personal').trim().slice(0, 40);
  if (patch.description !== undefined) next.description = String(patch.description || '').trim().slice(0, 500);
  if (patch.durationMinutes !== undefined) next.durationMinutes = clampNumber(patch.durationMinutes, 5, 600, 30);
  if (patch.frequency !== undefined) next.frequency = String(patch.frequency || 'Cuando lo necesite').trim().slice(0, 50);
  return next;
}

function createGoal(input) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Escribe un nombre para el objetivo.');
  const goal = {
    id: makeId('goal'),
    title: title.slice(0, 100),
    description: String(input.description || '').trim().slice(0, 500),
    target: clampNumber(input.target, 1, 1000000, 1),
    progress: 0,
    unit: String(input.unit || 'veces').trim().slice(0, 30),
    dueDate: input.dueDate || '',
    createdAt: new Date().toISOString(),
    archived: false
  };
  if (!isValidDateKey(goal.dueDate)) throw new Error('La fecha objetivo no es válida.');
  return goal;
}

function updateGoal(goal, patch) {
  const next = { ...goal, ...patch, updatedAt: new Date().toISOString() };
  if (patch.title !== undefined) {
    next.title = String(patch.title).trim().slice(0, 100);
    if (!next.title) throw new Error('El nombre del objetivo no puede quedar vacío.');
  }
  if (patch.description !== undefined) next.description = String(patch.description || '').trim().slice(0, 500);
  if (patch.target !== undefined) next.target = clampNumber(patch.target, 1, 1000000, 1);
  if (patch.unit !== undefined) next.unit = String(patch.unit || 'veces').trim().slice(0, 30);
  if (patch.dueDate !== undefined) next.dueDate = patch.dueDate || '';
  if (!isValidDateKey(next.dueDate)) throw new Error('La fecha objetivo no es válida.');
  next.progress = clampNumber(next.progress, 0, next.target, 0);
  return next;
}

function getRecommendations(profile, today = localDate()) {
  const mode = profile.preferences.autonomy;
  if (mode === 'manual') return [];
  const suggestions = [];
  for (const task of profile.tasks) {
    if (task.status !== 'pending' || task.locked) continue;
    if (task.dueDate && task.dueDate < today && task.scheduledDate !== today) {
      suggestions.push({
        id: 'overdue-' + task.id,
        taskId: task.id,
        title: 'Revisar tarea atrasada',
        detail: '“' + task.title + '” tiene una fecha anterior a hoy. Puedes reprogramarla sin alterar compromisos bloqueados.',
        date: today,
        kind: 'reschedule'
      });
    } else if (!task.scheduledDate && task.dueDate !== today) {
      suggestions.push({
        id: 'unscheduled-' + task.id,
        taskId: task.id,
        title: 'Encontrar un espacio para esta tarea',
        detail: '“' + task.title + '” todavía no tiene un día asignado.',
        date: today,
        kind: 'schedule'
      });
    }
  }
  return suggestions.slice(0, 5);
}

function analyzeSchedule(profile, dateKey) {
  const preferences = profile && profile.preferences ? profile.preferences : {};
  const parseTime = value => {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
    const parts = value.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  };
  const formatTime = minutes => String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
  const requestedStart = parseTime(preferences.workingDayStart);
  const requestedEnd = parseTime(preferences.workingDayEnd);
  const fromMinutes = requestedStart === null ? 540 : requestedStart;
  const untilMinutes = requestedEnd === null || requestedEnd <= fromMinutes ? 1020 : requestedEnd;
  if (!isValidDateKey(dateKey) || !dateKey) {
    return { date: dateKey, workday: { start: formatTime(fromMinutes), end: formatTime(untilMinutes) }, proposals: [], skipped: [], availableMinutes: untilMinutes - fromMinutes };
  }
  const tasks = Array.isArray(profile.tasks) ? profile.tasks : [];
  const skipped = [];
  const intervals = [];
  let occupiedMinutes = 0;
  for (const task of tasks) {
    if (task.status !== 'pending' || task.scheduledDate !== dateKey || !task.startTime || !task.endTime) continue;
    const start = parseTime(task.startTime);
    const end = parseTime(task.endTime);
    if (start === null || end === null || end <= start) {
      skipped.push({ taskId: task.id, title: task.title, reason: 'Tiene un horario existente que necesita revisión.' });
      continue;
    }
    intervals.push([start, end]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  const occupied = [];
  for (const interval of intervals) {
    const previous = occupied[occupied.length - 1];
    if (previous && interval[0] <= previous[1]) previous[1] = Math.max(previous[1], interval[1]);
    else occupied.push(interval.slice());
  }
  occupied.forEach(interval => {
    occupiedMinutes += Math.max(0, Math.min(untilMinutes, interval[1]) - Math.max(fromMinutes, interval[0]));
  });
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const candidates = tasks.filter(task =>
    task.status === 'pending' &&
    !task.locked &&
    !task.scheduledDate
  );
  const eligible = [];
  for (const task of candidates) {
    if (task.dueDate && task.dueDate < dateKey) {
      skipped.push({ taskId: task.id, title: task.title, reason: 'Ya venció el ' + task.dueDate + '; revisa su fecha antes de programarla.' });
      continue;
    }
    eligible.push(task);
  }
  eligible.sort((a, b) => {
    const dueA = a.dueDate || '9999-12-31';
    const dueB = b.dueDate || '9999-12-31';
    return dueA.localeCompare(dueB) ||
      (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1) ||
      clampNumber(a.estimatedMinutes, 5, 1440, 30) - clampNumber(b.estimatedMinutes, 5, 1440, 30) ||
      String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  });
  const proposals = [];
  for (const task of eligible) {
    const duration = clampNumber(task.estimatedMinutes, 5, 1440, 30);
    let cursor = fromMinutes;
    let chosenStart = null;
    for (const slot of occupied) {
      if (cursor + duration <= Math.min(slot[0], untilMinutes)) {
        chosenStart = cursor;
        break;
      }
      if (cursor < slot[1]) cursor = slot[1];
    }
    if (chosenStart === null && cursor + duration <= untilMinutes) chosenStart = cursor;
    if (chosenStart === null) {
      skipped.push({ taskId: task.id, title: task.title, reason: 'No queda un espacio continuo de ' + duration + ' minutos dentro del horario habitual.' });
      continue;
    }
    const finish = chosenStart + duration;
    const reasons = [];
    if (task.dueDate === dateKey) reasons.push('vence hoy');
    else if (task.dueDate) reasons.push('se adelanta a su fecha límite');
    if (task.priority === 'high') reasons.push('tiene prioridad alta');
    else if (task.priority === 'medium') reasons.push('tiene prioridad media');
    if (!reasons.length) reasons.push('ocupa el primer espacio disponible');
    proposals.push({
      taskId: task.id,
      title: task.title,
      date: dateKey,
      startTime: formatTime(chosenStart),
      endTime: formatTime(finish),
      durationMinutes: duration,
      priority: task.priority,
      dueDate: task.dueDate || '',
      reason: 'Se propone este horario porque ' + reasons.join(' y ') + '.'
    });
    occupied.push([chosenStart, finish]);
    occupied.sort((a, b) => a[0] - b[0]);
  }
  const scheduledMinutes = proposals.reduce((total, item) => total + item.durationMinutes, 0);
  return {
    date: dateKey,
    workday: { start: formatTime(fromMinutes), end: formatTime(untilMinutes) },
    proposals,
    skipped,
    availableMinutes: Math.max(0, untilMinutes - fromMinutes - occupiedMinutes),
    proposedMinutes: scheduledMinutes
  };
}

function suggestSchedule(profile, dateKey) {
  return analyzeSchedule(profile, dateKey).proposals;
}

const IDEA_BOARD_LIMITS = Object.freeze({ boards: 100, nodes: 2000, connections: 5000, coordinate: 1000000 });

function validateIdeaBoard(board) {
  const fail = message => { throw new TypeError('Pizarrón no válido: ' + message); };
  const timestamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (!board || typeof board !== 'object' || Array.isArray(board)) fail('se esperaba un objeto.');
  if (typeof board.id !== 'string' || !board.id || board.id.length > 100) fail('el identificador no es válido.');
  if (typeof board.title !== 'string' || !board.title.trim() || board.title.length > 100) fail('el nombre debe tener entre 1 y 100 caracteres.');
  if (typeof board.description !== 'string' || board.description.length > 500) fail('la descripción no es válida.');
  if (!timestamp(board.createdAt) || !timestamp(board.modifiedAt)) fail('las fechas de modificación no son válidas.');
  const viewport = board.viewport;
  if (!viewport || !Number.isFinite(viewport.x) || !Number.isFinite(viewport.y) || !Number.isFinite(viewport.zoom) ||
      Math.abs(viewport.x) > IDEA_BOARD_LIMITS.coordinate || Math.abs(viewport.y) > IDEA_BOARD_LIMITS.coordinate ||
      viewport.zoom < 0.1 || viewport.zoom > 4) fail('la vista del lienzo no es válida.');
  if (!Array.isArray(board.nodes) || board.nodes.length > IDEA_BOARD_LIMITS.nodes) fail('la lista de elementos supera el límite permitido.');
  if (!Array.isArray(board.connections) || board.connections.length > IDEA_BOARD_LIMITS.connections) fail('la lista de conexiones supera el límite permitido.');
  const ids = new Set();
  for (const node of board.nodes) {
    if (!node || typeof node !== 'object' || Array.isArray(node) || typeof node.id !== 'string' || !node.id || ids.has(node.id)) fail('hay elementos con identificadores inválidos o repetidos.');
    ids.add(node.id);
    if (!['note', 'activity', 'group'].includes(node.type)) fail('hay un tipo de elemento desconocido.');
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y) || Math.abs(node.x) > IDEA_BOARD_LIMITS.coordinate || Math.abs(node.y) > IDEA_BOARD_LIMITS.coordinate) fail('hay posiciones fuera de los límites permitidos.');
    if (!Number.isFinite(node.width) || !Number.isFinite(node.height) || node.width < 120 || node.width > 2000 || node.height < 80 || node.height > 2000) fail('hay dimensiones no válidas.');
    if (typeof node.title !== 'string' || node.title.length > 160 || typeof node.body !== 'string' || node.body.length > 10000) fail('el contenido de una tarjeta no es válido.');
    if (typeof node.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(node.color)) fail('hay un color no válido.');
    if (typeof node.category !== 'string' || node.category.length > 50) fail('hay una categoría no válida.');
    if (!timestamp(node.createdAt) || !timestamp(node.modifiedAt)) fail('hay fechas de elemento no válidas.');
    if (node.type === 'activity') {
      if (!isValidDateKey(node.startDate) || !isValidDateKey(node.dueDate)) fail('una actividad tiene una fecha no válida.');
      if (node.startDate && node.dueDate && node.dueDate < node.startDate) fail('la fecha límite de una actividad no puede ser anterior a su inicio.');
      if (!['pending', 'in-progress', 'done'].includes(node.status)) fail('una actividad tiene un estado no válido.');
      if (!['low', 'medium', 'high'].includes(node.priority)) fail('una actividad tiene una prioridad no válida.');
      if (!Number.isFinite(node.estimatedMinutes) || node.estimatedMinutes < 0 || node.estimatedMinutes > 1440) fail('la duración de una actividad no es válida.');
    }
    if (node.type === 'group') {
      if (!Array.isArray(node.childrenIds) || node.childrenIds.length > IDEA_BOARD_LIMITS.nodes || new Set(node.childrenIds).size !== node.childrenIds.length || node.childrenIds.some(id => typeof id !== 'string' || !id)) fail('un grupo contiene referencias no válidas.');
    }
  }
  const nodeById = new Map(board.nodes.map(node => [node.id, node]));
  for (const node of board.nodes) {
    if (node.type === 'group' && node.childrenIds.some(id => !nodeById.has(id) || id === node.id || nodeById.get(id).type === 'group')) fail('un grupo apunta a un elemento inexistente, a sí mismo o a otro grupo.');
  }
  const connectionIds = new Set();
  for (const connection of board.connections) {
    if (!connection || typeof connection !== 'object' || Array.isArray(connection) ||
        typeof connection.id !== 'string' || !connection.id || connectionIds.has(connection.id) || ids.has(connection.id)) fail('hay conexiones con identificadores inválidos o repetidos.');
    connectionIds.add(connection.id);
    if (!ids.has(connection.from) || !ids.has(connection.to) || connection.from === connection.to) fail('una conexión apunta a elementos inexistentes o iguales.');
    if (typeof connection.label !== 'string' || connection.label.length > 100) fail('la etiqueta de una conexión no es válida.');
    if (!['straight', 'curved'].includes(connection.style)) fail('el estilo de una conexión no es válido.');
    if (typeof connection.directed !== 'boolean') fail('la dirección de una conexión no es válida.');
  }
  return true;
}

function normalizeIdeaBoards(boards) {
  if (boards === undefined || boards === null) return [];
  if (!Array.isArray(boards)) throw new TypeError('La colección de pizarrones no es válida.');
  if (boards.length > IDEA_BOARD_LIMITS.boards) throw new RangeError('Has alcanzado el máximo de pizarrones.');
  const ids = new Set();
  boards.forEach(board => {
    validateIdeaBoard(board);
    if (ids.has(board.id)) throw new TypeError('Hay pizarrones con identificadores repetidos.');
    ids.add(board.id);
  });
  return boards;
}

function createIdeaBoardExport(board, exportedAt = new Date().toISOString()) {
  validateIdeaBoard(board);
  if (typeof exportedAt !== 'string' || !Number.isFinite(Date.parse(exportedAt))) {
    throw new TypeError('La fecha de exportación no es válida.');
  }
  return {
    format: 'oisym',
    formatVersion: '1.0.0',
    exportedAt,
    board: JSON.parse(JSON.stringify(board))
  };
}

function prepareIdeaBoardImport(payload, existingBoards = [], options = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
      payload.format !== 'oisym' || payload.formatVersion !== '1.0.0' ||
      !payload.board || typeof payload.board !== 'object' || Array.isArray(payload.board)) {
    throw new TypeError('El archivo no es un pizarrón .oisym compatible.');
  }
  if (payload.exportedAt !== undefined && (typeof payload.exportedAt !== 'string' || !Number.isFinite(Date.parse(payload.exportedAt)))) {
    throw new TypeError('La fecha de exportación del archivo no es válida.');
  }
  if (!Array.isArray(existingBoards)) throw new TypeError('La biblioteca actual no es válida.');
  if (existingBoards.length >= IDEA_BOARD_LIMITS.boards) throw new RangeError('Has alcanzado el máximo de 100 pizarrones.');
  const imported = JSON.parse(JSON.stringify(payload.board));
  validateIdeaBoard(imported);
  const makeUniqueId = typeof options.makeId === 'function' ? options.makeId : makeId;
  const now = options.now || new Date().toISOString();
  if (typeof now !== 'string' || !Number.isFinite(Date.parse(now))) throw new TypeError('La fecha de importación no es válida.');
  const nodeIds = new Map(imported.nodes.map(node => [node.id, makeUniqueId('idea')]));
  imported.id = makeUniqueId('board');
  imported.nodes = imported.nodes.map(node => ({
    ...node,
    id: nodeIds.get(node.id),
    ...(node.type === 'group' ? { childrenIds: node.childrenIds.map(childId => nodeIds.get(childId)) } : {})
  }));
  imported.connections = imported.connections.map(connection => ({
    ...connection,
    id: makeUniqueId('connection'),
    from: nodeIds.get(connection.from),
    to: nodeIds.get(connection.to)
  }));
  imported.createdAt = imported.modifiedAt = now;
  const existingNames = new Set(existingBoards.map(board => String(board.title || '').toLocaleLowerCase('es')));
  const baseTitle = imported.title;
  let title = baseTitle;
  let suffix = 2;
  while (existingNames.has(title.toLocaleLowerCase('es'))) {
    const ending = ' (' + suffix++ + ')';
    title = baseTitle.slice(0, 100 - ending.length) + ending;
  }
  imported.title = title;
  validateIdeaBoard(imported);
  return imported;
}

function createIdeaBoard(input = {}) {
  const now = new Date().toISOString();
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Escribe un nombre para el pizarrón.');
  const board = {
    id: makeId('board'),
    title: title.slice(0, 100),
    description: String(input.description || '').trim().slice(0, 500),
    createdAt: now,
    modifiedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [],
    connections: []
  };
  validateIdeaBoard(board);
  return board;
}

function createIdeaNode(type, input = {}) {
  if (!['note', 'activity', 'group'].includes(type)) throw new Error('El tipo de elemento no es válido.');
  const now = new Date().toISOString();
  const node = {
    id: makeId('idea'),
    type,
    x: clampNumber(input.x, -IDEA_BOARD_LIMITS.coordinate, IDEA_BOARD_LIMITS.coordinate, 0),
    y: clampNumber(input.y, -IDEA_BOARD_LIMITS.coordinate, IDEA_BOARD_LIMITS.coordinate, 0),
    width: clampNumber(input.width, 120, 2000, type === 'group' ? 420 : 260),
    height: clampNumber(input.height, 80, 2000, type === 'group' ? 300 : 190),
    title: String(input.title || (type === 'note' ? 'Nueva nota' : type === 'activity' ? 'Nueva actividad' : 'Nuevo grupo')).trim().slice(0, 160),
    body: String(input.body || '').slice(0, 10000),
    color: /^#[0-9a-f]{6}$/i.test(input.color || '') ? input.color : '#fff2bf',
    category: String(input.category || '').trim().slice(0, 50),
    createdAt: now,
    modifiedAt: now
  };
  if (type === 'activity') Object.assign(node, {
    startDate: input.startDate || '',
    dueDate: input.dueDate || '',
    status: ['pending', 'in-progress', 'done'].includes(input.status) ? input.status : 'pending',
    priority: ['low', 'medium', 'high'].includes(input.priority) ? input.priority : 'medium',
    estimatedMinutes: clampNumber(input.estimatedMinutes, 0, 1440, 0)
  });
  if (type === 'group') node.childrenIds = Array.isArray(input.childrenIds) ? [...new Set(input.childrenIds.filter(id => typeof id === 'string'))] : [];
  validateIdeaNode(node);
  return node;
}

function validateIdeaNode(node) {
  const now = new Date().toISOString();
  const board = {
    id: 'validation-board', title: 'Validación', description: '', createdAt: now, modifiedAt: now,
    viewport: { x: 0, y: 0, zoom: 1 }, nodes: [node.type === 'group' ? { ...node, childrenIds: [] } : node], connections: []
  };
  return validateIdeaBoard(board);
}

function updateIdeaNode(node, patch = {}) {
  const next = { ...node, ...patch, modifiedAt: new Date().toISOString() };
  if (patch.title !== undefined) { next.title = String(patch.title).trim().slice(0, 160); if (!next.title) throw new Error('El título no puede quedar vacío.'); }
  if (patch.body !== undefined) next.body = String(patch.body).slice(0, 10000);
  if (patch.category !== undefined) next.category = String(patch.category || '').trim().slice(0, 50);
  if (patch.color !== undefined && !/^#[0-9a-f]{6}$/i.test(patch.color)) throw new Error('El color no es válido.');
  validateIdeaNode(next);
  return next;
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || snapshot.schemaVersion !== SCHEMA_VERSION) {
    throw new Error('El archivo no tiene una versión de O-Isym compatible.');
  }
  if (!Array.isArray(snapshot.profiles) || snapshot.profiles.length > 50) {
    throw new Error('La lista de perfiles no es válida.');
  }
  const ids = new Set();
  for (const profile of snapshot.profiles) {
    if (!profile || typeof profile.id !== 'string' || !profile.id || ids.has(profile.id)) {
      throw new Error('Hay perfiles con identificadores inválidos o repetidos.');
    }
    if (typeof profile.name !== 'string' || !profile.name.trim() || profile.name.length > 60) {
      throw new Error('Hay un perfil con un nombre inválido.');
    }
    ids.add(profile.id);
  }
  if (snapshot.activeProfileId !== null && !ids.has(snapshot.activeProfileId)) {
    throw new Error('El perfil activo no existe en los datos.');
  }
  return true;
}

return { SCHEMA_VERSION, IDEA_BOARD_LIMITS, AUTONOMY_MODES, AVATAR_IDS, THEME_IDS, APPEARANCE_MODES, APPEARANCE_PALETTES, normalizeAppearanceColors, FOCUS_ALARM_TONES, FOCUS_MUSIC_TRACKS, FOCUS_REMINDER_INTERVALS, makeId, localDate, shiftDate, createProfile, normalizeProfile, getAgeBand, getDefaultThemeForAge, clampNumber, normalizeActiveFocus, getSuggestedFocusMinutes, getFocusElapsedSeconds, getFocusRemainingSeconds, createFocusSession, validateImportedProfile, createActivity, updateActivity, createTask, updateTask, createGoal, updateGoal, createIdeaBoard, createIdeaNode, updateIdeaNode, validateIdeaBoard, normalizeIdeaBoards, createIdeaBoardExport, prepareIdeaBoardImport, getRecommendations, suggestSchedule, analyzeSchedule, validateSnapshot };
});

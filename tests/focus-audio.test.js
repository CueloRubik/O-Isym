'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createFocusAudioController } = require('../src/focus-audio.js');

function createHarness() {
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  const audios = [];
  class FakeAudio {
    constructor(src) {
      this.src = src;
      this.paused = true;
      this.currentTime = 0;
      this.volume = 1;
      this.loop = false;
      this.onended = null;
      this.onerror = null;
      audios.push(this);
    }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    end() { this.paused = true; if (this.onended) this.onended(); }
  }
  const controller = createFocusAudioController({
    AudioClass: FakeAudio,
    setTimer(callback, delay) {
      const id = ++nextId;
      timers.set(id, { at: now + delay, callback });
      return id;
    },
    clearTimer(id) { timers.delete(id); }
  });
  function advance(ms) {
    now += ms;
    let runs = 0;
    while (true) {
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= now)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      due[1].callback();
      if (++runs > 30) throw new Error('Audio timer loop');
    }
  }
  return { controller, audios, advance };
}

test('la vista previa musical se puede detener manualmente', async () => {
  const h = createHarness();
  h.controller.previewMusic('preview.mp3', 0.4, 20000);
  await Promise.resolve();
  assert.equal(h.controller.isPreviewPlaying(), true);
  h.controller.stopPreview();
  assert.equal(h.controller.isPreviewPlaying(), false);
  assert.equal(h.audios[0].paused, true);
  h.advance(25000);
  assert.equal(h.audios.length, 1);
});

test('la vista previa musical se detiene automáticamente a los 20 segundos', async () => {
  const h = createHarness();
  h.controller.previewMusic('preview.mp3', 0.4, 20000);
  await Promise.resolve();
  h.advance(19999);
  assert.equal(h.controller.isPreviewPlaying(), true);
  h.advance(1);
  assert.equal(h.controller.isPreviewPlaying(), false);
  assert.equal(h.audios[0].paused, true);
});

test('la música de Focus se reproduce en bucle y tiene parada explícita', () => {
  const h = createHarness();
  h.controller.startMusic('focus.mp3', 0.35);
  assert.equal(h.controller.isMusicPlaying(), true);
  assert.equal(h.audios[0].loop, true);
  h.controller.stopMusic();
  assert.equal(h.controller.isMusicPlaying(), false);
  assert.equal(h.audios[0].paused, true);
});

test('la alarma respeta el número de repeticiones y el intervalo configurado', () => {
  const h = createHarness();
  h.controller.playAlarm('alarm.mp3', { volume: 0.7, plays: 3, intervalSeconds: 2, maxSeconds: 30 });
  h.audios[0].end();
  h.advance(1999);
  assert.equal(h.audios.length, 1);
  h.advance(1);
  assert.equal(h.audios.length, 2);
  h.audios[1].end();
  h.advance(2000);
  assert.equal(h.audios.length, 3);
  h.audios[2].end();
  assert.equal(h.controller.isAlarmPlaying(), false);
});

test('la alarma se detiene al alcanzar la duración máxima', () => {
  const h = createHarness();
  h.controller.playAlarm('alarm.mp3', { volume: 1, plays: 10, intervalSeconds: 1, maxSeconds: 5 });
  h.advance(5000);
  assert.equal(h.controller.isAlarmPlaying(), false);
  assert.equal(h.audios[0].paused, true);
});

test('detener la alarma cancela las repeticiones pendientes', () => {
  const h = createHarness();
  h.controller.playAlarm('alarm.mp3', { volume: 1, plays: 4, intervalSeconds: 2, maxSeconds: 30 });
  h.audios[0].end();
  h.controller.stopAlarm();
  h.advance(10000);
  assert.equal(h.audios.length, 1);
  assert.equal(h.controller.isAlarmPlaying(), false);
});

test('detener todo limpia música, vista previa, alarma y temporizadores', async () => {
  const h = createHarness();
  h.controller.previewMusic('preview.mp3', 0.4, 20000);
  await Promise.resolve();
  h.controller.startMusic('focus.mp3', 0.35);
  assert.equal(h.audios[0].paused, true);
  h.controller.playAlarm('alarm.mp3', { volume: 1, plays: 3, intervalSeconds: 1, maxSeconds: 20 });
  h.controller.stopAll();
  h.advance(30000);
  assert.equal(h.audios[1].paused, true);
  assert.equal(h.audios[2].paused, true);
  assert.equal(h.controller.isMusicPlaying(), false);
  assert.equal(h.controller.isPreviewPlaying(), false);
  assert.equal(h.controller.isAlarmPlaying(), false);
});

'use strict';

(function exposeFocusAudio(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OIsymFocusAudio = api;
})(typeof window !== 'undefined' ? window : null, function createFocusAudioModule() {
  function createFocusAudioController(options = {}) {
    if (typeof window !== 'undefined' && window.oisym?.nativeAudio && !options.AudioClass) return window.oisym.nativeAudio.createController(options);
    const AudioClass = options.AudioClass || (typeof Audio !== 'undefined' ? Audio : null);
    const setTimer = options.setTimer || setTimeout;
    const clearTimer = options.clearTimer || clearTimeout;
    const onChange = options.onChange || (() => {});
    const onError = options.onError || (() => {});
    let music = null;
    let preview = null;
    let previewTimer = null;
    let alarm = null;

    function notify() {
      onChange({
        musicPlaying: Boolean(music && !music.paused),
        previewPlaying: Boolean(preview && !preview.paused),
        alarmPlaying: Boolean(alarm)
      });
    }
    function makeAudio(src, volume) {
      if (!AudioClass) throw new Error('Audio no está disponible');
      const audio = new AudioClass(src);
      audio.preload = 'auto';
      audio.volume = Math.max(0, Math.min(1, Number(volume) || 0));
      return audio;
    }
    function stopMusic() {
      if (!music) return;
      const audio = music;
      music = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      try { audio.currentTime = 0; } catch (error) {}
      notify();
    }
    function stopPreview() {
      if (previewTimer !== null) clearTimer(previewTimer);
      previewTimer = null;
      if (!preview) return;
      const audio = preview;
      preview = null;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      try { audio.currentTime = 0; } catch (error) {}
      notify();
    }
    function stopAlarm() {
      if (!alarm) { notify(); return; }
      const playback = alarm;
      alarm = null;
      if (playback.repeatTimer !== null) clearTimer(playback.repeatTimer);
      if (playback.limitTimer !== null) clearTimer(playback.limitTimer);
      if (playback.audio) {
        playback.audio.onended = null;
        playback.audio.onerror = null;
        playback.audio.pause();
        try { playback.audio.currentTime = 0; } catch (error) {}
      }
      notify();
    }
    function startMusic(src, volume = 0.35) {
      stopPreview();
      if (!src) { stopMusic(); return false; }
      if (music && music.src.endsWith(src)) {
        music.volume = Math.max(0, Math.min(1, Number(volume) || 0));
        if (music.paused) music.play().catch(() => {
          if (music && music.src.endsWith(src)) { stopMusic(); onError('music'); }
        });
        notify();
        return true;
      }
      stopMusic();
      let audio;
      try { audio = makeAudio(src, volume); } catch (error) { onError('music'); return false; }
      audio.loop = true;
      music = audio;
      audio.play().catch(() => {
        if (music === audio) { stopMusic(); onError('music'); }
      });
      notify();
      return true;
    }
    function previewMusic(src, volume = 0.35, durationMs = 20000) {
      stopPreview();
      if (!src) return false;
      let audio;
      try { audio = makeAudio(src, volume); } catch (error) { onError('music-preview'); return false; }
      preview = audio;
      audio.onended = () => {
        if (preview !== audio) return;
        preview = null;
        if (previewTimer !== null) clearTimer(previewTimer);
        previewTimer = null;
        notify();
      };
      audio.onerror = () => {
        if (preview === audio) { stopPreview(); onError('music-preview'); }
      };
      audio.play().then(() => {
        if (preview === audio) previewTimer = setTimer(stopPreview, Math.max(1, durationMs));
      }).catch(() => {
        if (preview === audio) { stopPreview(); onError('music-preview'); }
      });
      notify();
      return true;
    }
    function playAlarm(src, config = {}) {
      stopAlarm();
      const volume = Math.max(0, Math.min(1, Number(config.volume) || 0));
      if (!src || volume <= 0) return false;
      const plays = Math.max(1, Math.min(10, Math.round(Number(config.plays) || 1)));
      const gap = Math.max(1, Math.min(15, Number(config.intervalSeconds) || 1)) * 1000;
      const maxMs = Math.max(5, Math.min(120, Number(config.maxSeconds) || 30)) * 1000;
      const playback = { audio: null, repeatTimer: null, limitTimer: null, count: 0 };
      alarm = playback;
      playback.limitTimer = setTimer(stopAlarm, maxMs);
      const playNext = () => {
        if (alarm !== playback) return;
        playback.count += 1;
        let audio;
        try { audio = makeAudio(src, volume); } catch (error) { stopAlarm(); onError('alarm'); return; }
        playback.audio = audio;
        audio.onended = () => {
          if (alarm !== playback) return;
          playback.audio = null;
          if (playback.count >= plays) { stopAlarm(); return; }
          playback.repeatTimer = setTimer(playNext, gap);
        };
        audio.onerror = () => {
          if (alarm === playback) { stopAlarm(); onError('alarm'); }
        };
        audio.play().catch(() => {
          if (alarm === playback) { stopAlarm(); onError('alarm'); }
        });
        notify();
      };
      playNext();
      return true;
    }
    function setMusicVolume(value) {
      const volume = Math.max(0, Math.min(1, Number(value) || 0));
      if (music) music.volume = volume;
      if (preview) preview.volume = volume;
    }
    function setAlarmVolume(value) {
      if (alarm && alarm.audio) alarm.audio.volume = Math.max(0, Math.min(1, Number(value) || 0));
    }
    function stopAll() { stopPreview(); stopMusic(); stopAlarm(); }

    return Object.freeze({
      startMusic, stopMusic, previewMusic, stopPreview, playAlarm, stopAlarm,
      setMusicVolume, setAlarmVolume, stopAll,
      isMusicPlaying: () => Boolean(music && !music.paused),
      isPreviewPlaying: () => Boolean(preview && !preview.paused),
      isAlarmPlaying: () => Boolean(alarm)
    });
  }
  return { createFocusAudioController };
});

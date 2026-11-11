(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.OIsymAppearance = factory();
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';
  // Each palette works in both light and dark mode. These are color schemes,
  // not copies of tasks, profile data or preference collections.
  const PALETTES = [
    { id: 'forest', name: 'Bosque', light: '#27856b', dark: '#74d9b3', base: '#15251e' },
    { id: 'ocean', name: 'Océano', light: '#236da8', dark: '#75baff', base: '#121f35' },
    { id: 'midnight', name: 'Medianoche', light: '#39578a', dark: '#95b7ff', base: '#121827' },
    { id: 'aurora', name: 'Aurora', light: '#168c86', dark: '#6de0d6', base: '#11292c' },
    { id: 'orchid', name: 'Orquídea', light: '#8054af', dark: '#c5a0f5', base: '#26182d' },
    { id: 'lavender', name: 'Lavanda', light: '#6c6cae', dark: '#b4b8ff', base: '#202036' },
    { id: 'rose', name: 'Rosa', light: '#b45180', dark: '#f7a3ca', base: '#2b1a26' },
    { id: 'ember', name: 'Cobre', light: '#ac5c33', dark: '#f5ae7a', base: '#291e19' },
    { id: 'sand', name: 'Arena', light: '#91652f', dark: '#e8c080', base: '#29251c' },
    { id: 'citrus', name: 'Lima', light: '#547b26', dark: '#b4dc70', base: '#1c2719' },
    { id: 'slate', name: 'Pizarra', light: '#526d83', dark: '#acc6da', base: '#17232c' },
    { id: 'graphite', name: 'Grafito', light: '#525c70', dark: '#b9c5de', base: '#181c24' }
  ];
  const findPalette = id => PALETTES.find(p => p.id === id) || PALETTES[0];
  const validHex = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const hex = values => '#' + values.map(value => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')).join('');
  const blend = (a, b, weight = .5) => hex(rgb(a).map((v, i) => v * (1 - weight) + rgb(b)[i] * weight));
  const luminance = value => {
    const channels = rgb(value).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const contrast = (a, b) => {
    const one = luminance(a), two = luminance(b);
    return (Math.max(one, two) + .05) / (Math.min(one, two) + .05);
  };
  // Black or white always provides at least 4.5:1 on an opaque sRGB color.
  const chooseText = background => contrast(background, '#ffffff') >= contrast(background, '#000000') ? '#ffffff' : '#000000';
  const readable = (desired, background, lightText, darkText, ratio = 4.5) => {
    if (validHex(desired) && contrast(desired, background) >= ratio) return desired;
    const light = lightText || '#f5f8fb', dark = darkText || '#132432';
    return contrast(light, background) >= contrast(dark, background) ? light : dark;
  };
  const makeTokens = (preferences = {}, systemDark = false) => {
    const mode = ['light', 'dark', 'system'].includes(preferences.appearanceMode) ? preferences.appearanceMode : 'light';
    const dark = mode === 'dark' || mode === 'system' && Boolean(systemDark);
    const palette = findPalette(preferences.appearancePalette);
    const custom = preferences.appearanceColors && typeof preferences.appearanceColors === 'object' ? preferences.appearanceColors : {};
    const override = (field, fallback) => validHex(custom[field]) ? custom[field].toLowerCase() : fallback;
    const pageBase = dark ? blend(palette.base, '#080e19', .28) : blend('#f6f9fc', palette.light, .028);
    const page = override('page', pageBase);
    const surface = override('surface', dark ? blend(palette.base, '#263444', .34) : '#ffffff');
    const inkBase = dark ? '#edf4fb' : '#203447';
    const text = readable(custom.text, surface, '#f5f8fb', '#172735');
    const contrastAdjusted = validHex(custom.text) && text.toLowerCase() !== custom.text.toLowerCase();
    const accent = override('accent', dark ? palette.dark : palette.light);
    const accentText = chooseText(accent);
    const emphasis = readable(accent, surface, '#f5f8fb', '#203447');
    const soft = blend(surface, accent, dark ? .19 : .115);
    const line = blend(surface, text, dark ? .20 : .115);
    const muted = readable(blend(text, surface, dark ? .27 : .35), surface, '#d1e0ed', '#4c5d6e', 4.5);
    const alt = blend(surface, page, .46);
    const nav = blend(surface, page, dark ? .48 : .40);
    const hover = blend(surface, accent, dark ? .11 : .065);
    return {
      dark, mode, palette: palette.id, contrastAdjusted,
      vars: {
        '--page': page, '--surface': surface, '--surface-soft': alt, '--text': text,
        '--muted': muted, '--line': line,
        '--accent': accent, '--accent-dark': emphasis, '--accent-soft': soft,
        '--blue': blend(surface, dark ? '#4c8dc3' : '#7ba9e9', dark ? .21 : .17),
        '--warning': dark ? '#e6b06b' : '#926122',
        '--danger': dark ? '#f09297' : '#b3424b',
        '--shadow': dark ? '0 8px 28px rgba(0, 0, 0, .20)' : '0 8px 28px rgba(40, 72, 58, .055)',
        '--workspace-ink': text, '--workspace-muted': muted,
        '--workspace-border': line, '--workspace-backdrop': page,
        '--workspace-shadow': dark ? '0 5px 20px rgba(0,0,0,.17)' : '0 4px 22px rgba(35,68,97,.045)',
        '--ui-accent-text': accentText, '--ui-navigation': nav, '--ui-field': surface,
        '--ui-hover': hover, '--ui-tile': alt,
        '--ui-accent-contrast': emphasis, '--ui-contrast-border': line
      }
    };
  };
  function apply(target, documentRoot, preferences, systemDark) {
    const result = makeTokens(preferences, systemDark);
    for (const el of [documentRoot, target]) {
      if (!el) continue;
      for (const [name, value] of Object.entries(result.vars)) el.style.setProperty(name, value);
      el.dataset.scheme = result.dark ? 'dark' : 'light';
      el.style.colorScheme = result.dark ? 'dark' : 'light';
    }
    return result;
  }
  return { PALETTES, findPalette, validHex, contrast, makeTokens, apply };
});

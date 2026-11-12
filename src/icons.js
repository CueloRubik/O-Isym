(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports=factory();
  else root.OIsymIcons=factory();
})(typeof globalThis !== 'undefined' ? globalThis : window,function() {
  'use strict';
  // Line icons inherit currentColor. They do not need brightness/invert filters,
  // which caused the solid white squares seen in the dark navigation.
  const SHAPES = {
    'today': [['rect',{x:3,y:4,w:18,h:17,rx:2}],['path',{d:'M8 2v4 M16 2v4 M3 10h18 M8 15l2.5 2.5L16 12'}]],
    'calendar': [['rect',{x:3,y:4,w:18,h:17,rx:2}],['path',{d:'M8 2v4 M16 2v4 M3 10h18 M7 14h3 M14 14h3 M7 18h3'}]],
    'tasks': [['rect',{x:4,y:3,w:16,h:18,rx:2}],['path',{d:'M8 8h.01 M11 8h5 M8 13l1.5 1.5L12 12 M14 13h3 M8 18h9'}]],
    'activities': [['path',{d:'M4 7.5L12 3l8 4.5L12 12 4 7.5Z M4 12l8 4.5 8-4.5 M4 16.5L12 21l8-4.5'}]],
    'goals': [['circle',{cx:12,cy:12,r:9}],['circle',{cx:12,cy:12,r:5}],['circle',{cx:12,cy:12,r:1}]],
    'dashboard': [['rect',{x:3,y:3,w:8,h:8,rx:1.5}],['rect',{x:13,y:3,w:8,h:5,rx:1.5}],['rect',{x:13,y:10,w:8,h:11,rx:1.5}],['rect',{x:3,y:13,w:8,h:8,rx:1.5}]],
    'insights': [['path',{d:'M4 20V12 M9 20V6 M14 20v-9 M19 20V3 M2 21h20'}]],
    'timer': [['circle',{cx:12,cy:13,r:9}],['path',{d:'M12 8v5l3 2 M9 2h6'}]],
    'profiles': [['circle',{cx:9,cy:8,r:3}],['path',{d:'M3 20v-2a6 6 0 0 1 12 0v2 M17 11a3 3 0 0 0 0-6 M18 14a5 5 0 0 1 3 4v2'}]],
    'settings': [['path',{d:'M4 6h16 M4 12h16 M4 18h16'}],['circle',{cx:9,cy:6,r:2,fill:'var(--surface,none)'}],['circle',{cx:16,cy:12,r:2,fill:'var(--surface,none)'}],['circle',{cx:8,cy:18,r:2,fill:'var(--surface,none)'}]],
    'search': [['circle',{cx:10.6,cy:10.6,r:6.6}],['path',{d:'m16 16 5 5'}]],
    'add': [['path',{d:'M12 4v16 M4 12h16'}]],
    'save': [['path',{d:'M4 3h13l3 3v15H4z M7 3v6h9V3 M8 21v-8h8v8'}]],
    'edit': [['path',{d:'M12 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7 M16 3l5 5-10 10-5 1 1-5L17 4a3 3 0 0 1 4 4'}]],
    'delete': [['path',{d:'M4 7h16 M10 4h4 M6 7l1 14h10l1-14 M10 11v6 M14 11v6'}]],
    'archivate': [['rect',{x:3,y:4,w:18,h:5,rx:1}],['path',{d:'M5 9v11h14V9 M10 13h4'}]],
    'duplicate': [['rect',{x:8,y:8,w:13,h:13,rx:2}],['path',{d:'M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3'}]],
    'export': [['path',{d:'M12 16V3 M7 8l5-5 5 5 M4 15v5h16v-5'}]],
    'import': [['path',{d:'M12 3v13 M7 11l5 5 5-5 M4 18v3h16v-3'}]],
    'back': [['path',{d:'m14 5-7 7 7 7 M8 12h13'}]],
    'undo': [['path',{d:'M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12'}]],
    'redo': [['path',{d:'m15 14 5-5-5-5 M20 9H10a6 6 0 0 0 0 12'}]],
    'pause': [['path',{d:'M8 5v14 M16 5v14'}]],
    'break': [['path',{d:'M5 6h12v9a5 5 0 0 1-5 5H9a5 5 0 0 1-4-5V6 M17 8h3a2 2 0 0 1 0 5h-3'}]],
    'zen': [['path',{d:'M20 4C11 4 5 9 5 16c0 3 2 5 5 5 7 0 11-8 10-17Z M3 21c3-5 8-9 13-12'}]],
    'reminder': [['path',{d:'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4'}]],
    'task-reminder': [['path',{d:'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4'}]],
    'priority': [['path',{d:'M5 21V3 M5 4h13l-3 5 3 5H5'}]],
    'filter': [['path',{d:'M3 4h18l-7 8v7l-4 2v-9L3 4Z'}]],
    'repeat': [['path',{d:'M20 7l-3-3-3 3 M17 4H7a4 4 0 0 0-4 4 M4 17l3 3 3-3 M7 20h10a4 4 0 0 0 4-4'}]],
    'help': [['circle',{cx:12,cy:12,r:9}],['path',{d:'M9.5 9a3 3 0 0 1 5 2.5c0 2-2.5 2-2.5 4 M12 19h.01'}]],
    'board-add': [['rect',{x:3,y:3,w:15,h:17,rx:2}],['path',{d:'M21 14v7 M17.5 17.5h7'}]],
    'note-add': [['path',{d:'M4 3h13l3 3v14H4z M17 3v4h4 M8 13h8 M12 9v8'}]],
    'activity-add': [['circle',{cx:10,cy:12,r:7}],['path',{d:'M10 8v8 M6 12h8 M20 6v6 M17 9h6'}]],
    'connect-arrow': [['path',{d:'M4 17 17 6 M11 6h6v6'}]],
    'connect-line': [['path',{d:'M4 18 20 6'}]],
    'connection-label': [['rect',{x:3,y:4,w:18,h:16,rx:2}],['path',{d:'M7 9h10 M7 13h7 M7 17h5'}]],
    'group': [['rect',{x:2,y:2,w:20,h:20,rx:2}],['rect',{x:5,y:6,w:6,h:6,rx:1}],['rect',{x:13,y:11,w:6,h:6,rx:1}]],
    'ungroup': [['rect',{x:2,y:2,w:20,h:20,rx:2,dasharray:'2 3'}],['rect',{x:5,y:6,w:6,h:6,rx:1}],['rect',{x:13,y:11,w:6,h:6,rx:1}]],
    'zoom-in': [['circle',{cx:10.5,cy:10.5,r:6.5}],['path',{d:'m16 16 5 5 M7.5 10.5h6 M10.5 7.5v6'}]],
    'zoom-out': [['circle',{cx:10.5,cy:10.5,r:6.5}],['path',{d:'m16 16 5 5 M7.5 10.5h6'}]],
    'fit-view': [['path',{d:'M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5 M8 8h8v8H8z'}]],
    'center': [['circle',{cx:12,cy:12,r:8}],['path',{d:'M12 2v5 M12 17v5 M2 12h5 M17 12h5'}]]
  };
  const TAGS={path:'path',circle:'circle',rect:'rect'};
  function glyph(path, documentRef, className='ui-icon', alt='') {
    const name=String(path).split('/').pop().replace(/\.png$/,'');
    const shapes=SHAPES[name];
    if(!shapes) return null;
    const ns='http://www.w3.org/2000/svg';
    const svg=documentRef.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('width','22');svg.setAttribute('height','22');
    svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');
    svg.setAttribute('stroke-linejoin','round');
    svg.setAttribute('focusable','false');
    svg.setAttribute('aria-hidden',alt?'false':'true');
    if(alt)svg.setAttribute('aria-label',alt);
    svg.classList.add(...className.split(/\s+/).filter(Boolean),'icon-glyph');
    svg.dataset.icon=name;
    for(const [tag,attrs] of shapes){
      const node=documentRef.createElementNS(ns,TAGS[tag]);
      for(const [key,value] of Object.entries(attrs)){
        const attribute=key==='w'?'width':key==='h'?'height':key==='dasharray'?'stroke-dasharray':key;
        node.setAttribute(attribute,String(value));
      }
      svg.append(node);
    }
    return svg;
  }
  return {glyph, SHAPES};
});

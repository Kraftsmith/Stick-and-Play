// The language of the instructions as a drop-down list: a flag and the language's own name. Russian has no flag
// (the owner's choice, 2026-11-15); an empty place of the same size keeps the names in one column.
// Used on the first run (startup.js), for a new child in Settings (parent.js) and for the children from the cloud (account.js).
import { LANGS } from './state.js';

const svg = body => `<svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
const FLAGS = {
  en: svg('<rect width="60" height="40" fill="#012169"/><path d="M0,0 60,40M60,0 0,40" stroke="#fff" stroke-width="8"/>'
    + '<path d="M0,0 60,40M60,0 0,40" stroke="#c8102e" stroke-width="3"/><path d="M30,0v40M0,20h60" stroke="#fff" stroke-width="12"/>'
    + '<path d="M30,0v40M0,20h60" stroke="#c8102e" stroke-width="7"/>'),
  uk: svg('<rect width="60" height="20" fill="#0057b7"/><rect y="20" width="60" height="20" fill="#ffd700"/>'),
  de: svg('<rect width="60" height="14" fill="#000"/><rect y="13.3" width="60" height="14" fill="#dd0000"/><rect y="26.6" width="60" height="13.4" fill="#ffce00"/>'),
  fr: svg('<rect width="20" height="40" fill="#002395"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#ed2939"/>'),
  es: svg('<rect width="60" height="40" fill="#aa151b"/><rect y="10" width="60" height="20" fill="#f1bf00"/>'),
};
const nameOf = l => (LANGS.find(x => x[0] === l) || LANGS[0])[1];
const item = l => `<span class="lpflag ${FLAGS[l] ? '' : 'none'}">${FLAGS[l] || ''}</span><span class="lpname">${nameOf(l)}</span>`;

// the closed list: the chosen language with an arrow; attrs go on the outer element (e.g. data-i for one child of several)
export const langPick = (value, attrs = '') => `<div class="lpick" ${attrs}>
  <button type="button" class="lpcur">${item(value)}<span class="lparr">▾</span></button>
  <div class="lplist" role="listbox">${LANGS.map(([l]) =>
    `<button type="button" role="option" data-lp="${l}" class="${l === value ? 'on' : ''}">${item(l)}</button>`).join('')}</div></div>`;

const closeAll = except => document.querySelectorAll('.lpick.open').forEach(p => { if (p !== except) p.classList.remove('open', 'up'); });
document.addEventListener('pointerdown', ev => { if (!ev.target.closest('.lpick')) closeAll(); }, true);

// every list inside root: opening, and onPick(pickElement, lang) when a language is chosen
export function wireLangPick(root, onPick) {
  root.querySelectorAll('.lpick').forEach(p => {
    p.querySelector('.lpcur').onclick = () => {
      const open = !p.classList.contains('open');
      closeAll(p); p.classList.toggle('open', open);
      if (!open) return;
      // inside a scrolling panel (Settings) it opens downwards and the panel scrolls to it; elsewhere it opens upwards
      // when the window has no room below
      const list = p.querySelector('.lplist'), r = p.getBoundingClientRect();
      let s = p.parentElement; while (s && !/(auto|scroll)/.test(getComputedStyle(s).overflowY)) s = s.parentElement;
      if (s) { list.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      p.classList.toggle('up', r.bottom + list.getBoundingClientRect().height > innerHeight - 8 && r.top > innerHeight - r.bottom);
    };
    p.querySelectorAll('[data-lp]').forEach(b => b.onclick = () => { p.classList.remove('open', 'up'); onPick(p, b.dataset.lp); });
  });
}

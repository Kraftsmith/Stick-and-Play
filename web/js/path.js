// The lesson path: one line of lessons per level, scrolled sideways, centred on the current lesson.
import { $, scale } from './stage.js';
import { U } from './session.js';
import { S, save, nextIdx, levelOpen, starsOf } from './state.js';
import { TRACKS, LEVELS, THEMES, iconOf, picOf } from './data.js';
import { I } from './icons.js';
import { starsHtml } from './ui.js';
import { sfx } from './audio.js';
import { go, onEnter } from './nav.js';
import { startLesson } from './lessons.js';
import { Premium, lessonLocked } from './premium.js';
import { openParent } from './parent.js';

// "Play" on the home screen opens the path, on the level the child played last
$('playBtn').onclick = () => { sfx.pop(); U.pathTr = S.lastTrack && TRACKS[S.lastTrack] && levelOpen(S.lastTrack) ? S.lastTrack : 'main'; go('path'); };
/* ================= lesson path ================= */
function renderPath() {
  const T = TRACKS[U.pathTr], cur = nextIdx(U.pathTr);
  // the level on screen shows its name, the others only their number, so that many levels fit between the corner buttons
  $('ptitle').innerHTML = LEVELS.map(([tr, name], n) => { const on = tr === U.pathTr, open = levelOpen(tr);
    return `<button class="lvtab ${on ? 'on' : 'num'} ${open ? '' : 'locked'}" data-tr="${tr}" aria-label="${name}">${on ? name : n + 1}${open ? '' : `<span class="lk">${I.lock}</span>`}</button>`; }).join('');
  $('ptitle').querySelectorAll('.lvtab').forEach(b => b.onclick = () => {
    if (!levelOpen(b.dataset.tr)) { sfx.no(); return; }
    if (b.dataset.tr !== U.pathTr) { U.pathTr = b.dataset.tr; S.lastTrack = U.pathTr; save(); sfx.pop(); renderPath(); }
  });
  // a single line of circles joined by connectors; a small theme tag sits above the first lesson of each theme.
  // The last circle of a theme is its finish: bigger, in a chequered ring, with a cup that lights up when it is done,
  // and a dotted gap leads from it to the next theme (feedback 2026-11-17: the end of a theme did not stand out)
  const firstOf = {}; T.islands.forEach(is => firstOf[is.idx[0]] = is);
  const finish = new Set(T.islands.map(is => is.idx[is.idx.length - 1]));
  $('islands').innerHTML = '<div class="pline">' + T.lessons.map((ls, i) => {
    // the next lesson past the free twenty waits for a grown-up: a lock, not the orange circle (subscription.md 3)
    const st = S.prog[U.pathTr][i], pay = !st && i === cur && lessonLocked(U.pathTr, i);
    const cls = st ? 'done' : pay ? 'pay' : i === cur ? 'cur' : 'locked';
    const is = firstOf[i], fin = finish.has(i);
    return (i ? `<div class="conn ${finish.has(i - 1) ? 'gap' : ''} ${st ? 'done' : ''}"></div>` : '') +
      `<div class="lwrap ${fin ? 'fin ' + cls : ''}">${is ? `<div class="ttag">${is.set ? iconOf(is.set) : is.icon}<small>${is.label}</small></div>` : ''}
        ${fin ? `<div class="cup">${I.trophy}</div>` : ''}
        <button class="ln ${cls} ${fin ? 'fin' : ''}" data-i="${i}">${ls.kind === 'words' ? picOf(THEMES[ls.theme][ls.part ? 4 : 0][0], ls.icon) : ls.icon}${st ? starsHtml(starsOf(st), 'lnstars') : pay ? `<span class="mk">${I.lock}</span>` : ''}</button></div>`;
  }).join('') + '</div>';
  // centre the U.current lesson
  const box = $('islands'), target = box.querySelector(`.ln[data-i="${Math.min(cur, T.lessons.length - 1)}"]`);
  box.scrollLeft = target.parentElement.offsetLeft - box.clientWidth / 2 + target.offsetWidth / 2;
  box.querySelectorAll('.ln').forEach(b => b.onclick = () => {
    if (box._dragged) return;
    const i = +b.dataset.i;
    if (b.classList.contains('locked')) { sfx.no(); return; }
    // no price and no "buy" on the child's side: the lock calls the grown-up and leads to the parent lock
    if (b.classList.contains('pay')) { sfx.pop(); openParent('premium'); return; }
    // a done lesson starts the new one: a child taps any circle just to play. Once the level is finished, it replays.
    // ...unless the new one is locked: then the finished lesson itself is played again
    sfx.pop(); startLesson(U.pathTr, cur < T.lessons.length && !lessonLocked(U.pathTr, cur) ? cur : i);
  });
}

// swipe the path sideways with a finger or mouse
(() => {
  const box = $('islands'); let st = null;
  box.addEventListener('pointerdown', ev => { st = { x: ev.clientX, l: box.scrollLeft }; box._dragged = false; });
  box.addEventListener('pointermove', ev => {
    if (!st) return; const dx = (ev.clientX - st.x) / scale;
    if (Math.abs(dx) > 10) box._dragged = true;
    box.scrollLeft = st.l - dx;
  });
  const end = () => { st = null; setTimeout(() => box._dragged = false, 0); };
  box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end); box.addEventListener('pointerleave', end);
})();
onEnter('path', renderPath);
// premium came or went while the path is open: the lock appears or leaves without a sound
Premium.onChange(() => { if (U.current === 'path') renderPath(); });

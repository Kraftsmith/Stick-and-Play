// Question tasks: tap the picture, drag it to its shadow, the odd one out, find the letter, the first letter, letter teams.
import { $, pt, rectIn, capture } from './stage.js';
import { U } from './session.js';
import { S, save, chunkPool, praise } from './state.js';
import { WORD_INFO, THEMES, SETS, CHUNKS, CHUNK_WORD, LETTERS, ECON, pic, picOf, gapWord, markWord, sndOf, letterSound } from './data.js';
import { I } from './icons.js';
import { pick, shuffle, one } from './util.js';
import { say, ph, en, cheer, sfx, warm } from './audio.js';
import { addCoins } from './ui.js';
import { go } from './nav.js';
import { L, later, nextTask, dotsHtml, letterPool, onTask } from './lessons.js';

export let Q = null;   // the open question: task, mistakes, the right answer, what to say after it
// the trace task is a question too (it is answered through answerQ)
export function setQ(q) { Q = q; }
/* ---- question tasks: pick / pair / odd / find / first ---- */
export function showQ(task) {
  if (U.current !== 'quiz') go('quiz');
  if (U.current !== 'quiz') return;
  Q = { task, miss: 0, locked: false, wrongAt: [], drag: false };
  $('dots').innerHTML = dotsHtml();
  const P = $('prompt'), spk = `<button class="speak" id="spk">${I.speaker}</button>`;
  let opts, phrase;
  if (task.t === 'pick' || task.t === 'pair') {
    const a = WORD_INFO[task.w];
    const others = pick(THEMES[a.theme].map(x => x[0]).filter(w => w !== a.w), 2);
    opts = shuffle([a.w, ...others]).map(w => ({ label: pic(WORD_INFO[w]), ok: w === a.w, cls: '' }));
    Q.id = a.w; Q.after = [en(a.w)];
    if (task.t === 'pick') {
      phrase = [ph('find'), en(a.w)];
      P.innerHTML = `${spk}<div class="promptword">${a.w}</div>`;
    } else {
      phrase = [ph('dragShadow')];
      P.innerHTML = `${spk}<div class="shadowpic" id="shadow">${pic(a)}</div>`;
      Q.drag = true;
    }
  } else if (task.t === 'odd') {
    const ins = pick(THEMES[task.theme], 3);
    const grp = SETS.find(s => s.id === task.theme).group;
    const out = one(THEMES[one(SETS.filter(s => s.group !== grp).map(s => s.id))]);
    // the sticker pictures, like every other task (the emoji here was the device's own, in another style)
    opts = shuffle([...ins.map(x => ({ label: picOf(x[0], x[1]), ok: false, cls: '' })), { label: picOf(out[0], out[1]), ok: true, cls: '' }]);
    phrase = [ph('oddOne')];
    // no theme picture here: a farm cow above farm options looked like "find the cow"
    P.innerHTML = `${spk}<div class="promptpic">${I.think}</div>`;
    Q.id = out[0]; Q.after = [en(out[0])];
  } else if (task.t === 'chunk' || task.t === 'missing') {
    const ci = task.t === 'chunk' ? task.ci : CHUNK_WORD[task.w].ci, c = CHUNKS[ci][0];
    const others = pick(chunkPool(ci).filter(i => i !== ci), 2);
    opts = shuffle([ci, ...others]).map(i => ({ label: CHUNKS[i][0], ok: i === ci, cls: 'letter two' }));
    Q.id = c;
    if (task.t === 'chunk') {
      phrase = [ph('find'), en(sndOf(ci) + '.')];
      P.innerHTML = spk; Q.after = [en(`${sndOf(ci)}, as in ${CHUNKS[ci][2][0][0]}.`)];
    } else {
      const wi = CHUNK_WORD[task.w];
      phrase = [ph('missingLetters'), en(task.w)];
      P.innerHTML = `${spk}<div class="promptpic">${picOf(task.w, wi.e)}</div><div class="promptword">${gapWord(task.w, c)}</div>`;
      Q.after = [en(task.w + '.')];
      Q.fill = () => { const pw = document.querySelector('#prompt .promptword'); if (pw) pw.innerHTML = markWord(task.w, c); };
    }
  } else {
    const ch = LETTERS[task.li][0];
    const others = pick(letterPool(task.pool ?? task.li).filter(i => i !== task.li), 2);
    opts = shuffle([task.li, ...others]).map(i => ({ label: LETTERS[i][0], ok: i === task.li, cls: 'letter' }));
    Q.id = ch;
    if (task.t === 'find') {
      // the sound, never the letter's name (phonics.md, rule 1)
      phrase = [ph('findLetterSays'), en(letterSound(task.li))];
      P.innerHTML = spk; Q.after = [en(letterSound(task.li))];
    } else {
      const [w, e] = one(LETTERS[task.li][1]);
      phrase = [ph('firstSound'), en(w)];   // a whole question, then the word (was three clips, the last one a lone "?")
      P.innerHTML = `${spk}<div class="promptpic">${picOf(w, e)}</div>`; Q.after = [en(letterSound(task.li)), en(w + '.')];
    }
  }
  Q.phrase = phrase; warm(...phrase, ...(Q.after || []));
  $('spk').onclick = () => say(...phrase);
  setTimeout(() => say(...phrase), 250);
  const C = $('choices'); C.innerHTML = '';
  opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'choice ' + o.cls; b.innerHTML = o.label; b.dataset.ok = o.ok ? 1 : 0;
    if (Q.drag) dragChoice(b, o.ok); else b.onclick = () => answerQ(b, o.ok);
    C.appendChild(b);
  });
}
export function dragChoice(b, ok) {
  let st = null;
  b.addEventListener('pointerdown', ev => {
    if (Q.locked) return; capture(b, ev); st = pt(ev);
    b.classList.remove('ret', 'no'); b.classList.add('dragging'); sfx.pop();
  });
  b.addEventListener('pointermove', ev => {
    if (!st) return; const q = pt(ev);
    b.style.transform = `translate(${q.x - st.x}px, ${q.y - st.y}px) scale(1.08)`;
  });
  const up = () => {
    if (!st) return; st = null; b.classList.remove('dragging');
    const r = rectIn(b), s = rectIn($('shadow'));
    const hit = Math.hypot(r.x + r.w / 2 - (s.x + s.w / 2), r.y + r.h / 2 - (s.y + s.h / 2)) < 170;
    if (hit && ok) { $('shadow').classList.add('lit'); b.style.visibility = 'hidden'; answerQ(b, true); return; }
    b.classList.add('ret'); b.style.transform = '';
    if (hit) answerQ(b, false); else sfx.pop();
  };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
}
export function answerQ(btn, ok) {
  if (Q.locked) return;
  // a letter traced over a word's picture (level 1) counts for the word: the letter is not taught there
  const isLetter = ['find', 'first', 'trace', 'chunk', 'missing'].includes(Q.task.t) && !(Q.task.t === 'trace' && Q.task.w);
  if (ok) {
    Q.locked = true; btn.classList.add('ok'); sfx.ok();
    if (Q.fill) Q.fill();
    let gain = ECON.task + (Q.miss === 0 ? ECON.firstTry : 0);
    L.earned += gain;
    S.stats.tasks++; S.stats.correct++;
    const bucket = isLetter ? S.stats.letters : S.stats.words;
    bucket[Q.id] = (bucket[Q.id] || 0) + 1;
    const r = rectIn(btn); addCoins(gain, { x: r.x + r.w / 2 - 25, y: r.y + 40 });
    say(...Q.after, cheer(praise()));
    later(nextTask, 1900);
  } else {
    Q.miss++; L.misses++; S.stats.wrong++;
    S.stats.err[Q.id] = (S.stats.err[Q.id] || 0) + 1; save();
    if (!Q.drag) { btn.classList.remove('no'); void btn.offsetWidth; btn.classList.add('no'); }
    sfx.no();
    // fast random tapping -> pause and repeat
    const now = Date.now(); Q.wrongAt.push(now);
    const spam = Q.wrongAt.filter(t => now - t < 1500).length >= 2;
    const okEl = document.querySelector('.screen.on .choice[data-ok="1"]'); if (Q.miss >= 2 && okEl) okEl.classList.add('hint');
    if (spam) { Q.locked = true; setTimeout(() => { Q.locked = false; }, 1800); }
    setTimeout(() => say(ph(spam ? 'slowDown' : Q.miss >= 2 ? 'lookHere' : 'tryAgain'), ...Q.phrase), 300);
  }
}
['pick', 'pair', 'odd', 'find', 'first', 'chunk', 'missing'].forEach(t => onTask(t, showQ));

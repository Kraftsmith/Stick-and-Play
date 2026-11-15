// Voice clips with ElevenLabs: every spoken line of the app -> web/audio/voice/<hash>.mp3, the manifest
// web/audio/voice/manifest.json and the module web/js/gen/voice.js (key "lang|text" -> file).
// Run: node app/voice.js            (skips clips that already exist; re-run after changing texts)
//      node app/voice.js --force    (re-render everything, e.g. after changing the voice)
//      node app/voice.js --force --lang en   (re-render one language only, e.g. after changing its model)
//      node app/voice.js --list     (only print the lines that have no clip yet and refresh the manifest; no API calls)
//      node app/voice.js --level    (bring every existing clip to one loudness and cut breaths and silence with ffmpeg;
//                                    no API calls. New clips get the same as they are rendered)
//      node app/voice.js --redo marked.txt  (re-render the lines in the file: "lang<TAB>text" per line, as Testing → Voices →
//                                             Copy marked gives them)
// The API key is read from ELEVENLABS_API_KEY or from the .env file in ENV_FILE (never stored here).
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { pathToFileURL } = require('url');
const ROOT = path.join(__dirname, '..');
const WEB = path.join(ROOT, 'web');
const OUT = path.join(WEB, 'audio', 'voice');
const GEN = path.join(WEB, 'js', 'gen', 'voice.js');
const ENV_FILE = process.env.ENV_FILE || 'C:/Users/User/Documents/Projects/EgzaminPolskiB1/.env';
const FORCE = process.argv.includes('--force');
const LIST = process.argv.includes('--list');
const LEVEL = process.argv.includes('--level');
const ONLY_LANG = process.argv.includes('--lang') ? process.argv[process.argv.indexOf('--lang') + 1] : null;
const REDO = process.argv.includes('--redo') ? process.argv[process.argv.indexOf('--redo') + 1] : null;

// ---- voices: one per language. An English voice reads Russian with an accent, so Russian lines need
// a native Russian voice from the ElevenLabs library (added to "My voices", then its id goes here or in VOICE_RU).
const VOICES = {
  en: process.env.VOICE_EN || 'XrExE9yKIg1WjnnlVkGX',   // "Matilda"
  // the owner's choice of 2026-11-14 (https://elevenlabs.io/voices/CYZATuZ1tjgW8es1QfPG); it replaces "Kate" (7G0NvIkWRnU0Dqjgz13p), who
  // sounded tired. The voice must be in "My voices" of the account. Every Russian clip was rendered with it on 2026-11-14.
  ru: process.env.VOICE_RU || 'CYZATuZ1tjgW8es1QfPG',
  // uk, de, fr, es: no voice yet (TASKS 4.6, 4б.1). A language without a voice here keeps its lines in the list (Testing →
  // Voices shows them as "device voice"), and no clip is rendered for it. Also VOICE_<LANG> in the environment.
};
for (const l of ['uk', 'de', 'fr', 'es']) if (process.env['VOICE_' + l.toUpperCase()]) VOICES[l] = process.env['VOICE_' + l.toUpperCase()];
// ---- model, one per language. English must enforce the language: eleven_multilingual_v2 ignores language_code and
// guesses the language from the text, and a lone English word has nothing to guess from ("kite" came out as Italian
// "ki-te"). Only Turbo v2.5 and Flash v2.5 honour language_code, so English stays on Turbo v2.5.
// Russian: whole Russian sentences leave nothing to guess, and Turbo v2.5 read them with an accent and wrong stresses;
// from 2026-11-12 Russian lines use Multilingual v2 (TASKS 4а.2). Every clip was re-rendered on 2026-11-14 (TASKS 4а.0б).
// Any other language starts on Multilingual v2, like Russian: its lines are whole sentences (choose per language, 4б.1).
const MODELS = { en: process.env.VOICE_MODEL_EN || 'eleven_turbo_v2_5', ru: process.env.VOICE_MODEL_RU || 'eleven_multilingual_v2' };
const modelFor = lang => process.env['VOICE_MODEL_' + lang.toUpperCase()] || MODELS[lang] || 'eleven_multilingual_v2';
const takesLanguageCode = model => /_v2_5$|^eleven_v3$/.test(model);
// One model for every line of a language (2026-11-14). Until then eight short Russian lines had eleven_v3: it kept the
// Russian accent on a word or two, but it sounded like another speaker next to the rest and added breaths and sighs
// after the words. Now a short line gets its language from CONTEXT instead: text the model is told came just before
// (previous_text), which it does not speak. LINE_MODEL stays for a line that cannot be made to sound right otherwise.
const LINE_MODEL = {};
// English gets no context: with one the model added to the word ("a dinosaur", "stars", "of course" for "horse"), and
// language_code already holds its language.
const CONTEXT = { ru: 'Мы играем и учим английские слова. Слушай внимательно.' };
// Russian: the stresses and the tone of each line (decided 2026-11-14: the tones of Specs/features/sounds.md, 2б, are to be
// followed when recording). See app/voice-ru.js.
const RU = require('./voice-ru.js');
const howOf = (lang, text) => lang === 'ru' && RU.LINES[text] || null;
// The sounds of the letters ("/s/", Specs/features/phonics.md, rule 1). A model reads a lone letter as its name, so a
// sound is rendered from a phoneme tag in CMU Arpabet, which only eleven_flash_v2 understands. The voice is American:
// the short O is AA.
const ARPABET = { s: 'S', a: 'AE1', t: 'T', p: 'P', i: 'IH1', n: 'N', m: 'M', d: 'D', g: 'G', o: 'AA1', k: 'K', e: 'EH1', u: 'AH1', h: 'HH', r: 'R',
  b: 'B', f: 'F', l: 'L', j: 'JH', v: 'V', w: 'W', y: 'Y', z: 'Z', ks: 'K S' };
const soundIn = text => (/^\/([a-z]+)\/$/.exec(text) || [])[1];
const SOUND_MODEL = process.env.VOICE_MODEL_SOUND || 'eleven_flash_v2';
const modelOf = (lang, text) => soundIn(text) ? SOUND_MODEL : LINE_MODEL[lang + '|' + text] || modelFor(lang);
// what is sent to the model for a line: the line itself, or the phoneme tag of a sound
const textFor = text => {
  const s = soundIn(text); if (!s) return text;
  if (!ARPABET[s]) throw new Error('no phonemes for ' + text);
  return `<phoneme alphabet="cmu-arpabet" ph="${ARPABET[s]}">${s}</phoneme>.`;
};
// v3 takes stability 0 / 0.5 / 1 only and no other settings
// Russian is livelier (2026-11-14: the owner wants a joyful voice; with style 0 the reading was flat)
const LANG_SETTINGS = { ru: { stability: 0.45, style: 0.3 } };
const settingsFor = (model, lang, how) => model === 'eleven_v3' ? { stability: 0.5 } : { ...SETTINGS, ...LANG_SETTINGS[lang], speed: SPEED[lang], ...(how && how.set) };   // how.set: a line's own settings (app/voice-ru.js)
// style 0: with more "style" the models act the line out, and a breath or a sigh is part of the act
const SETTINGS = { stability: 0.6, similarity_boost: 0.8, style: 0, use_speaker_boost: true };
const SPEED = { ru: 0.95, en: 0.85 };   // English a bit slower: the child is hearing new words; other languages: the model's own speed

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const m = fs.readFileSync(ENV_FILE, 'utf8').match(/^elevenlabs_api_key=(.+)$/im);
  if (!m) throw new Error('no elevenlabs_api_key in ' + ENV_FILE);
  return m[1].trim().replace(/^"|"$/g, '');
}

// ---- every line the app can say. The lines of the instructions come from the table of web/js/phrases.js (every
// language, every form of the grown-up); the English words from the app's data module, so the word lists never drift.
function allLines({ SETS, LETTERS, CHUNKS, SHAPES, soundOf }, phrases) {
  const en = t => ['en', t];
  const lines = phrases.allPhrases();
  // English: words, sticker names, set names, letters, sounds and the lesson sentences built from them
  const words = new Set();
  SETS.forEach(s => { lines.push(en(s.name), en(s.name + '!')); s.items.forEach(([, w]) => words.add(w)); });
  LETTERS.forEach(([ch, ws]) => {
    ws.forEach(([w]) => words.add(w));
    lines.push(en(soundOf(ch)));   // the sound, never the name (phonics.md, rule 1); the lesson's phrases are built from it and the words
  });
  CHUNKS.forEach(([c, s, ws]) => {
    ws.forEach(([w]) => words.add(w));
    lines.push(en(s + '.'), en(s + ','), en(`${s}, as in ${ws.map(w => w[0]).join(', and ')}.`), en(`${s}, as in ${ws[0][0]}.`));
  });
  words.forEach(w => lines.push(en(w), en(w + '.'), en(w + '!')));
  SHAPES.forEach(([name]) => lines.push(en(name)));   // the shapes traced on level 1
  lines.push(en('Hello!'), en('Hello! This is a test.'));
  lines.push(en('Three!'), en('Two!'), en('One!'), en('Go!'));   // the race countdown
  return lines;
}

// ---- one loudness for every clip, as the ear hears it. Two voices and four models come out at different levels, and
// the plain mean level (what this step used until 2026-11-14) does not match what is heard: measured that day, the
// English clips sounded about 1.5 dB louder than the Russian ones and single clips were up to 9 dB apart. So the level
// is measured the way loudness meters do it: the sound is weighted like the ear (little below 100 Hz, more above
// 1.5 kHz) and only the loud part of the clip counts, the frames within 20 dB of the loudest one; pauses and the
// tail do not pull the number down. Every clip is brought to LEVEL_DB; a limiter holds the peaks under PEAK_DB.
// The same step cuts what is not speech: silence at both ends and, in Russian clips, a breath or a sigh the model
// added before or after the words (eleven_v3 does that): a stretch of 200 ms or more, apart from the words and at
// least 10 dB weaker than them, and whatever follows the last frame within 26 dB of the loudest one. English clips
// keep their ends: a final "s" or "t" looks the same to these rules.
// A clip that needs less than 0.7 dB and no cut is left alone, so the step can be run again and again. Needs ffmpeg.
const { spawnSync } = require('child_process');
const LEVEL_DB = -18, PEAK_DB = -1, RATE = 44100, FRAME = 882;   // 20 ms frames
const EAR = 'highpass=f=100,highshelf=f=1500:g=4';
let noFfmpeg = false;
function pcmOf(f, af) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, ...(af ? ['-af', af] : []), '-ac', '1', '-ar', String(RATE), '-f', 's16le', '-'], { maxBuffer: 1 << 27 });
  if (r.error) { noFfmpeg = true; console.error('ffmpeg not found: the clips keep the level they were recorded at'); return null; }
  return new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 1);
}
const framesOf = pcm => { const fr = []; for (let i = 0; i + FRAME <= pcm.length; i += FRAME) { let s = 0; for (let j = 0; j < FRAME; j++) s += pcm[i + j] * pcm[i + j]; fr.push(s / FRAME / (32768 * 32768)); } return fr; };
const dB = x => 10 * Math.log10(x + 1e-12);
// stretches of sound, apart from each other by 60 ms of quiet or more
function segsOf(fr, top) {
  const segs = []; let quiet = 99;
  fr.forEach((x, i) => {
    if (x > top / 3162) { if (quiet >= 3 || !segs.length) segs.push({ from: i, to: i, max: x }); else { const s = segs[segs.length - 1]; s.to = i; s.max = Math.max(s.max, x); } quiet = 0; }
    else quiet++;
  });
  return segs;
}
const weakIn = (segs, s) => s.to - s.from + 1 >= 10 && s.max < Math.max(...segs.filter(o => o !== s).map(o => o.max)) / 10;
// a Russian clip as the model gave it: is there a breath before or after the words? (a weak stretch at either end, or
// a quarter of a second of quiet sound after the last loud frame). Such a clip is rendered again, see the render loop.
function breathy(f) {
  if (noFfmpeg) return false;
  const raw = pcmOf(f); if (!raw || raw.length < FRAME * 3) return false;
  const fr = framesOf(raw), top = Math.max(...fr), segs = segsOf(fr, top);
  if (segs.length > 1 && (weakIn(segs, segs[0]) || weakIn(segs, segs[segs.length - 1]))) return true;
  let last = fr.length - 1; while (last > 0 && fr[last] < top / 400) last--;
  let n = 0; for (let i = last + 1; i < fr.length; i++) if (fr[i] > top / 3162) n++;
  return n >= 12;
}
// returns what was done: { gain, cut } (dB added, seconds removed), or null when the clip was left as it is
function level(f, lang) {
  if (noFfmpeg) return null;
  const raw = pcmOf(f); if (!raw || raw.length < FRAME * 3) return null;
  const fr = framesOf(raw), top = Math.max(...fr);
  const segs = segsOf(fr, top);
  if (!segs.length) return null;
  if (lang === 'ru') {
    const weak = s => weakIn(segs, s);
    while (segs.length > 1 && weak(segs[segs.length - 1])) segs.pop();
    while (segs.length > 1 && weak(segs[0])) segs.shift();
  }
  const dur = raw.length / RATE;
  let from = Math.max(0, segs[0].from * FRAME / RATE - 0.02), to = Math.min(dur, (segs[segs.length - 1].to + 1) * FRAME / RATE + 0.06);
  // a Russian clip also ends 80 ms after its last frame within 26 dB of the loudest: what follows is the model's breath
  if (lang === 'ru') { let last = fr.length - 1; while (last > 0 && fr[last] < top / 400) last--; to = Math.min(to, (last + 1) * FRAME / RATE + 0.08); }
  if (from < 0.04) from = 0;
  if (dur - to < 0.04) to = dur;
  const cut = dur - (to - from);
  // how loud the kept part sounds, and its peak
  const ear = framesOf(pcmOf(f, EAR).subarray(Math.round(from * RATE), Math.round(to * RATE))), earTop = Math.max(...ear), loud = ear.filter(x => x > earTop / 100);
  let peak = 0; for (let i = Math.round(from * RATE); i < Math.round(to * RATE); i++) if (Math.abs(raw[i]) > peak) peak = Math.abs(raw[i]);
  const peakDb = 20 * Math.log10(peak / 32768 + 1e-9);
  // the limiter may take up to 6 dB off the peaks; a clip that would need more stays a little quieter
  const gain = Math.min(LEVEL_DB - dB(loud.reduce((x, y) => x + y, 0) / loud.length), PEAK_DB - peakDb + 6);
  if (Math.abs(gain) < 0.7 && cut < 0.04) return null;
  const af = [...(cut >= 0.04 ? [`atrim=start=${from.toFixed(3)}:end=${to.toFixed(3)}`, 'asetpts=PTS-STARTPTS', `afade=t=out:st=${Math.max(0, to - from - 0.03).toFixed(3)}:d=0.03`] : []),
    `volume=${gain.toFixed(1)}dB`, ...(peakDb + gain > PEAK_DB ? [`alimiter=limit=${Math.pow(10, PEAK_DB / 20).toFixed(3)}:level=disabled:attack=2:release=40`] : [])];
  const tmp = f + '.tmp.mp3';
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', f, '-af', af.join(','), '-ac', '1', '-ar', String(RATE), '-c:a', 'libmp3lame', '-b:a', '64k', tmp], { encoding: 'utf8' });
  if (r.status !== 0) { try { fs.unlinkSync(tmp); } catch (e) {} console.error('level FAILED', f); return null; }
  fs.renameSync(tmp, f);
  return { gain, cut: cut >= 0.04 ? cut : 0 };
}

// ---- render
const key =([lang, text]) => lang + '|' + text;
// TAKE: raised when every clip of a language is recorded anew (another voice). It goes into the file name, so the new
// clips get new names: browsers and the offline cache keep a clip for ever under its name and would go on playing the
// old voice. 2 for Russian: the voice of 2026-11-14.
const TAKE = { ru: 2 };
// a single line recorded anew has a take of its own (take: in app/voice-ru.js), for the same reason
const file = k => { const i = k.indexOf('|'), t = (RU.LINES[k.slice(i + 1)] || {}).take && k.startsWith('ru|') ? RU.LINES[k.slice(i + 1)].take : TAKE[k.slice(0, i)]; return crypto.createHash('md5').update(t ? k + '|take' + t : k).digest('hex').slice(0, 10) + '.mp3'; };
async function tts(lang, text) {
  const model = modelOf(lang, text), how = howOf(lang, text);
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[lang]}?output_format=mp3_44100_64`, {
    method: 'POST', headers: { 'xi-api-key': apiKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: how ? how.say : textFor(text), model_id: model, ...(takesLanguageCode(model) ? { language_code: lang } : {}),
      ...(model !== 'eleven_v3' && !soundIn(text) && CONTEXT[lang] ? { previous_text: how && how.prev || CONTEXT[lang] } : {}),
      ...(model !== 'eleven_v3' && how && (how.next || RU.TONE[how.tone]) ? { next_text: how.next || RU.TONE[how.tone] } : {}), voice_settings: settingsFor(model, lang, how) }),
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}
(async () => {
  const data = await import(pathToFileURL(path.join(WEB, 'js', 'data.js')).href);
  const phrases = await import(pathToFileURL(path.join(WEB, 'js', 'phrases.js')).href);
  const uniq = [...new Map(allLines(data, phrases).map(l => [key(l), l])).values()];
  fs.mkdirSync(OUT, { recursive: true });
  // --redo: the lines listed in the file, re-rendered even if their clip exists (a line not in the list is reported)
  const redo = REDO ? new Set(fs.readFileSync(REDO, 'utf8').split(/\r?\n/).filter(s => s.trim()).map(s => { const [lang, text] = s.split('\t'); return lang.trim() + '|' + text; })) : null;
  if (redo) [...redo].filter(k => !uniq.some(l => key(l) === k)).forEach(k => console.log('not in the list, skipped:', k));
  const voiceless = [...new Set(uniq.map(l => l[0]))].filter(l => !VOICES[l]);
  voiceless.forEach(l => console.log(`no voice for "${l}" in VOICES: its ${uniq.filter(x => x[0] === l).length} lines are read by the device's voice`));
  const todo = uniq.filter(l => VOICES[l[0]] && (!ONLY_LANG || l[0] === ONLY_LANG) && (redo ? redo.has(key(l)) : FORCE || !fs.existsSync(path.join(OUT, file(key(l))))));
  console.log(`${uniq.length} lines, ${todo.length} to render`);
  uniq.filter(l => l[0] === 'ru' && !howOf(...l)).forEach(l => console.log('no stresses and tone in app/voice-ru.js:', l[1]));
  if (LIST) { todo.forEach(([lang, text]) => console.log(lang, text)); writeManifest(uniq); return; }
  // --level: bring the clips that exist to one loudness, no API calls
  if (LEVEL) {
    let changed = 0;
    uniq.filter(l => !ONLY_LANG || l[0] === ONLY_LANG).forEach(l => {
      const f = path.join(OUT, file(key(l)));
      if (!fs.existsSync(f)) return;
      const g = level(f, l[0]);
      if (g) { changed++; console.log(`${g.gain > 0 ? '+' : ''}${g.gain.toFixed(1)} dB${g.cut ? `  cut ${g.cut.toFixed(2)} s` : ''}  ${l[0]} ${l[1]}`); }
    });
    console.log(`levelled ${changed} clips to ${LEVEL_DB} dB`);
    writeManifest(uniq); return;
  }
  let made = 0, chars = 0, failed = 0;
  const queue = todo.slice();
  await Promise.all(Array.from({ length: 2 }, async () => {
    for (let l; (l = queue.shift());) {
      const [lang, text] = l;
      try {
        const f = path.join(OUT, file(key(l)));
        // a Russian clip with a breath in it is rendered again, up to four times; the last one is kept and trimmed
        let tries = 0;
        do { fs.writeFileSync(f, await tts(lang, text)); tries++; chars += text.length; } while (lang === 'ru' && tries < 4 && breathy(f));
        const breath = lang === 'ru' && tries === 4 && breathy(f);
        level(f, lang); made++; process.stdout.write(`${lang} ${text}${tries > 1 ? `   (${tries} renders${breath ? ', still a breath: trimmed' : ''})` : ''}\n`);
      }
      catch (e) { failed++; console.error('FAILED', lang, text, e.message.slice(0, 200)); }
    }
  }));
  const n = writeManifest(uniq);
  console.log(`made ${made} clips (${chars} chars), failed ${failed}, manifest ${n}`);
})();
// VOICE: the lines that have a clip; LINES: every line of the list, with or without a clip (the Voices table in the
// parent zone, Testing, shows both, so a line spoken by the device's voice is easy to find)
function writeManifest(uniq) {
  const manifest = {};
  uniq.forEach(l => { const f = file(key(l)); if (fs.existsSync(path.join(OUT, f))) manifest[key(l)] = f.slice(0, -4); });
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
  fs.writeFileSync(GEN, `// Generated by app/voice.js: every spoken line, "lang|text" -> audio/voice/<file>.mp3. Do not edit by hand.\n`
    + `export const VOICE = ${JSON.stringify(manifest)};\n`
    + `// every line of the list in app/voice.js, recorded or not\nexport const LINES = ${JSON.stringify(uniq.map(key))};\n`);
  return Object.keys(manifest).length;
}

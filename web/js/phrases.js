// Every line the app says in the language of the instructions (SPEC 3.10, Specs/languages.md): tasks, hints, praise and
// the lines that send the child to a grown-up. English words, letters and sounds are not here: they are the same in
// every language and are said with en(...) (audio.js).
// One table for the game and for app/voice.js, which records a clip for every text below, so the list of clips never
// drifts from what the game says (TASKS 4.2, 4а.6). The Russian texts are the clip keys ("ru|Найди"): change a text and
// its clip is recorded anew.
// No imports: app/voice.js loads this module in Node.

// A new language: its texts next to the others (a missing text falls back, see chainOf), its forms of the grown-up in
// ADDRESS, then `node app/voice.js` for its clips once it has a voice there.
export const PHRASES = {
  // lessons (quiz.js, trace.js, puzzle.js)
  find:           { ru: 'Найди', de: 'Finde' },
  dragShadow:     { ru: 'Перетащи картинку к её тени!', de: 'Zieh das Bild zu seinem Schatten!' },
  oddOne:         { ru: 'Что здесь лишнее? Нажми!', de: 'Was passt nicht dazu? Tipp drauf!' },
  missingLetters: { ru: 'Каких букв не хватает?', de: 'Welche Buchstaben fehlen?' },
  findLetterSays: { ru: 'Найди букву, которая говорит', de: 'Finde den Buchstaben, der so klingt:' },
  firstSound:     { ru: 'С какого звука начинается слово?', de: 'Mit welchem Laut fängt das Wort an?' },
  trace:          { ru: 'Обведи!', de: 'Zeichne nach!' },
  traceLetter:    { ru: 'Обведи букву', de: 'Zeichne den Buchstaben' },
  traceSmall:     { ru: 'Обведи маленькую букву', de: 'Zeichne den kleinen Buchstaben' },
  traceLetters:   { ru: 'Обведи буквы', de: 'Zeichne die Buchstaben' },
  inWord:         { ru: 'в слове', de: 'im Wort' },
  puzzle:         { ru: 'Собери картинку!', de: 'Setz das Bild zusammen!' },
  // after an answer
  streak:         { ru: 'Три подряд! Бонус!', de: 'Dreimal richtig! Bonus!' },
  slowDown:       { ru: 'Не спеши. Послушай ещё раз.', de: 'Nicht so schnell. Hör noch mal zu.' },
  lookHere:       { ru: 'Посмотри, вот здесь!', de: 'Schau mal, hier!' },
  tryAgain:       { ru: 'Попробуй ещё!', de: 'Versuch es noch mal!' },
  gold:           { ru: 'Без единой ошибки! Золотая звезда!', de: 'Kein einziger Fehler! Ein goldener Stern!' },
  lessonDone:     { ru: 'Урок пройден!', de: 'Lektion geschafft!' },
  canBuy:         { ru: 'Можно купить стикер!', de: 'Du kannst einen Sticker kaufen!' },
  // praise: PRAISE, one at random (state.js praise())
  bravo:          { ru: 'Браво!', de: 'Bravo!' },
  right:          { ru: 'Правильно!', de: 'Richtig!' },
  great:          { ru: 'Отлично!', de: 'Toll!' },
  super:          { ru: 'Супер!', de: 'Super!' },
  // games (pairs.js, race.js, lines.js)
  remember:       { ru: 'Запомни!', de: 'Merk dir das!' },
  findPairs:      { ru: 'Найди парочки!', de: 'Finde die Paare!' },
  raceTap:        { ru: 'Жми на кнопку, чтобы ехать быстрее!', de: 'Drück auf den Knopf, dann fährst du schneller!' },
  raceCoins:      { ru: 'Собирай монеты!', de: 'Sammle Münzen!' },
  finish:         { ru: 'Финиш!', de: 'Ziel!' },
  firstPlace:     { ru: 'Первое место!', de: 'Erster Platz!' },
  linesGo:        { ru: 'Собери шарики одного цвета в ряд!', de: 'Leg Kugeln mit der gleichen Farbe in eine Reihe!' },
  linesOrder:     { ru: 'Поставь шарики по порядку, чтобы получилось слово!', de: 'Leg die Kugeln der Reihe nach, dann wird daraus ein Wort!' },
  tapBall:        { ru: 'Нажми на шарик!', de: 'Tipp auf eine Kugel!' },
  whereTo:        { ru: 'А теперь — куда его поставить!', de: 'Und jetzt: Wohin damit?' },
  // album and stickers (album.js)
  newAlbum:       { ru: 'И новый альбом!', de: 'Und ein neues Album!' },
  moreCoins:      { ru: 'Ещё немного монет! Пойдём играть?', de: 'Noch ein paar Münzen! Spielen wir?' },
  setDone:        { ru: 'Весь набор собран!', de: 'Das ganze Set ist komplett!' },
  cup:            { ru: 'Тебе кубок!', de: 'Ein Pokal für dich!' },
  // start and the parent zone (startup.js, parent.js)
  hello:          { ru: 'Привет!', de: 'Hallo!' },
  whoPlays:       { ru: 'Кто играет?', de: 'Wer spielt?' },
  gift:           { ru: 'Монетки тебе в подарок!', de: 'Ein Geschenk für dich: Münzen!' },   // no "пришёл": the child may be a girl (2026-11-14)
  test:           { ru: 'Привет! Это проверка.', de: 'Hallo! Das ist ein Test.' },
  // with the grown-up: a function of the forms of ADDRESS (f.call: whom to call, f.show: whom to show)
  showParent:     { ru: f => `Покажи ${f.show}!`, de: f => `Zeig es ${f.show}!` },
  sleep:          { ru: f => `Стикеры спят. Позови ${f.call}, чтобы поиграть ещё.`, de: f => `Die Sticker schlafen. Ruf ${f.call}, dann kannst du weiterspielen.` },
  forAdults:      { ru: f => `Это для взрослых. Позови ${f.call}!`, de: f => `Das ist für Erwachsene. Ruf ${f.call}!` },
  callShow:       { ru: f => `Позови ${f.call}! Покажи ${f.show}!`, de: f => `Ruf ${f.call}! Zeig es ${f.show}!` },
};
export const PRAISE = ['bravo', 'right', 'great', 'super'];

// Who the child is told to call (SPEC 3.10, "Имя родителя"): '' = "mom or dad", 'custom' = the forms the grown-up typed.
export const WHO = ['', 'mom', 'dad', 'grandma', 'grandpa'];
// The grown-up in the forms each language needs: `call` ("позови маму") and `show` ("покажи маме"). A language whose
// two forms are one word ("call Mom", "show Mom") lists only `call` in `fields`; `show` then is the same.
// fields: the boxes for 'custom' in the parent zone: [the line around the box, an example].
export const ADDRESS = {
  ru: {
    fields: { call: ['Позови …', 'тётю'], show: ['Покажи …', 'тёте'] },
    who: {
      '':      { call: 'маму или папу', show: 'маме или папе' },
      mom:     { call: 'маму',          show: 'маме' },
      dad:     { call: 'папу',          show: 'папе' },
      grandma: { call: 'бабушку',       show: 'бабушке' },
      grandpa: { call: 'дедушку',       show: 'дедушке' },
    },
  },
  // German: no article before Mama, Papa, Oma, Opa (standard German: "Ruf Mama!", "Zeig es Mama!"), so a typed name
  // ("Ruf Anna!") sounds the same and one form serves both lines (TASKS 4б.3). Southern German and Austrian "der Mama"
  // would need a second form; to be checked by a native speaker (4б.6).
  de: {
    fields: { call: ['Ruf …', 'Tante Anna'] },
    who: {
      '':      { call: 'Mama oder Papa', show: 'Mama oder Papa' },
      mom:     { call: 'Mama',           show: 'Mama' },
      dad:     { call: 'Papa',           show: 'Papa' },
      grandma: { call: 'Oma',            show: 'Oma' },
      grandpa: { call: 'Opa',            show: 'Opa' },
    },
  },
};

// The languages a line is looked for in: the child's, then English, then Russian (the one every line has today).
export const chainOf = lang => [...new Set([lang, 'en', 'ru'])];
// the language whose forms of the grown-up are used, and asked for in the parent zone
export const addressLang = lang => chainOf(lang).find(l => ADDRESS[l]) || 'ru';
// the forms in a language; `parent`: { who, call, show } of the child's settings (custom forms count only in addressLang)
export function formsOf(lang, parent = {}) {
  const a = ADDRESS[lang]; if (!a) return null;
  if (parent.who === 'custom' && parent.call && lang === addressLang(parent.lang || lang))
    return { call: parent.call, show: parent.show || parent.call };
  return a.who[parent.who] || a.who[''];
}
// [text, lang] of a line for a child; null when no language has it
export function phrase(id, lang, parent = {}) {
  const p = PHRASES[id];
  if (!p) throw new Error('no phrase ' + id);
  for (const l of chainOf(lang)) {
    const t = p[l];
    if (t == null) continue;
    if (typeof t !== 'function') return [t, l];
    const f = formsOf(l, { ...parent, lang });
    if (f) return [t(f), l];
  }
  return null;
}
// every text of every language, in all the forms of the grown-up the settings offer (app/voice.js records them;
// the custom forms are read by the device's voice)
export function allPhrases() {
  const out = [];
  Object.values(PHRASES).forEach(p => Object.entries(p).forEach(([l, t]) => {
    if (typeof t !== 'function') { out.push([l, t]); return; }
    const a = ADDRESS[l];
    if (a) Object.values(a.who).forEach(f => out.push([l, t(f)]));
  }));
  return out;
}

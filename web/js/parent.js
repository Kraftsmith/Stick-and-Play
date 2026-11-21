// The parent zone behind the code: settings, progress, testing tools; also the 15-minute extension from the sleep screen.
import { $ } from './stage.js';
import { U } from './session.js';
import { S, save, detach, resetAll, nextIdx, doneCount, learnedWords, learnedLetters, uniqueOwned,
  useProfile, profileId, newProfile, profileCards, freeAvatar, avatarPic, deviceLang, AVATARS, LANGS } from './state.js';
import { Profiles, MAX_PROFILES } from './profiles.js';
import { enterHome, showWho, bootLog } from './startup.js';
import { TRACKS, LETTERS, WORDS, STICKER_N } from './data.js';
import { pick, esc } from './util.js';
import { say, ph, en, sfx, music, ttsState, renderMute, tagOf } from './audio.js';
import { NTTS, isNative, installed, isIOS, canInstall, install, storage, storageCheck } from './platform.js';
import { renderCoins, renderHello } from './ui.js';
import { go, onEnter } from './nav.js';
import { startAt } from './lessons.js';
import { voicesHtml, bindVoices } from './voicelist.js';
import { WHO, ADDRESS, addressLang } from './phrases.js';
import { langPick, wireLangPick } from './langpick.js';
import { Cloud } from './cloud.js';
import { mountAccount } from './account.js';
import { saveBackupFile, readBackup, restoreBackup } from './backup.js';
import { Premium, FREE } from './premium.js';
import { mountPremium, premiumText } from './paywall.js';

/* ================= texts ================= */
// The Settings and Progress tabs and the lock, for the grown-up, never spoken (TASKS 4.7). The language is the child's
// language of the instructions, like account.js and paywall.js; a text missing in a language is the English one.
// Testing is for the developer and stays in English.
const T = {
  en: {
    tap: 'Tap in order:', settings: 'Settings', progress: 'Progress', testing: 'Testing',
    children: 'Children', changePic: 'Change the picture', noName: 'No name', name: 'Name', words: n => `${n} words`, playingNow: 'playing now',
    switchTo: 'Switch', del: 'Delete', instructions: 'Instructions:', callsYou: 'Child calls you:', add: 'Add', cancel: 'Cancel',
    addChild: '+ Add a child', most: n => `${n} children at most`, freeOne: n => `The free plan is for one child. Premium opens up to ${n}.`,
    who: { '': 'Mom or Dad', mom: 'Mom', dad: 'Dad', grandma: 'Grandma', grandpa: 'Grandpa', custom: 'Other' },
    listen: 'Listen',
    askWho: 'Who plays at the start:', ask: { kids: 'Children choose', parent: 'Ask for the parent code', never: 'Do not ask' },
    askNote: 'The “Who’s playing?” screen is shown every time the app starts. “Do not ask” opens the child who played last.',
    delAsk: name => `Delete ${name || 'this child'}? The stickers and albums will be gone.`,
    fileErr: {
      big: 'This file is too large to be a saved progress.',
      unreadable: 'This file cannot be read. Choose a file saved here with “Save progress to a file”.',
      foreign: 'This is not a Stick & Play progress file.',
      newer: 'This file was saved by a newer version of the game. Update the game and try again.',
      empty: 'There are no children in this file.',
      room: 'There is no room on this device to put the current progress aside. Nothing was changed.',
    },
    homeIOS: '<b>Add the game to the Home Screen.</b> Safari deletes the progress of a site that was not opened for 7 days; a game on the Home Screen is kept. In Safari: the Share button, then “Add to Home Screen”. The game on the Home Screen starts empty: save the progress to a file here first and load it there.',
    homeAndroid: '<b>Add the game to the Home screen.</b> It opens full screen, like an app, and keeps the same progress.',
    homeBtn: 'Add to Home screen', homeMenu: 'In the browser menu (⋮): “Add to Home screen” or “Install app”.',
    deviceH: 'Progress on this device',
    deviceNote: acct => `The progress is kept in this browser on this device${acct ? ', and a copy in your account' : ''}. Clearing the site data, another browser or another address starts an empty game.`,
    fsave: 'Save progress to a file', fload: 'Load from a file',
    fileNote: 'The file holds every child on this device. Keep it as a spare copy or load it on another device.',
    saveFail: 'The file could not be saved.', shared: 'The file is ready: choose where to keep it.', saved: 'Saved to the downloads of this device.',
    loadAsk: (date, kids) => `Replace the progress on this device with the file${date ? ' saved on ' + date : ''}?\n\nIn the file: ${kids}.\nWhat is on this device now is put aside for 30 days.`,
    lvl1: 'Level 1: words', lvl2: 'Level 2: letters', lvl3: 'Level 3: letter teams', of: (d, n) => `${d} of ${n}`, now: l => `now: ${l}`, allDone: 'all done',
    correct: 'Correct answers', engWords: (d, n) => `English words (${d} of ${n})`, letters: (d, n) => `Letters (${d} of ${n})`,
    mistakes: 'Frequent mistakes', puzzles: 'Puzzles solved', pairs: 'Pairs games', lines: 'Lines games', linesN: (g, w) => `${g} (${w} words)`,
    races: 'Races', racesN: (r, w) => `${r} (first in ${w})`, stickers: 'Stickers collected', today: 'Time today', min: n => `${n} min`,
    music: 'Music volume:', voice: 'Voice volume:', off: 'off', hints: 'Spoken hints in lessons:', on: 'on',
    hintsNote: 'off: no spoken instructions, only English words and praise',
    voiceOf: 'Voice:', test: 'Test', installVoices: 'Install voices', browserSpeech: 'browser speech',
    limit: 'Daily limit:', noLimit: 'no limit', privacy: 'Privacy Policy', delAcc: 'Delete account', langNames: { ru: 'Russian', en: 'English', uk: 'Ukrainian', de: 'German', fr: 'French', es: 'Spanish' },
    title: 'For Parents', sleepy: 'The stickers are sleepy.<br>Come back tomorrow!', keepOn: 'Keep learning +15 min',
  },
  // German (TASKS 4б.4): the grown-up is "Sie", as on the account and payment screens
  de: {
    tap: 'Tippen Sie der Reihe nach:', settings: 'Einstellungen', progress: 'Fortschritt',
    children: 'Kinder', changePic: 'Bild ändern', noName: 'Ohne Namen', name: 'Name', words: n => `${n} Wörter`, playingNow: 'spielt gerade',
    switchTo: 'Wechseln', del: 'Löschen', instructions: 'Anleitungen:', callsYou: 'Das Kind nennt Sie:', add: 'Hinzufügen', cancel: 'Abbrechen',
    addChild: '+ Kind hinzufügen', most: n => `Höchstens ${n} Kinder`, freeOne: n => `Die kostenlose Version ist für ein Kind. Mit Premium bis zu ${n}.`,
    who: { '': 'Mama oder Papa', mom: 'Mama', dad: 'Papa', grandma: 'Oma', grandpa: 'Opa', custom: 'Andere' },
    listen: 'Anhören',
    askWho: 'Wer spielt, beim Start:', ask: { kids: 'Kinder wählen', parent: 'Eltern-Code abfragen', never: 'Nicht fragen' },
    askNote: 'Der Bildschirm „Wer spielt?“ erscheint bei jedem Start der App. „Nicht fragen“ öffnet das Kind, das zuletzt gespielt hat.',
    delAsk: name => `${name || 'Dieses Kind'} löschen? Die Sticker und Alben gehen verloren.`,
    fileErr: {
      big: 'Diese Datei ist zu groß für einen gespeicherten Fortschritt.',
      unreadable: 'Diese Datei lässt sich nicht lesen. Wählen Sie eine Datei, die hier mit „Fortschritt in Datei speichern“ gesichert wurde.',
      foreign: 'Das ist keine Fortschrittsdatei von Stick & Play.',
      newer: 'Diese Datei stammt aus einer neueren Version des Spiels. Aktualisieren Sie das Spiel und versuchen Sie es erneut.',
      empty: 'In dieser Datei sind keine Kinder.',
      room: 'Auf diesem Gerät ist kein Platz, um den aktuellen Fortschritt beiseitezulegen. Es wurde nichts geändert.',
    },
    homeIOS: '<b>Fügen Sie das Spiel zum Home-Bildschirm hinzu.</b> Safari löscht den Fortschritt einer Website, die 7 Tage lang nicht geöffnet wurde; ein Spiel auf dem Home-Bildschirm bleibt erhalten. In Safari: die Teilen-Taste, dann „Zum Home-Bildschirm“. Das Spiel auf dem Home-Bildschirm startet leer: Speichern Sie den Fortschritt zuerst hier in einer Datei und laden Sie ihn dort.',
    homeAndroid: '<b>Fügen Sie das Spiel zum Startbildschirm hinzu.</b> Es öffnet sich im Vollbild wie eine App und behält denselben Fortschritt.',
    homeBtn: 'Zum Startbildschirm', homeMenu: 'Im Browsermenü (⋮): „Zum Startbildschirm hinzufügen“ oder „App installieren“.',
    deviceH: 'Fortschritt auf diesem Gerät',
    deviceNote: acct => `Der Fortschritt wird in diesem Browser auf diesem Gerät gespeichert${acct ? ', eine Kopie in Ihrem Konto' : ''}. Wenn Sie die Website-Daten löschen, einen anderen Browser oder eine andere Adresse nutzen, beginnt das Spiel leer.`,
    fsave: 'Fortschritt in Datei speichern', fload: 'Aus Datei laden',
    fileNote: 'Die Datei enthält alle Kinder auf diesem Gerät. Bewahren Sie sie als Sicherung auf oder laden Sie sie auf einem anderen Gerät.',
    saveFail: 'Die Datei konnte nicht gespeichert werden.', shared: 'Die Datei ist bereit: Wählen Sie, wo sie gespeichert werden soll.', saved: 'In den Downloads dieses Geräts gespeichert.',
    loadAsk: (date, kids) => `Den Fortschritt auf diesem Gerät durch die Datei${date ? ' vom ' + date : ''} ersetzen?\n\nIn der Datei: ${kids}.\nWas jetzt auf diesem Gerät ist, wird 30 Tage lang aufbewahrt.`,
    lvl1: 'Level 1: Wörter', lvl2: 'Level 2: Buchstaben', lvl3: 'Level 3: Buchstabenteams', of: (d, n) => `${d} von ${n}`, now: l => `jetzt: ${l}`, allDone: 'alles geschafft',
    correct: 'Richtige Antworten', engWords: (d, n) => `Englische Wörter (${d} von ${n})`, letters: (d, n) => `Buchstaben (${d} von ${n})`,
    mistakes: 'Häufige Fehler', puzzles: 'Gelöste Puzzles', pairs: 'Paare-Spiele', lines: 'Reihen-Spiele', linesN: (g, w) => `${g} (${w} Wörter)`,
    races: 'Rennen', racesN: (r, w) => `${r} (${w}× Erster)`, stickers: 'Gesammelte Sticker', today: 'Zeit heute', min: n => `${n} Min.`,
    music: 'Musik:', voice: 'Stimme:', off: 'aus', hints: 'Gesprochene Hinweise:', on: 'an',
    hintsNote: 'aus: keine gesprochenen Anleitungen, nur englische Wörter und Lob',
    voiceOf: 'Stimme des Geräts:', test: 'Testen', installVoices: 'Stimmen installieren', browserSpeech: 'Sprachausgabe des Browsers',
    limit: 'Tageslimit:', noLimit: 'kein Limit', privacy: 'Datenschutzerklärung', delAcc: 'Konto löschen', langNames: { ru: 'Russisch', en: 'Englisch', uk: 'Ukrainisch', de: 'Deutsch', fr: 'Französisch', es: 'Spanisch' },
    title: 'Für Eltern', sleepy: 'Die Sticker sind müde.<br>Bis morgen!', keepOn: 'Weiterlernen +15 Min.',
  },
  // French (TASKS 4в.4): the grown-up is "vous", as on the account and payment screens
  fr: {
    tap: 'Touchez dans l’ordre :', settings: 'Réglages', progress: 'Progrès',
    children: 'Enfants', changePic: 'Changer l’image', noName: 'Sans nom', name: 'Prénom', words: n => `${n} mots`, playingNow: 'joue en ce moment',
    switchTo: 'Passer à', del: 'Supprimer', instructions: 'Consignes :', callsYou: 'L’enfant vous appelle :', add: 'Ajouter', cancel: 'Annuler',
    addChild: '+ Ajouter un enfant', most: n => `${n} enfants au maximum`, freeOne: n => `La version gratuite est pour un enfant. Premium en permet jusqu’à ${n}.`,
    who: { '': 'Maman ou Papa', mom: 'Maman', dad: 'Papa', grandma: 'Mamie', grandpa: 'Papi', custom: 'Autre' },
    listen: 'Écouter',
    askWho: 'Au démarrage, qui joue :', ask: { kids: 'Les enfants choisissent', parent: 'Demander le code parent', never: 'Ne pas demander' },
    askNote: 'L’écran « Qui joue ? » s’affiche à chaque démarrage. « Ne pas demander » ouvre l’enfant qui a joué en dernier.',
    delAsk: name => `Supprimer ${name || 'cet enfant'} ? Les stickers et les albums seront perdus.`,
    fileErr: {
      big: 'Ce fichier est trop gros pour être une progression enregistrée.',
      unreadable: 'Ce fichier ne peut pas être lu. Choisissez un fichier enregistré ici avec « Enregistrer la progression dans un fichier ».',
      foreign: 'Ce n’est pas un fichier de progression de Stick & Play.',
      newer: 'Ce fichier vient d’une version plus récente du jeu. Mettez le jeu à jour et réessayez.',
      empty: 'Ce fichier ne contient aucun enfant.',
      room: 'Il n’y a pas assez de place sur cet appareil pour mettre de côté la progression actuelle. Rien n’a été modifié.',
    },
    homeIOS: '<b>Ajoutez le jeu à l’écran d’accueil.</b> Safari efface la progression d’un site qui n’a pas été ouvert depuis 7 jours ; un jeu sur l’écran d’accueil est conservé. Dans Safari : le bouton Partager, puis « Sur l’écran d’accueil ». Le jeu sur l’écran d’accueil démarre vide : enregistrez d’abord la progression dans un fichier ici, puis chargez-la là-bas.',
    homeAndroid: '<b>Ajoutez le jeu à l’écran d’accueil.</b> Il s’ouvre en plein écran, comme une application, et garde la même progression.',
    homeBtn: 'Ajouter à l’écran d’accueil', homeMenu: 'Dans le menu du navigateur (⋮) : « Ajouter à l’écran d’accueil » ou « Installer l’application ».',
    deviceH: 'Progression sur cet appareil',
    deviceNote: acct => `La progression est enregistrée dans ce navigateur, sur cet appareil${acct ? ', avec une copie dans votre compte' : ''}. Si vous effacez les données du site, changez de navigateur ou d’adresse, le jeu repart de zéro.`,
    fsave: 'Enregistrer la progression dans un fichier', fload: 'Charger depuis un fichier',
    fileNote: 'Le fichier contient tous les enfants de cet appareil. Gardez-le comme copie de secours ou chargez-le sur un autre appareil.',
    saveFail: 'Le fichier n’a pas pu être enregistré.', shared: 'Le fichier est prêt : choisissez où le garder.', saved: 'Enregistré dans les téléchargements de cet appareil.',
    loadAsk: (date, kids) => `Remplacer la progression de cet appareil par le fichier${date ? ' du ' + date : ''} ?\n\nDans le fichier : ${kids}.\nCe qui est sur cet appareil maintenant est mis de côté pendant 30 jours.`,
    lvl1: 'Niveau 1 : mots', lvl2: 'Niveau 2 : lettres', lvl3: 'Niveau 3 : groupes de lettres', of: (d, n) => `${d} sur ${n}`, now: l => `en cours : ${l}`, allDone: 'tout est fait',
    correct: 'Bonnes réponses', engWords: (d, n) => `Mots anglais (${d} sur ${n})`, letters: (d, n) => `Lettres (${d} sur ${n})`,
    mistakes: 'Erreurs fréquentes', puzzles: 'Puzzles terminés', pairs: 'Parties de paires', lines: 'Parties de boules', linesN: (g, w) => `${g} (${w} mots)`,
    races: 'Courses', racesN: (r, w) => `${r} (${w} fois premier)`, stickers: 'Stickers collectés', today: 'Temps aujourd’hui', min: n => `${n} min`,
    music: 'Musique :', voice: 'Voix :', off: 'non', hints: 'Consignes parlées :', on: 'oui',
    hintsNote: 'non : pas de consignes parlées, seulement les mots anglais et les félicitations',
    voiceOf: 'Voix de l’appareil :', test: 'Tester', installVoices: 'Installer des voix', browserSpeech: 'synthèse vocale du navigateur',
    limit: 'Limite par jour :', noLimit: 'sans limite', privacy: 'Politique de confidentialité', delAcc: 'Supprimer le compte', langNames: { ru: 'russe', en: 'anglais', uk: 'ukrainien', de: 'allemand', fr: 'français', es: 'espagnol' },
    title: 'Pour les parents', sleepy: 'Les stickers ont sommeil.<br>À demain !', keepOn: 'Continuer +15 min',
  },
};
// the screen when the time of the day is used up: its line and the button for the grown-up (album.js)
export function labelSleep() {
  const t = tx();
  document.querySelector('.sleepmsg .t').innerHTML = t.sleepy;
  const b = $('keepon'); b.lastChild.textContent = ' ' + t.keepOn;
}
// the site's pages for the grown-up (Google Play wants the privacy policy reachable from inside the app)
const LEGAL = 'https://stickandplay.kids/';
const tx = () => { const t = T[S.lang]; return t ? { ...T.en, ...t } : T.en; };

/* ================= parent ================= */
let code = [], entered = [], parentTab = 'settings';
let fileNote = null;   // the line under the backup buttons: { text, bad }
let avEdit = null, adding = null, showBoot = false, showVoices = false, cloudDoc = null;   // the Children block: whose picture is being chosen, the new child's form
// a lock on the child's side (a lesson or a sticker outside the free plan) leads here: the parent code, then the tab
export function openParent(tab) { parentTab = tab; go('parent'); }
// sleep screen: a grown-up enters the code and the child gets 15 more minutes today
$('keepon').onclick = () => { sfx.pop(); U.parentThen = 'extend'; go('parent'); };
const NAMES = ['zero','one','two','three','four','five','six','seven','eight','nine'];
function renderParent() {
  $('lockpad').style.display = 'block'; $('pstats').style.display = 'none';
  code = pick([1,2,3,4,5,6,7,8,9], 3); entered = [];
  say(ph('forAdults'));
  $('lockpad').firstElementChild.firstChild.textContent = tx().tap + ' ';
  document.querySelector('#parent .title').textContent = tx().title;
  $('lockcode').textContent = code.map(n => NAMES[n]).join(', ');
  $('keys').innerHTML = [1,2,3,4,5,6,7,8,9,0].map(n => `<button data-n="${n}">${n}</button>`).join('');
  $('keys').querySelectorAll('button').forEach(b => b.onclick = () => {
    entered.push(+b.dataset.n);
    if (entered[entered.length - 1] !== code[entered.length - 1]) { entered = []; sfx.no(); return; }
    if (entered.length === 3) {
      // the code was asked for something else: a child chosen on "Who's playing?"
      if (typeof U.parentThen === 'function') { const then = U.parentThen; U.parentThen = null; then(); return; }
      if (U.parentThen === 'extend') {
        U.parentThen = null; S.usedMs = Math.max(0, S.limit * 60000 - 15 * 60000); save();
        U.pathTr = 'main'; go('path'); return;
      }
      showStats();
    }
  });
}
// Settings: the children on this device (cloud-sync.md 4.6, startup.md 3.5)
function kidsHtml() {
  const t = tx(), kids = profileCards(), many = kids.length > 1, ask = Profiles.device().askWho;
  const pics = (sel, attr) => `<div class="pavs">${AVATARS.map(a => `<button ${attr}="${a}" class="${a === sel ? 'on' : ''}">${avatarPic(a)}</button>`).join('')}</div>`;
  return `<div class="pkids"><div class="ph">${t.children}</div>
    ${kids.map(k => `<div class="pkid ${k.playing ? 'cur' : ''}">
      <button class="pav" data-av="${k.id}" title="${t.changePic}">${avatarPic(k.avatar)}</button>
      <input type="text" data-name="${k.id}" maxlength="12" placeholder="${t.noName}" value="${esc(k.name)}">
      <span class="pklang">${langPick(k.lang, `data-lid="${k.id}"`)}</span>
      <span class="pkw">${t.words(k.words)}</span>
      ${k.playing ? `<b class="pknow">${t.playingNow}</b>` : `<button data-sw="${k.id}">${t.switchTo}</button>`}
      ${many ? `<button class="pkdel" data-del="${k.id}">${t.del}</button>` : ''}
      ${avEdit === k.id ? pics(k.avatar, `data-id="${k.id}" data-pick`) : ''}
    </div>`).join('')}
    ${adding ? `<div class="pkid new">
        <input type="text" id="akname" maxlength="12" placeholder="${t.name}" value="${esc(adding.kidName)}">
        <span class="pkrow">${t.instructions} ${langPick(adding.lang)}</span>
        <span class="pkrow">${t.callsYou} ${WHO.map(k => `<button data-aw="${k}" class="${adding.parentWho === k ? 'on' : ''}">${t.who[k]}</button>`).join('')}</span>
        ${pics(adding.avatar, 'data-apick')}
        <span class="pkrow"><button class="on" id="akadd">${t.add}</button><button id="akcancel">${t.cancel}</button></span>
      </div>`
      : kids.length >= MAX_PROFILES ? `<span class="pnote">${t.most(MAX_PROFILES)}</span>`
      : Premium.canAddProfile(kids.length) ? `<button id="kadd">${t.addChild}</button>`
      : `<span class="pnote">${t.freeOne(MAX_PROFILES)}</span><button id="kprem">${premiumText(S.lang).tab}</button>`}
    ${many ? `<div class="pkrow pkask">${t.askWho} ${Object.entries(t.ask)
        .map(([k, l]) => `<button data-ask="${k}" class="${ask === k ? 'on' : ''}">${l}</button>`).join('')}
        <span class="pnote">${t.askNote}</span></div>` : ''}
  </div>`;
}
function kidsWire(p) {
  const q = sel => p.querySelectorAll(sel);
  q('[data-name]').forEach(i => i.oninput = () => {
    const id = i.dataset.name, name = i.value.trim();
    if (id === profileId()) { S.kidName = name; save(); renderHello(); } else Profiles.setLocal(id, { kidName: name });
  });
  q('[data-av]').forEach(b => b.onclick = () => { avEdit = avEdit === b.dataset.av ? null : b.dataset.av; showStats(); });
  q('[data-pick]').forEach(b => b.onclick = () => {
    const id = b.dataset.id;
    if (id === profileId()) { S.avatar = b.dataset.pick; save(); } else { Profiles.patch(id, { avatar: b.dataset.pick }); Cloud.markDirty(id); }
    avEdit = null; showStats();
  });
  q('[data-sw]').forEach(b => b.onclick = () => { sfx.pop(); enterHome(b.dataset.sw); });
  // the language of each child (startup.md 3.5): the playing child hears it from the next line, and this zone turns to
  // it at once; another child's profile keeps it for its next game. The list of the new child's form is the other one.
  wireLangPick(p, (pick, l) => {
    const id = pick.dataset.lid;
    if (!id) { adding.lang = l; showStats(); return; }
    if (id === profileId()) { S.lang = l; save(); renderHello(); }
    else { Profiles.patch(id, { lang: l }); Cloud.markDirty(id); }
    showStats();
  });
  q('[data-del]').forEach(b => b.onclick = () => {
    const id = b.dataset.del, kid = profileCards().find(k => k.id === id);
    if (!confirm(tx().delAsk(kid.name))) return;
    const wasPlaying = id === profileId();
    if (Profiles.list().length > 1) Cloud.forget(id);   // with an account the child is deleted in the cloud too, and on the family's other devices
    if (!Profiles.remove(id)) return;
    if (wasPlaying) { useProfile(Profiles.current()); renderHello(); renderCoins(); renderMute(); }
    avEdit = null; showStats();
  });
  if ($('kprem')) $('kprem').onclick = () => { parentTab = 'premium'; showStats(); };
  if ($('kadd')) $('kadd').onclick = () => { adding = { kidName: '', lang: S.lang || deviceLang(), parentWho: S.parentWho || '', avatar: freeAvatar() }; showStats(); };
  if (adding) {
    $('akname').oninput = e => { adding.kidName = e.target.value.trim(); };
    q('[data-aw]').forEach(b => b.onclick = () => { adding.parentWho = b.dataset.aw; showStats(); });
    q('[data-apick]').forEach(b => b.onclick = () => { adding.avatar = b.dataset.apick; showStats(); });
    $('akadd').onclick = () => { newProfile(adding); adding = null; Cloud.onProfile(); showStats(); };
    $('akcancel').onclick = () => { adding = null; showStats(); };
  }
  q('[data-ask]').forEach(b => b.onclick = () => { Profiles.setDevice({ askWho: b.dataset.ask }); showStats(); });
}
// Settings: where the progress lives and how to keep it (startup.md 5.1). Web only: the native apps keep the saved
// game in their own storage, and a WebView cannot hand a file over.
function deviceHtml() {
  if (isNative) return '';
  const t = tx(), touch = matchMedia('(pointer: coarse)').matches;
  // the hint is for a game played in a browser tab on a phone or tablet
  const home = installed || !touch ? '' : isIOS
    ? `<div class="pnote phome">${t.homeIOS}</div>`
    : `<div class="pnote phome">${t.homeAndroid} ${canInstall() ? `<button id="pinstall">${t.homeBtn}</button>` : t.homeMenu}</div>`;
  return `<div class="pkids pdev"><div class="ph">${t.deviceH}</div>
    <div class="pnote">${t.deviceNote(!!Cloud.account())}</div>
    ${home}
    <div class="pkrow"><button id="fsave">${t.fsave}</button><button id="fload">${t.fload}</button>
      <input type="file" id="ffile" accept="application/json,.json" hidden></div>
    <div class="pnote">${t.fileNote}</div>
    ${fileNote ? `<div class="pnote ${fileNote.bad ? 'pbad' : 'pgood'}">${esc(fileNote.text)}</div>` : ''}</div>`;
}
function deviceWire() {
  if (isNative) return;
  if ($('pinstall')) $('pinstall').onclick = () => install().then(() => showStats());
  $('fsave').onclick = async () => {
    save();
    const how = await saveBackupFile().catch(() => 'failed');
    const t = tx();
    fileNote = how === 'cancelled' ? null : how === 'failed' ? { text: t.saveFail, bad: true } : { text: how === 'shared' ? t.shared : t.saved };
    showStats();
  };
  $('fload').onclick = () => $('ffile').click();
  $('ffile').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    const got = readBackup(await f.text().catch(() => null));
    const t = tx();
    if (got.error) { fileNote = { text: t.fileErr[got.error], bad: true }; showStats(); return; }
    const kids = got.kids.map(n => n || t.noName).join(', ');
    if (!confirm(t.loadAsk(got.date, kids))) { e.target.value = ''; return; }
    save();
    if (!restoreBackup(got.file, !!Cloud.account())) { fileNote = { text: t.fileErr.room, bad: true }; showStats(); return; }
    detach(); location.reload();
  };
}
// Testing: what the last cold start did (startup.md 10)
const kb = n => n == null ? '?' : n < 1e6 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(n < 1e9 ? 1 : 0) + ' MB';
function bootHtml() {
  const r = bootLog.route || {};
  return `<table class="pboot">
    <tr><td>Started</td><td>${bootLog.at} · launch screen left at ${bootLog.splashMs} ms</td></tr>
    <tr><td>Route</td><td>${r.screen || '—'}${r.profileId ? ' · ' + r.profileId.slice(0, 8) : ''}</td></tr>
    <tr><td>Address</td><td>${esc(location.origin + location.pathname)} · ${isNative ? 'native app' : installed ? 'from the Home screen' : 'browser tab'}</td></tr>
    <tr><td>Persistent storage</td><td>${storage.persisted == null ? 'the browser does not say' : storage.persisted ? 'granted: the browser keeps the progress when space runs low' : 'not granted: the browser may delete the progress'}</td></tr>
    <tr><td>Storage used</td><td>saved games ${kb(Profiles.size())} · the whole site ${kb(storage.usage)} of ${kb(storage.quota)}</td></tr>
    <tr><td>Cloud at the start</td><td>${bootLog.pull}</td></tr>
    <tr><td>Last pull</td><td>${Cloud.lastPull.at ? Cloud.lastPull.at + ' · ' : ''}${Cloud.lastPull.text}${Cloud.sim() ? ' · simulating: ' + Cloud.sim() : ''}</td></tr>
    ${bootLog.profiles.map(b => `<tr><td>at the start: ${esc(b.name || 'No name')} · ${b.id.slice(0, 8)}</td><td>${b.action}</td></tr>`).join('')}
    ${Profiles.list().map(p => { const l = Profiles.load(p.id).local, c = Cloud.lastPull.rows[p.id];
      return `<tr><td>now: ${esc(l.kidName || 'No name')} · ${p.id.slice(0, 8)}</td><td>base v${l.baseVersion || 0} · cloud ${c ? 'v' + c.cloud : '—'} · ${l.dirty ? 'dirty' : 'clean'}${c ? ' · ' + c.action : ''}</td></tr>`; }).join('')}
  </table>`;
}
function showStats() {
  $('lockpad').style.display = 'none'; const p = $('pstats'); p.style.display = 'block'; const t = tx();
  document.querySelector('#parent .title').textContent = t.title;   // the language may have just changed
  const acc = S.stats.correct + S.stats.wrong ? Math.round(S.stats.correct / (S.stats.correct + S.stats.wrong) * 100) : 0;
  const words = learnedWords(), letters = learnedLetters().map(i => LETTERS[i][0]);
  const weak = Object.entries(S.stats.err).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k} (${n})`);
  const mins = Math.round(S.usedMs / 60000);
  const where = tr => { const i = nextIdx(tr), n = TRACKS[tr].lessons.length;
    return t.of(doneCount(tr), n) + ' · ' + (i < n ? t.now(TRACKS[tr].islands.find(is => is.idx.includes(i)).label) : t.allDone); };
  // "Unlock all" is there once the free plan has its locks (premium.js), and for a family that already has premium
  const prem = Premium.limitsOn() || Premium.state().kind !== 'free';
  if (parentTab === 'premium' && !prem) parentTab = 'settings';
  const TABS = [['settings', t.settings], ...(prem ? [['premium', premiumText(S.lang).tab]] : []), ['progress', t.progress], ['testing', t.testing]];
  const tabs = `<div class="ptabs">${TABS.map(([k, l]) => `<button data-pt="${k}" class="${parentTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const PROGRESS = `<table>
    <tr><td>${t.lvl1}</td><td>${where('main')}</td></tr>
    <tr><td>${t.lvl2}</td><td>${where('abc')}</td></tr>
    <tr><td>${t.lvl3}</td><td>${where('lvl2')}</td></tr>
    <tr><td>${t.correct}</td><td>${acc}%</td></tr>
    <tr><td>${t.engWords(words.length, WORDS.length)}</td><td style="font-weight:400;font-size:22px">${words.slice(-12).join(', ') || '—'}</td></tr>
    <tr><td>${t.letters(letters.length, LETTERS.length)}</td><td>${letters.join(' ') || '—'}</td></tr>
    <tr><td>${t.mistakes}</td><td style="font-weight:400;font-size:22px">${weak.join(', ') || '—'}</td></tr>
    <tr><td>${t.puzzles}</td><td>${S.stats.puzzles}</td></tr>
    <tr><td>${t.pairs}</td><td>${S.stats.pairs || 0}</td></tr>
    <tr><td>${t.lines}</td><td>${t.linesN(S.stats.lines || 0, S.stats.linesWords || 0)}</td></tr>
    <tr><td>${t.races}</td><td>${t.racesN(S.stats.races || 0, S.stats.raceWins || 0)}</td></tr>
    <tr><td>${t.stickers}</td><td>${t.of(uniqueOwned(), STICKER_N)}</td></tr>
    <tr><td>${t.today}</td><td>${t.min(mins)}</td></tr>
  </table>`;
  const TESTING = `<div class="ptime">For testing:
    <button id="gift">+100 coins</button>
    <button id="skip">+1 lesson</button>
    <button id="lv2">${S.lvl2open ? 'All levels open' : 'Open all levels'}</button>
    <button id="tryrace">Race</button>
    <button id="tlines1">Lines ★</button><button id="tlines2">Lines ★★</button><button id="tlines3">Lines ★★★</button><button id="tlines4">Lines sh·ch</button><button id="tlines5">Lines ai·oa</button><button id="tlines6">Lines in order</button>
    <button id="tup">Time is up</button>
    <button id="treset">Reset time</button>
    <button id="twho">Show “Who’s playing?”</button>
    <button id="tboot" class="${showBoot ? 'on' : ''}">Boot log</button>
    <button id="tvoices" class="${showVoices ? 'on' : ''}">Voices</button>
    <button id="reset">Reset everything</button></div>
  <div class="ptime">Free plan locks:
    ${[['', Premium.PAYWALL ? 'as released (on)' : 'as released (off)'], ['on', 'on'], ['free', 'on, as free'], ['premium', 'on, as premium']]
      .map(([k, l]) => `<button data-pay="${k}" class="${Premium.mode() === k ? 'on' : ''}">${l}</button>`).join('')}
    <span class="pnote">now: ${Premium.limitsOn() ? 'locks on' : 'locks off'} · ${Premium.state().kind} · lessons done ${Premium.lessonsDone()} of ${FREE.lessons} free</span></div>
  <div class="ptime">Cloud:
    <button id="csync">Sync now</button>
    <button id="cdoc" class="${cloudDoc ? 'on' : ''}">Show cloud doc</button>
    <button id="cconf">Force conflict</button>
    <button id="cnewer">Simulate: cloud newer</button>
    <button id="coff" class="${Cloud.sim() === 'offline' ? 'on' : ''}">Simulate: no network</button>
    <button id="crev" class="${Cloud.sim() === 'revoked' ? 'on' : ''}">Simulate: revoked</button>
    <span class="pnote">${Cloud.account() ? esc(Cloud.account().email) + ' · ' + Cloud.status().state : 'not signed in: sign in on the Settings tab'}</span></div>
  ${cloudDoc ? `<textarea class="vout" readonly>${esc(cloudDoc)}</textarea>` : ''}${showBoot ? bootHtml() : ''}${showVoices ? voicesHtml() : ''}`;
  // the custom forms of the grown-up: the boxes of the language whose forms the child hears (phrases.js ADDRESS)
  const fields = ADDRESS[addressLang(S.lang)].fields, box = (id, k, v) => fields[k]
    ? `«${esc(fields[k][0])}» <input type="text" id="${id}" maxlength="16" placeholder="${esc(fields[k][1])}" value="${esc(v || '')}">` : '';
  const SETTINGS = '<div id="paccount"></div>' + kidsHtml() + deviceHtml() + `<div class="ptime">${t.music} <input type="range" id="mvol" min="0" max="100" step="5" value="${S.musicVol}"><b id="mvoln">${S.musicVol ? S.musicVol + '%' : t.off}</b></div>
  <div class="ptime">${t.voice} <input type="range" id="vvol" min="0" max="100" step="10" value="${S.voiceVol}"><b id="vvoln">${S.voiceVol ? S.voiceVol + '%' : t.off}</b></div>
  <div class="ptime">${t.hints} <button id="hon" class="${S.hints ? 'on' : ''}">${t.on}</button><button id="hoff" class="${!S.hints ? 'on' : ''}">${t.off}</button>
    <span class="pnote">${t.hintsNote}</span></div>
  <div class="ptime">${t.callsYou} ${[...WHO, 'custom'].map(k => `<button data-pw="${k}" class="${S.parentWho === k ? 'on' : ''}">${t.who[k]}</button>`).join('')}</div>
  ${S.parentWho === 'custom' ? `<div class="ptime">${box('pacc', 'call', S.parentAcc)}
      ${box('pdat', 'show', S.parentDat)}<button id="plisten">${t.listen}</button></div>` : ''}
  <div class="ptime">${t.voiceOf} <span id="vstat">…</span> <button id="vtest">${t.test}</button>${NTTS ? ` <button id="vinst">${t.installVoices}</button>` : ''}</div>
  <div class="ptime">${t.limit} ${[15,20,30,0].map(m => `<button data-m="${m}" class="${S.limit === m ? 'on' : ''}">${m ? t.min(m) : t.noLimit}</button>`).join('')}</div>
  <div class="ptime plegal"><a href="${LEGAL}privacy/" target="_blank" rel="noopener">${t.privacy}</a><a href="${LEGAL}delete-account/" target="_blank" rel="noopener">${t.delAcc}</a></div>`;
  p.innerHTML = tabs + (parentTab === 'progress' ? PROGRESS : parentTab === 'testing' ? TESTING : parentTab === 'premium' ? '<div id="ppremium"></div>' : SETTINGS);
  p.querySelectorAll('[data-pt]').forEach(b => b.onclick = () => { parentTab = b.dataset.pt; showStats(); });
  p.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { S.limit = +b.dataset.m; save(); showStats(); });
  if (parentTab === 'premium') mountPremium($('ppremium'), { lang: S.lang, toSettings: () => { parentTab = 'settings'; showStats(); } });
  if (parentTab === 'testing') {
    p.querySelectorAll('[data-pay]').forEach(b => b.onclick = () => { Premium.setMode(b.dataset.pay); showStats(); });
    $('gift').onclick = () => { S.coins += 100; save(); renderCoins(); showStats(); };
    $('skip').onclick = () => { Object.keys(TRACKS).forEach(tr => { const i = nextIdx(tr); if (i < TRACKS[tr].lessons.length) S.prog[tr][i] = 'ok'; }); save(); showStats(); };
    $('tup').onclick = () => { if (!S.limit) S.limit = 15; S.usedMs = S.limit * 60000; save(); go('album'); };
    $('lv2').onclick = () => { S.lvl2open = true; save(); showStats(); };
    // the first circle of that game in a theme (level 1) or a group (level 2)
    const gameAt = (tr, n, g) => TRACKS[tr].islands[n].idx.find(i => TRACKS[tr].lessons[i].game === g);
    $('tryrace').onclick = () => startAt('main', gameAt('main', 0, 'race'), 'race');
    // the first lines of theme 1, 3 and 6: level 1, 2 and 3
    [[1, 0], [2, 2], [3, 5]].forEach(([n, t]) => { $('tlines' + n).onclick = () => startAt('main', gameAt('main', t, 'lines'), 'lines'); });
    // letter teams (level 3): group 1 and 4, a team on one ball; reading (not on a path yet): letters in order
    $('tlines4').onclick = () => startAt('lvl2', gameAt('lvl2', 0, 'lines'), 'lines');
    $('tlines5').onclick = () => startAt('lvl2', gameAt('lvl2', 3, 'lines'), 'lines');
    $('tlines6').onclick = () => startAt('main', gameAt('main', 5, 'lines'), 'lines', { order: true });
    $('treset').onclick = () => { S.usedMs = 0; save(); showStats(); };
    $('twho').onclick = () => showWho();
    $('tboot').onclick = () => { showBoot = !showBoot; showStats(); if (showBoot) storageCheck().then(() => { if (showBoot && parentTab === 'testing' && $('tboot')) showStats(); }); };
    $('tvoices').onclick = () => { showVoices = !showVoices; showStats(); };
    if (showVoices) bindVoices(p, showStats);
    $('reset').onclick = () => { if (confirm('Reset all progress?')) resetAll(); };
    // the cloud copy (cloud-sync.md 10, startup.md 10)
    $('csync').onclick = async () => { await Cloud.pull(); await Cloud.push(); showBoot = true; showStats(); };
    $('cdoc').onclick = async () => { cloudDoc = cloudDoc ? null : JSON.stringify(await Cloud.cloudDocs().catch(e => ({ error: e.message })), null, 1); showStats(); };
    $('cconf').onclick = async () => { await Cloud.forceConflict(); showBoot = true; showStats(); };
    $('cnewer').onclick = () => { Cloud.forgetVersions(); location.reload(); };
    $('coff').onclick = () => { Cloud.setSim(Cloud.sim() === 'offline' ? '' : 'offline'); showStats(); };
    $('crev').onclick = () => { Cloud.setSim(Cloud.sim() === 'revoked' ? '' : 'revoked'); showStats(); };
  }
  if (parentTab !== 'settings') return;
  $('mvol').oninput = e => { const v = +e.target.value; music.setVol(v); $('mvoln').textContent = v ? v + '%' : t.off; };
  $('vvol').oninput = e => { S.voiceVol = +e.target.value; save(); $('vvoln').textContent = S.voiceVol ? S.voiceVol + '%' : t.off; };
  $('vvol').onchange = () => say(ph('hello'), en('Hello!'));
  $('hon').onclick = () => { S.hints = true; save(); showStats(); };
  $('hoff').onclick = () => { S.hints = false; save(); showStats(); };
  kidsWire(p);
  deviceWire();
  // the parent's account; when the device joins or leaves one, the children around the block may have changed
  mountAccount($('paccount'), { onJoined: () => {
    if (!Profiles.has(profileId())) { useProfile(Profiles.list()[0].id); U.home = 'home'; }
    renderHello(); renderCoins(); renderMute(); showStats();
  } });
  p.querySelectorAll('[data-pw]').forEach(b => b.onclick = () => { S.parentWho = b.dataset.pw; save(); showStats(); });
  if ($('plisten')) {
    if ($('pacc')) $('pacc').oninput = e => { S.parentAcc = e.target.value.trim(); save(); };
    if ($('pdat')) $('pdat').oninput = e => { S.parentDat = e.target.value.trim(); save(); };
    $('plisten').onclick = () => say(ph('callShow'));
  }
  $('vtest').onclick =() => say(ph('test'), en('Hello! This is a test.'));
  if (NTTS) {
    $('vinst').onclick = () => NTTS.install().catch(() => {});
    // the device's voices for the child's language of the instructions and for English
    const ls = [...new Set([S.lang || 'en', 'en'])];
    Promise.all(ls.map(l => NTTS.supported(tagOf(l)).catch(() => false)))
      .then(ok => { $('vstat').textContent = ls.map((l, i) => `${t.langNames[l] || l} ${ok[i] ? '✓' : '✗'}`).join(' · ') + (ttsState.log ? ' · ' + ttsState.log : ''); });
  } else $('vstat').textContent = t.browserSpeech;
}
onEnter('parent', renderParent);

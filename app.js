(function () {
'use strict';

/* ==========================================================
   CONFIG
   ========================================================== */
const CFG = {
    REST_TRIGGER: 15000,
    REST_DURATION: 60,
    XP_PER_REP: 10,
    XP_CHALLENGE_BONUS: 50,
    CAL: { pushup: 0.36, pullup: 1.0, squat: 0.32, crunch: 0.25 },
    NAMES: { pushup: 'Отжимания', pullup: 'Подтягивания', squat: 'Приседания', crunch: 'Пресс' },
    ICONS: { pushup: '💪', pullup: '🏋️', squat: '🦵', crunch: '🔥' },
    CAMERA_GUIDE: {
        pushup: {
            tips: [
                'Расположите телефон сбоку, на расстоянии 1.5–2 метра',
                'Камера должна видеть вас целиком — от головы до ступней',
                'Поставьте телефон на пол, прислонив к стене или опоре',
                'Убедитесь, что в кадре нет посторонних людей'
            ],
            img: 'img/guide-pushup.png'
        },
        pullup: {
            tips: [
                'Расположите телефон спереди, на расстоянии 2–3 метра',
                'Камера должна видеть перекладину и ваше тело целиком',
                'Поставьте телефон на высоту ~1 метр (стол, стул)',
                'Убедитесь, что хорошее освещение спереди'
            ],
            img: 'img/guide-pullup.png'
        },
        squat: {
            tips: [
                'Расположите телефон сбоку, на расстоянии 2–2.5 метра',
                'Камера должна видеть вас целиком — от головы до ступней',
                'Высота камеры — на уровне пояса (стол, стул, полка)',
                'Встаньте боком к камере для лучшего распознавания'
            ],
            img: 'img/guide-squat.png'
        },
        crunch: {
            tips: [
                'Расположите телефон сбоку, на расстоянии 1.5–2 метра',
                'Камера должна видеть верхнюю часть тела и колени',
                'Поставьте телефон на пол — угол снизу идеален',
                'Лягте так, чтобы быть в центре кадра'
            ],
            img: 'img/guide-crunch.png'
        }
    },
    TUTORIALS: {
        pushup: {
            desc: 'Примите упор лёжа. Руки чуть шире плеч. Опуститесь, пока угол в локте не станет меньше 90°, затем поднимитесь до полного выпрямления рук.',
            tips: ['Держите корпус прямым — не прогибайте поясницу', 'Локти направлены назад, не в стороны', 'Полная амплитуда: грудь почти касается пола', 'Дышите: вниз — вдох, вверх — выдох']
        },
        pullup: {
            desc: 'Возьмитесь за перекладину хватом сверху. Из полного виса подтянитесь, пока подбородок не окажется выше перекладины.',
            tips: ['Начинайте из полного виса (руки выпрямлены)', 'Сводите лопатки в верхней точке', 'Опускайтесь плавно, без рывков', 'Не раскачивайтесь — работайте мышцами']
        },
        squat: {
            desc: 'Встаньте прямо, ноги на ширине плеч. Присядьте, пока бёдра не будут параллельны полу, затем вернитесь в исходное положение.',
            tips: ['Колени не выходят за носки', 'Спина остаётся прямой', 'Опускайтесь до параллели бёдер с полом', 'Упор на пятки, а не на носки']
        },
        crunch: {
            desc: 'Лягте на спину, колени согнуты. Поднимите верхнюю часть корпуса, напрягая пресс, затем плавно опуститесь.',
            tips: ['Не тяните себя руками за шею', 'Отрывайте лопатки от пола', 'Движение плавное, без рывков', 'Поясница прижата к полу']
        }
    },
    CHALLENGES: [
        { exercise: 'pushup', target: 30, label: '30 отжиманий за одну тренировку' },
        { exercise: 'squat',  target: 25, label: '25 приседаний без перерыва' },
        { exercise: 'pushup', target: 50, label: '50 отжиманий — настоящий марафон!' },
        { exercise: 'crunch', target: 40, label: '40 скручиваний — стальной пресс!' },
        { exercise: 'squat',  target: 40, label: '40 приседаний — ноги огонь!' },
        { exercise: 'pullup', target: 10, label: '10 подтягиваний — проверка силы' },
        { exercise: 'pushup', target: 20, label: '20 отжиманий с формой выше 70 баллов', minForm: 70 },
        { exercise: 'squat',  target: 15, label: '15 приседаний с идеальной формой', minForm: 80 }
    ],
    BADGES: [
        { id: 'first',      icon: '🎯', name: 'Первый шаг',         desc: 'Завершите первую тренировку' },
        { id: 'ten',         icon: '💪', name: 'Десятка',            desc: '10 повторений за сессию' },
        { id: 'fifty',       icon: '🔥', name: 'Полтинник',          desc: '50 повторений за сессию' },
        { id: 'hundred',     icon: '💯', name: 'Сотня',              desc: '100 повторений за сессию' },
        { id: 'total500',    icon: '🏃', name: 'Марафонец',          desc: '500 повторений за всё время' },
        { id: 'total1000',   icon: '🏆', name: 'Тысячник',           desc: '1000 повторений за всё время' },
        { id: 'streak3',     icon: '📅', name: 'Стабильность',       desc: '3 дня подряд' },
        { id: 'streak7',     icon: '⚡', name: 'Неделя силы',        desc: '7 дней подряд' },
        { id: 'streak30',    icon: '👑', name: 'Месяц дисциплины',   desc: '30 дней подряд' },
        { id: 'form90',      icon: '✨', name: 'Идеальная форма',    desc: 'Средняя форма > 90' },
        { id: 'record',      icon: '🥇', name: 'Рекордсмен',        desc: 'Побейте личный рекорд' },
        { id: 'calories100', icon: '🔋', name: 'Калориебой',         desc: 'Сожгите 100 ккал суммарно' },
        { id: 'allexercises',icon: '🎪', name: 'Многостаночник',     desc: 'Попробуйте все 4 упражнения' },
        { id: 'challenge',   icon: '🎲', name: 'Спринтер',           desc: 'Выполните ежедневный вызов' }
    ],
    LEVELS: (function () {
        const t = [0];
        for (let i = 1; i <= 50; i++) t.push(i * (i + 1) * 25);
        return t;
    })()
};

/* ==========================================================
   DOM REFS
   ========================================================== */
const $ = id => document.getElementById(id);
const DOM = {
    loading:       $('loading'),
    homeScreen:    $('home-screen'),
    appScreen:     $('app-screen'),
    cameraGuide:   $('camera-guide'),
    countdownOvl:  $('countdown-overlay'),
    countdownNum:  $('countdown-num'),
    xpFill:        $('xp-fill'),
    xpLevel:       $('xp-level'),
    xpText:        $('xp-text'),
    streakNum:     $('streak-num'),
    goalFill:      $('goal-fill'),
    goalLabel:     $('goal-label'),
    goalInput:     $('goal-input'),
    exerciseSel:   $('exercise-select'),
    video:         $('video'),
    canvas:        $('canvas'),
    confettiCvs:   $('confetti-canvas'),
    repCounter:    $('rep-counter'),
    formScore:     $('form-score'),
    formRingPath:  $('form-ring-path'),
    setsVal:       $('sets-val'),
    timerVal:      $('timer-val'),
    calVal:        $('cal-val'),
    symVal:        $('sym-val'),
    feedback:      $('feedback'),
    tempoPill:     $('tempo-pill'),
    partialWarn:   $('partial-warn'),
    fatigueHint:   $('fatigue-hint'),
    celebGoal:     $('celebration-goal'),
    celebLevel:    $('celebration-level'),
    levelUpText:   $('levelup-text'),
    badgePopup:    $('badge-popup'),
    badgePopIcon:  $('badge-popup-icon'),
    badgePopName:  $('badge-popup-name'),
    restOverlay:   $('rest-overlay'),
    restCountdown: $('rest-countdown'),
    cameraError:   $('camera-error'),
    // modals
    modalTutorial: $('modal-tutorial'),
    modalChallenge:$('modal-challenge'),
    modalResults:  $('modal-results'),
    modalHistory:  $('modal-history'),
    modalBadges:   $('modal-badges'),
    resultsBody:   $('results-body'),
    resultsTitle:  $('results-title'),
    shareCanvas:   $('share-canvas'),
    historyList:   $('history-list'),
    chartArea:     $('chart-area'),
    badgesGrid:    $('badges-grid'),
    challengeDesc: $('challenge-desc'),
    tutIcon:       $('tut-icon'),
    tutTitle:      $('tut-title'),
    tutDesc:       $('tut-desc'),
    tutTips:       $('tut-tips'),
};
const ctx = DOM.canvas.getContext('2d');
const confCtx = DOM.confettiCvs.getContext('2d');

/* ==========================================================
   STATE
   ========================================================== */
const S = {
    count: 0, stage: 'wait', sets: 1, totalCal: 0,
    isVoice: false, goal: 50, goalReached: false,
    facingMode: 'user', camera: null,
    workoutOn: false, workoutStart: 0,
    isResting: false, restInt: null, restSec: 60, autoRest: true,
    // form tracking
    minAngle: 180, bodyAngSum: 0, bodyAngN: 0,
    repScores: [], avgForm: 0,
    // symmetry
    leftAng: 0, rightAng: 0,
    // tempo
    repTimes: [], lastRepTS: Date.now(),
    // pullup
    startY: 0, minTravel: 0.15,
    // timer
    timerInt: null,
    // challenge
    challenge: null, challengeAccepted: false,
    // gamification (loaded from storage)
    xp: 0, level: 1, streak: 0,
    badges: [], totalReps: {}, exercisesUsed: [],
    totalCalAll: 0
};

/* ==========================================================
   STORAGE
   ========================================================== */
const LS = {
    _k: 'ait_',
    get(k)    { try { return JSON.parse(localStorage.getItem(this._k + k)); } catch { return null; } },
    set(k, v) { localStorage.setItem(this._k + k, JSON.stringify(v)); },
    remove(k) { localStorage.removeItem(this._k + k); }
};

function loadProfile() {
    S.xp            = LS.get('xp')            || 0;
    S.badges        = LS.get('badges')        || [];
    S.totalReps     = LS.get('totalReps')     || {};
    S.exercisesUsed = LS.get('exUsed')        || [];
    S.totalCalAll   = LS.get('totalCal')      || 0;
    const streakD   = LS.get('streak');
    if (streakD) {
        const today = dayKey();
        const yesterday = dayKey(-1);
        if (streakD.last === today || streakD.last === yesterday) {
            S.streak = streakD.count;
        } else {
            S.streak = 0;
        }
    }
    S.level = calcLevel(S.xp);
    S.goal = parseInt(DOM.goalInput.value) || parseInt($('home-goal-input').value) || 50;
    S.autoRest = LS.get('autoRest') !== false;
    const arToggle = $('home-autorest-toggle');
    if (arToggle) arToggle.checked = S.autoRest;
}

function saveProfile() {
    LS.set('xp',       S.xp);
    LS.set('badges',   S.badges);
    LS.set('totalReps',S.totalReps);
    LS.set('exUsed',   S.exercisesUsed);
    LS.set('totalCal', S.totalCalAll);
}

function dayKey(offset) {
    const d = new Date();
    if (offset) d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
}

/* ==========================================================
   AUDIO
   ========================================================== */
let audioCtx = null;
function beep(freq, dur) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = freq; o.type = 'sine';
        g.gain.setValueAtTime(0.12, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        o.start(); o.stop(audioCtx.currentTime + dur);
    } catch {}
}

/* ==========================================================
   SPEECH
   ========================================================== */
const synth = window.speechSynthesis;
let bestVoice = null;

function initVoices() {
    const voices = synth.getVoices();
    if (!voices.length) return;
    const ru = voices.filter(v => v.lang && (v.lang.startsWith('ru') || v.lang === 'ru-RU'));
    // Prefer high-quality cloud / online voices
    bestVoice = ru.find(v => /google/i.test(v.name))
             || ru.find(v => /microsoft.*online/i.test(v.name))
             || ru.find(v => /yandex/i.test(v.name))
             || ru.find(v => !v.localService)
             || ru[0] || null;
}
if (typeof synth.onvoiceschanged !== 'undefined') {
    synth.onvoiceschanged = initVoices;
}
initVoices();

function speak(text, opts) {
    if (!S.isVoice) return;
    synth.cancel();
    const o = opts || {};
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'ru-RU';
    u.rate  = o.rate  || 1.0;
    u.pitch = o.pitch || 1.0;
    u.volume = 0.85;
    if (bestVoice) u.voice = bestVoice;
    synth.speak(u);
}

/* ==========================================================
   GAMIFICATION
   ========================================================== */
function calcLevel(xp) {
    for (let i = CFG.LEVELS.length - 1; i >= 0; i--) {
        if (xp >= CFG.LEVELS[i]) return i + 1;
    }
    return 1;
}

function addXP(amount) {
    const oldLevel = S.level;
    S.xp += amount;
    S.level = calcLevel(S.xp);
    updateXPBar();
    if (S.level > oldLevel) onLevelUp(S.level);
}

function updateXPBar() {
    const lvl = S.level;
    const curThresh = CFG.LEVELS[lvl - 1] || 0;
    const nextThresh = CFG.LEVELS[lvl] || curThresh + 100;
    const progress = (S.xp - curThresh) / (nextThresh - curThresh) * 100;
    DOM.xpFill.style.width = Math.min(progress, 100) + '%';
    DOM.xpLevel.textContent = 'Ур. ' + lvl;
    DOM.xpText.textContent = (S.xp - curThresh) + ' / ' + (nextThresh - curThresh) + ' XP';
}

function onLevelUp(lvl) {
    DOM.levelUpText.textContent = '⬆ УРОВЕНЬ ' + lvl + '!';
    DOM.celebLevel.classList.add('active');
    beep(880, 0.2); setTimeout(() => beep(1100, 0.3), 200);
    speak('Поздравляю! Уровень ' + lvl);
    setTimeout(() => DOM.celebLevel.classList.remove('active'), 2500);
}

function updateStreak() {
    const today = dayKey();
    const streakD = LS.get('streak') || { last: '', count: 0 };
    if (streakD.last === today) return; // already counted today
    const yesterday = dayKey(-1);
    if (streakD.last === yesterday) {
        streakD.count++;
    } else if (streakD.last !== today) {
        streakD.count = 1;
    }
    streakD.last = today;
    LS.set('streak', streakD);
    S.streak = streakD.count;
    DOM.streakNum.textContent = S.streak;
}

// === BADGES ===
let badgeQueue = [];
let showingBadge = false;

function tryUnlockBadge(id) {
    if (S.badges.includes(id)) return;
    S.badges.push(id);
    const b = CFG.BADGES.find(x => x.id === id);
    if (b) badgeQueue.push(b);
    processBadgeQueue();
}

function processBadgeQueue() {
    if (showingBadge || !badgeQueue.length) return;
    showingBadge = true;
    const b = badgeQueue.shift();
    DOM.badgePopIcon.textContent = b.icon;
    DOM.badgePopName.textContent = b.name;
    DOM.badgePopup.classList.add('show');
    beep(520, 0.15); setTimeout(() => beep(780, 0.2), 150);
    setTimeout(() => {
        DOM.badgePopup.classList.remove('show');
        showingBadge = false;
        setTimeout(() => processBadgeQueue(), 300);
    }, 2500);
}

function checkBadges() {
    const c = S.count;
    const ex = DOM.exerciseSel.value;
    const totalAll = Object.values(S.totalReps).reduce((a, b) => a + b, 0);

    if (c >= 1)   tryUnlockBadge('first');
    if (c >= 10)  tryUnlockBadge('ten');
    if (c >= 50)  tryUnlockBadge('fifty');
    if (c >= 100) tryUnlockBadge('hundred');
    if (totalAll >= 500)  tryUnlockBadge('total500');
    if (totalAll >= 1000) tryUnlockBadge('total1000');
    if (S.streak >= 3)  tryUnlockBadge('streak3');
    if (S.streak >= 7)  tryUnlockBadge('streak7');
    if (S.streak >= 30) tryUnlockBadge('streak30');
    if (S.avgForm >= 90 && c >= 5) tryUnlockBadge('form90');
    if (S.totalCalAll >= 100) tryUnlockBadge('calories100');
    if (S.exercisesUsed.length >= 4) tryUnlockBadge('allexercises');
}

/* ==========================================================
   DAILY CHALLENGE
   ========================================================== */
function getDailyChallenge() {
    const today = dayKey();
    const completed = LS.get('chalDone');
    if (completed && completed.date === today) return null;
    // Deterministic pick by date
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) & 0x7fffffff;
    return CFG.CHALLENGES[hash % CFG.CHALLENGES.length];
}

function showDailyChallenge() {
    const ch = getDailyChallenge();
    if (!ch) return;
    S.challenge = ch;
    DOM.challengeDesc.textContent = ch.label;
    openModal('modal-challenge');
}

function checkChallengeComplete() {
    if (!S.challenge || !S.challengeAccepted) return;
    const ch = S.challenge;
    if (DOM.exerciseSel.value !== ch.exercise) return;
    if (S.count < ch.target) return;
    if (ch.minForm && S.avgForm < ch.minForm) return;
    // Challenge done!
    LS.set('chalDone', { date: dayKey(), done: true });
    addXP(CFG.XP_CHALLENGE_BONUS);
    tryUnlockBadge('challenge');
    speak('Вызов дня выполнен! Плюс ' + CFG.XP_CHALLENGE_BONUS + ' опыта!');
    S.challenge = null;
}

/* ==========================================================
   GOAL & PROGRESS
   ========================================================== */
function updateGoal() {
    S.goal = parseInt(DOM.goalInput.value) || 50;
    updateGoalBar();
}

function updateGoalBar() {
    const pct = Math.min((S.count / S.goal) * 100, 100);
    DOM.goalFill.style.width = pct + '%';
    DOM.goalLabel.textContent = S.count + ' / ' + S.goal;
    if (S.count >= S.goal && !S.goalReached) {
        S.goalReached = true;
        DOM.celebGoal.classList.add('active');
        speak('Цель достигнута!');
        beep(880, 0.25); setTimeout(() => beep(1100, 0.35), 250);
        launchConfetti();
        setTimeout(() => DOM.celebGoal.classList.remove('active'), 3000);
    }
}

/* ==========================================================
   TIMER
   ========================================================== */
function startTimer() {
    if (S.workoutOn) return;
    S.workoutOn = true;
    S.workoutStart = Date.now();
    S.timerInt = setInterval(() => {
        if (S.isResting) return;
        DOM.timerVal.textContent = fmtTime(Date.now() - S.workoutStart);
    }, 1000);
}

function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

/* ==========================================================
   TEMPO
   ========================================================== */
function updateTempo() {
    if (S.repTimes.length < 2) { DOM.tempoPill.style.display = 'none'; return; }
    const dt = (S.repTimes[S.repTimes.length - 1] - S.repTimes[S.repTimes.length - 2]) / 1000;
    DOM.tempoPill.style.display = 'block';
    if (dt < 1.5) {
        DOM.tempoPill.textContent = '⚡ Быстро';
        DOM.tempoPill.style.color = '#ff4081';
    } else if (dt < 3.5) {
        DOM.tempoPill.textContent = '✓ Нормально';
        DOM.tempoPill.style.color = '#00e676';
    } else {
        DOM.tempoPill.textContent = '🐢 Медленно';
        DOM.tempoPill.style.color = '#ffab40';
    }
}

function checkFatigue() {
    if (S.repTimes.length < 8) return;
    const first5 = [];
    for (let i = 1; i < 6 && i < S.repTimes.length; i++) first5.push(S.repTimes[i] - S.repTimes[i - 1]);
    const last3 = [];
    const n = S.repTimes.length;
    for (let i = n - 3; i < n; i++) last3.push(S.repTimes[i] - S.repTimes[i - 1]);
    const avgFirst = first5.reduce((a, b) => a + b, 0) / first5.length;
    const avgLast = last3.reduce((a, b) => a + b, 0) / last3.length;
    if (avgLast > avgFirst * 1.8) {
        DOM.fatigueHint.textContent = '😤 Темп падает — можно отдохнуть';
        DOM.fatigueHint.classList.add('show');
        setTimeout(() => DOM.fatigueHint.classList.remove('show'), 4000);
    }
}

/* ==========================================================
   FORM SCORE
   ========================================================== */
function calcFormScore(mode, angle, bodyAngle) {
    let rom = 0, align = 0, tempo = 30;
    if (mode === 'pushup') {
        if (S.minAngle <= 70) rom = 40;
        else if (S.minAngle <= 85) rom = 30;
        else if (S.minAngle <= 95) rom = 15;
        if (bodyAngle >= 50 && bodyAngle <= 70) align = 30;
        else if (bodyAngle >= 40 && bodyAngle <= 80) align = 20;
        else if (bodyAngle >= 35 && bodyAngle <= 90) align = 10;
    } else if (mode === 'squat') {
        if (S.minAngle <= 75) rom = 40;
        else if (S.minAngle <= 90) rom = 30;
        else if (S.minAngle <= 100) rom = 15;
        align = 25; // simplified
    } else if (mode === 'pullup') {
        if (S.minAngle <= 80) rom = 40;
        else if (S.minAngle <= 100) rom = 25;
        align = 25;
    } else if (mode === 'crunch') {
        if (S.minAngle <= 70) rom = 40;
        else if (S.minAngle <= 90) rom = 25;
        align = 25;
    }

    // Tempo consistency
    if (S.repTimes.length >= 3) {
        const diffs = [];
        for (let i = S.repTimes.length - 3; i < S.repTimes.length - 1; i++) {
            diffs.push(S.repTimes[i + 1] - S.repTimes[i]);
        }
        const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        const std = Math.sqrt(diffs.reduce((a, d) => a + (d - mean) ** 2, 0) / diffs.length) / 1000;
        if (std < 0.3) tempo = 30;
        else if (std < 0.6) tempo = 20;
        else if (std < 1.0) tempo = 10;
        else tempo = 5;
    }

    return Math.min(100, rom + align + tempo);
}

function updateFormRing(score) {
    DOM.formScore.textContent = score;
    DOM.formRingPath.setAttribute('stroke-dasharray', score + ', 100');
    let color;
    if (score >= 80) color = '#00e676';
    else if (score >= 60) color = '#ffd740';
    else if (score >= 40) color = '#ff9100';
    else color = '#ff5252';
    DOM.formRingPath.style.stroke = color;
}

/* ==========================================================
   SYMMETRY
   ========================================================== */
function updateSymmetry(landmarks) {
    const l11 = landmarks[11], l13 = landmarks[13], l15 = landmarks[15];
    const l12 = landmarks[12], l14 = landmarks[14], l16 = landmarks[16];
    const leftVis = l11.visibility > 0.4 && l13.visibility > 0.4 && l15.visibility > 0.4;
    const rightVis = l12.visibility > 0.4 && l14.visibility > 0.4 && l16.visibility > 0.4;
    if (leftVis && rightVis) {
        S.leftAng = calcAngle(l11, l13, l15);
        S.rightAng = calcAngle(l12, l14, l16);
        const max = Math.max(S.leftAng, S.rightAng, 1);
        const sym = Math.round(100 - Math.abs(S.leftAng - S.rightAng) / max * 100);
        DOM.symVal.textContent = sym + '%';
        DOM.symVal.style.color = sym >= 85 ? '#00e676' : sym >= 65 ? '#ffd740' : '#ff5252';
    }
}

/* ==========================================================
   MATH
   ========================================================== */
function calcAngle(a, b, c) {
    const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let ang = Math.abs(r * 180 / Math.PI);
    if (ang > 180) ang = 360 - ang;
    return ang;
}

function bodyIncline(shoulder, hip) {
    return Math.abs(Math.atan2(hip.y - shoulder.y, hip.x - shoulder.x) * 180 / Math.PI);
}

/* ==========================================================
   DRAW HELPERS
   ========================================================== */
function drawAngleArc(bx, by, angle, w, h) {
    const px = bx * w, py = by * h, r = 24;
    ctx.beginPath();
    ctx.arc(px, py, r, -Math.PI, -Math.PI + Math.PI * (angle / 180));
    ctx.strokeStyle = angle < 90 ? 'rgba(255,64,129,.7)' : 'rgba(0,230,118,.7)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#ffd740';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(Math.round(angle) + '°', px + r + 4, py + 4);
}

/* ==========================================================
   EXERCISE PROCESSING
   ========================================================== */
function processExercise(landmarks) {
    if (S.isResting) return;
    checkRest();

    const mode = DOM.exerciseSel.value;
    const lv = (i) => landmarks[i].visibility > 0.4;

    // Auto-pick side
    const leftV = ((landmarks[11].visibility || 0) + (landmarks[13].visibility || 0) + (landmarks[15].visibility || 0)) / 3;
    const rightV = ((landmarks[12].visibility || 0) + (landmarks[14].visibility || 0) + (landmarks[16].visibility || 0)) / 3;
    let s, e, w, hip, knee, ankle, nose = landmarks[0];
    if (leftV > rightV) {
        s = landmarks[11]; e = landmarks[13]; w = landmarks[15]; hip = landmarks[23]; knee = landmarks[25]; ankle = landmarks[27];
    } else {
        s = landmarks[12]; e = landmarks[14]; w = landmarks[16]; hip = landmarks[24]; knee = landmarks[26]; ankle = landmarks[28];
    }
    if (!s || !e || !w || s.visibility < 0.5 || e.visibility < 0.5) return;

    const cW = DOM.canvas.width, cH = DOM.canvas.height;
    DOM.partialWarn.classList.remove('show');

    // --- PUSHUP ---
    if (mode === 'pushup') {
        const angle = calcAngle(s, e, w);
        drawAngleArc(e.x, e.y, angle, cW, cH);
        if (!hip || hip.visibility < 0.5) return;
        const bAngle = bodyIncline(s, hip);
        if (bAngle < 35 || bAngle > 145) return;

        S.minAngle = Math.min(S.minAngle, angle);

        if (angle > 160) {
            if (S.stage === 'down') {
                const score = calcFormScore(mode, angle, bAngle);
                onRep(score, bAngle);
            }
            S.stage = 'up';
            DOM.feedback.textContent = '⬇ Вниз';
            DOM.feedback.style.color = '#ff4081';
        }
        if (angle < 90) {
            S.stage = 'down';
            DOM.feedback.textContent = '⬆ Вверх';
            DOM.feedback.style.color = '#00e676';
        }
        // Partial rep warning
        if (angle >= 90 && angle < 115 && S.stage === 'up') {
            DOM.partialWarn.classList.add('show');
        }
    }

    // --- PULLUP ---
    else if (mode === 'pullup') {
        const angle = calcAngle(s, e, w);
        drawAngleArc(e.x, e.y, angle, cW, cH);
        if (w.y > s.y) return;
        S.minAngle = Math.min(S.minAngle, angle);

        if (angle > 140) {
            S.stage = 'hang';
            S.startY = nose.y;
            DOM.feedback.textContent = '⬆ Тяни!';
            DOM.feedback.style.color = '#ff4081';
        }
        if (angle < 100 && S.stage === 'hang') {
            const travel = S.startY - nose.y;
            if (travel > S.minTravel) {
                const score = calcFormScore(mode, angle, 0);
                onRep(score, 0);
                S.stage = 'up';
            }
        }
        if (angle > 130 && S.stage === 'up') {
            DOM.feedback.textContent = '⬇ Вниз';
            DOM.feedback.style.color = '#00e676';
            S.stage = 'wait';
        }
    }

    // --- SQUAT ---
    else if (mode === 'squat') {
        if (!hip || !knee || !ankle) return;
        if (hip.visibility < 0.5 || knee.visibility < 0.5 || ankle.visibility < 0.5) return;
        const kAngle = calcAngle(hip, knee, ankle);
        drawAngleArc(knee.x, knee.y, kAngle, cW, cH);
        S.minAngle = Math.min(S.minAngle, kAngle);

        if (kAngle < 90) {
            S.stage = 'down';
            DOM.feedback.textContent = '⬆ Встаём!';
            DOM.feedback.style.color = '#00e676';
        }
        if (kAngle > 160) {
            if (S.stage === 'down') {
                const score = calcFormScore(mode, kAngle, 0);
                onRep(score, 0);
            }
            S.stage = 'up';
            DOM.feedback.textContent = '⬇ Садимся';
            DOM.feedback.style.color = '#ff4081';
        }
        if (kAngle >= 90 && kAngle < 110 && S.stage === 'up') {
            DOM.partialWarn.classList.add('show');
        }
    }

    // --- CRUNCH ---
    else if (mode === 'crunch') {
        if (!hip || !knee) return;
        if (s.visibility < 0.5 || hip.visibility < 0.5 || knee.visibility < 0.5) return;
        const bAngle = calcAngle(s, hip, knee);
        drawAngleArc(hip.x, hip.y, bAngle, cW, cH);
        S.minAngle = Math.min(S.minAngle, bAngle);

        if (bAngle > 140) {
            if (S.stage === 'up') S.stage = 'down';
            DOM.feedback.textContent = '⬆ Скручиваемся!';
            DOM.feedback.style.color = '#ff4081';
        }
        if (bAngle < 90) {
            if (S.stage === 'down' || S.stage === 'wait') {
                const score = calcFormScore(mode, bAngle, 0);
                onRep(score, 0);
            }
            S.stage = 'up';
            DOM.feedback.textContent = '⬇ Ложимся';
            DOM.feedback.style.color = '#00e676';
        }
    }

    // Symmetry
    updateSymmetry(landmarks);
}

/* ==========================================================
   ON REP
   ========================================================== */
function onRep(formScore, bodyAngle) {
    S.count++;
    DOM.repCounter.textContent = S.count;
    DOM.repCounter.classList.add('pulse');
    setTimeout(() => DOM.repCounter.classList.remove('pulse'), 200);

    beep(660, 0.06);

    // Natural voice — speak only on key reps, with varied phrases
    if (S.count <= 3 || S.count % 5 === 0) {
        speak(S.count);
    }

    // Calories
    const mode = DOM.exerciseSel.value;
    S.totalCal += (CFG.CAL[mode] || 0.3);
    S.totalCalAll += (CFG.CAL[mode] || 0.3);
    DOM.calVal.textContent = S.totalCal.toFixed(1);

    // Form
    S.repScores.push(formScore);
    S.avgForm = Math.round(S.repScores.reduce((a, b) => a + b, 0) / S.repScores.length);
    updateFormRing(formScore);
    S.minAngle = 180; // reset for next rep

    // Tempo
    S.lastRepTS = Date.now();
    S.repTimes.push(Date.now());
    updateTempo();
    checkFatigue();

    // XP
    addXP(CFG.XP_PER_REP);

    // Total reps
    S.totalReps[mode] = (S.totalReps[mode] || 0) + 1;

    // Exercises used
    if (!S.exercisesUsed.includes(mode)) {
        S.exercisesUsed.push(mode);
    }

    // Goal
    updateGoalBar();

    // Timer
    startTimer();

    // Milestones — varied encouragement phrases
    const encouragement = [
        'Отлично!', 'Так держать!', 'Молодец!', 'Супер!',
        'Продолжай!', 'Класс!', 'Сила!', 'Не останавливайся!'
    ];
    if (S.count === 10) {
        setTimeout(() => speak('Десять! Хороший старт!', { rate: 0.95 }), 300);
    } else if (S.count === 25) {
        setTimeout(() => speak('Двадцать пять! ' + encouragement[Math.floor(Math.random() * encouragement.length)], { rate: 0.95 }), 300);
    } else if (S.count === 50) {
        setTimeout(() => speak('Полтинник! Невероятно!', { rate: 0.9 }), 300);
    } else if (S.count === 100) {
        setTimeout(() => speak('Сотня! Ты машина!', { rate: 0.9 }), 300);
    } else if (S.count > 10 && S.count % 10 === 0) {
        const phrase = encouragement[Math.floor(Math.random() * encouragement.length)];
        setTimeout(() => speak(S.count + '! ' + phrase, { rate: 0.95 }), 300);
    }

    // Badges
    checkBadges();

    // Challenge
    checkChallengeComplete();
}

/* ==========================================================
   REST TIMER
   ========================================================== */
function checkRest() {
    if (!S.autoRest || S.count === 0 || S.isResting) return;
    if (Date.now() - S.lastRepTS > CFG.REST_TRIGGER) startRest();
}

function startRest() {
    S.isResting = true;
    S.restSec = CFG.REST_DURATION;
    DOM.restOverlay.classList.add('active');
    DOM.restCountdown.textContent = S.restSec;
    DOM.restCountdown.classList.remove('ending');
    speak('Отдых');

    S.restInt = setInterval(() => {
        S.restSec--;
        DOM.restCountdown.textContent = S.restSec;
        if (S.restSec <= 10) DOM.restCountdown.classList.add('ending');
        if (S.restSec <= 0) {
            stopRest();
            speak('Время вышло! За работу!');
            beep(660, 0.25);
        }
    }, 1000);
}

function stopRest() {
    S.isResting = false;
    DOM.restOverlay.classList.remove('active');
    DOM.restCountdown.classList.remove('ending');
    clearInterval(S.restInt);
    S.lastRepTS = Date.now();
    S.sets++;
    DOM.setsVal.textContent = S.sets;
    speak('Подход ' + S.sets);
}

/* ==========================================================
   CONFETTI
   ========================================================== */
let confParts = [], confRunning = false;
function launchConfetti() {
    DOM.confettiCvs.width = DOM.confettiCvs.clientWidth;
    DOM.confettiCvs.height = DOM.confettiCvs.clientHeight;
    const colors = ['#00e676','#ffd740','#ff4081','#40c4ff','#ff6d00','#e040fb','#76ff03'];
    confParts = [];
    for (let i = 0; i < 100; i++) {
        confParts.push({
            x: DOM.confettiCvs.width / 2 + (Math.random() - .5) * 80,
            y: DOM.confettiCvs.height / 2,
            vx: (Math.random() - .5) * 14,
            vy: -Math.random() * 12 - 3,
            w: Math.random() * 8 + 3, h: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * 360, rotV: (Math.random() - .5) * 14,
            life: 1
        });
    }
    if (!confRunning) { confRunning = true; animConf(); }
}

function animConf() {
    confCtx.clearRect(0, 0, DOM.confettiCvs.width, DOM.confettiCvs.height);
    let alive = false;
    for (const p of confParts) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.rot += p.rotV; p.life -= 0.009;
        confCtx.save();
        confCtx.translate(p.x, p.y);
        confCtx.rotate(p.rot * Math.PI / 180);
        confCtx.globalAlpha = Math.max(0, p.life);
        confCtx.fillStyle = p.color;
        confCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confCtx.restore();
    }
    if (alive) requestAnimationFrame(animConf);
    else { confRunning = false; confCtx.clearRect(0, 0, DOM.confettiCvs.width, DOM.confettiCvs.height); }
}

/* ==========================================================
   COUNTDOWN 3-2-1
   ========================================================== */
function runCountdown() {
    return new Promise(resolve => {
        let n = 3;
        DOM.countdownOvl.style.display = 'flex';
        DOM.countdownNum.textContent = n;
        beep(440, 0.1);
        const iv = setInterval(() => {
            n--;
            if (n > 0) {
                DOM.countdownNum.textContent = n;
                DOM.countdownNum.style.animation = 'none';
                void DOM.countdownNum.offsetWidth;
                DOM.countdownNum.style.animation = 'countPulse .5s ease-out';
                beep(440, 0.1);
            } else {
                DOM.countdownNum.textContent = 'GO!';
                DOM.countdownNum.style.color = '#00e676';
                DOM.countdownNum.style.animation = 'none';
                void DOM.countdownNum.offsetWidth;
                DOM.countdownNum.style.animation = 'countPulse .5s ease-out';
                beep(880, 0.2);
                clearInterval(iv);
                setTimeout(() => {
                    DOM.countdownOvl.style.display = 'none';
                    DOM.countdownNum.style.color = '';
                    resolve();
                }, 700);
            }
        }, 1000);
    });
}

/* ==========================================================
   MODALS
   ========================================================== */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(el => {
    el.addEventListener('click', () => el.parentElement.classList.remove('open'));
});

/* ==========================================================
   TUTORIAL
   ========================================================== */
function showTutorial(exercise) {
    const t = CFG.TUTORIALS[exercise];
    DOM.tutIcon.textContent = CFG.ICONS[exercise];
    DOM.tutTitle.textContent = CFG.NAMES[exercise];
    DOM.tutDesc.textContent = t.desc;
    DOM.tutTips.innerHTML = t.tips.map(x => '<li>' + x + '</li>').join('');
    openModal('modal-tutorial');
}

/* ==========================================================
   FINISH WORKOUT
   ========================================================== */
function finishWorkout() {
    if (S.count === 0) {
        if (S.camera) S.camera.stop();
        S.camera = null;
        goHome();
        return;
    }

    // Update streak
    updateStreak();

    // Save to history
    const history = LS.get('history') || [];
    const mode = DOM.exerciseSel.value;
    const entry = {
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        type: mode,
        typeName: CFG.NAMES[mode],
        count: S.count,
        sets: S.sets,
        calories: +S.totalCal.toFixed(1),
        duration: fmtTime(Date.now() - (S.workoutStart || Date.now())),
        avgForm: S.avgForm
    };
    history.unshift(entry);
    if (history.length > 30) history.pop();
    LS.set('history', history);

    // Check personal record
    const records = LS.get('records') || {};
    let isRecord = false;
    if (!records[mode] || S.count > records[mode]) {
        records[mode] = S.count;
        isRecord = true;
        tryUnlockBadge('record');
    }
    LS.set('records', records);

    saveProfile();
    showResults(entry, isRecord);
}

function showResults(entry, isRecord) {
    DOM.resultsTitle.textContent = isRecord ? '🎉 Новый рекорд!' : 'Тренировка завершена!';
    const records = LS.get('records') || {};
    DOM.resultsBody.innerHTML = `
        <div class="results-grid">
            <div class="result-card ${isRecord ? 'highlight' : ''}">
                <div class="rc-label">Повторений</div>
                <div class="rc-value">${entry.count}</div>
                <div class="rc-sub">${entry.typeName}</div>
            </div>
            <div class="result-card">
                <div class="rc-label">Подходов</div>
                <div class="rc-value" style="color:var(--orange)">${entry.sets}</div>
            </div>
            <div class="result-card">
                <div class="rc-label">Калории</div>
                <div class="rc-value" style="color:var(--pink)">${entry.calories}</div>
            </div>
            <div class="result-card">
                <div class="rc-label">Время</div>
                <div class="rc-value" style="color:var(--cyan);font-size:1.3rem">${entry.duration}</div>
            </div>
            <div class="result-card">
                <div class="rc-label">Ср. форма</div>
                <div class="rc-value" style="color:var(--gold)">${entry.avgForm || '—'}</div>
            </div>
            <div class="result-card">
                <div class="rc-label">Рекорд</div>
                <div class="rc-value" style="color:var(--green)">${records[entry.type] || entry.count}</div>
                <div class="rc-sub">${entry.typeName}</div>
            </div>
        </div>
        <div style="text-align:center;font-size:.8rem;color:var(--text-3)">
            🔥 Стрик: ${S.streak} дн. &nbsp;|&nbsp; ⭐ Уровень: ${S.level} &nbsp;|&nbsp; XP: ${S.xp}
        </div>
    `;
    openModal('modal-results');
}

/* ==========================================================
   SHARE
   ========================================================== */
function generateShareCard() {
    const c = DOM.shareCanvas;
    const cx = c.getContext('2d');
    c.width = 1080; c.height = 1080;

    // Background
    const grad = cx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, '#0a0a1a'); grad.addColorStop(1, '#1a1a3e');
    cx.fillStyle = grad; cx.fillRect(0, 0, 1080, 1080);

    // Border glow
    cx.strokeStyle = '#00e67640'; cx.lineWidth = 4;
    cx.strokeRect(30, 30, 1020, 1020);

    cx.textAlign = 'center';

    // Title
    cx.fillStyle = '#555'; cx.font = '600 28px Inter, sans-serif';
    cx.fillText('AI TRAINER', 540, 100);

    // Exercise icon + name
    const mode = DOM.exerciseSel.value;
    cx.fillStyle = '#aaa'; cx.font = '32px Inter';
    cx.fillText(CFG.NAMES[mode], 540, 220);

    // Big count
    cx.fillStyle = '#00e676'; cx.font = '900 180px Inter, sans-serif';
    cx.fillText(String(S.count), 540, 460);
    cx.fillStyle = '#666'; cx.font = '24px Inter';
    cx.fillText('ПОВТОРЕНИЙ', 540, 510);

    // Stats row
    const stats = [
        { label: 'Подходов', val: S.sets },
        { label: 'Ккал', val: S.totalCal.toFixed(1) },
        { label: 'Форма', val: S.avgForm || '—' },
        { label: 'Время', val: fmtTime(Date.now() - (S.workoutStart || Date.now())) }
    ];
    const startX = 140;
    stats.forEach((st, i) => {
        const x = startX + i * 220;
        cx.fillStyle = '#888'; cx.font = '20px Inter'; cx.fillText(st.label, x, 620);
        cx.fillStyle = '#fff'; cx.font = '700 40px Inter'; cx.fillText(String(st.val), x, 670);
    });

    // Level + streak
    cx.fillStyle = '#ce93d8'; cx.font = '600 26px Inter';
    cx.fillText('Уровень ' + S.level + '  |  🔥 Стрик ' + S.streak + ' дн.', 540, 800);

    // Date
    cx.fillStyle = '#444'; cx.font = '22px Inter';
    cx.fillText(new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }), 540, 900);

    // Watermark
    cx.fillStyle = '#333'; cx.font = '18px Inter';
    cx.fillText('ai-trainer • github.io', 540, 1000);
}

async function shareResults() {
    generateShareCard();
    try {
        const blob = await new Promise(r => DOM.shareCanvas.toBlob(r, 'image/png'));
        if (navigator.share && navigator.canShare) {
            const file = new File([blob], 'workout.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'AI Trainer — Тренировка' });
                return;
            }
        }
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'workout.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch {}
}

/* ==========================================================
   HISTORY MODAL
   ========================================================== */
function showHistoryModal() {
    const history = LS.get('history') || [];

    // Chart
    const last7 = history.slice(0, 7).reverse();
    if (last7.length > 1) {
        const max = Math.max(...last7.map(h => h.count), 1);
        DOM.chartArea.style.display = 'block';
        DOM.chartArea.innerHTML = '<div class="chart-title">Последние тренировки</div><div class="chart-bars">' +
            last7.map(h => `<div class="chart-col"><div class="chart-col-val">${h.count}</div><div class="chart-bar-outer"><div class="chart-bar-inner" style="height:${(h.count/max)*100}%"></div></div><div class="chart-col-lbl">${h.date}</div></div>`).join('') +
            '</div>';
    } else {
        DOM.chartArea.style.display = 'none';
    }

    // List
    if (!history.length) {
        DOM.historyList.innerHTML = '<div style="color:var(--text-3);text-align:center;padding:20px">Нет записей</div>';
    } else {
        DOM.historyList.innerHTML = history.map(h => `
            <div class="history-item">
                <div><span class="hi-date">${h.date}${h.time ? ', ' + h.time : ''}</span></div>
                <span class="hi-type">${h.typeName || h.type}</span>
                <div class="hi-stats">
                    <span class="hi-count">${h.count} раз</span>
                    <div class="hi-detail">${h.sets || '?'} подх. · ${h.calories || 0} ккал · Ф:${h.avgForm || '—'}</div>
                </div>
            </div>
        `).join('');
    }
    openModal('modal-history');
}

/* ==========================================================
   BADGES MODAL
   ========================================================== */
function showBadgesModal() {
    DOM.badgesGrid.innerHTML = CFG.BADGES.map(b => {
        const unlocked = S.badges.includes(b.id);
        return `<div class="badge-cell ${unlocked ? 'unlocked' : 'locked'}">
            <div class="badge-cell-icon">${b.icon}</div>
            <div class="badge-cell-name">${b.name}</div>
        </div>`;
    }).join('');
    openModal('modal-badges');
}

/* ==========================================================
   RESET
   ========================================================== */
function resetWorkout() {
    S.count = 0; S.stage = 'wait'; S.sets = 1; S.totalCal = 0;
    S.goalReached = false; S.workoutOn = false;
    S.minAngle = 180; S.bodyAngSum = 0; S.bodyAngN = 0;
    S.repScores = []; S.avgForm = 0;
    S.repTimes = []; S.lastRepTS = Date.now();
    clearInterval(S.timerInt); clearInterval(S.restInt);
    S.isResting = false;

    DOM.repCounter.textContent = '0';
    DOM.setsVal.textContent = '1';
    DOM.timerVal.textContent = '00:00';
    DOM.calVal.textContent = '0';
    DOM.symVal.textContent = '—';
    DOM.formScore.textContent = '—';
    DOM.formRingPath.setAttribute('stroke-dasharray', '0, 100');
    DOM.feedback.textContent = 'Встаньте перед камерой';
    DOM.feedback.style.color = '#fff';
    DOM.tempoPill.style.display = 'none';
    DOM.restOverlay.classList.remove('active');
    updateGoalBar();
}

/* ==========================================================
   MEDIAPIPE
   ========================================================== */
function onResults(results) {
    DOM.loading.style.display = 'none';
    DOM.canvas.width = DOM.canvas.clientWidth;
    DOM.canvas.height = DOM.canvas.clientHeight;

    ctx.save();
    ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
    ctx.drawImage(results.image, 0, 0, DOM.canvas.width, DOM.canvas.height);

    if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: 'rgba(0,230,118,.2)', lineWidth: 2 });
        drawLandmarks(ctx, results.poseLandmarks, { color: 'rgba(0,230,118,.55)', lineWidth: 1, radius: 3 });
        processExercise(results.poseLandmarks);
    }
    ctx.restore();
}

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
});
pose.onResults(onResults);

/* ==========================================================
   CAMERA
   ========================================================== */
function startCamera() {
    S.camera = new Camera(DOM.video, {
        onFrame: async () => { await pose.send({ image: DOM.video }); },
        facingMode: S.facingMode,
        width: 640, height: 480
    });
    S.camera.start().then(() => {
        DOM.loading.style.display = 'none';
        DOM.cameraError.classList.remove('active');
    }).catch(() => {
        DOM.loading.style.display = 'none';
        DOM.cameraError.classList.add('active');
    });
}

/* ==========================================================
   EVENT LISTENERS
   ========================================================== */
$('btn-camera').addEventListener('click', () => {
    S.facingMode = S.facingMode === 'user' ? 'environment' : 'user';
    if (S.camera) S.camera.stop();
    startCamera();
});

$('btn-voice').addEventListener('click', () => {
    S.isVoice = !S.isVoice;
    $('btn-voice').textContent = S.isVoice ? '🗣️' : '🔇';
    if (S.isVoice) speak('Голосовой тренер включён');
});

$('btn-tutorial').addEventListener('click', () => showTutorial(DOM.exerciseSel.value));

DOM.exerciseSel.addEventListener('change', () => {
    resetWorkout();
    // Show tutorial first time
    const seen = LS.get('tutSeen') || [];
    const ex = DOM.exerciseSel.value;
    if (!seen.includes(ex)) {
        seen.push(ex);
        LS.set('tutSeen', seen);
        showTutorial(ex);
    }
});

DOM.goalInput.addEventListener('input', updateGoal);
DOM.goalInput.addEventListener('change', updateGoal);

$('btn-finish').addEventListener('click', finishWorkout);
$('btn-rest-skip').addEventListener('click', stopRest);
$('btn-retry').addEventListener('click', () => {
    DOM.cameraError.classList.remove('active');
    DOM.loading.style.display = 'flex';
    startCamera();
});

$('tut-ok').addEventListener('click', () => closeModal('modal-tutorial'));

$('challenge-accept').addEventListener('click', () => {
    S.challengeAccepted = true;
    const ch = S.challenge;
    if (ch) {
        selectedExercise = ch.exercise;
        DOM.exerciseSel.value = ch.exercise;
        resetWorkout();
    }
    closeModal('modal-challenge');
    // If we're already in training, just run countdown; otherwise start training
    if (DOM.appScreen.style.display !== 'none') {
        runCountdown();
    }
});
$('challenge-skip').addEventListener('click', () => {
    closeModal('modal-challenge');
    if (DOM.appScreen.style.display !== 'none') {
        runCountdown();
    }
});

$('btn-share').addEventListener('click', shareResults);
$('btn-badges-open').addEventListener('click', () => { closeModal('modal-results'); showBadgesModal(); });
$('btn-history-open').addEventListener('click', () => { closeModal('modal-results'); showHistoryModal(); });
$('btn-new-workout').addEventListener('click', () => { closeModal('modal-results'); resetWorkout(); goHome(); });

$('btn-close-history').addEventListener('click', () => closeModal('modal-history'));
$('btn-clear-history').addEventListener('click', () => {
    if (confirm('Удалить всю историю и рекорды?')) {
        LS.remove('history'); LS.remove('records');
        LS.remove('xp'); LS.remove('badges');
        LS.remove('totalReps'); LS.remove('exUsed');
        LS.remove('totalCal'); LS.remove('streak');
        closeModal('modal-history');
        loadProfile();
        updateXPBar();
        DOM.streakNum.textContent = '0';
    }
});
$('btn-close-badges').addEventListener('click', () => closeModal('modal-badges'));

/* ==========================================================
   HOME SCREEN
   ========================================================== */
let selectedExercise = 'pushup';

function updateHomeScreen() {
    // Stats
    $('home-level').textContent = 'Ур. ' + S.level;
    $('home-xp').textContent = S.xp;
    $('home-streak').textContent = S.streak;

    // Records
    const records = LS.get('records') || {};
    ['pushup','pullup','squat','crunch'].forEach(ex => {
        const el = $('rec-' + ex);
        if (el) el.textContent = records[ex] ? 'Рекорд: ' + records[ex] : 'Рекорд: —';
    });

    // Daily challenge
    const ch = getDailyChallenge();
    const banner = $('home-challenge');
    if (ch) {
        banner.style.display = 'flex';
        $('home-challenge-text').textContent = ch.label;
    } else {
        banner.style.display = 'none';
    }

    // Sync selected card
    document.querySelectorAll('.ex-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.ex === selectedExercise);
    });
}

// Exercise card selection
document.querySelectorAll('.ex-card').forEach(card => {
    card.addEventListener('click', () => {
        selectedExercise = card.dataset.ex;
        document.querySelectorAll('.ex-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
    });
});

// Auto-rest toggle
$('home-autorest-toggle').addEventListener('change', function () {
    S.autoRest = this.checked;
    LS.set('autoRest', S.autoRest);
});

// Home bottom links
$('home-history-btn').addEventListener('click', showHistoryModal);
$('home-badges-btn').addEventListener('click', showBadgesModal);

/* ==========================================================
   CAMERA GUIDE
   ========================================================== */
function showCameraGuide() {
    const ex = selectedExercise;
    const guide = CFG.CAMERA_GUIDE[ex];

    $('guide-exercise').textContent = CFG.NAMES[ex];
    $('guide-image').src = guide.img;

    const tipsEl = $('guide-tips');
    tipsEl.innerHTML = guide.tips.map((tip, i) =>
        `<div class="guide-tip">
            <div class="guide-tip-icon">${i + 1}</div>
            <div>${tip}</div>
        </div>`
    ).join('');

    updateGuideCamLabel();
    DOM.cameraGuide.classList.add('active');
}

function updateGuideCamLabel() {
    $('guide-cam-toggle').textContent = S.facingMode === 'user' ? 'Фронтальная 🔄' : 'Задняя 🔄';
}

$('guide-cam-toggle').addEventListener('click', () => {
    S.facingMode = S.facingMode === 'user' ? 'environment' : 'user';
    updateGuideCamLabel();
    if (S.camera) S.camera.stop();
    startCamera();
});

$('btn-guide-ready').addEventListener('click', () => {
    DOM.cameraGuide.classList.remove('active');
    runCountdown();
});

$('btn-guide-back').addEventListener('click', () => {
    DOM.cameraGuide.classList.remove('active');
    if (S.camera) S.camera.stop();
    S.camera = null;
    goHome();
});

/* ==========================================================
   NAVIGATION
   ========================================================== */
function goHome() {
    DOM.appScreen.style.display = 'none';
    DOM.homeScreen.style.display = 'block';
    DOM.cameraGuide.classList.remove('active');
    DOM.loading.style.display = 'none';
    updateHomeScreen();
}

function goTraining() {
    // Sync exercise select with home selection
    DOM.exerciseSel.value = selectedExercise;
    DOM.goalInput.value = $('home-goal-input').value;
    updateGoal();
    resetWorkout();

    // Hide home, show app
    DOM.homeScreen.style.display = 'none';
    DOM.appScreen.style.display = 'flex';

    // Start camera & show guide
    DOM.loading.style.display = 'flex';
    startCamera();

    // Small delay so camera initializes before guide shows on top
    setTimeout(() => {
        DOM.loading.style.display = 'none';
        showCameraGuide();
    }, 800);
}

// Start training button
$('btn-start-training').addEventListener('click', goTraining);

// Override finish to return home
const origFinish = finishWorkout;
// (finishWorkout already opens results modal, btn-new-workout now calls goHome)

/* ==========================================================
   INIT
   ========================================================== */
function init() {
    loadProfile();
    updateXPBar();
    DOM.streakNum.textContent = S.streak;

    // Preload guide images
    Object.values(CFG.CAMERA_GUIDE).forEach(g => {
        const img = new Image();
        img.src = g.img;
    });

    // Don't start camera — show home screen first
    DOM.loading.style.display = 'none';
    DOM.appScreen.style.display = 'none';
    DOM.homeScreen.style.display = 'block';
    updateHomeScreen();
}

init();

})();

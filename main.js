/**
 * main.js — Entry Point & Orchestration Module
 * 
 * Contains:
 *   - State management
 *   - Event listeners
 *   - Navigation (goHome, goTraining)
 *   - Workout lifecycle (start, finish, reset)
 *   - Speech synthesis
 *   - Audio beep
 *   - Daily challenge
 *   - Gamification (XP, levels, badges, streaks)
 *   - Integration of all modules
 */

import {
    initDB, getProfile, saveProfile, hasProfile,
    getGameData, saveGameData, getStreak, saveStreak,
    getRecords, saveRecords, getSettings, saveSettings,
    getWorkoutHistory, addWorkout, clearAllData,
    migrateFromLocalStorage, dayKey
} from './storage.js';

import {
    CFG, processExercise, calcRPE,
    calcCaloriesPerRep, analyzeTempo, checkFatigue,
    generateWorkoutPlan, resetCrunchCalibration
} from './trainer-logic.js';

import {
    initPose, startCamera, stopCamera, getPose,
    drawVideoFrame, drawSkeleton, drawAngleArc,
    transformLandmarks, mapLandmarkToCanvas
} from './camera.js';

import {
    DOM, ctx, openModal, closeModal, initModalBackdrops,
    updateRepCounter, setRepCounter, updateFormRing, updateGoalBar,
    updateXPBar, updateTimer, updateCalories, updateSymmetry,
    updateSets, showFeedback, showPartialWarning, showFatigueHint,
    updateTempoPill, showGoalCelebration, showLevelUp, showBadgePopup,
    showRestOverlay, updateRestCountdown, showCameraError,
    showTutorial, runCountdown, showCameraGuide, hideCameraGuide,
    updateGuideCamLabel, showResults, showHistoryModal, showBadgesModal,
    showProfileScreen, hideProfileScreen, updateHomeScreen,
    showTrainerPlan, hideTrainerPlan, renderProgressChart,
    launchConfetti, resetHUD, fmtTime, shareResults
} from './ui.js';

/* ==========================================================
   STATE
   ========================================================== */

const S = {
    count: 0, stage: 'wait', sets: 1, totalCal: 0,
    isVoice: false, goal: 50, goalReached: false,
    facingMode: 'user',
    workoutOn: false, workoutStart: 0,
    isResting: false, restInt: null, restSec: 60, autoRest: true,
    // form tracking
    minAngle: 180, bodyAngSum: 0, bodyAngN: 0,
    repScores: [], avgForm: 0,
    // pullup
    startY: 0,
    // tempo
    repTimes: [], lastRepTS: Date.now(),
    // timer
    timerInt: null,
    // challenge
    challenge: null, challengeAccepted: false,
    // gamification
    xp: 0, level: 1, streak: 0,
    badges: [], totalReps: {}, exercisesUsed: [],
    totalCalAll: 0,
    // UI state
    selectedExercise: 'pushup',
    // profile
    profileName: '',
    userWeight: 70,
    extraWeight: 0,
    userGoal: 'muscle', // strength | muscle | endurance
    // settings
    tutSeen: [],
    chalDone: null
};

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
    } catch (e) { /* ignore audio errors */ }
}

/* ==========================================================
   SPEECH
   ========================================================== */

const synth = window.speechSynthesis || null;
let bestVoice = null;

function initVoices() {
    if (!synth) return;
    try {
        const voices = synth.getVoices();
        if (!voices || !voices.length) return;
        const ru = voices.filter(v => v.lang && (v.lang.startsWith('ru') || v.lang === 'ru-RU'));
        bestVoice = ru.find(v => /google/i.test(v.name))
                 || ru.find(v => /microsoft.*online/i.test(v.name))
                 || ru.find(v => /yandex/i.test(v.name))
                 || ru.find(v => !v.localService)
                 || ru[0] || null;
    } catch (e) { /* speechSynthesis not available */ }
}

if (synth && typeof synth.onvoiceschanged !== 'undefined') {
    synth.onvoiceschanged = initVoices;
}
initVoices();

function speak(text, opts) {
    if (!S.isVoice || !synth) return;
    synth.cancel();
    const o = opts || {};
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'ru-RU';
    u.rate = o.rate || 1.0;
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
    updateXPBar(S.xp, S.level, CFG.LEVELS);
    if (S.level > oldLevel) {
        showLevelUp(S.level);
        beep(880, 0.2); setTimeout(() => beep(1100, 0.3), 200);
        speak('Поздравляю! Уровень ' + S.level);
    }
}

async function updateStreak() {
    const today = dayKey();
    const streakD = await getStreak();
    if (streakD.last === today) return;
    const yesterday = dayKey(-1);
    if (streakD.last === yesterday) {
        streakD.count++;
    } else if (streakD.last !== today) {
        streakD.count = 1;
    }
    streakD.last = today;
    await saveStreak(streakD);
    S.streak = streakD.count;
    if (DOM.streakNum) DOM.streakNum.textContent = S.streak;
}

/* ==========================================================
   BADGES
   ========================================================== */

function tryUnlockBadge(id) {
    if (S.badges.includes(id)) return;
    S.badges.push(id);
    const b = CFG.BADGES.find(x => x.id === id);
    if (b) {
        showBadgePopup(b);
        beep(520, 0.15); setTimeout(() => beep(780, 0.2), 150);
    }
}

function checkBadges() {
    const c = S.count;
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
    if (S.chalDone && S.chalDone.date === today) return null;
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
    S.chalDone = { date: dayKey(), done: true };
    saveSettings({ autoRest: S.autoRest, tutSeen: S.tutSeen, chalDone: S.chalDone });
    addXP(CFG.XP_CHALLENGE_BONUS);
    tryUnlockBadge('challenge');
    speak('Вызов дня выполнен! Плюс ' + CFG.XP_CHALLENGE_BONUS + ' опыта!');
    S.challenge = null;
}

/* ==========================================================
   GOAL
   ========================================================== */

function updateGoal() {
    S.goal = parseInt(DOM.goalInput.value) || 50;
    updateGoalBar(S.count, S.goal);
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
        updateTimer(Date.now() - S.workoutStart);
    }, 1000);
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
    showRestOverlay(true);
    updateRestCountdown(S.restSec);
    speak('Отдых');

    S.restInt = setInterval(() => {
        S.restSec--;
        updateRestCountdown(S.restSec);
        if (S.restSec <= 0) {
            stopRest();
            speak('Время вышло! За работу!');
            beep(660, 0.25);
        }
    }, 1000);
}

function stopRest() {
    S.isResting = false;
    showRestOverlay(false);
    clearInterval(S.restInt);
    S.lastRepTS = Date.now();
    S.sets++;
    updateSets(S.sets);
    speak('Подход ' + S.sets);
}

/* ==========================================================
   ON REP
   ========================================================== */

function onRep(formScore) {
    S.count++;
    updateRepCounter(S.count);
    beep(660, 0.06);

    // Voice
    if (S.count <= 3 || S.count % 5 === 0) {
        speak(S.count);
    }

    // Calories (using user weight)
    const mode = DOM.exerciseSel.value;
    const calPerRep = calcCaloriesPerRep(mode, S.userWeight, S.extraWeight);
    S.totalCal += calPerRep;
    S.totalCalAll += calPerRep;
    updateCalories(S.totalCal);

    // Form
    S.repScores.push(formScore);
    S.avgForm = Math.round(S.repScores.reduce((a, b) => a + b, 0) / S.repScores.length);
    updateFormRing(formScore);
    S.minAngle = 180;

    // Tempo
    S.lastRepTS = Date.now();
    S.repTimes.push(Date.now());
    const tempo = analyzeTempo(S.repTimes);
    updateTempoPill(tempo);

    // Fatigue
    if (checkFatigue(S.repTimes)) {
        showFatigueHint('😤 Темп падает — можно отдохнуть');
    }

    // XP
    addXP(CFG.XP_PER_REP);

    // Total reps
    S.totalReps[mode] = (S.totalReps[mode] || 0) + 1;

    // Exercises used
    if (!S.exercisesUsed.includes(mode)) {
        S.exercisesUsed.push(mode);
    }

    // Goal
    updateGoalBar(S.count, S.goal);
    if (S.count >= S.goal && !S.goalReached) {
        S.goalReached = true;
        showGoalCelebration();
        speak('Цель достигнута!');
        beep(880, 0.25); setTimeout(() => beep(1100, 0.35), 250);
        launchConfetti();
    }

    // Timer
    startTimer();

    // Milestones
    const enc = ['Отлично!', 'Так держать!', 'Молодец!', 'Супер!', 'Продолжай!', 'Класс!', 'Сила!', 'Не останавливайся!'];
    if (S.count === 10) {
        setTimeout(() => speak('Десять! Хороший старт!', { rate: 0.95 }), 300);
    } else if (S.count === 25) {
        setTimeout(() => speak('Двадцать пять! ' + enc[Math.floor(Math.random() * enc.length)], { rate: 0.95 }), 300);
    } else if (S.count === 50) {
        setTimeout(() => speak('Полтинник! Невероятно!', { rate: 0.9 }), 300);
    } else if (S.count === 100) {
        setTimeout(() => speak('Сотня! Ты машина!', { rate: 0.9 }), 300);
    } else if (S.count > 10 && S.count % 10 === 0) {
        const phrase = enc[Math.floor(Math.random() * enc.length)];
        setTimeout(() => speak(S.count + '! ' + phrase, { rate: 0.95 }), 300);
    }

    // Badges
    checkBadges();

    // Challenge
    checkChallengeComplete();
}

/* ==========================================================
   MEDIAPIPE RESULTS CALLBACK
   ========================================================== */

function onResults(results) {
    if (DOM.loading) DOM.loading.style.display = 'none';

    const canvasEl = DOM.canvas;
    canvasEl.width = canvasEl.clientWidth;
    canvasEl.height = canvasEl.clientHeight;

    const cW = canvasEl.width;
    const cH = canvasEl.height;
    const videoW = results.image.width || DOM.video.videoWidth || 640;
    const videoH = results.image.height || DOM.video.videoHeight || 480;

    ctx.save();
    ctx.clearRect(0, 0, cW, cH);

    // Draw video with object-fit:cover crop
    drawVideoFrame(ctx, results.image, videoW, videoH, cW, cH);

    if (results.poseLandmarks) {
        // Transform landmarks for canvas drawing
        const transformed = transformLandmarks(results.poseLandmarks, videoW, videoH, cW, cH);

        // Draw thin, semi-transparent skeleton
        drawSkeleton(ctx, transformed, cW, cH);

        // Process exercise (uses original normalized landmarks for angle calculations)
        if (!S.isResting) {
            checkRest();

            const mode = DOM.exerciseSel.value;
            const exResult = processExercise(results.poseLandmarks, mode, {
                stage: S.stage,
                minAngle: S.minAngle,
                startY: S.startY,
                repTimes: S.repTimes
            });

            if (exResult) {
                // Update state
                S.stage = exResult.newStage;
                if (exResult.newMinAngle !== undefined) S.minAngle = exResult.newMinAngle;
                if (exResult.startY !== undefined) S.startY = exResult.startY;

                // UI feedback
                if (exResult.feedback) {
                    showFeedback(exResult.feedback, exResult.feedbackColor);
                }

                // Partial rep warning
                showPartialWarning(exResult.showPartial || false);

                // Draw angle arc at the joint
                if (exResult.jointForArc && exResult.angle) {
                    const mapped = mapLandmarkToCanvas(
                        exResult.jointForArc.x, exResult.jointForArc.y,
                        videoW, videoH, cW, cH
                    );
                    drawAngleArc(ctx, mapped.x, mapped.y, exResult.angle);
                }

                // Symmetry
                if (exResult.symmetry !== null && exResult.symmetry !== undefined) {
                    updateSymmetry(exResult.symmetry);
                }

                // Rep counted
                if (exResult.isRep) {
                    onRep(exResult.formScore);
                }
            }
        }
    }

    ctx.restore();
}

/* ==========================================================
   RESET WORKOUT
   ========================================================== */

function resetWorkout() {
    S.count = 0; S.stage = 'wait'; S.sets = 1; S.totalCal = 0;
    S.goalReached = false; S.workoutOn = false;
    S.minAngle = 180; S.bodyAngSum = 0; S.bodyAngN = 0;
    S.repScores = []; S.avgForm = 0;
    S.repTimes = []; S.lastRepTS = Date.now();
    S.startY = 0;
    clearInterval(S.timerInt); clearInterval(S.restInt);
    S.isResting = false;
    resetCrunchCalibration();
    resetHUD();
    updateGoalBar(0, S.goal);
}

/* ==========================================================
   FINISH WORKOUT
   ========================================================== */

async function finishWorkout() {
    if (S.count === 0) {
        stopCamera();
        goHome();
        return;
    }

    // Update streak
    await updateStreak();

    // Build entry
    const mode = DOM.exerciseSel.value;
    const duration = fmtTime(Date.now() - (S.workoutStart || Date.now()));
    const durationSec = Math.floor((Date.now() - (S.workoutStart || Date.now())) / 1000);
    const rpe = calcRPE(S.count, S.avgForm, durationSec, mode);

    const entry = {
        date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        type: mode,
        typeName: CFG.NAMES[mode],
        count: S.count,
        sets: S.sets,
        calories: +S.totalCal.toFixed(1),
        duration: duration,
        avgForm: S.avgForm,
        rpe: rpe
    };

    // Save to IndexedDB
    await addWorkout(entry);

    // Check personal record
    const records = await getRecords();
    let isRecord = false;
    if (!records[mode] || S.count > records[mode]) {
        records[mode] = S.count;
        isRecord = true;
        tryUnlockBadge('record');
    }
    await saveRecords(records);

    // Save game data
    await saveGameData({
        xp: S.xp,
        badges: S.badges,
        totalReps: S.totalReps,
        exercisesUsed: S.exercisesUsed,
        totalCalAll: S.totalCalAll
    });

    // Update profile extra weight if changed
    const profile = await getProfile();
    if (profile) {
        profile.extraWeight = S.extraWeight;
        await saveProfile(profile);
    }

    showResults(entry, isRecord, S, records);
}

/* ==========================================================
   NAVIGATION
   ========================================================== */

async function goHome() {
    DOM.appScreen.style.display = 'none';
    DOM.homeScreen.style.display = 'block';
    hideCameraGuide();
    if (DOM.loading) DOM.loading.style.display = 'none';

    const records = await getRecords();
    const challenge = getDailyChallenge();
    updateHomeScreen(S, records, challenge);

    // Show trainer plan
    const history = await getWorkoutHistory();
    const profile = await getProfile();
    if (profile && history.length > 0) {
        const plan = generateWorkoutPlan(history, profile);
        showTrainerPlan(plan);
    } else {
        hideTrainerPlan();
    }

    // Show progress chart
    if (history.length >= 2) {
        renderProgressChart(history);
    }
}

async function goTraining() {
    DOM.exerciseSel.value = S.selectedExercise;
    const homeGoalInput = document.getElementById('home-goal-input');
    if (homeGoalInput) DOM.goalInput.value = homeGoalInput.value;
    updateGoal();
    resetWorkout();

    // Reset crunch calibration when switching exercises
    resetCrunchCalibration();

    DOM.homeScreen.style.display = 'none';
    DOM.appScreen.style.display = 'flex';

    if (DOM.loading) DOM.loading.style.display = 'flex';

    // Start camera
    const pose = getPose();
    try {
        await startCamera(DOM.video, S.facingMode, pose);
        showCameraError(false);
    } catch {
        showCameraError(true);
    }

    if (DOM.loading) DOM.loading.style.display = 'none';
    showCameraGuide(S.selectedExercise, S.facingMode);
}

/* ==========================================================
   EVENT LISTENERS
   ========================================================== */

function setupEventListeners() {
    // Modal backdrops
    initModalBackdrops();

    // Camera toggle (in header)
    const btnCamera = document.getElementById('btn-camera');
    if (btnCamera) {
        btnCamera.addEventListener('click', async () => {
            S.facingMode = S.facingMode === 'user' ? 'environment' : 'user';
            stopCamera();
            const pose = getPose();
            try {
                await startCamera(DOM.video, S.facingMode, pose);
            } catch {
                showCameraError(true);
            }
        });
    }

    // Voice toggle
    const btnVoice = document.getElementById('btn-voice');
    if (btnVoice) {
        btnVoice.addEventListener('click', () => {
            S.isVoice = !S.isVoice;
            btnVoice.textContent = S.isVoice ? '🗣️' : '🔇';
            if (S.isVoice) speak('Голосовой тренер включён');
        });
    }

    // Tutorial button
    const btnTutorial = document.getElementById('btn-tutorial');
    if (btnTutorial) {
        btnTutorial.addEventListener('click', () => showTutorial(DOM.exerciseSel.value));
    }

    // Exercise select change
    DOM.exerciseSel.addEventListener('change', () => {
        resetWorkout();
        resetCrunchCalibration();
        const ex = DOM.exerciseSel.value;
        if (!S.tutSeen.includes(ex)) {
            S.tutSeen.push(ex);
            saveSettings({ autoRest: S.autoRest, tutSeen: S.tutSeen, chalDone: S.chalDone });
            showTutorial(ex);
        }
    });

    // Goal input
    DOM.goalInput.addEventListener('input', updateGoal);
    DOM.goalInput.addEventListener('change', updateGoal);

    // Finish/Stop button
    const btnFinish = document.getElementById('btn-finish');
    if (btnFinish) btnFinish.addEventListener('click', finishWorkout);

    // Rest skip
    const btnRestSkip = document.getElementById('btn-rest-skip');
    if (btnRestSkip) btnRestSkip.addEventListener('click', stopRest);

    // Camera retry
    const btnRetry = document.getElementById('btn-retry');
    if (btnRetry) {
        btnRetry.addEventListener('click', async () => {
            showCameraError(false);
            if (DOM.loading) DOM.loading.style.display = 'flex';
            const pose = getPose();
            try {
                await startCamera(DOM.video, S.facingMode, pose);
                if (DOM.loading) DOM.loading.style.display = 'none';
            } catch {
                if (DOM.loading) DOM.loading.style.display = 'none';
                showCameraError(true);
            }
        });
    }

    // Tutorial OK
    const tutOk = document.getElementById('tut-ok');
    if (tutOk) tutOk.addEventListener('click', () => closeModal('modal-tutorial'));

    // Challenge accept/skip
    const chalAccept = document.getElementById('challenge-accept');
    if (chalAccept) {
        chalAccept.addEventListener('click', () => {
            S.challengeAccepted = true;
            const ch = S.challenge;
            if (ch) {
                S.selectedExercise = ch.exercise;
                DOM.exerciseSel.value = ch.exercise;
                resetWorkout();
            }
            closeModal('modal-challenge');
            if (DOM.appScreen.style.display !== 'none') {
                runCountdown(beep);
            }
        });
    }

    const chalSkip = document.getElementById('challenge-skip');
    if (chalSkip) {
        chalSkip.addEventListener('click', () => {
            closeModal('modal-challenge');
            if (DOM.appScreen.style.display !== 'none') {
                runCountdown(beep);
            }
        });
    }

    // Share
    const btnShare = document.getElementById('btn-share');
    if (btnShare) {
        btnShare.addEventListener('click', () => shareResults(S, DOM.exerciseSel.value));
    }

    // Results modal buttons
    const btnBadgesOpen = document.getElementById('btn-badges-open');
    if (btnBadgesOpen) {
        btnBadgesOpen.addEventListener('click', () => {
            closeModal('modal-results');
            showBadgesModal(S.badges);
        });
    }

    const btnHistoryOpen = document.getElementById('btn-history-open');
    if (btnHistoryOpen) {
        btnHistoryOpen.addEventListener('click', async () => {
            closeModal('modal-results');
            const history = await getWorkoutHistory();
            showHistoryModal(history);
        });
    }

    const btnNewWorkout = document.getElementById('btn-new-workout');
    if (btnNewWorkout) {
        btnNewWorkout.addEventListener('click', () => {
            closeModal('modal-results');
            resetWorkout();
            stopCamera();
            goHome();
        });
    }

    // History modal
    const btnCloseHistory = document.getElementById('btn-close-history');
    if (btnCloseHistory) btnCloseHistory.addEventListener('click', () => closeModal('modal-history'));

    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', async () => {
            if (confirm('Удалить всю историю, рекорды и данные?')) {
                await clearAllData();
                closeModal('modal-history');
                // Reload game data
                await loadGameState();
                updateXPBar(S.xp, S.level, CFG.LEVELS);
                if (DOM.streakNum) DOM.streakNum.textContent = '0';
            }
        });
    }

    // Badges modal
    const btnCloseBadges = document.getElementById('btn-close-badges');
    if (btnCloseBadges) btnCloseBadges.addEventListener('click', () => closeModal('modal-badges'));

    // Exercise cards on home screen
    document.querySelectorAll('.ex-card').forEach(card => {
        card.addEventListener('click', () => {
            S.selectedExercise = card.dataset.ex;
            document.querySelectorAll('.ex-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    // Auto-rest toggle
    const autoRestToggle = document.getElementById('home-autorest-toggle');
    if (autoRestToggle) {
        autoRestToggle.addEventListener('change', function () {
            S.autoRest = this.checked;
            saveSettings({ autoRest: S.autoRest, tutSeen: S.tutSeen, chalDone: S.chalDone });
        });
    }

    // Home links
    const homeHistoryBtn = document.getElementById('home-history-btn');
    if (homeHistoryBtn) {
        homeHistoryBtn.addEventListener('click', async () => {
            const history = await getWorkoutHistory();
            showHistoryModal(history);
        });
    }

    const homeBadgesBtn = document.getElementById('home-badges-btn');
    if (homeBadgesBtn) {
        homeBadgesBtn.addEventListener('click', () => showBadgesModal(S.badges));
    }

    // Start training button
    const btnStartTraining = document.getElementById('btn-start-training');
    if (btnStartTraining) {
        btnStartTraining.addEventListener('click', goTraining);
    }

    // Camera guide buttons
    const guideCamToggle = document.getElementById('guide-cam-toggle');
    if (guideCamToggle) {
        guideCamToggle.addEventListener('click', async () => {
            S.facingMode = S.facingMode === 'user' ? 'environment' : 'user';
            updateGuideCamLabel(S.facingMode);
            stopCamera();
            const pose = getPose();
            try {
                await startCamera(DOM.video, S.facingMode, pose);
            } catch {
                showCameraError(true);
            }
        });
    }

    const btnGuideReady = document.getElementById('btn-guide-ready');
    if (btnGuideReady) {
        btnGuideReady.addEventListener('click', () => {
            hideCameraGuide();
            runCountdown(beep);
        });
    }

    const btnGuideBack = document.getElementById('btn-guide-back');
    if (btnGuideBack) {
        btnGuideBack.addEventListener('click', () => {
            hideCameraGuide();
            stopCamera();
            goHome();
        });
    }

    // Interactive rep counter (+/- buttons)
    const btnRepMinus = document.getElementById('btn-rep-minus');
    const btnRepPlus = document.getElementById('btn-rep-plus');

    if (btnRepMinus) {
        btnRepMinus.addEventListener('click', () => {
            if (S.count > 0) {
                S.count--;
                setRepCounter(S.count);
                updateGoalBar(S.count, S.goal);
            }
        });
    }

    if (btnRepPlus) {
        btnRepPlus.addEventListener('click', () => {
            S.count++;
            setRepCounter(S.count);
            updateGoalBar(S.count, S.goal);
            beep(660, 0.06);
        });
    }

    // Profile creation form
    const btnSaveProfile = document.getElementById('btn-save-profile');
    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', async () => {
            const name = document.getElementById('profile-name')?.value?.trim() || 'Спортсмен';
            const weight = parseFloat(document.getElementById('profile-weight')?.value) || 70;
            const goal = document.getElementById('profile-goal')?.value || 'muscle';
            const extraWeight = parseFloat(document.getElementById('profile-extra-weight')?.value) || 0;

            const profile = { name, weight, extraWeight, goal };
            await saveProfile(profile);

            S.profileName = name;
            S.userWeight = weight;
            S.extraWeight = extraWeight;
            S.userGoal = goal;

            hideProfileScreen();
            goHome();
        });
    }

    // Edit profile button (from home screen)
    const btnEditProfile = document.getElementById('btn-edit-profile');
    if (btnEditProfile) {
        btnEditProfile.addEventListener('click', async () => {
            const profile = await getProfile();
            if (profile) {
                const nameInput = document.getElementById('profile-name');
                const weightInput = document.getElementById('profile-weight');
                const goalInput = document.getElementById('profile-goal');
                const extraInput = document.getElementById('profile-extra-weight');
                if (nameInput) nameInput.value = profile.name || '';
                if (weightInput) weightInput.value = profile.weight || 70;
                if (goalInput) goalInput.value = profile.goal || 'muscle';
                if (extraInput) extraInput.value = profile.extraWeight || 0;
            }
            showProfileScreen();
        });
    }
}

/* ==========================================================
   LOAD STATE FROM INDEXEDDB
   ========================================================== */

async function loadGameState() {
    const gameData = await getGameData();
    S.xp = gameData.xp || 0;
    S.badges = gameData.badges || [];
    S.totalReps = gameData.totalReps || {};
    S.exercisesUsed = gameData.exercisesUsed || [];
    S.totalCalAll = gameData.totalCalAll || 0;

    const streakD = await getStreak();
    const today = dayKey();
    const yesterday = dayKey(-1);
    if (streakD.last === today || streakD.last === yesterday) {
        S.streak = streakD.count;
    } else {
        S.streak = 0;
    }

    S.level = calcLevel(S.xp);

    const settings = await getSettings();
    S.autoRest = settings.autoRest !== false;
    S.tutSeen = settings.tutSeen || [];
    S.chalDone = settings.chalDone || null;

    const autoRestToggle = document.getElementById('home-autorest-toggle');
    if (autoRestToggle) autoRestToggle.checked = S.autoRest;

    // Load profile
    const profile = await getProfile();
    if (profile) {
        S.profileName = profile.name || '';
        S.userWeight = profile.weight || 70;
        S.extraWeight = profile.extraWeight || 0;
        S.userGoal = profile.goal || 'muscle';
    }

    // Load goal from input
    const homeGoalInput = document.getElementById('home-goal-input');
    S.goal = parseInt(DOM.goalInput?.value) || parseInt(homeGoalInput?.value) || 50;
}

/* ==========================================================
   INITIALIZATION
   ========================================================== */

async function init() {
    try {
        // Initialize IndexedDB
        await initDB();

        // Migrate from old localStorage if needed
        const migrated = await migrateFromLocalStorage();
        if (migrated) {
            console.log('Data migrated from localStorage to IndexedDB');
        }

        // Load state
        await loadGameState();

        // Initialize MediaPipe (non-fatal if CDN didn't load)
        try {
            if (typeof Pose !== 'undefined') {
                initPose(onResults);
            } else {
                console.warn('MediaPipe Pose not loaded — camera features unavailable');
            }
        } catch (poseErr) {
            console.warn('MediaPipe init failed:', poseErr);
        }

        // Update UI
        updateXPBar(S.xp, S.level, CFG.LEVELS);
        if (DOM.streakNum) DOM.streakNum.textContent = S.streak;

        // Preload guide images
        Object.values(CFG.CAMERA_GUIDE).forEach(g => {
            const img = new Image();
            img.src = g.img;
        });

        // Setup events
        setupEventListeners();

        // Signal that app loaded successfully
        window.__aiTrainerReady = true;

        // Check if profile exists
        const hasProf = await hasProfile();
        if (!hasProf) {
            // Show profile creation screen
            if (DOM.loading) DOM.loading.style.display = 'none';
            DOM.appScreen.style.display = 'none';
            DOM.homeScreen.style.display = 'none';
            showProfileScreen();
        } else {
            // Show home screen
            if (DOM.loading) DOM.loading.style.display = 'none';
            DOM.appScreen.style.display = 'none';
            DOM.homeScreen.style.display = 'block';

            const records = await getRecords();
            const challenge = getDailyChallenge();
            updateHomeScreen(S, records, challenge);

            // Show progress chart & trainer plan
            const history = await getWorkoutHistory();
            if (history.length >= 2) {
                renderProgressChart(history);
            }

            const profile = await getProfile();
            if (profile && history.length > 0) {
                const plan = generateWorkoutPlan(history, profile);
                showTrainerPlan(plan);
            }
        }
    } catch (err) {
        console.error('Init error:', err);
        // Fallback: hide loading, show home screen
        window.__aiTrainerReady = true;
        if (DOM.loading) DOM.loading.style.display = 'none';
        if (DOM.homeScreen) DOM.homeScreen.style.display = 'block';
    }
}

// Launch
init();

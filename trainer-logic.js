/**
 * trainer-logic.js — Exercise Processing & Smart Trainer Module
 * 
 * Contains:
 *   - Configuration constants
 *   - Angle/math calculations
 *   - Exercise state machines (pushup, pullup, squat, crunch with anti-cheat)
 *   - Form scoring
 *   - RPE calculation
 *   - Calorie calculation based on user profile
 *   - Trainer Brain: workout plan generation
 */

/* ==========================================================
   CONFIGURATION
   ========================================================== */

export const CFG = {
    REST_TRIGGER: 15000,
    REST_DURATION: 60,
    XP_PER_REP: 10,
    XP_CHALLENGE_BONUS: 50,

    // Base calories per rep (without weight adjustment)
    CAL_BASE: { pushup: 0.36, pullup: 1.0, squat: 0.32, crunch: 0.25 },

    NAMES: { pushup: 'Отжимания', pullup: 'Подтягивания', squat: 'Приседания', crunch: 'Пресс' },
    ICONS: { pushup: '💪', pullup: '🏋️', squat: '🦵', crunch: '🔥' },

    CAMERA_GUIDE: {
        pushup: {
            tips: [
                'Расположите телефон спереди, на расстоянии 1.5–2 метра',
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
        { id: 'first',       icon: '🎯', name: 'Первый шаг',         desc: 'Завершите первую тренировку' },
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

    LEVELS: (() => {
        const t = [0];
        for (let i = 1; i <= 50; i++) t.push(i * (i + 1) * 25);
        return t;
    })()
};

/* ==========================================================
   MATH HELPERS
   ========================================================== */

export function calcAngle(a, b, c) {
    const r = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let ang = Math.abs(r * 180 / Math.PI);
    if (ang > 180) ang = 360 - ang;
    return ang;
}

export function bodyIncline(shoulder, hip) {
    return Math.abs(Math.atan2(hip.y - shoulder.y, hip.x - shoulder.x) * 180 / Math.PI);
}

/* ==========================================================
   SYMMETRY
   ========================================================== */

export function calcSymmetry(landmarks) {
    const l11 = landmarks[11], l13 = landmarks[13], l15 = landmarks[15];
    const l12 = landmarks[12], l14 = landmarks[14], l16 = landmarks[16];
    const leftVis = l11.visibility > 0.4 && l13.visibility > 0.4 && l15.visibility > 0.4;
    const rightVis = l12.visibility > 0.4 && l14.visibility > 0.4 && l16.visibility > 0.4;

    if (leftVis && rightVis) {
        const leftAng = calcAngle(l11, l13, l15);
        const rightAng = calcAngle(l12, l14, l16);
        const max = Math.max(leftAng, rightAng, 1);
        return Math.round(100 - Math.abs(leftAng - rightAng) / max * 100);
    }
    return null;
}

/* ==========================================================
   FORM SCORE
   ========================================================== */

export function calcFormScore(mode, minAngle, bodyAngle, repTimes) {
    let rom = 0, align = 0, tempo = 30;

    if (mode === 'pushup') {
        if (minAngle <= 70) rom = 40;
        else if (minAngle <= 85) rom = 30;
        else if (minAngle <= 95) rom = 15;
        if (bodyAngle >= 50 && bodyAngle <= 70) align = 30;
        else if (bodyAngle >= 40 && bodyAngle <= 80) align = 20;
        else if (bodyAngle >= 35 && bodyAngle <= 90) align = 10;
    } else if (mode === 'squat') {
        if (minAngle <= 75) rom = 40;
        else if (minAngle <= 90) rom = 30;
        else if (minAngle <= 100) rom = 15;
        align = 25;
    } else if (mode === 'pullup') {
        if (minAngle <= 80) rom = 40;
        else if (minAngle <= 100) rom = 25;
        align = 25;
    } else if (mode === 'crunch') {
        if (minAngle <= 70) rom = 40;
        else if (minAngle <= 90) rom = 25;
        align = 25;
    }

    // Tempo consistency
    if (repTimes && repTimes.length >= 3) {
        const diffs = [];
        for (let i = repTimes.length - 3; i < repTimes.length - 1; i++) {
            diffs.push(repTimes[i + 1] - repTimes[i]);
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

/* ==========================================================
   CRUNCH STATE MACHINE (Anti-Cheat)
   
   States:
     'idle'        → Waiting for person to lie down in profile
     'calibrating' → Person detected in lying position, waiting 1.5s stability
     'ready'       → Calibration done, ready to count
     'up'          → Crunch performed (torso raised)
     'down'        → Returned to lying position (rep counted on next 'up')
   ========================================================== */

// Internal crunch calibration state
let crunchCalibrationStart = 0;
const CRUNCH_CALIBRATION_MS = 1500; // 1.5 seconds

export function resetCrunchCalibration() {
    crunchCalibrationStart = 0;
}

/**
 * Process crunch exercise with state machine
 * @returns {{ newStage, feedback, feedbackColor, isRep, formScore, showPartial, crunchStatus }}
 */
function processCrunch(landmarks, stage, minAngle, repTimes) {
    const s = landmarks[leftVis(landmarks) ? 11 : 12];
    const hip = landmarks[leftVis(landmarks) ? 23 : 24];
    const knee = landmarks[leftVis(landmarks) ? 25 : 26];

    if (!hip || !knee) return { newStage: stage, crunchStatus: 'no_body' };
    if (s.visibility < 0.5 || hip.visibility < 0.5 || knee.visibility < 0.5) {
        return { newStage: stage, crunchStatus: 'low_visibility' };
    }

    const bAngle = calcAngle(s, hip, knee);
    const result = {
        newStage: stage,
        feedback: '',
        feedbackColor: '',
        isRep: false,
        formScore: 0,
        showPartial: false,
        jointForArc: { x: hip.x, y: hip.y },
        angle: bAngle,
        crunchStatus: 'ok',
        newMinAngle: Math.min(minAngle, bAngle)
    };

    // State machine
    if (stage === 'idle' || stage === 'wait') {
        // Check if person is in lying position (angle > 130)
        if (bAngle > 130) {
            if (crunchCalibrationStart === 0) {
                crunchCalibrationStart = Date.now();
            }
            const elapsed = Date.now() - crunchCalibrationStart;
            if (elapsed >= CRUNCH_CALIBRATION_MS) {
                result.newStage = 'ready';
                result.feedback = '✅ Позиция зафиксирована! Начинайте';
                result.feedbackColor = '#00e676';
                result.crunchStatus = 'calibrated';
            } else {
                result.feedback = `⏳ Зафиксируйте позицию... ${((CRUNCH_CALIBRATION_MS - elapsed) / 1000).toFixed(1)}с`;
                result.feedbackColor = '#ffab40';
                result.crunchStatus = 'calibrating';
                result.newStage = 'idle';
            }
        } else {
            crunchCalibrationStart = 0;
            result.feedback = '🔄 Лягте на спину, согните колени';
            result.feedbackColor = '#ff4081';
            result.crunchStatus = 'waiting';
            result.newStage = 'idle';
        }
        return result;
    }

    // After calibration — normal counting
    if (stage === 'ready' || stage === 'down') {
        if (bAngle < 90) {
            const score = calcFormScore('crunch', minAngle, 0, repTimes);
            result.newStage = 'up';
            result.isRep = true;
            result.formScore = score;
            result.feedback = '⬇ Ложимся';
            result.feedbackColor = '#00e676';
        } else {
            result.feedback = '⬆ Скручиваемся!';
            result.feedbackColor = '#ff4081';
        }
    }

    if (stage === 'up') {
        if (bAngle > 140) {
            result.newStage = 'down';
            result.feedback = '⬆ Скручиваемся!';
            result.feedbackColor = '#ff4081';
        } else {
            result.feedback = '⬇ Ложимся';
            result.feedbackColor = '#00e676';
        }
    }

    return result;
}

function leftVis(landmarks) {
    const leftV = ((landmarks[11].visibility || 0) + (landmarks[13].visibility || 0) + (landmarks[15].visibility || 0)) / 3;
    const rightV = ((landmarks[12].visibility || 0) + (landmarks[14].visibility || 0) + (landmarks[16].visibility || 0)) / 3;
    return leftV > rightV;
}

/* ==========================================================
   EXERCISE PROCESSING
   ========================================================== */

/**
 * Process a single frame of exercise detection.
 * 
 * @param {Array} landmarks - MediaPipe pose landmarks
 * @param {string} mode - Exercise type (pushup, pullup, squat, crunch)
 * @param {Object} state - Current exercise state { stage, minAngle, startY, repTimes }
 * @returns {Object} result - { newStage, newMinAngle, feedback, feedbackColor, isRep, formScore, showPartial, jointForArc, angle, symmetry }
 */
export function processExercise(landmarks, mode, state) {
    const useLeft = leftVis(landmarks);
    let s, e, w, hip, knee, ankle, nose = landmarks[0];
    if (useLeft) {
        s = landmarks[11]; e = landmarks[13]; w = landmarks[15];
        hip = landmarks[23]; knee = landmarks[25]; ankle = landmarks[27];
    } else {
        s = landmarks[12]; e = landmarks[14]; w = landmarks[16];
        hip = landmarks[24]; knee = landmarks[26]; ankle = landmarks[28];
    }

    if (!s || !e || !w || s.visibility < 0.5 || e.visibility < 0.5) {
        return null; // Not enough visibility
    }

    const symmetry = calcSymmetry(landmarks);
    let result = {
        newStage: state.stage,
        newMinAngle: state.minAngle,
        feedback: '',
        feedbackColor: '',
        isRep: false,
        formScore: 0,
        showPartial: false,
        jointForArc: null,
        angle: 0,
        symmetry
    };

    // --- PUSHUP ---
    if (mode === 'pushup') {
        const angle = calcAngle(s, e, w);
        result.jointForArc = { x: e.x, y: e.y };
        result.angle = angle;

        if (!hip || hip.visibility < 0.5) return null;
        const bAngle = bodyIncline(s, hip);
        if (bAngle < 35 || bAngle > 145) return null;

        result.newMinAngle = Math.min(state.minAngle, angle);

        if (angle > 160) {
            if (state.stage === 'down') {
                const score = calcFormScore(mode, state.minAngle, bAngle, state.repTimes);
                result.isRep = true;
                result.formScore = score;
            }
            result.newStage = 'up';
            result.feedback = '⬇ Вниз';
            result.feedbackColor = '#ff4081';
        }
        if (angle < 90) {
            result.newStage = 'down';
            result.feedback = '⬆ Вверх';
            result.feedbackColor = '#00e676';
        }
        if (angle >= 90 && angle < 115 && state.stage === 'up') {
            result.showPartial = true;
        }
    }

    // --- PULLUP ---
    else if (mode === 'pullup') {
        const angle = calcAngle(s, e, w);
        result.jointForArc = { x: e.x, y: e.y };
        result.angle = angle;
        if (w.y > s.y) return null;
        result.newMinAngle = Math.min(state.minAngle, angle);

        if (angle > 140) {
            result.newStage = 'hang';
            result.feedback = '⬆ Тяни!';
            result.feedbackColor = '#ff4081';
        }
        if (angle < 100 && state.stage === 'hang') {
            const travel = (state.startY || nose.y) - nose.y;
            if (travel > 0.15) {
                const score = calcFormScore(mode, state.minAngle, 0, state.repTimes);
                result.isRep = true;
                result.formScore = score;
                result.newStage = 'up';
            }
        }
        if (angle > 130 && state.stage === 'up') {
            result.feedback = '⬇ Вниз';
            result.feedbackColor = '#00e676';
            result.newStage = 'wait';
        }
        // Track start Y for pullups
        if (result.newStage === 'hang') {
            result.startY = nose.y;
        }
    }

    // --- SQUAT ---
    else if (mode === 'squat') {
        if (!hip || !knee || !ankle) return null;
        if (hip.visibility < 0.5 || knee.visibility < 0.5 || ankle.visibility < 0.5) return null;
        const kAngle = calcAngle(hip, knee, ankle);
        result.jointForArc = { x: knee.x, y: knee.y };
        result.angle = kAngle;
        result.newMinAngle = Math.min(state.minAngle, kAngle);

        if (kAngle < 90) {
            result.newStage = 'down';
            result.feedback = '⬆ Встаём!';
            result.feedbackColor = '#00e676';
        }
        if (kAngle > 160) {
            if (state.stage === 'down') {
                const score = calcFormScore(mode, state.minAngle, 0, state.repTimes);
                result.isRep = true;
                result.formScore = score;
            }
            result.newStage = 'up';
            result.feedback = '⬇ Садимся';
            result.feedbackColor = '#ff4081';
        }
        if (kAngle >= 90 && kAngle < 110 && state.stage === 'up') {
            result.showPartial = true;
        }
    }

    // --- CRUNCH (State Machine with Anti-Cheat) ---
    else if (mode === 'crunch') {
        const crunchResult = processCrunch(landmarks, state.stage, state.minAngle, state.repTimes);
        result.newStage = crunchResult.newStage;
        result.feedback = crunchResult.feedback;
        result.feedbackColor = crunchResult.feedbackColor;
        result.isRep = crunchResult.isRep || false;
        result.formScore = crunchResult.formScore || 0;
        result.showPartial = crunchResult.showPartial || false;
        result.jointForArc = crunchResult.jointForArc || null;
        result.angle = crunchResult.angle || 0;
        result.crunchStatus = crunchResult.crunchStatus;
        if (crunchResult.newMinAngle !== undefined) {
            result.newMinAngle = crunchResult.newMinAngle;
        }
    }

    return result;
}

/* ==========================================================
   RPE CALCULATION (Rating of Perceived Exertion)
   
   Scale 1-10:
     1-3: Easy
     4-6: Moderate
     7-8: Hard
     9-10: Maximum
   ========================================================== */

export function calcRPE(reps, avgForm, durationSec, mode) {
    let rpe = 1;

    // Base RPE from rep count relative to exercise difficulty
    const repThresholds = {
        pushup: [10, 20, 35, 50, 75],
        pullup: [3, 6, 10, 15, 20],
        squat:  [15, 25, 40, 60, 80],
        crunch: [15, 30, 50, 70, 100]
    };
    const thresholds = repThresholds[mode] || repThresholds.pushup;

    if (reps >= thresholds[4]) rpe = 9;
    else if (reps >= thresholds[3]) rpe = 7;
    else if (reps >= thresholds[2]) rpe = 5;
    else if (reps >= thresholds[1]) rpe = 4;
    else if (reps >= thresholds[0]) rpe = 3;
    else rpe = 2;

    // Adjust for form degradation (lower form = harder, they're fatigued)
    if (avgForm < 50) rpe += 1;
    if (avgForm < 30) rpe += 1;

    // Adjust for duration (longer = more fatigue)
    if (durationSec > 600) rpe += 1;  // > 10 min
    if (durationSec > 1200) rpe += 1; // > 20 min

    return Math.min(10, Math.max(1, rpe));
}

/* ==========================================================
   CALORIE CALCULATION
   
   Adjusted for user weight:
     calories = baseCalPerRep * (userWeight / 70) * reps
     Extra weight adds 15% per 5kg
   ========================================================== */

export function calcCalories(mode, reps, userWeight = 70, extraWeight = 0) {
    const base = CFG.CAL_BASE[mode] || 0.3;
    const weightFactor = userWeight / 70; // normalized to 70kg baseline
    const extraFactor = 1 + (extraWeight / 5) * 0.15;
    return +(base * weightFactor * extraFactor * reps).toFixed(1);
}

export function calcCaloriesPerRep(mode, userWeight = 70, extraWeight = 0) {
    const base = CFG.CAL_BASE[mode] || 0.3;
    const weightFactor = userWeight / 70;
    const extraFactor = 1 + (extraWeight / 5) * 0.15;
    return base * weightFactor * extraFactor;
}

/* ==========================================================
   TRAINER BRAIN — Workout Plan Generation
   
   Takes user profile + history → returns today's plan
   ========================================================== */

/**
 * Generate workout plan based on history and user profile.
 * 
 * @param {Array} history - Recent workout entries
 * @param {{weight:number, extraWeight:number, goal:string}} profile
 * @returns {{exercise:string, targetReps:number, suggestedExtraWeight:number, reasoning:string, intensity:string}}
 */
export function generateWorkoutPlan(history, profile) {
    const goal = profile?.goal || 'muscle';
    const currentExtra = profile?.extraWeight || 0;

    // Get last 7 days of workouts
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const recentWorkouts = (history || []).filter(w =>
        w.timestamp && (now - w.timestamp) < weekMs
    );

    // Find the most recent workout
    const lastWorkout = recentWorkouts[0] || null;

    // Determine which exercise to suggest
    let suggestedExercise = 'pushup';
    const exerciseCounts = {};
    recentWorkouts.forEach(w => {
        exerciseCounts[w.type] = (exerciseCounts[w.type] || 0) + 1;
    });

    // Suggest the least-done exercise for variety, or the main one for the goal
    const allExercises = ['pushup', 'pullup', 'squat', 'crunch'];
    const undone = allExercises.filter(e => !exerciseCounts[e]);
    if (undone.length > 0) {
        suggestedExercise = undone[0];
    } else {
        // Pick least done
        suggestedExercise = allExercises.reduce((min, e) =>
            (exerciseCounts[e] || 0) < (exerciseCounts[min] || 0) ? e : min
        , allExercises[0]);
    }

    let targetReps = 20;
    let suggestedExtraWeight = currentExtra;
    let reasoning = '';
    let intensity = 'moderate'; // low, moderate, high

    // Goal-based logic
    if (goal === 'strength') {
        // Strength: fewer reps, more weight
        targetReps = 15;
        if (lastWorkout && lastWorkout.avgForm >= 75 && lastWorkout.count >= 15) {
            // Last workout was manageable → increase weight, keep reps moderate
            suggestedExtraWeight = currentExtra + 2;
            targetReps = 12;
            reasoning = 'Прошлая тренировка была успешной. Добавляем вес (+2 кг) и снижаем повторы для роста силы.';
            intensity = 'high';
        } else if (lastWorkout && lastWorkout.avgForm < 50) {
            // Last workout was hard → reduce weight slightly
            suggestedExtraWeight = Math.max(0, currentExtra - 1);
            targetReps = 15;
            reasoning = 'Форма была низкой в прошлый раз. Снижаем нагрузку для восстановления техники.';
            intensity = 'low';
        } else {
            reasoning = 'Стандартная силовая тренировка. Фокус на технике и контроле.';
            intensity = 'moderate';
        }
    } else if (goal === 'endurance') {
        // Endurance: more reps, less weight
        targetReps = 30;
        suggestedExtraWeight = Math.max(0, currentExtra - 1);
        if (lastWorkout && lastWorkout.count >= 30) {
            targetReps = lastWorkout.count + 5;
            reasoning = `Вы сделали ${lastWorkout.count} в прошлый раз. Увеличиваем цель на 5 для развития выносливости.`;
            intensity = 'moderate';
        } else if (lastWorkout && lastWorkout.count < 20) {
            targetReps = 25;
            reasoning = 'Начинаем с комфортного объёма и постепенно увеличиваем.';
            intensity = 'low';
        } else {
            reasoning = 'Стандартная тренировка на выносливость. Больше повторений, меньше вес.';
        }
    } else {
        // Muscle (hypertrophy): moderate reps and weight
        targetReps = 20;
        if (lastWorkout && lastWorkout.avgForm >= 70 && lastWorkout.count >= 20) {
            targetReps = 25;
            suggestedExtraWeight = currentExtra + 1;
            reasoning = 'Прогрессия нагрузки: добавляем повторы и вес для мышечного роста.';
            intensity = 'high';
        } else if (lastWorkout && lastWorkout.avgForm < 55) {
            targetReps = 18;
            reasoning = 'Фокус на технике. Делаем чуть меньше, но качественнее.';
            intensity = 'low';
        } else {
            reasoning = 'Стандартная тренировка на массу. 8-20 повторов в подходе — оптимальная зона.';
            intensity = 'moderate';
        }
    }

    return {
        exercise: suggestedExercise,
        exerciseName: CFG.NAMES[suggestedExercise],
        targetReps: Math.max(5, Math.round(targetReps)),
        suggestedExtraWeight: Math.max(0, suggestedExtraWeight),
        reasoning,
        intensity,
        goalName: goal === 'strength' ? 'Сила' : goal === 'endurance' ? 'Выносливость' : 'Мышечная масса'
    };
}

/* ==========================================================
   TEMPO ANALYSIS
   ========================================================== */

export function analyzeTempo(repTimes) {
    if (repTimes.length < 2) return null;
    const dt = (repTimes[repTimes.length - 1] - repTimes[repTimes.length - 2]) / 1000;
    if (dt < 1.5) return { label: '⚡ Быстро', color: '#ff4081' };
    if (dt < 3.5) return { label: '✓ Нормально', color: '#00e676' };
    return { label: '🐢 Медленно', color: '#ffab40' };
}

export function checkFatigue(repTimes) {
    if (repTimes.length < 8) return false;
    const first5 = [];
    for (let i = 1; i < 6 && i < repTimes.length; i++) {
        first5.push(repTimes[i] - repTimes[i - 1]);
    }
    const last3 = [];
    const n = repTimes.length;
    for (let i = n - 3; i < n; i++) {
        last3.push(repTimes[i] - repTimes[i - 1]);
    }
    const avgFirst = first5.reduce((a, b) => a + b, 0) / first5.length;
    const avgLast = last3.reduce((a, b) => a + b, 0) / last3.length;
    return avgLast > avgFirst * 1.8;
}

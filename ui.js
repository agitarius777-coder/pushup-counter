/**
 * ui.js — UI Management Module
 * 
 * Contains:
 *   - DOM references
 *   - Modal management
 *   - HUD updates (rep counter, form ring, goal bar, XP bar, etc.)
 *   - Interactive rep counter (+/-)
 *   - Confetti animation
 *   - Share card generation
 *   - History modal with SVG chart
 *   - Badges modal
 *   - Profile creation screen
 *   - Progress visualization (SVG line chart)
 *   - Countdown 3-2-1
 *   - Camera guide screen
 */

import { CFG } from './trainer-logic.js';

/* ==========================================================
   DOM REFERENCES
   ========================================================== */

const $ = id => document.getElementById(id);

export const DOM = {
    loading:       $('loading'),
    homeScreen:    $('home-screen'),
    appScreen:     $('app-screen'),
    cameraGuide:   $('camera-guide'),
    countdownOvl:  $('countdown-overlay'),
    countdownNum:  $('countdown-num'),
    profileScreen: $('profile-screen'),

    // XP
    xpFill:        $('xp-fill'),
    xpLevel:       $('xp-level'),
    xpText:        $('xp-text'),
    streakNum:     $('streak-num'),

    // Goal
    goalFill:      $('goal-fill'),
    goalLabel:     $('goal-label'),
    goalInput:     $('goal-input'),

    // Exercise
    exerciseSel:   $('exercise-select'),

    // Video/Canvas
    video:         $('video'),
    canvas:        $('canvas'),
    confettiCvs:   $('confetti-canvas'),

    // HUD
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

    // Celebrations
    celebGoal:     $('celebration-goal'),
    celebLevel:    $('celebration-level'),
    levelUpText:   $('levelup-text'),
    badgePopup:    $('badge-popup'),
    badgePopIcon:  $('badge-popup-icon'),
    badgePopName:  $('badge-popup-name'),

    // Rest
    restOverlay:   $('rest-overlay'),
    restCountdown: $('rest-countdown'),

    // Camera error
    cameraError:   $('camera-error'),

    // Modals
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

    // Interactive counter buttons
    btnRepMinus:   $('btn-rep-minus'),
    btnRepPlus:    $('btn-rep-plus'),

    // Trainer plan
    trainerPlan:   $('trainer-plan'),
    trainerPlanContent: $('trainer-plan-content'),

    // Progress chart
    progressChart: $('progress-chart'),
};

export const ctx = DOM.canvas ? DOM.canvas.getContext('2d') : null;
const confCtx = DOM.confettiCvs ? DOM.confettiCvs.getContext('2d') : null;

/* ==========================================================
   MODALS
   ========================================================== */

export function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
}

export function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

// Close on backdrop click
export function initModalBackdrops() {
    document.querySelectorAll('.modal-backdrop').forEach(el => {
        el.addEventListener('click', () => el.parentElement.classList.remove('open'));
    });
}

/* ==========================================================
   HUD UPDATES
   ========================================================== */

export function updateRepCounter(count) {
    if (!DOM.repCounter) return;
    DOM.repCounter.textContent = count;
    DOM.repCounter.classList.add('pulse');
    setTimeout(() => DOM.repCounter.classList.remove('pulse'), 200);
}

export function setRepCounter(count) {
    if (!DOM.repCounter) return;
    DOM.repCounter.textContent = count;
}

export function updateFormRing(score) {
    if (!DOM.formScore) return;
    DOM.formScore.textContent = score;
    DOM.formRingPath.setAttribute('stroke-dasharray', score + ', 100');
    let color;
    if (score >= 80) color = '#00e676';
    else if (score >= 60) color = '#ffd740';
    else if (score >= 40) color = '#ff9100';
    else color = '#ff5252';
    DOM.formRingPath.style.stroke = color;
}

export function updateGoalBar(count, goal) {
    if (!DOM.goalFill) return;
    const pct = Math.min((count / goal) * 100, 100);
    DOM.goalFill.style.width = pct + '%';
    DOM.goalLabel.textContent = count + ' / ' + goal;
}

export function updateXPBar(xp, level, levels) {
    if (!DOM.xpFill) return;
    const curThresh = levels[level - 1] || 0;
    const nextThresh = levels[level] || curThresh + 100;
    const progress = (xp - curThresh) / (nextThresh - curThresh) * 100;
    DOM.xpFill.style.width = Math.min(progress, 100) + '%';
    DOM.xpLevel.textContent = 'Ур. ' + level;
    DOM.xpText.textContent = (xp - curThresh) + ' / ' + (nextThresh - curThresh) + ' XP';
}

export function updateTimer(elapsedMs) {
    if (!DOM.timerVal) return;
    DOM.timerVal.textContent = fmtTime(elapsedMs);
}

export function updateCalories(cal) {
    if (!DOM.calVal) return;
    DOM.calVal.textContent = cal.toFixed(1);
}

export function updateSymmetry(sym) {
    if (!DOM.symVal) return;
    if (sym === null) return;
    DOM.symVal.textContent = sym + '%';
    DOM.symVal.style.color = sym >= 85 ? '#00e676' : sym >= 65 ? '#ffd740' : '#ff5252';
}

export function updateSets(sets) {
    if (!DOM.setsVal) return;
    DOM.setsVal.textContent = sets;
}

export function showFeedback(text, color) {
    if (!DOM.feedback) return;
    DOM.feedback.textContent = text;
    if (color) DOM.feedback.style.color = color;
}

export function showPartialWarning(show) {
    if (!DOM.partialWarn) return;
    DOM.partialWarn.classList.toggle('show', show);
}

export function showFatigueHint(text) {
    if (!DOM.fatigueHint) return;
    DOM.fatigueHint.textContent = text;
    DOM.fatigueHint.classList.add('show');
    setTimeout(() => DOM.fatigueHint.classList.remove('show'), 4000);
}

export function updateTempoPill(tempo) {
    if (!DOM.tempoPill) return;
    if (!tempo) {
        DOM.tempoPill.style.display = 'none';
        return;
    }
    DOM.tempoPill.style.display = 'block';
    DOM.tempoPill.textContent = tempo.label;
    DOM.tempoPill.style.color = tempo.color;
}

/* ==========================================================
   CELEBRATIONS
   ========================================================== */

export function showGoalCelebration() {
    if (!DOM.celebGoal) return;
    DOM.celebGoal.classList.add('active');
    setTimeout(() => DOM.celebGoal.classList.remove('active'), 3000);
}

export function showLevelUp(level) {
    if (!DOM.celebLevel) return;
    DOM.levelUpText.textContent = '⬆ УРОВЕНЬ ' + level + '!';
    DOM.celebLevel.classList.add('active');
    setTimeout(() => DOM.celebLevel.classList.remove('active'), 2500);
}

// Badge popup queue
let badgeQueue = [];
let showingBadge = false;

export function showBadgePopup(badge) {
    badgeQueue.push(badge);
    processBadgeQueue();
}

function processBadgeQueue() {
    if (showingBadge || !badgeQueue.length) return;
    showingBadge = true;
    const b = badgeQueue.shift();
    DOM.badgePopIcon.textContent = b.icon;
    DOM.badgePopName.textContent = b.name;
    DOM.badgePopup.classList.add('show');
    setTimeout(() => {
        DOM.badgePopup.classList.remove('show');
        showingBadge = false;
        setTimeout(() => processBadgeQueue(), 300);
    }, 2500);
}

/* ==========================================================
   REST OVERLAY
   ========================================================== */

export function showRestOverlay(show) {
    if (!DOM.restOverlay) return;
    DOM.restOverlay.classList.toggle('active', show);
}

export function updateRestCountdown(sec) {
    if (!DOM.restCountdown) return;
    DOM.restCountdown.textContent = sec;
    DOM.restCountdown.classList.toggle('ending', sec <= 10);
}

/* ==========================================================
   CAMERA ERROR
   ========================================================== */

export function showCameraError(show) {
    if (!DOM.cameraError) return;
    DOM.cameraError.classList.toggle('active', show);
}

/* ==========================================================
   TUTORIAL
   ========================================================== */

export function showTutorial(exercise) {
    const t = CFG.TUTORIALS[exercise];
    if (!t) return;
    DOM.tutIcon.textContent = CFG.ICONS[exercise];
    DOM.tutTitle.textContent = CFG.NAMES[exercise];
    DOM.tutDesc.textContent = t.desc;
    DOM.tutTips.innerHTML = t.tips.map(x => '<li>' + x + '</li>').join('');
    openModal('modal-tutorial');
}

/* ==========================================================
   COUNTDOWN 3-2-1
   ========================================================== */

export function runCountdown(beepFn) {
    return new Promise(resolve => {
        let n = 3;
        DOM.countdownOvl.style.display = 'flex';
        DOM.countdownNum.textContent = n;
        if (beepFn) beepFn(440, 0.1);

        const iv = setInterval(() => {
            n--;
            if (n > 0) {
                DOM.countdownNum.textContent = n;
                DOM.countdownNum.style.animation = 'none';
                void DOM.countdownNum.offsetWidth;
                DOM.countdownNum.style.animation = 'countPulse .5s ease-out';
                if (beepFn) beepFn(440, 0.1);
            } else {
                DOM.countdownNum.textContent = 'GO!';
                DOM.countdownNum.style.color = '#00e676';
                DOM.countdownNum.style.animation = 'none';
                void DOM.countdownNum.offsetWidth;
                DOM.countdownNum.style.animation = 'countPulse .5s ease-out';
                if (beepFn) beepFn(880, 0.2);
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
   CAMERA GUIDE
   ========================================================== */

export function showCameraGuide(exercise, facingMode) {
    const guide = CFG.CAMERA_GUIDE[exercise];
    if (!guide) return;

    $('guide-exercise').textContent = CFG.NAMES[exercise];
    $('guide-image').src = guide.img;

    const tipsEl = $('guide-tips');
    tipsEl.innerHTML = guide.tips.map((tip, i) =>
        `<div class="guide-tip">
            <div class="guide-tip-icon">${i + 1}</div>
            <div>${tip}</div>
        </div>`
    ).join('');

    updateGuideCamLabel(facingMode);
    DOM.cameraGuide.classList.add('active');
}

export function hideCameraGuide() {
    DOM.cameraGuide.classList.remove('active');
}

export function updateGuideCamLabel(facingMode) {
    const el = $('guide-cam-toggle');
    if (el) el.textContent = facingMode === 'user' ? 'Фронтальная 🔄' : 'Задняя 🔄';
}

/* ==========================================================
   RESULTS MODAL
   ========================================================== */

export function showResults(entry, isRecord, state, records) {
    DOM.resultsTitle.textContent = isRecord ? '🎉 Новый рекорд!' : 'Тренировка завершена!';
    
    // RPE label
    const rpeLabels = ['', 'Очень легко', 'Легко', 'Легко', 'Умеренно', 'Умеренно', 
                       'Тяжело', 'Тяжело', 'Очень тяжело', 'Максимум', 'Максимум'];
    const rpeLabel = rpeLabels[entry.rpe] || '';

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
        ${entry.rpe ? `<div class="results-rpe">RPE: ${entry.rpe}/10 — ${rpeLabel}</div>` : ''}
        <div style="text-align:center;font-size:.8rem;color:var(--text-3)">
            🔥 Стрик: ${state.streak} дн. &nbsp;|&nbsp; ⭐ Уровень: ${state.level} &nbsp;|&nbsp; XP: ${state.xp}
        </div>
    `;
    openModal('modal-results');
}

/* ==========================================================
   SHARE CARD
   ========================================================== */

export function generateShareCard(state, exerciseType) {
    const c = DOM.shareCanvas;
    if (!c) return;
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

    // Exercise name
    cx.fillStyle = '#aaa'; cx.font = '32px Inter';
    cx.fillText(CFG.NAMES[exerciseType], 540, 220);

    // Big count
    cx.fillStyle = '#00e676'; cx.font = '900 180px Inter, sans-serif';
    cx.fillText(String(state.count), 540, 460);
    cx.fillStyle = '#666'; cx.font = '24px Inter';
    cx.fillText('ПОВТОРЕНИЙ', 540, 510);

    // Stats row
    const stats = [
        { label: 'Подходов', val: state.sets },
        { label: 'Ккал', val: state.totalCal.toFixed(1) },
        { label: 'Форма', val: state.avgForm || '—' },
        { label: 'Время', val: fmtTime(Date.now() - (state.workoutStart || Date.now())) }
    ];
    const startX = 140;
    stats.forEach((st, i) => {
        const x = startX + i * 220;
        cx.fillStyle = '#888'; cx.font = '20px Inter'; cx.fillText(st.label, x, 620);
        cx.fillStyle = '#fff'; cx.font = '700 40px Inter'; cx.fillText(String(st.val), x, 670);
    });

    // Level + streak
    cx.fillStyle = '#ce93d8'; cx.font = '600 26px Inter';
    cx.fillText('Уровень ' + state.level + '  |  🔥 Стрик ' + state.streak + ' дн.', 540, 800);

    // Date
    cx.fillStyle = '#444'; cx.font = '22px Inter';
    cx.fillText(new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }), 540, 900);

    // Watermark
    cx.fillStyle = '#333'; cx.font = '18px Inter';
    cx.fillText('ai-trainer', 540, 1000);
}

export async function shareResults(state, exerciseType) {
    generateShareCard(state, exerciseType);
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
    } catch (e) {
        console.warn('Share failed:', e);
    }
}

/* ==========================================================
   HISTORY MODAL WITH SVG CHART
   ========================================================== */

export function showHistoryModal(history) {
    // Chart — SVG-based
    const last7 = (history || []).slice(0, 7).reverse();
    if (last7.length > 1) {
        const max = Math.max(...last7.map(h => h.count), 1);
        DOM.chartArea.style.display = 'block';
        DOM.chartArea.innerHTML = '<div class="chart-title">Последние тренировки</div><div class="chart-bars">' +
            last7.map(h => {
                const dateStr = h.date || new Date(h.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                return `<div class="chart-col">
                    <div class="chart-col-val">${h.count}</div>
                    <div class="chart-bar-outer">
                        <div class="chart-bar-inner" style="height:${(h.count / max) * 100}%"></div>
                    </div>
                    <div class="chart-col-lbl">${dateStr}</div>
                </div>`;
            }).join('') + '</div>';
    } else {
        DOM.chartArea.style.display = 'none';
    }

    // List
    if (!history || !history.length) {
        DOM.historyList.innerHTML = '<div style="color:var(--text-3);text-align:center;padding:20px">Нет записей</div>';
    } else {
        DOM.historyList.innerHTML = history.map(h => {
            const dateStr = h.date || new Date(h.timestamp).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
            const timeStr = h.time || new Date(h.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            return `
                <div class="history-item">
                    <div><span class="hi-date">${dateStr}, ${timeStr}</span></div>
                    <span class="hi-type">${h.typeName || CFG.NAMES[h.type] || h.type}</span>
                    <div class="hi-stats">
                        <span class="hi-count">${h.count} раз</span>
                        <div class="hi-detail">${h.sets || '?'} подх. · ${h.calories || 0} ккал · Ф:${h.avgForm || '—'}</div>
                    </div>
                </div>`;
        }).join('');
    }
    openModal('modal-history');
}

/* ==========================================================
   BADGES MODAL
   ========================================================== */

export function showBadgesModal(unlockedBadges) {
    DOM.badgesGrid.innerHTML = CFG.BADGES.map(b => {
        const unlocked = (unlockedBadges || []).includes(b.id);
        return `<div class="badge-cell ${unlocked ? 'unlocked' : 'locked'}">
            <div class="badge-cell-icon">${b.icon}</div>
            <div class="badge-cell-name">${b.name}</div>
        </div>`;
    }).join('');
    openModal('modal-badges');
}

/* ==========================================================
   PROFILE SCREEN (First-time setup)
   ========================================================== */

export function showProfileScreen() {
    if (DOM.profileScreen) DOM.profileScreen.style.display = 'flex';
}

export function hideProfileScreen() {
    if (DOM.profileScreen) DOM.profileScreen.style.display = 'none';
}

/* ==========================================================
   HOME SCREEN UPDATES
   ========================================================== */

export function updateHomeScreen(state, records, challenge) {
    // Stats
    const levelEl = $('home-level');
    const xpEl = $('home-xp');
    const streakEl = $('home-streak');
    if (levelEl) levelEl.textContent = 'Ур. ' + state.level;
    if (xpEl) xpEl.textContent = state.xp;
    if (streakEl) streakEl.textContent = state.streak;

    // User name
    const nameEl = $('home-user-name');
    if (nameEl && state.profileName) {
        nameEl.textContent = state.profileName;
        nameEl.style.display = 'block';
    }

    // Records
    ['pushup', 'pullup', 'squat', 'crunch'].forEach(ex => {
        const el = $('rec-' + ex);
        if (el) el.textContent = records[ex] ? 'Рекорд: ' + records[ex] : 'Рекорд: —';
    });

    // Daily challenge
    const banner = $('home-challenge');
    if (challenge && banner) {
        banner.style.display = 'flex';
        $('home-challenge-text').textContent = challenge.label;
    } else if (banner) {
        banner.style.display = 'none';
    }

    // Sync selected card
    const sel = state.selectedExercise || 'pushup';
    document.querySelectorAll('.ex-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.ex === sel);
    });
}

/* ==========================================================
   TRAINER PLAN DISPLAY
   ========================================================== */

export function showTrainerPlan(plan) {
    const el = DOM.trainerPlan;
    const content = DOM.trainerPlanContent;
    if (!el || !content) return;

    const intensityColors = { low: '#00e676', moderate: '#ffd740', high: '#ff4081' };
    const intensityLabels = { low: 'Лёгкая', moderate: 'Средняя', high: 'Высокая' };

    content.innerHTML = `
        <div class="plan-header">
            <span class="plan-icon">${CFG.ICONS[plan.exercise] || '💪'}</span>
            <div class="plan-info">
                <div class="plan-exercise">${plan.exerciseName}</div>
                <div class="plan-target">${plan.targetReps} повторений</div>
            </div>
            <div class="plan-intensity" style="color:${intensityColors[plan.intensity]}">
                ${intensityLabels[plan.intensity]}
            </div>
        </div>
        ${plan.suggestedExtraWeight > 0 ? `<div class="plan-weight">🏋️ Утяжелители: ${plan.suggestedExtraWeight} кг</div>` : ''}
        <div class="plan-reasoning">${plan.reasoning}</div>
        <div class="plan-goal-badge">Цель: ${plan.goalName}</div>
    `;
    el.style.display = 'block';
}

export function hideTrainerPlan() {
    if (DOM.trainerPlan) DOM.trainerPlan.style.display = 'none';
}

/* ==========================================================
   PROGRESS CHART (SVG Line Chart)
   ========================================================== */

export function renderProgressChart(history, container) {
    const el = container || DOM.progressChart;
    if (!el) return;

    // Get last 30 days of data
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const recent = (history || []).filter(w => w.timestamp && (now - w.timestamp) < thirtyDaysMs);

    if (recent.length < 2) {
        el.innerHTML = '<div class="progress-empty">Недостаточно данных. Тренируйтесь чаще!</div>';
        return;
    }

    // Aggregate by day
    const dailyData = {};
    recent.forEach(w => {
        const day = new Date(w.timestamp).toISOString().slice(0, 10);
        if (!dailyData[day]) dailyData[day] = 0;
        dailyData[day] += w.count;
    });

    const sortedDays = Object.keys(dailyData).sort();
    const values = sortedDays.map(d => dailyData[d]);
    const maxVal = Math.max(...values, 1);

    // SVG dimensions
    const width = 320;
    const height = 140;
    const padding = { top: 15, right: 10, bottom: 25, left: 35 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    // Generate points
    const points = values.map((v, i) => {
        const x = padding.left + (i / (values.length - 1)) * plotW;
        const y = padding.top + plotH - (v / maxVal) * plotH;
        return { x, y, val: v, day: sortedDays[i] };
    });

    // Create SVG path
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    // Area path (for gradient fill)
    const areaPath = linePath + ` L ${points[points.length - 1].x.toFixed(1)} ${padding.top + plotH} L ${points[0].x.toFixed(1)} ${padding.top + plotH} Z`;

    // Y axis labels
    const yLabels = [0, Math.round(maxVal / 2), maxVal];

    // X axis labels (first and last)
    const formatDate = (d) => {
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    el.innerHTML = `
        <div class="progress-title">Прогресс за месяц (повторений/день)</div>
        <svg viewBox="0 0 ${width} ${height}" class="progress-svg">
            <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="rgba(0,230,118,0.3)"/>
                    <stop offset="100%" stop-color="rgba(0,230,118,0.02)"/>
                </linearGradient>
            </defs>
            
            <!-- Grid lines -->
            ${yLabels.map(v => {
                const y = padding.top + plotH - (v / maxVal) * plotH;
                return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
                        <text x="${padding.left - 5}" y="${y + 3}" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="8">${v}</text>`;
            }).join('')}
            
            <!-- Area fill -->
            <path d="${areaPath}" fill="url(#chartGrad)"/>
            
            <!-- Line -->
            <path d="${linePath}" fill="none" stroke="#00e676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            
            <!-- Points -->
            ${points.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#00e676" stroke="#0a0a1a" stroke-width="1.5"/>`).join('')}
            
            <!-- X axis labels -->
            <text x="${padding.left}" y="${height - 5}" fill="rgba(255,255,255,0.4)" font-size="7">${formatDate(sortedDays[0])}</text>
            <text x="${width - padding.right}" y="${height - 5}" text-anchor="end" fill="rgba(255,255,255,0.4)" font-size="7">${formatDate(sortedDays[sortedDays.length - 1])}</text>
        </svg>
    `;
}

/* ==========================================================
   CONFETTI
   ========================================================== */

let confParts = [], confRunning = false;

export function launchConfetti() {
    if (!DOM.confettiCvs || !confCtx) return;
    DOM.confettiCvs.width = DOM.confettiCvs.clientWidth;
    DOM.confettiCvs.height = DOM.confettiCvs.clientHeight;
    const colors = ['#00e676', '#ffd740', '#ff4081', '#40c4ff', '#ff6d00', '#e040fb', '#76ff03'];
    confParts = [];
    for (let i = 0; i < 100; i++) {
        confParts.push({
            x: DOM.confettiCvs.width / 2 + (Math.random() - .5) * 80,
            y: DOM.confettiCvs.height / 2,
            vx: (Math.random() - .5) * 14,
            vy: -Math.random() * 12 - 3,
            w: Math.random() * 8 + 3,
            h: Math.random() * 5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * 360,
            rotV: (Math.random() - .5) * 14,
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
        p.x += p.vx; p.y += p.vy; p.vy += 0.28;
        p.rot += p.rotV; p.life -= 0.009;
        confCtx.save();
        confCtx.translate(p.x, p.y);
        confCtx.rotate(p.rot * Math.PI / 180);
        confCtx.globalAlpha = Math.max(0, p.life);
        confCtx.fillStyle = p.color;
        confCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confCtx.restore();
    }
    if (alive) requestAnimationFrame(animConf);
    else {
        confRunning = false;
        confCtx.clearRect(0, 0, DOM.confettiCvs.width, DOM.confettiCvs.height);
    }
}

/* ==========================================================
   RESET HUD
   ========================================================== */

export function resetHUD() {
    if (DOM.repCounter) DOM.repCounter.textContent = '0';
    if (DOM.setsVal) DOM.setsVal.textContent = '1';
    if (DOM.timerVal) DOM.timerVal.textContent = '00:00';
    if (DOM.calVal) DOM.calVal.textContent = '0';
    if (DOM.symVal) {
        DOM.symVal.textContent = '—';
        DOM.symVal.style.color = '';
    }
    if (DOM.formScore) DOM.formScore.textContent = '—';
    if (DOM.formRingPath) DOM.formRingPath.setAttribute('stroke-dasharray', '0, 100');
    if (DOM.feedback) {
        DOM.feedback.textContent = 'Встаньте перед камерой';
        DOM.feedback.style.color = '#fff';
    }
    if (DOM.tempoPill) DOM.tempoPill.style.display = 'none';
    if (DOM.restOverlay) DOM.restOverlay.classList.remove('active');
    if (DOM.partialWarn) DOM.partialWarn.classList.remove('show');
}

/* ==========================================================
   UTILITY
   ========================================================== */

export function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

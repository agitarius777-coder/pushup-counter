/**
 * storage.js — IndexedDB Storage Module (Local-First Architecture)
 * 
 * Two stores:
 *   - userProfile: key-value store for profile, game data, settings, records
 *   - workoutHistory: auto-increment store for workout entries
 * 
 * Includes migration from old localStorage data.
 */

const DB_NAME = 'AITrainerDB';
const DB_VERSION = 1;

let db = null;

/* ==========================================================
   CORE DB OPERATIONS
   ========================================================== */

export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const database = e.target.result;
            if (!database.objectStoreNames.contains('userProfile')) {
                database.createObjectStore('userProfile');
            }
            if (!database.objectStoreNames.contains('workoutHistory')) {
                const store = database.createObjectStore('workoutHistory', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('type', 'type', { unique: false });
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };

        request.onerror = (e) => {
            console.error('IndexedDB error:', e.target.error);
            reject(e.target.error);
        };
    });
}

/* ---------- Generic key-value helpers for userProfile store ---------- */

function profileGet(key) {
    return new Promise((resolve, reject) => {
        if (!db) { resolve(null); return; }
        const tx = db.transaction('userProfile', 'readonly');
        const store = tx.objectStore('userProfile');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

function profileSet(key, value) {
    return new Promise((resolve, reject) => {
        if (!db) { reject(new Error('DB not ready')); return; }
        const tx = db.transaction('userProfile', 'readwrite');
        const store = tx.objectStore('userProfile');
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

function profileDelete(key) {
    return new Promise((resolve, reject) => {
        if (!db) { reject(new Error('DB not ready')); return; }
        const tx = db.transaction('userProfile', 'readwrite');
        const store = tx.objectStore('userProfile');
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

/* ==========================================================
   USER PROFILE
   ========================================================== */

/**
 * @returns {Promise<{name:string, weight:number, extraWeight:number, goal:string}|null>}
 */
export async function getProfile() {
    return profileGet('profile');
}

/**
 * @param {{name:string, weight:number, extraWeight:number, goal:string}} profile
 */
export async function saveProfile(profile) {
    return profileSet('profile', profile);
}

export async function hasProfile() {
    const p = await getProfile();
    return p !== null && p.name;
}

/* ==========================================================
   GAME DATA (xp, badges, streaks, etc.)
   ========================================================== */

const DEFAULT_GAME_DATA = {
    xp: 0,
    badges: [],
    totalReps: {},
    exercisesUsed: [],
    totalCalAll: 0
};

export async function getGameData() {
    const data = await profileGet('gameData');
    return data || { ...DEFAULT_GAME_DATA };
}

export async function saveGameData(data) {
    return profileSet('gameData', data);
}

/* ==========================================================
   STREAK
   ========================================================== */

export async function getStreak() {
    const data = await profileGet('streak');
    return data || { last: '', count: 0 };
}

export async function saveStreak(streakData) {
    return profileSet('streak', streakData);
}

/* ==========================================================
   RECORDS
   ========================================================== */

export async function getRecords() {
    const data = await profileGet('records');
    return data || {};
}

export async function saveRecords(records) {
    return profileSet('records', records);
}

/* ==========================================================
   SETTINGS
   ========================================================== */

export async function getSettings() {
    const data = await profileGet('settings');
    return data || { autoRest: true, tutSeen: [], chalDone: null };
}

export async function saveSettings(settings) {
    return profileSet('settings', settings);
}

/* ==========================================================
   WORKOUT HISTORY
   ========================================================== */

export async function getWorkoutHistory() {
    return new Promise((resolve, reject) => {
        if (!db) { resolve([]); return; }
        const tx = db.transaction('workoutHistory', 'readonly');
        const store = tx.objectStore('workoutHistory');
        const req = store.getAll();
        req.onsuccess = () => {
            // Sort by timestamp descending (newest first)
            const results = req.result || [];
            results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            resolve(results);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function addWorkout(entry) {
    return new Promise((resolve, reject) => {
        if (!db) { reject(new Error('DB not ready')); return; }
        // Ensure timestamp
        if (!entry.timestamp) entry.timestamp = Date.now();
        const tx = db.transaction('workoutHistory', 'readwrite');
        const store = tx.objectStore('workoutHistory');
        const req = store.add(entry);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function getWorkoutsByMonth(year, month) {
    const history = await getWorkoutHistory();
    return history.filter(w => {
        const d = new Date(w.timestamp);
        return d.getFullYear() === year && d.getMonth() === month;
    });
}

/* ==========================================================
   CLEAR ALL DATA
   ========================================================== */

export async function clearAllData() {
    return new Promise((resolve, reject) => {
        if (!db) { resolve(); return; }
        const tx = db.transaction(['userProfile', 'workoutHistory'], 'readwrite');
        tx.objectStore('userProfile').clear();
        tx.objectStore('workoutHistory').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/* ==========================================================
   MIGRATION FROM LOCALSTORAGE
   ========================================================== */

export async function migrateFromLocalStorage() {
    const prefix = 'ait_';

    function lsGet(key) {
        try { return JSON.parse(localStorage.getItem(prefix + key)); }
        catch { return null; }
    }

    // Check if migration is needed
    const migrated = await profileGet('_migrated');
    if (migrated) return false;

    let hasSomething = false;

    // Migrate game data
    const xp = lsGet('xp');
    const badges = lsGet('badges');
    const totalReps = lsGet('totalReps');
    const exUsed = lsGet('exUsed');
    const totalCal = lsGet('totalCal');
    if (xp !== null || badges !== null) {
        hasSomething = true;
        await saveGameData({
            xp: xp || 0,
            badges: badges || [],
            totalReps: totalReps || {},
            exercisesUsed: exUsed || [],
            totalCalAll: totalCal || 0
        });
    }

    // Migrate streak
    const streak = lsGet('streak');
    if (streak) {
        hasSomething = true;
        await saveStreak(streak);
    }

    // Migrate records
    const records = lsGet('records');
    if (records) {
        hasSomething = true;
        await saveRecords(records);
    }

    // Migrate settings
    const autoRest = lsGet('autoRest');
    const tutSeen = lsGet('tutSeen');
    const chalDone = lsGet('chalDone');
    if (autoRest !== null || tutSeen || chalDone) {
        hasSomething = true;
        await saveSettings({
            autoRest: autoRest !== false,
            tutSeen: tutSeen || [],
            chalDone: chalDone || null
        });
    }

    // Migrate history
    const history = lsGet('history');
    if (history && Array.isArray(history)) {
        hasSomething = true;
        for (const entry of history) {
            // Add timestamp from date string if possible
            if (!entry.timestamp) {
                entry.timestamp = Date.now() - (history.indexOf(entry) * 86400000);
            }
            await addWorkout(entry);
        }
    }

    // Mark migration as done
    await profileSet('_migrated', true);

    return hasSomething;
}

/* ==========================================================
   UTILITY
   ========================================================== */

export function dayKey(offset = 0) {
    const d = new Date();
    if (offset) d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
}

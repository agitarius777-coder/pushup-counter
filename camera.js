/**
 * camera.js — MediaPipe & Camera Management Module
 * 
 * Contains:
 *   - MediaPipe Pose initialization
 *   - Camera start/stop
 *   - Object-fit:cover coordinate mapping (fixes video distortion)
 *   - Skeleton drawing (thin, semi-transparent lines)
 *   - Angle arc drawing
 */

/* global Pose, Camera, POSE_CONNECTIONS, drawConnectors, drawLandmarks */

let poseInstance = null;
let cameraInstance = null;

/* ==========================================================
   OBJECT-FIT:COVER COORDINATE MAPPING
   
   When video uses object-fit:cover, the visible portion is cropped.
   We need to calculate the crop region and map landmarks accordingly.
   ========================================================== */

/**
 * Calculate the source crop rectangle for object-fit:cover behavior.
 * Returns the region of the video that's actually visible on the canvas.
 */
export function getCoverCropParams(videoWidth, videoHeight, canvasWidth, canvasHeight) {
    if (!videoWidth || !videoHeight || !canvasWidth || !canvasHeight) {
        return { sx: 0, sy: 0, sWidth: videoWidth || canvasWidth, sHeight: videoHeight || canvasHeight };
    }

    const videoAspect = videoWidth / videoHeight;
    const canvasAspect = canvasWidth / canvasHeight;
    let sx, sy, sWidth, sHeight;

    if (videoAspect > canvasAspect) {
        // Video is wider than canvas — crop sides
        sHeight = videoHeight;
        sWidth = videoHeight * canvasAspect;
        sx = (videoWidth - sWidth) / 2;
        sy = 0;
    } else {
        // Video is taller than canvas — crop top/bottom
        sWidth = videoWidth;
        sHeight = videoWidth / canvasAspect;
        sx = 0;
        sy = (videoHeight - sHeight) / 2;
    }

    return { sx, sy, sWidth, sHeight };
}

/**
 * Transform normalized landmark coordinates (0-1 in video space)
 * to canvas coordinates accounting for object-fit:cover crop.
 */
export function mapLandmarkToCanvas(lx, ly, videoWidth, videoHeight, canvasWidth, canvasHeight) {
    const { sx, sy, sWidth, sHeight } = getCoverCropParams(videoWidth, videoHeight, canvasWidth, canvasHeight);

    // Convert normalized coords to video pixels
    const videoX = lx * videoWidth;
    const videoY = ly * videoHeight;

    // Map from video space to canvas space (accounting for crop)
    const canvasX = ((videoX - sx) / sWidth) * canvasWidth;
    const canvasY = ((videoY - sy) / sHeight) * canvasHeight;

    return { x: canvasX, y: canvasY };
}

/**
 * Transform all landmarks for drawing on the canvas.
 * Returns a new array of landmarks with x,y mapped to canvas space.
 */
export function transformLandmarks(landmarks, videoWidth, videoHeight, canvasWidth, canvasHeight) {
    return landmarks.map(lm => {
        const mapped = mapLandmarkToCanvas(lm.x, lm.y, videoWidth, videoHeight, canvasWidth, canvasHeight);
        return {
            ...lm,
            // Store canvas-pixel coordinates for drawing
            cx: mapped.x,
            cy: mapped.y
        };
    });
}

/* ==========================================================
   SKELETON DRAWING (thin, semi-transparent)
   ========================================================== */

/**
 * Draw skeleton with thin semi-transparent lines.
 * Uses transformed landmarks (cx, cy in canvas pixel coords).
 */
export function drawSkeleton(ctx, transformedLandmarks, canvasWidth, canvasHeight) {
    // Draw connectors manually for better control
    if (typeof POSE_CONNECTIONS === 'undefined') return;
    const connections = POSE_CONNECTIONS;
    ctx.save();

    // Lines
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    for (const [startIdx, endIdx] of connections) {
        const start = transformedLandmarks[startIdx];
        const end = transformedLandmarks[endIdx];
        if (!start || !end) continue;
        if ((start.visibility || 0) < 0.4 || (end.visibility || 0) < 0.4) continue;

        ctx.beginPath();
        ctx.moveTo(start.cx, start.cy);
        ctx.lineTo(end.cx, end.cy);
        ctx.stroke();
    }

    // Points
    ctx.fillStyle = 'rgba(0, 230, 118, 0.45)';
    for (const lm of transformedLandmarks) {
        if ((lm.visibility || 0) < 0.4) continue;
        ctx.beginPath();
        ctx.arc(lm.cx, lm.cy, 2.5, 0, 2 * Math.PI);
        ctx.fill();
    }

    ctx.restore();
}

/* ==========================================================
   ANGLE ARC DRAWING
   ========================================================== */

/**
 * Draw angle arc at a joint position (in canvas pixel coords).
 */
export function drawAngleArc(ctx, cx, cy, angle) {
    const r = 24;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI, -Math.PI + Math.PI * (angle / 180));
    ctx.strokeStyle = angle < 90 ? 'rgba(255,64,129,.7)' : 'rgba(0,230,118,.7)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffd740';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(Math.round(angle) + '°', cx + r + 4, cy + 4);
}

/* ==========================================================
   DRAW VIDEO FRAME WITH COVER CROP
   ========================================================== */

/**
 * Draw the video frame onto the canvas with object-fit:cover behavior.
 */
export function drawVideoFrame(ctx, image, videoWidth, videoHeight, canvasWidth, canvasHeight) {
    const { sx, sy, sWidth, sHeight } = getCoverCropParams(videoWidth, videoHeight, canvasWidth, canvasHeight);
    ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, canvasWidth, canvasHeight);
}

/* ==========================================================
   MEDIAPIPE INITIALIZATION
   ========================================================== */

export function initPose(onResultsCallback) {
    if (typeof Pose === 'undefined') {
        console.warn('Pose class not available (CDN not loaded)');
        return null;
    }
    poseInstance = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });
    poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });
    poseInstance.onResults(onResultsCallback);
    return poseInstance;
}

export function getPose() {
    return poseInstance;
}

/* ==========================================================
   CAMERA MANAGEMENT
   ========================================================== */

export function startCamera(videoEl, facingMode, pose) {
    if (typeof Camera === 'undefined') {
        return Promise.reject(new Error('Camera class not available (CDN not loaded)'));
    }
    cameraInstance = new Camera(videoEl, {
        onFrame: async () => {
            if (pose) await pose.send({ image: videoEl });
        },
        facingMode: facingMode,
        width: 640,
        height: 480
    });

    return cameraInstance.start().then(() => {
        return cameraInstance;
    });
}

export function stopCamera() {
    if (cameraInstance) {
        cameraInstance.stop();
        cameraInstance = null;
    }
}

export function getCamera() {
    return cameraInstance;
}

export function setCameraInstance(cam) {
    cameraInstance = cam;
}

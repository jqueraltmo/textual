'use strict';

const cache = new Map(); // url -> { video, ready, error }

export function getVideo(url, start = 0) {
    const rounded = Math.round(start * 10) / 10;
    const key = `${url}|${rounded}`;
    let entry = cache.get(key);
    if (entry) return entry;

    entry = { video: null, ready: false, error: false, start: rounded };
    cache.set(key, entry);

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    video.preload = "auto";

    video.onloadedmetadata = () => {
        if (rounded > 0) video.currentTime = rounded;
    };
    video.onloadeddata = () => {
        entry.ready = true;
        video.play().catch(() => { });
    };
    video.onerror = () => {
        entry.error = true;
        console.error(`[Textual] Failed to load video: ${url}`);
    };

    video.src = url;
    entry.video = video;
    return entry;
}

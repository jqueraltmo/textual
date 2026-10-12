'use strict';

const cache = new Map(); // url -> { video, ready, error }

export function getVideo(url) {
    let entry = cache.get(url);
    if (entry) return entry;

    entry = { video: null, ready: false, error: false };
    cache.set(url, entry);

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;         // autoplay policy
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";

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

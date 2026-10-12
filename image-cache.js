'use strict';

const cache = new Map(); // url -> { img, loaded, error }

export function getImage(url) {
    let entry = cache.get(url);
    if (entry) return entry;

    entry = { img: null, loaded: false, error: false };
    cache.set(url, entry);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { entry.loaded = true; };
    img.onerror = () => {
        entry.error = true;
        console.error(`[Textual] Failed to load image: ${url}`);
    };
    img.src = url;
    entry.img = img;

    return entry;
}

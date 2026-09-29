"use strict";

import mulberry32 from "./mulberry32.js";

/**
 * Zalgo text transformation.
 * Deterministic: the same (text, intensity, seed) always produces
 * the same output.
 */

const MARKS = [];
for (let c = 0x0300; c <= 0x036F; c++) {
    MARKS.push(String.fromCharCode(c));
}

export function zalgo(text, intensity = 5, seed = 0) {
    const rand = mulberry32(seed);
    let out = "";
    for (const ch of text) {
        out += ch;
        const count = Math.floor(rand() * intensity);
        for (let i = 0; i < count; i++) {
            out += MARKS[Math.floor(rand() * MARKS.length)];
        }
    }
    return out;
}

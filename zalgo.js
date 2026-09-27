"use strict";

/**
 * Zalgo text transformation.
 * Deterministic: the same (text, intensity, seed) always produces
 * the same output.
 */

const MARKS = [];
for (let c = 0x0300; c <= 0x036F; c++) {
    MARKS.push(String.fromCharCode(c));
}

function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
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

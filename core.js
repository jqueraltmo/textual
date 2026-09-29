"use strict";

import { TextNode } from "./TextNode.js";

/**
 * Compiles user code into a function. Called once per define.
 */
export function compile(code) {
    return new Function(
        "text", "fb", "time", "cps", "beat",
        "osc", "phasor", "tri", "saw", "sqr", "seq",
        `"use strict";\n${code}`
    );
}

/**
 * Runs compiled code with the given time, returning the outputs.
 * Called every frame.
 */
export function run(compiled, time, tempo) {
    const outputs = new Map();
    let feedback = 0;

    const dispatch = (node, destination) => {
        let bucket = outputs.get(destination);
        if (!bucket) {
            bucket = [];
            outputs.set(destination, bucket);
        }
        bucket.push(node);
    };

    const text = (content) => new TextNode(content, dispatch);
    const fb = (amount) => { feedback = amount; };

    const cps = tempo.cps;
    const beat = (time - tempo.time) * cps + tempo.count;
    // `t` is the canonical time exposed to user code as `time`.
    // Anchored to the tempo reference (beat / cps), matching Punctual's DSL.
    const t = beat / cps;

    const osc = (freq = 1) => Math.sin(2 * Math.PI * t * freq);

    const phasor = (freq = 1) => {
        const x = t * freq;
        return x - Math.floor(x);
    };
    const tri = (freq = 1) => Math.abs(phasor(freq) - 0.5) * 4 - 1;
    const saw = (freq = 1) => phasor(freq) * 2 - 1;
    const sqr = (freq = 1) => (phasor(freq) < 0.5 ? -1 : 1);

    const seq = (...args) => {
        const values = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
        const state = { values, speed: 1, offset: 0, smooth: false };

        function evaluate() {
            const n = values.length;
            if (n === 0) return 0;
            const pos = beat * state.speed * n + state.offset;
            const norm = ((pos % n) + n) % n;
            const i = Math.floor(norm);
            if (!state.smooth) return values[i];
            const frac = norm - i;
            const a = values[i];
            const b = values[(i + 1) % n];
            return a + (b - a) * frac;
        }

        const api = {
            fast(k = 2) { state.speed *= k; return api; },
            slow(k = 2) { state.speed /= k; return api; },
            offset(k = 1) { state.offset += k; return api; },
            smooth(on = true) { state.smooth = on; return api; },
            valueOf() { return evaluate(); },
            toString() { return String(evaluate()); },
        };
        return api;
    }

    compiled(text, fb, t, cps, beat, osc, phasor, tri, saw, sqr, seq);

    return { outputs, feedback };
}

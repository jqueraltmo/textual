"use strict";

import { TextNode } from "./TextNode.js";
import { BezierNode } from "./BezierNode.js";

/**
 * Compiles user code into a function. Called once per define.
 */
export function compile(code) {
    return new Function(
        "text", "bezier", "curve", "sCurve", "fb", "time", "cps", "beat",
        "osc", "phasor", "tri", "saw", "sqr", "unipolar", "bipolar", "remap", "linlin",
        "seq",
        `"use strict";\n${code}`
    );
}

function lift(fn) {
    return (v, ...rest) => Array.isArray(v) ? v.map(x => fn(x, ...rest)) : fn(v, ...rest);
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
    const bezier = (...args) => {
        const node = new BezierNode(dispatch);
        node.bezier(...args);
        return node;
    };
    const curve = (x, y, bend = 0) => {
        const node = new BezierNode(dispatch);
        const px = -y;
        const py = x;
        node.bezier(
            [0, 0],
            [x / 3 + bend * px, y / 3 + bend * py],
            [2 * x / 3 + bend * px, 2 * y / 3 + bend * py],
            [x, y]
        );
        return node;
    };
    const sCurve = (x, y, bend = 1) => {
        const node = new BezierNode(dispatch);
        const px = -y;
        const py = x;
        node.bezier(
            [0, 0],
            [x / 3 + bend * px, y / 3 + bend * py],
            [2 * x / 3 - bend * px, 2 * y / 3 - bend * py],
            [x, y]
        );
        return node;
    };
    const fb = (amount) => { feedback = amount; };

    const cps = tempo.cps;
    const beat = (time - tempo.time) * cps + tempo.count;
    // `t` is the canonical time exposed to user code as `time`.
    // Anchored to the tempo reference (beat / cps), matching Punctual's DSL.
    const t = beat / cps;

    const osc = lift((freq = 1) => Math.sin(2 * Math.PI * t * freq));

    const phasor = lift((freq = 1) => {
        const x = t * freq;
        return x - Math.floor(x);
    });
    const tri = lift((freq = 1) => Math.abs(phasor(freq) - 0.5) * 4 - 1);
    const saw = lift((freq = 1) => phasor(freq) * 2 - 1);
    const sqr = lift((freq = 1) => (phasor(freq) < 0.5 ? -1 : 1));

    const unipolar = lift(v => (v + 1) / 2);
    const bipolar = lift(v => v * 2 - 1);
    const remap = lift((v, a, b) => a + (v + 1) * (b - a) / 2);
    const linlin = lift((v, a, b, c, d) => c + (v - a) * (d - c) / (b - a));

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

    compiled(text, bezier, curve, sCurve, fb, t, cps, beat, osc, phasor, tri, saw, sqr, unipolar, bipolar, remap, linlin, seq);

    return { outputs, feedback };
}

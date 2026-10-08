"use strict";

import { TextNode } from "./TextNode.js";
import { BezierNode } from "./BezierNode.js";
import { CurveNode } from "./CurveNode.js";
import { SCurveNode } from "./SCurveNode.js";
import { GroupNode } from "./GroupNode.js";
import { RectNode } from "./RectNode.js";
import { EllipseNode } from "./EllipseNode.js";

/**
 * Compiles user code into a function. Called once per define.
 */
export function compile(code) {
    return new Function(
        "group", "text", "bezier", "curve", "sCurve", "scurve", "rect", "ellipse", "circle",
        "fb", "time", "cps", "beat", "aspect",
        "osc", "phasor", "tri", "saw", "sqr", "unipolar", "bipolar", "remap", "linlin",
        "seq", "swarm",
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
export function run(compiled, time, tempo, aspect) {
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
    const bezier = (...args) => new BezierNode(dispatch, ...args);
    const curve = (x, y, bend) => new CurveNode(dispatch, x, y, bend);
    const sCurve = (x, y, bend) => new SCurveNode(dispatch, x, y, bend);
    const rect = (x, y, w, h) => new RectNode(dispatch, x, y, w, h);
    const ellipse = (rx, ry, sa, ea) => new EllipseNode(dispatch, rx, ry, sa, ea);
    const circle = (r, sa, ea) => new EllipseNode(dispatch, r, r, sa, ea);
    const group = (...args) => new GroupNode(dispatch, ...args);

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
            const a = values[i];
            if (!state.smooth) return a;
            const b = values[(i + 1) % n];

            if (typeof a === "number" && typeof b === "number") {
                const frac = norm - i;
                return a + (b - a) * frac;
            }

            if (Array.isArray(a) && Array.isArray(b)) {
                const frac = norm - i;
                const len = Math.min(a.length, b.length);
                const out = new Array(len);
                for (let k = 0; k < len; k++) {
                    out[k] = a[k] + (b[k] - a[k]) * frac;
                }
                return out;
            }

            return a;
        }

        const api = {
            fast(k = 2) { state.speed *= k; return api; },
            slow(k = 2) { state.speed /= k; return api; },
            offset(k = 1) { state.offset += k; return api; },
            smooth(on = true) { state.smooth = on; return api; },
            valueOf() { return evaluate(); },
            values() { return values; },
            toString() { return String(evaluate()); },
            [Symbol.iterator]() {
                const value = evaluate();
                return Array.isArray(value)
                    ? value[Symbol.iterator]()
                    : [value][Symbol.iterator]();
            }
        };
        return api;
    }

    const swarm = (base, variants = {}) => {
        const entries = Object.entries(variants).map(([prop, vals]) => [
            prop,
            Array.isArray(vals) ? vals : [vals],
        ]).filter(([, vals]) => vals.length > 0);
        if (entries.length === 0) {
            return new GroupNode(dispatch, [base.clone()]);
        }

        const maxLen = Math.max(...entries.map(([, vals]) => vals.length));
        const children = [];

        for (let i = 0; i < maxLen; i++) {
            const copy = base.clone();
            for (const [prop, rawVals] of entries) {
                if (typeof copy[prop] !== "function") {
                    throw new Error(`swarm: "${prop}" is not a method on the node`);
                }
                const vals = Array.isArray(rawVals) ? rawVals : [rawVals];
                const v = vals[i % vals.length];
                const args = Array.isArray(v) ? v : [v];
                copy[prop](...args);
            }
            children.push(copy);
        }

        return new GroupNode(dispatch, children);
    };

    compiled(group, text, bezier, curve, sCurve, sCurve, rect, ellipse, circle, fb, t, cps, beat, aspect, osc,
        phasor, tri, saw, sqr, unipolar, bipolar, remap, linlin, seq, swarm);

    return { outputs, feedback };
}

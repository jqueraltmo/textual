"use strict";

import { expandEmojis } from "./emoji.js";
import { zalgo } from "./zalgo.js";

/**
 * A text node with style properties and a dispatch callback.
 * Calling .out() sends the node to a destination via the dispatcher.
 */
export class TextNode {
    constructor(content, dispatch) {
        this.content = normalizeContent(content);
        this._dispatch = dispatch;

        // Style defaults. Users can override these properties directly.
        this.fontSize = 48;
        this.lineHeightMultiplier = 1.3;
        this.fontFamily = null;
        this.fontWeight = "700";
        this.align = "center";
        this.baseline = "middle";
        this.fillColor = "#ffffff";
        this.strokeColor = "#ffffff";
        this.lineWidth = 2;
        this.renderMode = "fill";
        this.shadowOffsetX = 0;
        this.shadowOffsetY = 0;
        this.shadowBlur = 0;
        this.shadowColor = "#000000";
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.zalgoIntensity = 0;
        this.zalgoSeed = 0;
    }

    /**
     * Sends this node to a destination. Returns `this` to allow chaining.
     * @param {string} destination
     */
    out(destination = "") {
        this._dispatch(this, destination);
        return this;
    }

    size(fontSize = 48) {
        this.fontSize = fontSize;
        return this;
    }

    move(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        return this;
    }

    color(r = 1, g = 1, b = 1, a = 1) {
        const rv = r.valueOf();
        const c = typeof rv === "string"
            ? rv
            : `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
        this.fillColor = c;
        this.strokeColor = c;
        return this;
    }

    font(fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif') {
        this.fontFamily = fontFamily;
        return this;
    }

    spin(rotation = 0) {
        this.rotation = rotation * Math.PI;
        return this;
    }

    fill() {
        this.renderMode = "fill";
        return this;
    }

    stroke(lineWidth = 2) {
        this.renderMode = "stroke";
        if (lineWidth !== undefined) this.lineWidth = lineWidth;
        return this;
    }

    shadow(x = 2, y = 2, blur = 4, color = "#808080") {
        this.shadowOffsetX = x;
        this.shadowOffsetY = y;
        this.shadowBlur = blur;
        this.shadowColor = color;
        return this;
    }

    zalgo(intensity = 5, seed = 0) {
        this.zalgoIntensity = intensity;
        this.zalgoSeed = seed;
        return this;
    }
}

function normalizeContent(content) {
    if (typeof content === "function") return content;
    if (content === undefined || content === null) return "";
    return String(content);
}

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
    const t = time - tempo.time;

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

    compiled(text, fb, time, cps, beat, osc, phasor, tri, saw, sqr, seq);

    return { outputs, feedback };
}

/**
 * Resolves a node's content to a plain string, applying emoji/zalgo expansion.
 * Handles both static strings and dynamic functions.
 */
export function resolveText(node) {
    const raw = typeof node.content === "function" ? node.content() : node.content;
    let text = raw === undefined || raw === null ? "" : String(raw);

    if (text.indexOf(":") !== -1) text = expandEmojis(text);
    if (node.zalgoIntensity > 0) text = zalgo(text, node.zalgoIntensity, node.zalgoSeed);

    return text;
}

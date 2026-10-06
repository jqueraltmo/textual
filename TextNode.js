'use strict';

import { Node } from './Node.js';
import { expandEmojis } from "./emoji.js";
import { hackString } from "./hack-text.js";
import { zalgo } from "./zalgo.js";
import mulberry32 from "./mulberry32.js";
import { toGraphemes } from "./graphemes.js";

export class TextNode extends Node {
    constructor(content, dispatch) {
        super(dispatch);
        this.content = TextNode._normalizeContent(content);
        this.fontSize = 48;
        this.lineHeightMultiplier = 1.3;
        this.fontFamily = null;
        this.fontWeight = "700";
        this.align = "center";
        this.baseline = "middle";
        this.renderMode = "fill";
        this.tracking = undefined;
        this._wordSpacing = undefined;
        this._stretch = undefined;
        this._caps = false;
        this.zalgoIntensity = 0;
        this.zalgoSeed = 0;
        this.hackProb = 0;
        this.hackSeed = 0;
        this.dirParams = null;
        this._vertical = 0;
        this._mono = 0;
    }

    clone(content) {
        const copy = super.clone();
        if (content !== undefined) {
            copy.content = TextNode._normalizeContent(content);
        }
        return copy;
    }

    size(fontSize = 48) {
        this.fontSize = fontSize;
        return this;
    }

    font(fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif') {
        this.fontFamily = fontFamily;
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

    sp(px = 4) { this.tracking = px; return this; }
    spacing(...args) { return this.sp(...args); }

    wsp(px = 8) { this._wordSpacing = px; return this; }
    wordspacing(...args) { return this.wsp(...args); }

    stretch(v = -0.5) { this._stretch = v; return this; }

    caps(v = 1) { this._caps = v; return this; }

    zalgo(intensity = 5, seed = 0) {
        this.zalgoIntensity = intensity;
        this.zalgoSeed = seed;
        return this;
    }

    hack(prob = .3, seed = 0) {
        this.hackProb = prob;
        this.hackSeed = seed;
        return this;
    }

    dir(l = 0, p = 1, s = 0) {
        this.dirParams = { l, p, s };
        return this;
    }
    direction(...args) { return this.dir(...args); }

    vertical(on = 1) { this._vertical = on; return this; }

    mono(on = 1) { this._mono = on; return this; }

    _drawSelf(env) {
        const ctx = env.ctx;
        const fontSize = this.fontSize;
        const lineHeight = fontSize * this.lineHeightMultiplier;

        ctx.font = this._resolveFont();
        ctx.textAlign = this.align;
        ctx.textBaseline = this.baseline;

        const tracking = this.tracking?.valueOf?.() ?? this.tracking;
        if (tracking !== undefined) ctx.letterSpacing = `${tracking}px`;

        const wsp = this._wordSpacing?.valueOf?.() ?? this._wordSpacing;
        if (wsp !== undefined) ctx.wordSpacing = `${wsp}px`;

        const stretch = this._stretch?.valueOf?.() ?? this._stretch;
        if (stretch !== undefined) {
            ctx.fontStretch = TextNode._resolveStretch(stretch);
        }

        const capsValue = this._caps?.valueOf?.() ?? this._caps;
        if (capsValue > 0) ctx.fontVariantCaps = "small-caps";

        const text = this._resolveText();
        const lines = text.split("\n");

        // Apply direction effect per line, if enabled.
        let processedLines = lines;
        if (this.dirParams) {
            const { l, p, s } = this.dirParams;
            const pValue = p?.valueOf?.() ?? p;
            const lValue = l?.valueOf?.() ?? l;
            processedLines = lines.map(line =>
                TextNode._applyDir(line, lValue, pValue, s)
            );
        }

        const totalHeight = lines.length * lineHeight;
        const startY = -(totalHeight / 2) + (lineHeight / 2);

        const draw = this.renderMode === "stroke"
            ? (s, x, y) => ctx.strokeText(s, x, y)
            : (s, x, y) => ctx.fillText(s, x, y);

        const styles = this._resolveStyles(ctx, env);
        if (this.renderMode === "stroke") {
            if (styles.stroke !== null) ctx.strokeStyle = styles.stroke;
            ctx.lineWidth = this.lineWidth;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
        } else {
            if (styles.fill !== null) ctx.fillStyle = styles.fill;
        }

        for (let i = 0; i < processedLines.length; i++) {
            draw(processedLines[i], 0, startY + i * lineHeight);
        }
    }

    _resolveFont() {
        // The user chose a font explicitly: respect it, even for zalgo.
        if (this.fontFamily !== null) {
            return `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
        }
        // Zalgo needs a font without combining marks so the browser uses
        // its own fallback positioning, which handles stacked marks better
        // than any single font we tried.
        if (this.zalgoIntensity > 0) {
            return `${this.fontSize}px Helvetica, Arial, sans-serif`;
        }
        // Default: platform sans-serif.
        return `${this.fontWeight} ${this.fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    }

    /**
     * Resolves a node's content to a plain string, applying emoji/zalgo expansion.
     * Handles both static strings and dynamic functions.
     */
    _resolveText() {
        const raw = typeof this.content === "function" ? this.content() : this.content;
        let text = raw === undefined || raw === null ? "" : String(raw);

        if (text.indexOf(":") !== -1) text = expandEmojis(text);
        if (this._mono > 0) text = text.replace(/\uFE0F/g, "\uFE0E");
        if (this._vertical > 0) text = TextNode._transpose(text);
        if (this.hackProb > 0) text = hackString(text, this.hackProb, this.hackSeed);
        if (this.zalgoIntensity > 0) text = zalgo(text, this.zalgoIntensity, this.zalgoSeed);

        return text;
    }

    dryRun(env) {
        super.dryRun(env);
        this._resolveText();
    }

    static _normalizeContent(content) {
        if (typeof content === "function") return content;
        if (content === undefined || content === null) return "";
        return String(content);
    }

    static _resolveStretch(v) {
        if (typeof v === "string") return v;
        const STEPS = [
            "ultra-condensed", "extra-condensed", "condensed",
            "semi-condensed", "normal",
            "semi-expanded", "expanded", "extra-expanded", "ultra-expanded"
        ];
        const clamped = Math.max(-1, Math.min(1, v));
        const i = Math.round((clamped + 1) / 2 * (STEPS.length - 1));
        return STEPS[i];
    }

    static _applyDir(text, l, p, seed) {
        const rand = mulberry32(seed);
        const chars = toGraphemes(text);
        const n = chars.length;
        const size = Math.round(l > 0 ? l : n + l);
        if (size <= 1 || p <= 0) return text;
        const prob = p > 1 ? 1 : p;

        const used = new Array(n).fill(false);
        const fromRight = l < 0;

        const indices = fromRight
            ? [...Array(n).keys()].reverse()
            : [...Array(n).keys()];

        for (const i of indices) {
            if (used[i]) continue;
            if (rand() >= prob) continue;

            let start, end;
            if (fromRight) {
                start = Math.max(0, i - size + 1);
                end = i;
            } else {
                start = i;
                end = Math.min(n - 1, i + size - 1);
            }

            const len = end - start + 1;
            for (let k = 0; k < Math.floor(len / 2); k++) {
                [chars[start + k], chars[end - k]] =
                    [chars[end - k], chars[start + k]];
            }
            for (let k = start; k <= end; k++) used[k] = true;
        }

        return chars.join("");
    }

    static _transpose(text) {
        const lines = text.split("\n");
        const grids = lines.map(l => toGraphemes(l));
        const maxLen = Math.max(...grids.map(g => g.length));
        for (const g of grids) {
            while (g.length < maxLen) g.push(" ");
        }
        const out = [];
        for (let col = 0; col < maxLen; col++) {
            let row = "";
            for (let r = 0; r < grids.length; r++) row += grids[r][col];
            out.push(row);
        }
        return out.join("\n");
    }
}

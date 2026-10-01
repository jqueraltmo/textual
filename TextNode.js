'use strict';

import { Node } from './Node.js';
import { expandEmojis } from "./emoji.js";
import { hackString } from "./hack-text.js";
import { zalgo } from "./zalgo.js";

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
        this.zalgoIntensity = 0;
        this.zalgoSeed = 0;
        this.hackProb = 0;
        this.hackSeed = 0;
    }

    static _normalizeContent(content) {
        if (typeof content === "function") return content;
        if (content === undefined || content === null) return "";
        return String(content);
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

    _drawSelf(ctx) {
        const fontSize = this.fontSize;
        const lineHeight = fontSize * this.lineHeightMultiplier;

        ctx.font = this._resolveFont();
        ctx.textAlign = this.align;
        ctx.textBaseline = this.baseline;

        const text = this._resolveText();
        const lines = text.split("\n");
        const totalHeight = lines.length * lineHeight;
        const startY = -(totalHeight / 2) + (lineHeight / 2);

        const draw = this.renderMode === "stroke"
            ? (s, x, y) => ctx.strokeText(s, x, y)
            : (s, x, y) => ctx.fillText(s, x, y);

        if (this.renderMode === "stroke") {
            ctx.strokeStyle = this._strokeColor;
            ctx.lineWidth = this.lineWidth;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
        } else {
            ctx.fillStyle = this._fillColor;
        }

        for (let i = 0; i < lines.length; i++) {
            draw(lines[i], 0, startY + i * lineHeight);
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
        if (this.hackProb > 0) text = hackString(text, this.hackProb, this.hackSeed);
        if (this.zalgoIntensity > 0) text = zalgo(text, this.zalgoIntensity, this.zalgoSeed);

        return text;
    }

    dryRun(ctx) {
        super.dryRun(ctx);
        this._resolveText();
    }
}

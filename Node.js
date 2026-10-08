'use strict';

import { Gradient } from './Gradient.js';

export class Node {
    constructor(dispatch) {
        this._dispatch = dispatch;
        this._fit = null;
        this.lineWidth = 2;
        this.shadowOffsetX = 0;
        this.shadowOffsetY = 0;
        this.shadowBlur = 0;
        this.shadowColor = "#000000";
        this.x = 0;
        this.y = 0;
        this.zoomx = 1;
        this.zoomy = 1;
        this.customTransform = null;
        this.rotation = 0;
        this.customMatrix = null;
        this._fillColor = null;
        this._strokeColor = null;
        this._gradient = null;
        this._gradient = null;
    }

    out(destination = "") {
        this._dispatch(this, destination);
        return this;
    }

    fit(v = 1) {
        this._fit = v; return this;
    }

    clone() {
        const copy = Object.create(Object.getPrototypeOf(this));
        Object.assign(copy, this);
        return copy;
    }

    move(x = 0, y = 0) {
        if (Array.isArray(x)) {
            [x = 0, y = 0] = x;
        }
        this.x = x;
        this.y = y;
        return this;
    }

    color(r = 1, g = 1, b = 1, a = 1) {
        const c = this._toColor(r, g, b, a);
        this._fillColor = c;
        this._strokeColor = c;
        return this;
    }

    fillColor(r = 1, g = 1, b = 1, a = 1) {
        this._fillColor = this._toColor(r, g, b, a);
        return this;
    }

    strokeColor(r = 1, g = 1, b = 1, a = 1) {
        this._strokeColor = this._toColor(r, g, b, a);
        return this;
    }

    _toColor(r = 1, g = 1, b = 1, a = 1) {
        // Resolve seq-like values to their current value.
        r = r?.valueOf ? r.valueOf() : r;
        g = g?.valueOf ? g.valueOf() : g;
        b = b?.valueOf ? b.valueOf() : b;
        a = a?.valueOf ? a.valueOf() : a;

        // If r is an array, destructure it into (r, g, b, a).
        if (Array.isArray(r)) {
            [r = 1, g = 1, b = 1, a = 1] = r;
        }

        // A string r means an explicit CSS color.
        if (typeof r === "string") return r;

        return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
    }

    spin(rotation = 0) {
        this.rotation = rotation * Math.PI;
        return this;
    }

    zoom(zx = 1, zy = 1) {
        if (Array.isArray(zx)) {
            [zx = 1, zy = 1] = zx;
        }
        this.zoomx = zx;
        this.zoomy = zy;
        return this;
    }

    transform(fn) {
        this.customTransform = fn;
        return this;
    }

    matrix(...args) {
        const m = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        const [a = 1, b = 0, c = 0, d = 1, e = 0, f = 0] = m;
        this.customMatrix = [a, b, c, d, e, f];
        return this;
    }

    fill() {
        throw new Error(`${this.constructor.name}.fill() not implemented`);
    }
    stroke() {
        throw new Error(`${this.constructor.name}.stroke() not implemented`);
    }

    shadow(x = 2, y = 2, blur = 4, color = "#808080") {
        this.shadowOffsetX = x;
        this.shadowOffsetY = y;
        this.shadowBlur = blur;
        this.shadowColor = color;
        return this;
    }

    composite(mode = "source-over") {
        if (mode?.values) {
            for (const v of mode.values()) {
                if (!VALID_COMPOSITE_MODES.has(v)) {
                    throw new Error(`Unknown composite mode: ${v}`);
                }
            }
        } else {
            const resolved = mode?.valueOf?.() ?? mode;
            if (!VALID_COMPOSITE_MODES.has(resolved)) {
                throw new Error(`Unknown composite mode: ${resolved}`);
            }
        }
        this.compositeMode = mode;
        return this;
    }
    comp(...args) { return this.composite(...args); }

    grlin(x1 = -1, y1 = 0, x2 = 1, y2 = 0, ...colors) {
        this._gradient = new Gradient("linear", [x1, y1, x2, y2], colors);
        return this;
    }

    grrad(x = 0, y = 0, r = 1, ...colors) {
        this._gradient = new Gradient("radial", [x, y, r], colors);
        return this;
    }

    grconic(angle = 0, x = 0, y = 0, ...colors) {
        this._gradient = new Gradient("conic", [angle, x, y], colors);
        return this;
    }

    stop(...stops) {
        if (!this._gradient) {
            throw new Error("stop() requires a gradient; call grlin, grrad or grconic first");
        }
        this._gradient.stops = stops;
        return this;
    }

    _resolveStyles(ctx, env) {
        if (this._gradient) {
            const cg = this._gradient._toCanvasGradient(ctx, env);
            return { fill: cg, stroke: cg };
        }
        return { fill: this._fillColor, stroke: this._strokeColor };
    }

    draw(env) {
        let sx = env.width / 2;
        let sy = env.height / 2;

        if (this._fit !== null) {
            const f = this._fit?.valueOf?.() ?? this._fit;
            sx = f * env.height / 2;
        }

        const px = this.x * sx;
        const py = -this.y * sy;

        const localEnv = { ...env, sx, sy };

        const ctx = env.ctx;
        ctx.save();
        try {
            ctx.translate(px, py);
            ctx.rotate(this.rotation);
            ctx.scale(this.zoomx, this.zoomy);
            if (this.customMatrix) ctx.transform(...this.customMatrix);
            if (this.customTransform) this.customTransform(ctx);
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
            if (this.compositeMode) {
                const mode = this.compositeMode?.valueOf?.() ?? this.compositeMode;
                if (!VALID_COMPOSITE_MODES.has(mode)) {
                    throw new Error(`Unknown composite mode: ${mode}`);
                }
                ctx.globalCompositeOperation = mode;
            }
            this._drawSelf(localEnv);
        } finally {
            ctx.restore();
        }
    }

    _drawSelf(env) {
        throw new Error("Node._drawSelf not implemented");
    }

    dryRun(env) {
        if (this.customTransform) this.customTransform(env.ctx);
    }
}

const VALID_COMPOSITE_MODES = new Set([
    "source-over", "source-in", "source-out", "source-atop",
    "destination-over", "destination-in", "destination-out", "destination-atop",
    "lighter", "copy", "xor",
    "multiply", "screen", "overlay", "darken", "lighten",
    "color-dodge", "color-burn", "hard-light", "soft-light",
    "difference", "exclusion",
    "hue", "saturation", "color", "luminosity"
]);
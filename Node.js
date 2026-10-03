'use strict';

export class Node {
    constructor(dispatch) {
        this._dispatch = dispatch;
        this._fillColor = "#ffffff";
        this._strokeColor = "#ffffff";
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
    }

    out(destination = "") {
        this._dispatch(this, destination);
        return this;
    }

    clone() {
        const copy = Object.create(Object.getPrototypeOf(this));
        Object.assign(copy, this);
        return copy;
    }

    move(x = 0, y = 0) {
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

    draw(env) {
        const px = this.x * env.width / 2;
        const py = -this.y * env.height / 2;
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
            this._drawSelf(env);
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
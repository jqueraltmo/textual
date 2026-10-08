'use strict';

const DEFAULT_COLORS = ["white", "transparent"];

export class Gradient {
    constructor(type, params, colors) {
        this.type = type;
        this.params = params;
        this.colors = (colors && colors.length > 0) ? colors : DEFAULT_COLORS;
        this.stops = null;
    }

    _resolveColor(c) {
        if (Array.isArray(c)) {
            const [r = 0, g = 0, b = 0, a = 1] = c;
            return `rgba(${r * 255}, ${g * 255}, ${b * 255}, ${a})`;
        }
        return String(c);
    }

    _toCanvasGradient(ctx, env) {
        const w = env.sx;
        const h = env.sy;

        let cg;
        if (this.type === "linear") {
            const [x1, y1, x2, y2] = this.params.map(p => p?.valueOf?.() ?? p);
            cg = ctx.createLinearGradient(x1 * w, -y1 * h, x2 * w, -y2 * h);
        } else if (this.type === "radial") {
            const [x, y, r] = this.params.map(p => p?.valueOf?.() ?? p);
            cg = ctx.createRadialGradient(x * w, -y * h, 0, x * w, -y * h, r * w);
        } else if (this.type === "conic") {
            const [angle, x, y] = this.params.map(p => p?.valueOf?.() ?? p);
            cg = ctx.createConicGradient(angle, x * w, -y * h);
        } else {
            throw new Error(`Unknown gradient type: ${this.type}`);
        }

        if (this.stops) {
            for (const [offset, color] of this.stops) {
                cg.addColorStop(offset, this._resolveColor(color));
            }
        } else {
            const n = this.colors.length;
            for (let i = 0; i < n; i++) {
                const offset = n === 1 ? 0 : i / (n - 1);
                cg.addColorStop(offset, this._resolveColor(this.colors[i]));
            }
        }

        return cg;
    }
}

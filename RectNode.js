'use strict';

import { Node } from './Node.js';

export class RectNode extends Node {
    constructor(dispatch, w = 1, h = 1) {
        super(dispatch);
        this._fill = false;
        this._stroke = true;
        this.w = w;
        this.h = h;
    }

    fill(on = true) {
        this._fill = on;
        return this;
    }

    stroke(lineWidth) {
        if (lineWidth === 0) {
            this._stroke = false;
        } else {
            this._stroke = true;
            if (lineWidth !== undefined) this.lineWidth = lineWidth;
        }
        return this;
    }

    _drawSelf(env) {
        const ctx = env.ctx;
        const wNorm = this.w?.valueOf?.() ?? this.w;
        const hNorm = this.h?.valueOf?.() ?? this.h;
        const w = wNorm * env.width / 2;
        const h = hNorm * env.height / 2;
        const x = -w / 2;
        const y = -h / 2;

        ctx.beginPath();
        ctx.rect(x, y, w, h);

        const styles = this._resolveStyles(ctx, env);

        if (this._fill) {
            if (styles.fill !== null) ctx.fillStyle = styles.fill;
            ctx.fill();
        }
        if (this._stroke) {
            if (styles.stroke !== null) ctx.strokeStyle = styles.stroke;
            ctx.lineWidth = this.lineWidth;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.stroke();
        }
    }
}

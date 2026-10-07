'use strict';

import { Node } from './Node.js';

export class EllipseNode extends Node {
    constructor(dispatch, radiusX = 1, radiusY = 1, startAngle = 0, endAngle = Math.PI * 2) {
        super(dispatch);
        this._fill = false;
        this._stroke = true;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
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
        const radiusXNorm = this.radiusX?.valueOf?.() ?? this.radiusX;
        const radiusYNorm = this.radiusY?.valueOf?.() ?? this.radiusY;
        const radiusX = radiusXNorm * env.width / 2;
        const radiusY = radiusYNorm * env.height / 2;
        const startAngle = this.startAngle?.valueOf?.() ?? this.startAngle;
        const endAngle = this.endAngle?.valueOf?.() ?? this.endAngle;

        ctx.beginPath();
        ctx.ellipse(0, 0, radiusX, radiusY, 0, startAngle, endAngle);

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

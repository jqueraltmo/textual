'use strict';

import { Node } from './Node.js';

export class BezierNode extends Node {
    constructor(dispatch, ...args) {
        super(dispatch);
        this.curveType = "cubic";
        this.points = [[0, 0], [0.3, 0.3], [0.8, 0], [0.4, 0.8]];
        this._fill = false;
        this._stroke = true;
        if (args.length > 0) this.bezier(...args);
    }

    clone(...args) {
        const copy = super.clone();
        copy.points = this.points.map(p => [...p]);
        if (args.length > 0) copy.bezier(...args);
        return copy;
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

    bezier(...args) {
        let pts;

        if (args.length === 1 && Array.isArray(args[0])) {
            const a = args[0];
            if (Array.isArray(a[0])) {
                pts = a;
            } else {
                pts = [];
                for (let i = 0; i < a.length; i += 2) pts.push([a[i], a[i + 1]]);
            }
        } else if (args.every(Array.isArray)) {
            pts = args;
        } else if (args.every(a => typeof a === "number") && args.length % 2 === 0) {
            pts = [];
            for (let i = 0; i < args.length; i += 2) pts.push([args[i], args[i + 1]]);
        } else {
            throw new Error("bezier: invalid arguments");
        }

        if (pts.length === 3) this.curveType = "quadratic";
        else if (pts.length === 4) this.curveType = "cubic";
        else throw new Error(`bezier: expected 3 or 4 points, got ${pts.length}`);

        this.points = pts;
        return this;
    }

    _drawSelf(env) {
        const ctx = env.ctx;
        const toLocal = (p) => [p[0] * env.sx, -p[1] * env.sy]

        const [start, ...rest] = this.points;
        ctx.beginPath();
        ctx.moveTo(...toLocal(start));

        if (this.curveType === "quadratic") {
            const [cp, end] = rest;
            ctx.quadraticCurveTo(...toLocal(cp), ...toLocal(end));
        } else {
            const [cp1, cp2, end] = rest;
            ctx.bezierCurveTo(...toLocal(cp1), ...toLocal(cp2), ...toLocal(end));
        }

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

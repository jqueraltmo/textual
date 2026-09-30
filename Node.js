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


    _toColor(r, g, b, a) {
        const rv = r.valueOf();
        if (typeof rv === "string") return rv;
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

    draw(ctx, width, height) {
        const center = Node._toScreenCoordinates([this.x, this.y], width, height);
        ctx.save();
        try {
            ctx.translate(center[0], center[1]);
            ctx.rotate(this.rotation);
            ctx.scale(this.zoomx, this.zoomy);
            if (this.customMatrix) ctx.transform(...this.customMatrix);
            if (this.customTransform) this.customTransform(ctx);
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
            this._drawSelf(ctx, width, height);
        } finally {
            ctx.restore();
        }
    }

    _drawSelf(ctx, width, height) {
        throw new Error("Node._drawSelf not implemented");
    }

    dryRun(ctx) {
        if (this.customTransform) this.customTransform(ctx);
    }

    static _toScreenCoordinates(coords, width, height) {
        return [
            ((coords[0] + 1) / 2) * width,
            ((1 - coords[1]) / 2) * height
        ];
    }
}

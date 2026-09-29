"use strict";

/**
 * Renders Nodes to 2D canvases
 * Supports two targets: own canvas, or stream
 * (an offscreen canvas whose MediaStream can be consumed elsewhere).
 */
export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.streams = new Map(); // name -> { canvas, ctx, stream, active }

        this._onResize = () => this.resize();
        window.addEventListener("resize", this._onResize);
        this.resize();
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.floor(window.innerWidth * dpr);
        const h = Math.floor(window.innerHeight * dpr);
        this.canvas.width = w;
        this.canvas.height = h;
        for (const entry of this.streams.values()) {
            entry.canvas.width = this.canvas.width;
            entry.canvas.height = this.canvas.height;
        }
    }

    getStream(name) {
        let entry = this.streams.get(name);
        if (!entry) {
            const c = document.createElement("canvas");
            c.width = this.canvas.width;
            c.height = this.canvas.height;
            entry = {
                canvas: c,
                ctx: c.getContext("2d"),
                stream: c.captureStream(30),
                active: true,
            };
            this.streams.set(name, entry);
        } else {
            entry.active = true;
        }
        return entry.stream;
    }

    resetStreamActivity() {
        for (const entry of this.streams.values()) {
            entry.active = false;
        }
    }

    sweepInactiveStreams() {
        const removed = [];
        for (const [name, entry] of this.streams) {
            if (!entry.active) {
                for (const track of entry.stream.getTracks()) {
                    track.stop();
                }
                this.streams.delete(name);
                removed.push(name);
            }
        }
        return removed;
    }

    _target(target) {
        if (target === "") {
            return { canvas: this.canvas, ctx: this.ctx };
        }
        const entry = this.streams.get(target);
        return entry ? { canvas: entry.canvas, ctx: entry.ctx } : null;
    }

    /**
     * Prepares a target for a new frame.
     * @param {string} target
     * @param {number} feedback - 0 = full clear, 1 = perfect persistence.
     */
    beginFrame(target, feedback = 0) {
        const t = this._target(target);
        if (!t) return;

        if (feedback >= 1) return;

        const { canvas, ctx } = t;
        if (feedback <= 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const removal = 1 - feedback;
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0, 0, 0, ${removal})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    /**
     * Draws a list of nodes to a target.
     * @param {TextNode[]} nodes
     * @param {{ brightness?: number, target?: string }} [options]
     */
    draw(nodes, { brightness = 1, target = "" } = {}) {
        const t = this._target(target);
        if (!t) return;

        const { canvas, ctx } = t;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.save();
        try {
            ctx.scale(dpr, dpr);
            ctx.globalAlpha = brightness;
            for (const node of nodes) {
                node.draw(ctx, width, height);
            }
        } finally {
            ctx.restore();
        }
    }

    /**
    * Executes user-supplied code paths (custom transforms, dynamic content)
    * in an isolated context. Throws if anything fails, so the caller can
    * decide to skip the frame before touching the real canvas.
    */
    dryRun(nodes) {
        if (!this._testCtx) {
            const c = document.createElement("canvas");
            c.width = 1;
            c.height = 1;
            this._testCtx = c.getContext("2d");
        }
        const ctx = this._testCtx;
        for (const node of nodes) {
            node.dryRun(ctx);
        }
    }
}
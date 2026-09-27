"use strict";

import { resolveText } from "./core.js";

/**
 * Renders TextNodes to 2D canvases.
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
    draw(nodes, { brightness = 1, target = "canvas" } = {}) {
        const t = this._target(target);
        if (!t) return;

        const { canvas, ctx } = t;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.globalAlpha = brightness;

        for (const node of nodes) {
            this._drawNode(node, width, height, ctx);
        }

        ctx.restore();
    }

    _drawNode(node, width, height, ctx) {
        const fontSize = node.fontSize;
        const lineHeight = fontSize * node.lineHeightMultiplier;

        const centerX = ((node.x + 1) / 2) * width;
        const centerY = ((1 - node.y) / 2) * height;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(node.rotation || 0);

        ctx.font = `${node.fontWeight} ${fontSize}px ${node.fontFamily}`;
        ctx.textAlign = node.align;
        ctx.textBaseline = node.baseline;

        const text = resolveText(node);
        const lines = text.split("\n");
        const totalHeight = lines.length * lineHeight;
        const startY = -(totalHeight / 2) + (lineHeight / 2);

        ctx.shadowColor = node.shadowColor;
        ctx.shadowBlur = node.shadowBlur;
        ctx.shadowOffsetX = node.shadowOffsetX;
        ctx.shadowOffsetY = node.shadowOffsetY;

        const draw = node.renderMode === "stroke"
            ? (s, x, y) => ctx.strokeText(s, x, y)
            : (s, x, y) => ctx.fillText(s, x, y);

        if (node.renderMode === "stroke") {
            ctx.strokeStyle = node.strokeColor;
            ctx.lineWidth = node.lineWidth;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
        } else {
            ctx.fillStyle = node.fillColor;
        }

        for (let i = 0; i < lines.length; i++) {
            draw(lines[i], 0, startY + i * lineHeight);
        }

        ctx.restore();
    }
}
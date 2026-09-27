"use strict";

/**
 * Estuary adapter for the Textual language.
 * Thin translation layer between Estuary's Exolang API and the core.
 */
import { compile, run } from "./core.js";
import { CanvasRenderer } from "./canvas-renderer.js";
import { installMediaStreamShim } from "./stream-shim.js";

// Temporary: allows Punctual's `vid "stream://..."` to work.
installMediaStreamShim();

/** Entry point required by Estuary. */
export function exoLang(args) {
    return new EstuaryAdapter();
}

export class EstuaryAdapter {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "textual-canvas";
        this.canvas.setAttribute(
            "style",
            "z-index: -1; position: fixed; left: 0px; top: 0px; width: 100vw; height: 100vh; pointer-events: none;"
        );
        document.body.appendChild(this.canvas);
        this.renderer = new CanvasRenderer(this.canvas);
        this.zones = new Map(); // zoneId -> compiled function
        this.brightness = 1.0;
        this.pendingFeedback = 0;
        this.errors = new Map(); // zone -> last runtime error message
        this.tempo = { cps: 0.5, time: 0, count: 0 };
    }

    async define(args) {
        const code = args.text ? args.text.trim() : "";

        if (!code) {
            this.zones.delete(args.zone);
            return { info: `Cleared zone ${args.zone}` };
        }

        let compiled;
        try {
            compiled = compile(code);
            run(compiled, 0, this.tempo);
        } catch (err) {
            throw new Error(`Textual: ${err.message}`);
        }

        this.zones.set(args.zone, compiled);
        this.errors.delete(args.zone);
        return { info: `Textual zone ${args.zone}: compiled` };
    }

    clear(args) {
        this.zones.delete(args.zone);
    }


    preRender(args) {
        if (!args.canDraw) return;
        this.renderer.resetStreamActivity();
        this.renderer.beginFrame("", this.pendingFeedback);
        for (const name of this.renderer.streams.keys()) {
            this.renderer.beginFrame(name, this.pendingFeedback);
        }
    }

    render(args) {
        if (!args.canDraw) return [];

        const compiled = this.zones.get(args.zone);
        if (!compiled) return [];

        let outputs, feedback;
        try {
            ({ outputs, feedback } = run(compiled, args.nowTime, this.tempo));
        } catch (err) {
            this._logOnce(args.zone, err);
            return [];
        }

        this.errors.delete(args.zone);
        this.pendingFeedback = feedback;

        for (const [destination, nodes] of outputs) {
            if (nodes.length === 0) continue;

            if (destination === "") {
                this.renderer.draw(nodes, {
                    brightness: this.brightness,
                    target: "",
                });
            } else {
                const stream = this.renderer.getStream(destination);
                window.__mediaStreams = window.__mediaStreams || {};
                window.__mediaStreams[destination] = stream;
                this.renderer.draw(nodes, {
                    brightness: this.brightness,
                    target: destination,
                });
            }
        }

        return [];
    }

    _logOnce(zone, err) {
        const message = err && err.message ? err.message : String(err);
        if (this.errors.get(zone) === message) return;
        this.errors.set(zone, message);
        console.error(`[Textual] Zone ${zone}:`, err);
    }

    postRender(args) {
        if (!args.canDraw) return;
        const removed = this.renderer.sweepInactiveStreams();
        for (const name of removed) {
            if (window.__mediaStreams) delete window.__mediaStreams[name];
        }
    }

    setBrightness(brightness) {
        this.brightness = brightness;
    }

    setTempo(tempo) {
        this.tempo = {
            cps: Number(tempo.freqNumerator) / Number(tempo.freqDenominator),
            time: tempo.time,
            count: Number(tempo.countNumerator) / Number(tempo.countDenominator),
        };
    }

    setAudioInput() { }
    setAudioOutput() { }
    setOutputChannelCount() { }
    setFillModeScreen() { }
    setFillModePage() { }
}
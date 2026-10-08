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
        this.tempo = { cps: 0.5, time: 0, count: 0 };
        this.brightness = 1.0;

        // Zone state
        this.zones = new Map();         // zone -> current compiled function
        this.lastWorking = new Map();   // zone -> last compiled function that rendered without error
        this.currentBroken = new Set(); // zones whose current code is known to fail at render
        this.errors = new Map();        // zone -> last error message logged
        this._frameUsed = new Map();    // zone -> compiled function used this frame

        // Frame state (reset each frame)
        this._frameBuffers = new Map(); // zone -> outputs
        this._frameFeedback = 0;
    }

    async define(args) {
        const code = args.text ? args.text.trim() : "";

        if (!code) {
            this.zones.delete(args.zone);
            this.lastWorking.delete(args.zone);
            this.currentBroken.delete(args.zone);
            this.errors.delete(args.zone);
            return { info: `Cleared zone ${args.zone}` };
        }

        let compiled;
        try {
            compiled = compile(code);
        } catch (err) {
            throw new Error(`Textual: ${err.message}`);
        }

        // Test run: catch runtime errors in the code itself, and draw
        // errors in resolveText / customTransform.
        try {
            const { outputs } = run(compiled, 0, this.tempo);
            for (const nodes of outputs.values()) {
                this.renderer.dryRun(nodes);
            }
        } catch (err) {
            throw new Error(`Textual: ${err.message}`);
        }

        this.zones.set(args.zone, compiled);
        this.currentBroken.delete(args.zone);
        this.errors.delete(args.zone);
        return { info: `Textual zone ${args.zone}: compiled` };
    }

    clear(args) {
        this.zones.delete(args.zone);
        this.lastWorking.delete(args.zone);
        this.currentBroken.delete(args.zone);
        this.errors.delete(args.zone);
    }

    preRender(args) {
        if (!args.canDraw) return;
        this._frameBuffers.clear();
        this._frameUsed.clear();
        this._frameFeedback = 0;
        this.renderer.resetStreamActivity();
    }

    render(args) {
        if (!args.canDraw) return [];

        const current = this.zones.get(args.zone);
        if (!current) return [];

        let outputs, feedback, used;

        if (this.currentBroken.has(args.zone)) {
            const fallback = this.lastWorking.get(args.zone);
            if (!fallback) return [];
            try {
                ({ outputs, feedback } = run(fallback, args.nowTime, this.tempo, this.renderer.aspect));
                used = fallback;
            } catch (err) {
                return [];
            }
        } else {
            try {
                ({ outputs, feedback } = run(current, args.nowTime, this.tempo, this.renderer.aspect));
                used = current;
                this.errors.delete(args.zone);
            } catch (err) {
                this._logOnce(args.zone, err);
                this.currentBroken.add(args.zone);
                const fallback = this.lastWorking.get(args.zone);
                if (!fallback) return [];
                try {
                    ({ outputs, feedback } = run(fallback, args.nowTime, this.tempo, this.renderer.aspect));
                    used = fallback;
                } catch (err2) {
                    return [];
                }
            }
        }

        this._frameFeedback = Math.max(this._frameFeedback, feedback);
        this._frameBuffers.set(args.zone, outputs);
        this._frameUsed.set(args.zone, used);
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

        this.renderer.beginFrame("", this._frameFeedback);
        for (const name of this.renderer.streams.keys()) {
            this.renderer.beginFrame(name, this._frameFeedback);
        }

        for (const [zone, outputs] of this._frameBuffers) {
            try {
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
                // Draw succeeded for this zone: commit lastWorking.
                const used = this._frameUsed.get(zone);
                if (used && !this.currentBroken.has(zone)) {
                    this.lastWorking.set(zone, used);
                }
            } catch (err) {
                this._logOnce(zone, err);
                this.currentBroken.add(zone);
            }
        }

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
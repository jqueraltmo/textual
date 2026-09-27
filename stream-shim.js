"use strict";

/**
 * TEMPORARY SHIM — do not keep once Punctual supports MediaStreams.
 *
 * Allows any <video> element on the page to consume a MediaStream
 * published under `window.__mediaStreams` by using a `stream://name`
 * URL. The actual `src` is replaced by `srcObject`, and the standard
 * media events are dispatched so consumers that wait for metadata
 * before playing still work.
 *
 * Install once, before any consumer tries to load a `stream://` URL.
 */

let installed = false;

export function installMediaStreamShim() {
    if (installed) return;
    installed = true;

    const proto = HTMLMediaElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "src");
    if (!descriptor || !descriptor.set) return;

    Object.defineProperty(proto, "src", {
        configurable: true,
        enumerable: descriptor.enumerable,
        get() {
            return descriptor.get.call(this);
        },
        set(value) {
            if (typeof value === "string" && value.startsWith("stream://")) {
                const name = value.slice("stream://".length);
                const stream = window.__mediaStreams?.[name];
                if (stream) {
                    this.srcObject = stream;
                    queueMicrotask(() => {
                        this.dispatchEvent(new Event("loadedmetadata"));
                        this.dispatchEvent(new Event("loadeddata"));
                        this.dispatchEvent(new Event("canplay"));
                        this.play().catch(() => { });
                    });
                    return;
                }
                console.warn(`[Textual] stream not found: ${name}`);
            }
            descriptor.set.call(this, value);
        },
    });

    const removeAttr = proto.removeAttribute;
    proto.removeAttribute = function (name) {
        if (name === "src" && this.srcObject) {
            this.srcObject = null;
            return;
        }
        return removeAttr.call(this, name);
    };
}
'use strict';

import { Node } from './Node.js';
import { getVideo } from './video-cache.js';

export class VideoNode extends Node {
    constructor(dispatch, url) {
        super(dispatch);
        this.url = url;
        this._video = null;
        this._rangeStart = undefined;
        this._rangeEnd = null;
        this._rate = undefined;
        this._loop = undefined;
    }
    start(t = 0) { this._start = t; return this; }
    rate(r = 1) { this._rate = r; return this; }
    loop(on = true) { this._loop = on; return this; }
    range(start = 0, end = null) {
        this._rangeStart = start;
        this._rangeEnd = end;
        return this;
    }

    _drawSelf(env) {
        // Resolve start and refresh the cache entry if the URL or start changed.
        const start = this._start?.valueOf?.() ?? this._start ?? 0;
        if (!this._video || this._videoUrl !== this.url || this._videoStart !== start) {
            this._video = getVideo(this.url, start);
            this._videoUrl = this.url;
            this._videoStart = start;
        }

        const { video, ready, error, start: entryStart } = this._video;
        if (!ready || error) return;
        if (video.readyState < 2) return;

        // playbackRate: absolute value, Chrome doesn't support negative.
        const rate = Math.abs(this._rate?.valueOf?.() ?? this._rate ?? 1);
        if (Math.abs(video.playbackRate - rate) > 0.001) {
            video.playbackRate = rate;
        }

        const shouldLoop = this._loop === undefined
            ? true
            : (this._loop?.valueOf?.() ?? this._loop);

        if (this._rangeStart !== undefined) {
            // range() takes priority: manual loop between start and end.
            this._applyRange(video, shouldLoop);
        } else {
            // Loop from the end back to `start`, not to 0.
            if (video.ended || video.currentTime >= video.duration - 0.02) {
                if (shouldLoop) {
                    video.currentTime = entryStart;
                } else {
                    video.pause();
                }
            }
        }

        if (video.paused && (this._rangeStart !== undefined || shouldLoop)) {
            video.play().catch(() => { });
        }

        const w = video.videoWidth * this._zoomx;
        const h = video.videoHeight * this._zoomy;
        env.ctx.drawImage(video, -w / 2, -h / 2, w, h);
    }

    _applyRange(video, shouldLoop) {
        const start = this._rangeStart?.valueOf?.() ?? this._rangeStart;
        const end = this._rangeEnd != null
            ? (this._rangeEnd?.valueOf?.() ?? this._rangeEnd)
            : video.duration;
        if (!Number.isFinite(end)) return;

        const prev = video._textualRange;
        const changed = !prev || prev[0] !== start || prev[1] !== end;

        if (changed) {
            video._textualRange = [start, end];
            video.loop = false;
            video.currentTime = start;
            return;
        }

        if (video.currentTime >= end) {
            if (shouldLoop) {
                video.currentTime = start;
            } else {
                video.pause();
            }
        }
    }
}

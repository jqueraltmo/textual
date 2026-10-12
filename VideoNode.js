'use strict';

import { Node } from './Node.js';
import { getVideo } from './video-cache.js';

export class VideoNode extends Node {
    constructor(dispatch, url) {
        super(dispatch);
        this.url = url;
        this._fit = 1;
        this._video = null;
        this._rangeStart = undefined;
        this._rangeEnd = null;
        this._rate = undefined;
        this._loop = undefined;
    }

    rate(r = 1) { this._rate = r; return this; }
    loop(on = true) { this._loop = on; return this; }
    range(start = 0, end = null) {
        this._rangeStart = start;
        this._rangeEnd = end;
        return this;
    }

    _drawSelf(env) {
        if (!this._video) this._video = getVideo(this.url);
        const { video, ready, error } = this._video;
        if (!ready || error) return;
        if (video.readyState < 2) return;

        const rate = Math.abs(this._rate?.valueOf?.() ?? this._rate ?? 1);
        if (Math.abs(video.playbackRate - rate) > 0.001) {
            video.playbackRate = rate;
        }

        if (this._rangeStart !== undefined) {
            this._applyRange(video);
        } else if (this._loop !== undefined) {
            video.loop = this._loop?.valueOf?.() ?? this._loop;
        }

        if (video.paused) video.play().catch(() => { });

        const w = video.videoWidth * this.zoomx;
        const h = video.videoHeight * this.zoomy;
        env.ctx.drawImage(video, -w / 2, -h / 2, w, h);
    }

    _applyRange(video) {
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

        if (video.currentTime >= end) video.currentTime = start;
    }
}

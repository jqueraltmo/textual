'use strict';

import { Node } from './Node.js';
import { getImage } from './image-cache.js';

export class ImageNode extends Node {
    constructor(dispatch, url) {
        super(dispatch);
        this.url = url;
        this._fit = 1;      // images default to uniform positioning
        this._image = null;
    }

    _drawSelf(env) {
        if (!this._image) this._image = getImage(this.url);
        const { img, loaded, error } = this._image;
        if (!loaded || error) return;

        const w = img.naturalWidth * this.zoomx;
        const h = img.naturalHeight * this.zoomy;

        env.ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
}

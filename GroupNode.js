'use strict';

import { Node } from './Node.js';

export class GroupNode extends Node {
    constructor(dispatch, ...args) {
        super(dispatch);
        this.children = (args.length === 1 && Array.isArray(args[0])) ? args[0] : args;
    }

    clone(...children) {
        const copy = super.clone();
        copy.children = this.children.map(c => c);
        if (children.length > 0) copy.children = children;
        return copy;
    }

    _drawSelf(ctx, width, height) {
        for (const child of this.children) {
            child.draw(ctx, width, height);
        }
    }

    dryRun(ctx) {
        super.dryRun(ctx);
        for (const child of this.children) {
            child.dryRun(ctx);
        }
    }
}

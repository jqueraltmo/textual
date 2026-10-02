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

    _drawSelf(env) {
        for (const child of this.children) {
            child.draw(env);
        }
    }

    dryRun(env) {
        super.dryRun(env);
        for (const child of this.children) {
            child.dryRun(env);
        }
    }
}

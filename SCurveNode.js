import { BezierNode } from "./BezierNode.js";

export class SCurveNode extends BezierNode {
    constructor(dispatch, x = 1, y = 0, bend = 0) {
        super(dispatch);
        this.end = [x, y];
        this.bend = bend;
        this._rebuild();
    }

    _rebuild() {
        const [x, y] = this.end;
        const { bend } = this;
        const px = -y, py = x;
        this.bezier(
            [0, 0],
            [x / 3 + bend * px, y / 3 + bend * py],
            [2 * x / 3 + bend * px, 2 * y / 3 - bend * py],
            [x, y]
        );
    }

    clone(x, y, bend) {
        const copy = super.clone();
        if (x !== undefined || y !== undefined) {
            copy.end = [
                x !== undefined ? x : this.end[0],
                y !== undefined ? y : this.end[1],
            ];
        }
        if (bend !== undefined) copy.bend = bend;
        if (x !== undefined || y !== undefined || bend !== undefined) {
            copy._rebuild();
        }
        return copy;
    }
}

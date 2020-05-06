export class Changes {
    y: number;
    x: number;
    val: string;
    isOriginal: boolean;
    lookedAt: boolean;
    prevChange: number;

    constructor(y: number, x: number, val: string, isOriginal: boolean, lookedAt: boolean, prevChange: number) {
        this.y = y;
        this.x = x;
        this.val = val;
        this.isOriginal = isOriginal;
        this.lookedAt = lookedAt;
        this.prevChange = prevChange;
    }
}

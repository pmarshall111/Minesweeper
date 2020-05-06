export class OptionsChanges {
    y: number;
    x: number;
    val: string;
    inEveryOption: boolean

    constructor(y: number, x: number, val: string, inEveryOption: boolean) {
        this.y = y;
        this.x = x;
        this.val = val;
        this.inEveryOption = inEveryOption;
    }
}

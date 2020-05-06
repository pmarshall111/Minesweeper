import {Changes} from "./Changes";
import {OptionsChanges} from "./OptionsChanges";

export class IterableHist {
    current: string[][];
    nextIndex: {y: number, x: number};
    changes: Changes[]
    options: string[][][];
    optionsIdx: number;
    optionsChanges: OptionsChanges[];
    startLastTime: string[][];
    finished: boolean;
    solutionPossible: boolean;
    solvingStatus: string;
    flags: number;
    spaceToStartNextIterationFrom: {y: number, x:number}

    constructor(current: string[][], nextIndex: { y: number; x: number }, changes: Changes[], options: string[][][], optionsIdx: number,
                optionsChanges: OptionsChanges[], startLastTime: string[][], finished: boolean, solutionPossible: boolean,
                solvingStatus: string, flags: number, spaceToStartNextIterationFrom: {y: number, x: number}) {
        this.current = current;
        this.nextIndex = nextIndex;
        this.changes = this.makeChangesCopy(changes);
        this.options = this.makeOptionsCopy(options);
        this.optionsIdx = optionsIdx;
        this.optionsChanges = this.makeOptionsChangesCopy(optionsChanges);
        this.startLastTime = startLastTime;
        this.finished = finished;
        this.solutionPossible = solutionPossible;
        this.solvingStatus = solvingStatus;
        this.flags = flags;
        this.spaceToStartNextIterationFrom = spaceToStartNextIterationFrom;
    }

    private makeChangesCopy(changes: Changes[]): Changes[]{
        let newArr: Changes[] = [];
        changes.forEach(change => {
            let {y, x, val, isOriginal, lookedAt, prevChange} = change;
            newArr.push(new Changes(y,x,val,isOriginal,lookedAt, prevChange));
        })
        return newArr;
    }

    private makeOptionsCopy(options: string[][][]): string[][][] {
        let newArr: string[][][] = [];
        options.forEach(r1 => {
            let arr2d: string[][] = [];
            r1.forEach(r2 => {
                arr2d.push(r2.slice());
            })
            newArr.push(arr2d);
        });
        return newArr;
    }

    private makeOptionsChangesCopy(optionsChanges: OptionsChanges[]): OptionsChanges[] {
        let newArr: OptionsChanges[] = [];
        optionsChanges.forEach(optionsChange => {
            let {y, x, val, inEveryOption} = optionsChange;
            newArr.push(new OptionsChanges(y,x,val,inEveryOption));
        })
        return newArr;
    }
}

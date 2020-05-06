import {Changes} from "./Changes";
import {OptionsChanges} from "./OptionsChanges";

export class InfoForSite {
    changes:Changes[];
    optionsChanges: OptionsChanges[];
    finished: boolean;
    solutionPossible: boolean;
    flags: number;
    current: string[][];
    solvingStatus: string;
    isPrev: boolean; //used within the site to know whether we've gone forwards or backwards.

    constructor(changes: Changes[], optionsChanges: OptionsChanges[], finished: boolean, solutionPossible: boolean,
                flags: number, current: string[][], solvingStatus: string) {
        this.changes = changes;
        this.optionsChanges = optionsChanges;
        this.finished = finished;
        this.solutionPossible = solutionPossible;
        this.flags = flags;
        this.current = current;
        this.solvingStatus = solvingStatus;
        this.isPrev = false;
    }

}

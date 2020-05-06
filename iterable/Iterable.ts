import {IterableHist} from "./IterableHist";
import {Changes} from "./Changes";
import {OptionsChanges} from "./OptionsChanges";
import {InfoForSite} from "./InfoForSite";

export class Iterable {
    private current: string[][];
    private flags: number;
    private solution: string[][];
    finished: boolean;
    solutionPossible: boolean;
    private nextIndex: {y: number, x: number};
    private changes: Changes[]
    private options: string[][][];
    private optionsIdx: number;
    private optionsChanges: OptionsChanges[];
    private startLastTime: string[][];
    private solvingStatus: string;
    private spaceToStartNextIterationFrom: {y: number, x: number};
    private history: IterableHist[];

    constructor(current: string[][], solution: string[][], flags: number) {
        this.current = current;
        this.flags = flags;
        this.solution = solution;
        this.finished = false;
        this.solutionPossible = true;
        this.nextIndex = {y: 0, x: 0};
        this.changes = [];
        this.options = [];
        this.optionsIdx = 0;
        this.optionsChanges = [];
        this.startLastTime = this.makeBoardCopy(current);
        this.solvingStatus = "Not yet started.";
        this.spaceToStartNextIterationFrom = {y: 999, x: 999};
        this.history = [];
        this.storeHistory();
    }

    private openAllRemainingSquares(): InfoForSite {
        for (let y = 0; y<this.current.length; y++) {
            for (let x = 0; x<this.current[y].length; x++) {
                if (this.current[y][x] == "?") {
                    let val = this.open(y,x);
                    this.changes.push(new Changes(y, x, val, false, true, -1));
                }
            }
        }
        this.solvingStatus = "Used all our flags, so reminaing squares are opened. Board is now solved.";
        this.finished = true;
        return this.getReturnObj();
    }

    next(): InfoForSite {
        if (!this.finished && this.solutionPossible) {
            if (this.flags == 0) {
                return this.openAllRemainingSquares();
            }

            let toRecurseFromIndex: number = this.getLatestChangeIndexToLookAt();
                if (toRecurseFromIndex == -1) {
                    //then we have no chain to look through and need to just continue looping through array as usual
                    this.changes = [];
                    if (this.nextIndex.y <= this.current.length-1) {
                        return this.moveToNextSquare();
                    } else if (!this.equal2dArrays(this.current,this.startLastTime)) {
                        //something changed, go back to beginning of array and try again.
                        return this.moveBackToStartOfArray();
                    } else {
                        //nothing changed. we need to calculate permutations of available spaces to move forward.
                        return this.calcBoardPermutations();
                    }
                } else {
                    //then we have a current chain to look through
                    let {y, x, val} = this.changes[toRecurseFromIndex];
                    if (val == "?" && y < this.spaceToStartNextIterationFrom.y && x < this.spaceToStartNextIterationFrom.x) {
                        this.setNextIterationStartSpace(y,x);
                    }
                    this.tryOpenAroundSquare(y, x, toRecurseFromIndex);
                    this.changes[toRecurseFromIndex].lookedAt = true;
                    this.storeHistory();
                    this.solvingStatus = `Looking through chain to open boxes. Currently looking at the darkest purple square (val: ${val}) to see if any surrounding
                    boxes can be opened. Turquoise boxes are those opened by the current chain.`
                    return this.getReturnObj();
                }
        } else {
            this.solvingStatus = this.solutionPossible ? "Solved." : "Unsolvable."
            return this.getReturnObj();
        }
    }

    setNextIterationStartSpace(y: number, x: number) {
        let obj = {y,x};
        if (y-1 >= 0) {
            if (x-1 >= 0) {
                obj = {y: y-1, x: x-1}
            } else {
                obj = {y: y-1, x}
            }
        } else if (x-1 >= 0) {
            obj = {y, x:x-1}
        }
        this.spaceToStartNextIterationFrom = obj;
    }

    prev(): InfoForSite {
        //restoring class fields to how they were on previous iteration.
        let lastState = this.history[this.history.length-2];
        let {current, nextIndex,changes, options, optionsIdx, optionsChanges, startLastTime, finished,
            solutionPossible, solvingStatus, flags, spaceToStartNextIterationFrom} = lastState;
        this.current = current;
        this.nextIndex = nextIndex;
        this.changes = changes;
        this.options = options;
        this.optionsIdx = optionsIdx;
        this.optionsChanges = optionsChanges;
        this.startLastTime = startLastTime;
        this.finished = finished;
        this.solutionPossible = solutionPossible;
        this.solvingStatus = solvingStatus;
        this.flags = flags;
        this.spaceToStartNextIterationFrom = spaceToStartNextIterationFrom;
        this.history = this.history.slice(0, this.history.length-1);
        return this.getReturnObj();
    }

    getReturnObj(): InfoForSite {
        let {changes, optionsChanges, finished, solutionPossible, flags, current, solvingStatus} = this;
        return new InfoForSite(changes, optionsChanges, finished, solutionPossible, flags, current, solvingStatus);
    }

    private moveToNextSquare(): InfoForSite {
        let {y,x} = this.nextIndex;
        // this.tryOpenAroundSquare(i, j);
        this.changes.unshift(new Changes(y,x,this.current[y][x], true, false, -1));
        this.nextIndex = (x==this.current[0].length-1) ? {y: y+1, x: 0} : {y: y, x:x+1};
        this.storeHistory();
        this.solvingStatus = "Moving to next square and seeing if any surrounding squares can be opened or flagged."
        return this.getReturnObj();
    }

    private moveBackToStartOfArray(): InfoForSite {
        this.startLastTime = this.makeBoardCopy(this.current);
        this.options = [];
        this.optionsChanges = [];
        this.nextIndex = this.spaceToStartNextIterationFrom;
        this.spaceToStartNextIterationFrom = {y: 999, x: 999};
        this.storeHistory();
        this.solvingStatus = "Moving back to start of the board."
        return this.getReturnObj();
    }

    private calcBoardPermutations(): InfoForSite{
        if (this.options.length == 0) {
            //we've come to the end of the array and unable to change anything. look for possibilities.
            this.getPossiblePositions(this.current, this.flags);
            this.optionsIdx = 0;
        }
        if (this.optionsIdx != this.options.length) {
            //return to user the changes that would be made if the curent option was implemented.
            let nextBoard = this.options[this.optionsIdx];
            this.getOptionsChangesFromCurrent(nextBoard);
            this.optionsIdx++;
            this.storeHistory();
            this.solvingStatus = `Showing permutation ${this.optionsIdx} of ${this.options.length}.`
            return this.getReturnObj();
        } else {
            //we've reached the end of the options. we make permanent any changes that appeared in all options.
            let changes = this.optionsChanges.filter(x => x.inEveryOption);
            changes.forEach(change => {
                let {y,x,val} = change;
                if (val == "b") {
                    this.flags--;
                    this.current[y][x] = "x";
                    this.changes.push(new Changes(y,x, "x", true, true, -1))
                } else if (val == "t") {
                    this.current[y][x] = this.open(y,x);
                    this.changes.push(new Changes(y,x, this.current[y][x],  true,  false, -1));
                }
            })
            if (this.equal2dArrays(this.current, this.startLastTime) && !this.checkIfFinished()) {
                this.solutionPossible = false;
                // return "?";
            } else if (this.checkIfFinished()) {
                this.finished = true;
            }
            this.startLastTime = this.makeBoardCopy(this.current);
            this.options = [];
            this.optionsChanges = [];
            this.nextIndex = this.spaceToStartNextIterationFrom;
            this.spaceToStartNextIterationFrom = {y: 999, x:999}
            this.storeHistory();
            this.solvingStatus = "Any squares that were bombs or spaces throughout ALL permutations are made permanent."
            return this.getReturnObj();
        }
    }

    storeHistory() {
        this.history.push(
            new IterableHist(this.makeBoardCopy(this.current),
                this.nextIndex,
                this.changes,
                this.options,
                this.optionsIdx,
                this.optionsChanges,
                this.makeBoardCopy(this.startLastTime),
            this.finished,
            this.solutionPossible,
                this.solvingStatus,
                this.flags,
                this.spaceToStartNextIterationFrom)
        );
    }
    
    checkIfFinished() {
        for (let i = 0; i < this.current.length; i++) {
            for (let j = 0; j < this.current[0].length; j++) {
                if (this.current[i][j] == "?") {
                    return false;
                }
            }
        }
        return true;
    }

    //method identifying which squares the current pemutation would change so they can be displayed to the user.
    getOptionsChangesFromCurrent(board: string[][]) {
        let newOptionsChanges: OptionsChanges[] = []
        for (let i = 0; i< board.length; i++) {
            for (let j = 0; j<board[0].length; j++) {
                if (board[i][j] != this.current[i][j]) {
                    if (this.optionsChanges.length == 0) {
                        //on first iteration - inEvery option has to be true.
                        newOptionsChanges.push(new OptionsChanges(i,j, board[i][j], true));
                    } else {
                        let added = false;
                        for (let a = 0; a<this.optionsChanges.length; a++) {
                            if (this.optionsChanges[a].y == i && this.optionsChanges[a].x == j &&
                                this.optionsChanges[a].inEveryOption && this.optionsChanges[a].val == board[i][j]) {
                                newOptionsChanges.push(new OptionsChanges(i,j, board[i][j], true));
                                added=true;
                                break;
                            }
                        }

                        if (!added) {
                            newOptionsChanges.push(new OptionsChanges(i,j, board[i][j], false))
                        }

                    }
                }
            }
        }
        this.optionsChanges = newOptionsChanges;
    }

    getPossiblePositions(_board: string[][], _numBombs: number) {
        var options: string[][][] = []
        const recurse = (board: string[][], numBombs: number, _i: number = 0, _j: number = 0): void => {
            //using firstIteration so loop can start at where we last changed, but also start at 0 on the next line
            var firstIteration = true
            for (var i = _i; i<board.length; i++) {
                for (var j = firstIteration ? _j : 0; j<board[0].length; j++) {
                    if (isNaN(+board[i][j])) continue;

                    var sqInfo = this.getSquareInfo(board, i, j);
                    var flagsNeeded = +sqInfo.boxNumber - sqInfo.surrFlagged.length;
                    //doing checks so we can stop iterating if a number is invalid, or continue if there's nothing to do
                    //invalid
                    if (sqInfo.surrFlagged.length > +sqInfo.boxNumber) return;
                    if (flagsNeeded>numBombs) return;
                    if (flagsNeeded>sqInfo.surrAvailable.length) return;

                    //nothing to do
                    if (sqInfo.surrAvailable.length === 0) continue;
                    if (flagsNeeded === 0) {
                        var nBoard = this.makeBoardCopy(board);
                        for (let i = 0; i<sqInfo.surrAvailable.length; i++) {
                            let pos = sqInfo.surrAvailable[i];
                            nBoard[pos.y][pos.x] = "t"
                        }
                        return recurse(nBoard, numBombs, i, j)
                    };

                    var updatedNumbBombs = numBombs-flagsNeeded

                    //making array that we can plug into combinations generator
                    //b is for a predicted bomb and t is for predicted taken space
                    var array = new Array(sqInfo.surrAvailable.length);
                    for (let i = 0; i<array.length; i++) {
                        array[i] = "t";
                    }
                    for (var a = 0; a<flagsNeeded; a++) {
                        array[a] = "b"
                    }
                    var possibilities = this.combinations(array)

                    // @ts-ignore
                    possibilities.forEach(possibility => {
                        var nBoard = this.makeBoardCopy(board);
                        for (let i = 0; i<sqInfo.surrAvailable.length; i++) {
                            let pos = sqInfo.surrAvailable[i];
                            nBoard[pos.y][pos.x] = possibility[i]
                        }
                        recurse(nBoard, updatedNumbBombs, i, j)
                    });
                    return;
                }
                firstIteration = false;
            }
            options.push(board)
        }
        recurse(_board, _numBombs)
        this.options = options;
    }

    getBombOptions(board: string[][], numBombs: number, _i = 0, _j = 0): void {
        //using firstIteration so loop can start at where we last changed, but also start at 0 on the next line
        var firstIteration = true
        for (var i = _i; i<board.length; i++) {
            for (var j = firstIteration ? _j : 0; j<board[0].length; j++) {
                if (isNaN(+board[i][j])) continue;

                var sqInfo = this.getSquareInfo(this.current, i, j)
                var flagsNeeded = +sqInfo.boxNumber - sqInfo.surrFlagged.length;

                //doing checks so we can stop iterating if a number is invalid, or continue if there's nothing to do
                //invalid
                if (sqInfo.surrFlagged.length > +sqInfo.boxNumber) return;
                if (flagsNeeded>numBombs) return;
                if (flagsNeeded>sqInfo.surrAvailable.length) return;

                //nothing to do
                if (sqInfo.surrAvailable.length === 0) continue;
                if (flagsNeeded === 0) {
                    var nBoard = this.makeBoardCopy(board);
                    for (let i = 0; i<sqInfo.surrAvailable.length; i++) {
                        let pos = sqInfo.surrAvailable[i];
                        nBoard[pos.y][pos.x] = "t"
                    }
                    return this.getBombOptions(nBoard, numBombs, i, j)
                }

                var updatedNumbBombs = numBombs-flagsNeeded

                //making array that we can plug into combinations generator
                //b is for a predicted bomb and t is for predicted taken space
                var array: string[] = new Array(sqInfo.surrAvailable.length).map(x => "t");
                for (var a = 0; a<flagsNeeded; a++) {
                    array[a] = "b"
                }
                var possibilities = this.combinations(array)

                // @ts-ignore
                possibilities.forEach((possibility: string[]) => {
                    var nBoard = this.makeBoardCopy(board);
                    for (let i = 0; i<sqInfo.surrAvailable.length; i++) {
                        let pos = sqInfo.surrAvailable[i];
                        nBoard[pos.y][pos.x] = possibility[i]
                    }
                    this.getBombOptions(nBoard, updatedNumbBombs, i, j)
                });
                return;
            }
            firstIteration = false;
        }
        this.options.push(board)
    }

    combinations(array: string[]) {
        var perms = this.permutations(array)
        for (var i = 0; i<perms.length-1; i++) {
            for (var j = i+1; j<perms.length; j++) {
                // @ts-ignore
                if (this.equalArrays(perms[i], perms[j])) {perms.splice(j, 1); j--;}
            }
        }
        return perms
    }

    //slices 1 off the front of the array until we get to 2 elements, then we get the 2 permutations by rotating
    //through the values
    //then add back on the last element removed, rotate through to get the combinations and continue until there
    //are no more sliced values to add back on.
    permutations(array: string[]) {
        var result: string[][] = []
        if (array.length === 1) return array;
        if (array.length === 2) return [array.slice(),[array.pop(), array.pop()]]
        // @ts-ignore
        var next = this.permutations(array.slice(1)).map((each: string[]) => {each.unshift(array[0]); return each})
        next.forEach((perm: string[]) => {
            for (var i = 0; i<perm.length; i++) {
                // @ts-ignore
                perm.push(perm.shift());
                var arrays = perm.slice(); //copy needed otherwise the term pushed in is "circular object array"
                result.push(arrays)
            }
        });
        return result
    }

    equalArrays(array1: any[], array2: any[]) {
        for (var i = 0; i<array1.length; i++) {
            if (array1[i] !== array2[i]) return false
        }
        return true
    }

    equal2dArrays(array1: any[], array2: any[]) {
        for (var i = 0; i<array1.length; i++) {
            for (let j = 0; j<array1[0].length; j++) {
                if (array1[i][j] !== array2[i][j]) return false
            }
        }
        return true
    }

    makeBoardCopy(board: string[][]) {
        var copy = board.slice();
        return copy.map(x => x.slice())
    }

    getSurroundingSquares(i: number, j: number) {
        let squares = [];
        let toLeft = j-1, toUp = i-1, toRight = j+1, toDown = i+1;
        let leftValid = toLeft >= 0, upValid = toUp >= 0, rightValid = toRight < this.current[0].length, downValid = toDown < this.current.length;
        //left
        if (leftValid) {
            if (upValid) squares.push({i:toUp, j:toLeft});
            squares.push({i, j: toLeft});
            if (downValid) squares.push({i:toDown, j:toLeft});
        }
        //central
        if (upValid) squares.push({i:toUp, j});
        if (downValid) squares.push({i:toDown, j})
        //right
        if (rightValid) {
            if (upValid) squares.push({i:toUp, j:toRight});
            squares.push({i, j: toRight});
            if (downValid) squares.push({i:toDown, j:toRight});
        }

        return squares;
    }

    tryOpenAroundSquare(i: number, j: number, prevChangeIndex: number) {
        var info = this.getSquareInfo(this.current, i, j);
        var avail = info.surrAvailable;
        //if we don't need any more flags
        if (info.surrFlagged.length === +info.boxNumber) {
            for (var a = 0; a<avail.length; a++) {
                var val = this.open(avail[a].y,avail[a].x)
                this.current[avail[a].y][avail[a].x] = val
                this.changes.push(new Changes(avail[a].y, avail[a].x, val, false, false, prevChangeIndex));
            }
        }
        //if we need flags and there are no spare spaces
        let extraFlagsNeeded = +info.boxNumber - info.surrFlagged.length
        if (extraFlagsNeeded - info.surrAvailable.length === 0) {
            for (var b = 0; b<avail.length; b++) {
                this.current[avail[b].y][avail[b].x] = "x"
                this.changes.push(new Changes(avail[b].y, avail[b].x, "x", false, true, prevChangeIndex));
                this.flags--;
            }
        }
    }

    open(y: number, x: number): string {
        let ans = this.solution[y][x];
        if (ans == "x") {
            throw new Error("Opened a bomb!!!!!");
        } else {
            return ans;
        }
    }

    getLatestChangeIndexToLookAt(): number {
        for (let i = this.changes.length-1; i>=0; i--) {
            if (!this.changes[i].lookedAt) {
                this.changes[i].lookedAt = true;
                return i;
            }
        }
        return -1;
    }

    getSquareInfo(board: string[][], i: number, j: number) {
        let info: {boxNumber: string, surrFlagged: {y: number, x: number}[], surrAvailable: {y: number, x: number}[]}

        info = {
            boxNumber: board[i][j],
            surrFlagged: [],
            surrAvailable: []
        }

        //checking that the space we're looking at is a number
        if ("x?".indexOf(board[i][j]) != -1) return info;
        //now collecting info
        //try and catch blocks so that if we select an element that is not within the board the error doesn't break our program
        //boxes in row above
        try {if ("x?b".indexOf(board[i-1][j-1]) !== -1) {
            let posObj = {y: i-1, x: j-1}
            "x?b".indexOf(board[i-1][j-1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
        }} catch(e) {}
        try {if ("x?b".indexOf(board[i-1][j]) !== -1) {
            let posObj = {y: i-1, x: j}
            "x?b".indexOf(board[i-1][j]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
        }} catch(e) {}
        try {if ("x?b".indexOf(board[i-1][j+1]) !== -1) {
            let posObj = {y: i-1, x: j+1}
            "x?b".indexOf(board[i-1][j+1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
        }} catch(e) {}

        //boxes on same row
        try {if ("x?b".indexOf(board[i][j-1]) !== -1) {
            let posObj = {y: i, x: j-1}
            "x?b".indexOf(board[i][j-1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
        }} catch(e) {}
        try {if ("x?b".indexOf(board[i][j+1]) !== -1) {
            let posObj = {y: i, x: j+1}
            "x?b".indexOf(board[i][j+1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
        }} catch(e) {}
        //boxes beneath
        try {if ("x?b".indexOf(board[i+1][j-1]) !== -1) {
            let posObj = {y: i+1, x: j-1}
            "x?b".indexOf(board[i+1][j-1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
        }} catch(e) {}
        try {if ("x?b".indexOf(board[i+1][j]) !== -1) {
            let posObj = {y: i+1, x: j}
            "x?b".indexOf(board[i+1][j]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
        }} catch(e) {}
        try {if ("x?b".indexOf(board[i+1][j+1]) !== -1) {
            let posObj = {y: i+1, x: j+1}
            "x?b".indexOf(board[i+1][j+1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
        }} catch(e) {}

        return info
    }
}

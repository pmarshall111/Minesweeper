"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IterableHist_1 = require("./IterableHist");
var Changes_1 = require("./Changes");
var OptionsChanges_1 = require("./OptionsChanges");
var InfoForSite_1 = require("./InfoForSite");
var Iterable = /** @class */ (function () {
    function Iterable(current, solution, flags) {
        this.current = current;
        this.flags = flags;
        this.solution = solution;
        this.finished = false;
        this.solutionPossible = true;
        this.nextIndex = { y: 0, x: 0 };
        this.changes = [];
        this.options = [];
        this.optionsIdx = 0;
        this.optionsChanges = [];
        this.startLastTime = this.makeBoardCopy(current);
        this.solvingStatus = "Not yet started.";
        this.spaceToStartNextIterationFrom = { y: 999, x: 999 };
        this.history = [];
        this.storeHistory();
    }
    Iterable.prototype.openAllRemainingSquares = function () {
        for (var y = 0; y < this.current.length; y++) {
            for (var x = 0; x < this.current[y].length; x++) {
                if (this.current[y][x] == "?") {
                    var val = this.open(y, x);
                    this.changes.push(new Changes_1.Changes(y, x, val, false, true, -1));
                }
            }
        }
        this.solvingStatus = "Used all our flags, so reminaing squares are opened. Board is now solved.";
        this.finished = true;
        return this.getReturnObj();
    };
    Iterable.prototype.next = function () {
        if (!this.finished && this.solutionPossible) {
            if (this.flags == 0) {
                return this.openAllRemainingSquares();
            }
            var toRecurseFromIndex = this.getLatestChangeIndexToLookAt();
            if (toRecurseFromIndex == -1) {
                //then we have no chain to look through and need to just continue looping through array as usual
                this.changes = [];
                if (this.nextIndex.y <= this.current.length - 1) {
                    return this.moveToNextSquare();
                }
                else if (!this.equal2dArrays(this.current, this.startLastTime)) {
                    //something changed, go back to beginning of array and try again.
                    return this.moveBackToStartOfArray();
                }
                else {
                    //nothing changed. we need to calculate permutations of available spaces to move forward.
                    return this.calcBoardPermutations();
                }
            }
            else {
                //then we have a current chain to look through
                var _a = this.changes[toRecurseFromIndex], y = _a.y, x = _a.x, val = _a.val;
                if (val == "?" && y < this.spaceToStartNextIterationFrom.y && x < this.spaceToStartNextIterationFrom.x) {
                    this.setNextIterationStartSpace(y, x);
                }
                this.tryOpenAroundSquare(y, x, toRecurseFromIndex);
                this.changes[toRecurseFromIndex].lookedAt = true;
                this.storeHistory();
                this.solvingStatus = "Looking through chain to open boxes. Currently looking at the darkest purple square (val: " + val + ") to see if any surrounding\n                    boxes can be opened. Turquoise boxes are those opened by the current chain.";
                return this.getReturnObj();
            }
        }
        else {
            this.solvingStatus = this.solutionPossible ? "Solved." : "Unsolvable.";
            return this.getReturnObj();
        }
    };
    Iterable.prototype.setNextIterationStartSpace = function (y, x) {
        var obj = { y: y, x: x };
        if (y - 1 >= 0) {
            if (x - 1 >= 0) {
                obj = { y: y - 1, x: x - 1 };
            }
            else {
                obj = { y: y - 1, x: x };
            }
        }
        else if (x - 1 >= 0) {
            obj = { y: y, x: x - 1 };
        }
        this.spaceToStartNextIterationFrom = obj;
    };
    Iterable.prototype.prev = function () {
        //restoring class fields to how they were on previous iteration.
        var lastState = this.history[this.history.length - 2];
        var current = lastState.current, nextIndex = lastState.nextIndex, changes = lastState.changes, options = lastState.options, optionsIdx = lastState.optionsIdx, optionsChanges = lastState.optionsChanges, startLastTime = lastState.startLastTime, finished = lastState.finished, solutionPossible = lastState.solutionPossible, solvingStatus = lastState.solvingStatus, flags = lastState.flags, spaceToStartNextIterationFrom = lastState.spaceToStartNextIterationFrom;
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
        this.history = this.history.slice(0, this.history.length - 1);
        return this.getReturnObj();
    };
    Iterable.prototype.getReturnObj = function () {
        var _a = this, changes = _a.changes, optionsChanges = _a.optionsChanges, finished = _a.finished, solutionPossible = _a.solutionPossible, flags = _a.flags, current = _a.current, solvingStatus = _a.solvingStatus;
        return new InfoForSite_1.InfoForSite(changes, optionsChanges, finished, solutionPossible, flags, current, solvingStatus);
    };
    Iterable.prototype.moveToNextSquare = function () {
        var _a = this.nextIndex, y = _a.y, x = _a.x;
        // this.tryOpenAroundSquare(i, j);
        this.changes.unshift(new Changes_1.Changes(y, x, this.current[y][x], true, false, -1));
        this.nextIndex = (x == this.current[0].length - 1) ? { y: y + 1, x: 0 } : { y: y, x: x + 1 };
        this.storeHistory();
        this.solvingStatus = "Moving to next square and seeing if any surrounding squares can be opened or flagged.";
        return this.getReturnObj();
    };
    Iterable.prototype.moveBackToStartOfArray = function () {
        this.startLastTime = this.makeBoardCopy(this.current);
        this.options = [];
        this.optionsChanges = [];
        this.nextIndex = this.spaceToStartNextIterationFrom;
        this.spaceToStartNextIterationFrom = { y: 999, x: 999 };
        this.storeHistory();
        this.solvingStatus = "Moving back to start of the board.";
        return this.getReturnObj();
    };
    Iterable.prototype.calcBoardPermutations = function () {
        var _this = this;
        if (this.options.length == 0) {
            //we've come to the end of the array and unable to change anything. look for possibilities.
            this.getPossiblePositions(this.current, this.flags);
            this.optionsIdx = 0;
        }
        if (this.optionsIdx != this.options.length) {
            //return to user the changes that would be made if the curent option was implemented.
            var nextBoard = this.options[this.optionsIdx];
            this.getOptionsChangesFromCurrent(nextBoard);
            this.optionsIdx++;
            this.storeHistory();
            this.solvingStatus = "Showing permutation " + this.optionsIdx + " of " + this.options.length + ".";
            return this.getReturnObj();
        }
        else {
            //we've reached the end of the options. we make permanent any changes that appeared in all options.
            var changes = this.optionsChanges.filter(function (x) { return x.inEveryOption; });
            changes.forEach(function (change) {
                var y = change.y, x = change.x, val = change.val;
                if (val == "b") {
                    _this.flags--;
                    _this.current[y][x] = "x";
                    _this.changes.push(new Changes_1.Changes(y, x, "x", true, true, -1));
                }
                else if (val == "t") {
                    _this.current[y][x] = _this.open(y, x);
                    _this.changes.push(new Changes_1.Changes(y, x, _this.current[y][x], true, false, -1));
                }
            });
            if (this.equal2dArrays(this.current, this.startLastTime) && !this.checkIfFinished()) {
                this.solutionPossible = false;
                // return "?";
            }
            else if (this.checkIfFinished()) {
                this.finished = true;
            }
            this.startLastTime = this.makeBoardCopy(this.current);
            this.options = [];
            this.optionsChanges = [];
            this.nextIndex = this.spaceToStartNextIterationFrom;
            this.spaceToStartNextIterationFrom = { y: 999, x: 999 };
            this.storeHistory();
            this.solvingStatus = "Any squares that were bombs or spaces throughout ALL permutations are made permanent.";
            return this.getReturnObj();
        }
    };
    Iterable.prototype.storeHistory = function () {
        this.history.push(new IterableHist_1.IterableHist(this.makeBoardCopy(this.current), this.nextIndex, this.changes, this.options, this.optionsIdx, this.optionsChanges, this.makeBoardCopy(this.startLastTime), this.finished, this.solutionPossible, this.solvingStatus, this.flags, this.spaceToStartNextIterationFrom));
    };
    Iterable.prototype.checkIfFinished = function () {
        for (var i = 0; i < this.current.length; i++) {
            for (var j = 0; j < this.current[0].length; j++) {
                if (this.current[i][j] == "?") {
                    return false;
                }
            }
        }
        return true;
    };
    //method identifying which squares the current pemutation would change so they can be displayed to the user.
    Iterable.prototype.getOptionsChangesFromCurrent = function (board) {
        var newOptionsChanges = [];
        for (var i = 0; i < board.length; i++) {
            for (var j = 0; j < board[0].length; j++) {
                if (board[i][j] != this.current[i][j]) {
                    if (this.optionsChanges.length == 0) {
                        //on first iteration - inEvery option has to be true.
                        newOptionsChanges.push(new OptionsChanges_1.OptionsChanges(i, j, board[i][j], true));
                    }
                    else {
                        var added = false;
                        for (var a = 0; a < this.optionsChanges.length; a++) {
                            if (this.optionsChanges[a].y == i && this.optionsChanges[a].x == j &&
                                this.optionsChanges[a].inEveryOption && this.optionsChanges[a].val == board[i][j]) {
                                newOptionsChanges.push(new OptionsChanges_1.OptionsChanges(i, j, board[i][j], true));
                                added = true;
                                break;
                            }
                        }
                        if (!added) {
                            newOptionsChanges.push(new OptionsChanges_1.OptionsChanges(i, j, board[i][j], false));
                        }
                    }
                }
            }
        }
        this.optionsChanges = newOptionsChanges;
    };
    Iterable.prototype.getPossiblePositions = function (_board, _numBombs) {
        var _this = this;
        var options = [];
        var recurse = function (board, numBombs, _i, _j) {
            if (_i === void 0) { _i = 0; }
            if (_j === void 0) { _j = 0; }
            //using firstIteration so loop can start at where we last changed, but also start at 0 on the next line
            var firstIteration = true;
            for (var i = _i; i < board.length; i++) {
                for (var j = firstIteration ? _j : 0; j < board[0].length; j++) {
                    if (isNaN(+board[i][j]))
                        continue;
                    var sqInfo = _this.getSquareInfo(board, i, j);
                    var flagsNeeded = +sqInfo.boxNumber - sqInfo.surrFlagged.length;
                    //doing checks so we can stop iterating if a number is invalid, or continue if there's nothing to do
                    //invalid
                    if (sqInfo.surrFlagged.length > +sqInfo.boxNumber)
                        return;
                    if (flagsNeeded > numBombs)
                        return;
                    if (flagsNeeded > sqInfo.surrAvailable.length)
                        return;
                    //nothing to do
                    if (sqInfo.surrAvailable.length === 0)
                        continue;
                    if (flagsNeeded === 0) {
                        var nBoard = _this.makeBoardCopy(board);
                        for (var i_1 = 0; i_1 < sqInfo.surrAvailable.length; i_1++) {
                            var pos = sqInfo.surrAvailable[i_1];
                            nBoard[pos.y][pos.x] = "t";
                        }
                        return recurse(nBoard, numBombs, i, j);
                    }
                    ;
                    var updatedNumbBombs = numBombs - flagsNeeded;
                    //making array that we can plug into combinations generator
                    //b is for a predicted bomb and t is for predicted taken space
                    var array = new Array(sqInfo.surrAvailable.length);
                    for (var i_2 = 0; i_2 < array.length; i_2++) {
                        array[i_2] = "t";
                    }
                    for (var a = 0; a < flagsNeeded; a++) {
                        array[a] = "b";
                    }
                    var possibilities = _this.combinations(array);
                    // @ts-ignore
                    possibilities.forEach(function (possibility) {
                        var nBoard = _this.makeBoardCopy(board);
                        for (var i_3 = 0; i_3 < sqInfo.surrAvailable.length; i_3++) {
                            var pos = sqInfo.surrAvailable[i_3];
                            nBoard[pos.y][pos.x] = possibility[i_3];
                        }
                        recurse(nBoard, updatedNumbBombs, i, j);
                    });
                    return;
                }
                firstIteration = false;
            }
            options.push(board);
        };
        recurse(_board, _numBombs);
        this.options = options;
    };
    Iterable.prototype.getBombOptions = function (board, numBombs, _i, _j) {
        var _this = this;
        if (_i === void 0) { _i = 0; }
        if (_j === void 0) { _j = 0; }
        //using firstIteration so loop can start at where we last changed, but also start at 0 on the next line
        var firstIteration = true;
        for (var i = _i; i < board.length; i++) {
            for (var j = firstIteration ? _j : 0; j < board[0].length; j++) {
                if (isNaN(+board[i][j]))
                    continue;
                var sqInfo = this.getSquareInfo(this.current, i, j);
                var flagsNeeded = +sqInfo.boxNumber - sqInfo.surrFlagged.length;
                //doing checks so we can stop iterating if a number is invalid, or continue if there's nothing to do
                //invalid
                if (sqInfo.surrFlagged.length > +sqInfo.boxNumber)
                    return;
                if (flagsNeeded > numBombs)
                    return;
                if (flagsNeeded > sqInfo.surrAvailable.length)
                    return;
                //nothing to do
                if (sqInfo.surrAvailable.length === 0)
                    continue;
                if (flagsNeeded === 0) {
                    var nBoard = this.makeBoardCopy(board);
                    for (var i_4 = 0; i_4 < sqInfo.surrAvailable.length; i_4++) {
                        var pos = sqInfo.surrAvailable[i_4];
                        nBoard[pos.y][pos.x] = "t";
                    }
                    return this.getBombOptions(nBoard, numBombs, i, j);
                }
                var updatedNumbBombs = numBombs - flagsNeeded;
                //making array that we can plug into combinations generator
                //b is for a predicted bomb and t is for predicted taken space
                var array = new Array(sqInfo.surrAvailable.length).map(function (x) { return "t"; });
                for (var a = 0; a < flagsNeeded; a++) {
                    array[a] = "b";
                }
                var possibilities = this.combinations(array);
                // @ts-ignore
                possibilities.forEach(function (possibility) {
                    var nBoard = _this.makeBoardCopy(board);
                    for (var i_5 = 0; i_5 < sqInfo.surrAvailable.length; i_5++) {
                        var pos = sqInfo.surrAvailable[i_5];
                        nBoard[pos.y][pos.x] = possibility[i_5];
                    }
                    _this.getBombOptions(nBoard, updatedNumbBombs, i, j);
                });
                return;
            }
            firstIteration = false;
        }
        this.options.push(board);
    };
    Iterable.prototype.combinations = function (array) {
        var perms = this.permutations(array);
        for (var i = 0; i < perms.length - 1; i++) {
            for (var j = i + 1; j < perms.length; j++) {
                // @ts-ignore
                if (this.equalArrays(perms[i], perms[j])) {
                    perms.splice(j, 1);
                    j--;
                }
            }
        }
        return perms;
    };
    //slices 1 off the front of the array until we get to 2 elements, then we get the 2 permutations by rotating
    //through the values
    //then add back on the last element removed, rotate through to get the combinations and continue until there
    //are no more sliced values to add back on.
    Iterable.prototype.permutations = function (array) {
        var result = [];
        if (array.length === 1)
            return array;
        if (array.length === 2)
            return [array.slice(), [array.pop(), array.pop()]];
        // @ts-ignore
        var next = this.permutations(array.slice(1)).map(function (each) { each.unshift(array[0]); return each; });
        next.forEach(function (perm) {
            for (var i = 0; i < perm.length; i++) {
                // @ts-ignore
                perm.push(perm.shift());
                var arrays = perm.slice(); //copy needed otherwise the term pushed in is "circular object array"
                result.push(arrays);
            }
        });
        return result;
    };
    Iterable.prototype.equalArrays = function (array1, array2) {
        for (var i = 0; i < array1.length; i++) {
            if (array1[i] !== array2[i])
                return false;
        }
        return true;
    };
    Iterable.prototype.equal2dArrays = function (array1, array2) {
        for (var i = 0; i < array1.length; i++) {
            for (var j = 0; j < array1[0].length; j++) {
                if (array1[i][j] !== array2[i][j])
                    return false;
            }
        }
        return true;
    };
    Iterable.prototype.makeBoardCopy = function (board) {
        var copy = board.slice();
        return copy.map(function (x) { return x.slice(); });
    };
    Iterable.prototype.getSurroundingSquares = function (i, j) {
        var squares = [];
        var toLeft = j - 1, toUp = i - 1, toRight = j + 1, toDown = i + 1;
        var leftValid = toLeft >= 0, upValid = toUp >= 0, rightValid = toRight < this.current[0].length, downValid = toDown < this.current.length;
        //left
        if (leftValid) {
            if (upValid)
                squares.push({ i: toUp, j: toLeft });
            squares.push({ i: i, j: toLeft });
            if (downValid)
                squares.push({ i: toDown, j: toLeft });
        }
        //central
        if (upValid)
            squares.push({ i: toUp, j: j });
        if (downValid)
            squares.push({ i: toDown, j: j });
        //right
        if (rightValid) {
            if (upValid)
                squares.push({ i: toUp, j: toRight });
            squares.push({ i: i, j: toRight });
            if (downValid)
                squares.push({ i: toDown, j: toRight });
        }
        return squares;
    };
    Iterable.prototype.tryOpenAroundSquare = function (i, j, prevChangeIndex) {
        var info = this.getSquareInfo(this.current, i, j);
        var avail = info.surrAvailable;
        //if we don't need any more flags
        if (info.surrFlagged.length === +info.boxNumber) {
            for (var a = 0; a < avail.length; a++) {
                var val = this.open(avail[a].y, avail[a].x);
                this.current[avail[a].y][avail[a].x] = val;
                this.changes.push(new Changes_1.Changes(avail[a].y, avail[a].x, val, false, false, prevChangeIndex));
            }
        }
        //if we need flags and there are no spare spaces
        var extraFlagsNeeded = +info.boxNumber - info.surrFlagged.length;
        if (extraFlagsNeeded - info.surrAvailable.length === 0) {
            for (var b = 0; b < avail.length; b++) {
                this.current[avail[b].y][avail[b].x] = "x";
                this.changes.push(new Changes_1.Changes(avail[b].y, avail[b].x, "x", false, true, prevChangeIndex));
                this.flags--;
            }
        }
    };
    Iterable.prototype.open = function (y, x) {
        var ans = this.solution[y][x];
        if (ans == "x") {
            throw new Error("Opened a bomb!!!!!");
        }
        else {
            return ans;
        }
    };
    Iterable.prototype.getLatestChangeIndexToLookAt = function () {
        for (var i = this.changes.length - 1; i >= 0; i--) {
            if (!this.changes[i].lookedAt) {
                this.changes[i].lookedAt = true;
                return i;
            }
        }
        return -1;
    };
    Iterable.prototype.getSquareInfo = function (board, i, j) {
        var info;
        info = {
            boxNumber: board[i][j],
            surrFlagged: [],
            surrAvailable: []
        };
        //checking that the space we're looking at is a number
        if ("x?".indexOf(board[i][j]) != -1)
            return info;
        //now collecting info
        //try and catch blocks so that if we select an element that is not within the board the error doesn't break our program
        //boxes in row above
        try {
            if ("x?b".indexOf(board[i - 1][j - 1]) !== -1) {
                var posObj = { y: i - 1, x: j - 1 };
                "x?b".indexOf(board[i - 1][j - 1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
            }
        }
        catch (e) { }
        try {
            if ("x?b".indexOf(board[i - 1][j]) !== -1) {
                var posObj = { y: i - 1, x: j };
                "x?b".indexOf(board[i - 1][j]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
            }
        }
        catch (e) { }
        try {
            if ("x?b".indexOf(board[i - 1][j + 1]) !== -1) {
                var posObj = { y: i - 1, x: j + 1 };
                "x?b".indexOf(board[i - 1][j + 1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
            }
        }
        catch (e) { }
        //boxes on same row
        try {
            if ("x?b".indexOf(board[i][j - 1]) !== -1) {
                var posObj = { y: i, x: j - 1 };
                "x?b".indexOf(board[i][j - 1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
            }
        }
        catch (e) { }
        try {
            if ("x?b".indexOf(board[i][j + 1]) !== -1) {
                var posObj = { y: i, x: j + 1 };
                "x?b".indexOf(board[i][j + 1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
            }
        }
        catch (e) { }
        //boxes beneath
        try {
            if ("x?b".indexOf(board[i + 1][j - 1]) !== -1) {
                var posObj = { y: i + 1, x: j - 1 };
                "x?b".indexOf(board[i + 1][j - 1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
            }
        }
        catch (e) { }
        try {
            if ("x?b".indexOf(board[i + 1][j]) !== -1) {
                var posObj = { y: i + 1, x: j };
                "x?b".indexOf(board[i + 1][j]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
            }
        }
        catch (e) { }
        try {
            if ("x?b".indexOf(board[i + 1][j + 1]) !== -1) {
                var posObj = { y: i + 1, x: j + 1 };
                "x?b".indexOf(board[i + 1][j + 1]) === 1 ? info.surrAvailable.push(posObj) : info.surrFlagged.push(posObj);
            }
        }
        catch (e) { }
        return info;
    };
    return Iterable;
}());
exports.Iterable = Iterable;
//# sourceMappingURL=Iterable.js.map
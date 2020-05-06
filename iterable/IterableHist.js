"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Changes_1 = require("./Changes");
var OptionsChanges_1 = require("./OptionsChanges");
var IterableHist = /** @class */ (function () {
    function IterableHist(current, nextIndex, changes, options, optionsIdx, optionsChanges, startLastTime, finished, solutionPossible, solvingStatus, flags, spaceToStartNextIterationFrom) {
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
    IterableHist.prototype.makeChangesCopy = function (changes) {
        var newArr = [];
        changes.forEach(function (change) {
            var y = change.y, x = change.x, val = change.val, isOriginal = change.isOriginal, lookedAt = change.lookedAt, prevChange = change.prevChange;
            newArr.push(new Changes_1.Changes(y, x, val, isOriginal, lookedAt, prevChange));
        });
        return newArr;
    };
    IterableHist.prototype.makeOptionsCopy = function (options) {
        var newArr = [];
        options.forEach(function (r1) {
            var arr2d = [];
            r1.forEach(function (r2) {
                arr2d.push(r2.slice());
            });
            newArr.push(arr2d);
        });
        return newArr;
    };
    IterableHist.prototype.makeOptionsChangesCopy = function (optionsChanges) {
        var newArr = [];
        optionsChanges.forEach(function (optionsChange) {
            var y = optionsChange.y, x = optionsChange.x, val = optionsChange.val, inEveryOption = optionsChange.inEveryOption;
            newArr.push(new OptionsChanges_1.OptionsChanges(y, x, val, inEveryOption));
        });
        return newArr;
    };
    return IterableHist;
}());
exports.IterableHist = IterableHist;
//# sourceMappingURL=IterableHist.js.map
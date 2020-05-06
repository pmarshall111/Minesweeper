'use strict'
function solveMine(map, mines) {

    //turning input to array of arrays
    var board;
    if (typeof map === "string") {
        board = convertStringToArray(map);
    }
    else board = map

    //open all easy boxes and keep numMines up to date
    var iterate = openingDefinites(board)
    var minesRemaining = mines-iterate.flags
    while(iterate.changed) {
        iterate = openingDefinites(iterate.board)
        minesRemaining -= iterate.flags
    }

    //calculate possible combinations of bomb positions and make permanent the ones that are in all combinations
    var options = getPossiblePositions(iterate.board, minesRemaining);
    if (options.length === 0) return finishedBoard(iterate.board, minesRemaining) //todo: might need options.lenth = 1
    var similar = getSimilar(options);
    var opening = makePermanent(similar);
    minesRemaining -= opening.minesPlaced

    //finish or recurse, depending on if we made any changes
    return equalBoards(board, opening.board) ? finishedBoard(opening.board, minesRemaining) : solveMine(opening.board, minesRemaining)
}


/*MINESWEEPER LOGIC FUNCTIONS*/


//looking through each item and first check if flags needed - available boxes === 0,
//meaning there are no spare boxes for numbers => each box must have a bomb in
//We also look for boxes that already have the correct number of flags in surrounding boxes
//so the available boxes must have numbers in.
function openingDefinites (board) {
    var changed = false, flags = 0;
    for (var i = 0; i<board.length; i++) {
        for (var j = 0; j<board[0].length; j++) {
            var info = getSquareInfo(board, i, j);
            var avail = info.surrAvailable;
            //if we don't need any more flags
            if (info.surrFlagged.length === +info.boxNumber) {
                for (var a = 0; a<avail.length; a++) {
                    var int = open(avail[a].y,avail[a].x)
                    board[avail[a].y][avail[a].x] = int
                    changed = true
                }
            }
            //if we need flags and there are no space spaces
            let extraFlagsNeeded = +info.boxNumber - info.surrFlagged.length
            if (extraFlagsNeeded - info.surrAvailable.length === 0) {
                for (var b = 0; b<avail.length; b++) {
                    board[avail[b].y][avail[b].x] = "x"
                    changed = true;
                    flags++
                }
            }
        }
    }
    return {board, changed, flags};
}


//calc'ing the possible positions of bombs
function getPossiblePositions(_board, _numBombs) {
    var options = []
    function recurse(board, numBombs, _i, _j) {
        if (!_i) _i = 0; //TODO: should be able to comment these out.
        if (!_j) _j = 0;
        //using firstIteration so loop can start at where we last changed, but also start at 0 on the next line
        var firstIteration = true
        for (var i = _i || 0; i<board.length; i++) {
            for (var j = firstIteration ? _j : 0; j<board[0].length; j++) {
                if (isNaN(board[i][j])) continue;

                var sqInfo = getSquareInfo(board, i, j)
                var flagsNeeded = +sqInfo.boxNumber - sqInfo.surrFlagged.length;


                //doing checks so we can stop iterating if a number is invalid, or continue if there's nothing to do
                //invalid
                if (sqInfo.surrFlagged.length > +sqInfo.boxNumber) return;
                if (flagsNeeded>numBombs) return;
                if (flagsNeeded>sqInfo.surrAvailable.length) return;

                //nothing to do
                if (sqInfo.surrAvailable.length === 0) continue;
                if (flagsNeeded === 0) {
                    if (sqInfo.surrAvailable) {//TODO: could probably remove this line as we've just checked earlier if there are 0 elements
                        var nBoard = makeBoardCopy(board);
                        for (let i = 0; i<sqInfo.surrAvailable.length; i++) {
                            let pos = sqInfo.surrAvailable[i];
                            nBoard[pos.y][pos.x] = "t"
                        }
                        return recurse(nBoard, numBombs, i, j)
                    }
                    continue;
                };


                var updatedNumbBombs = numBombs-flagsNeeded

                //making array that we can plug into combinations generator
                //b is for a predicted bomb and t is for predicted taken space
                var array = new Array(sqInfo.surrAvailable.length).fill("t")
                for (var a = 0; a<flagsNeeded; a++) {
                    array[a] = "b"
                }
                var possibilities = combinations(array)

                possibilities.forEach(function(possibility) {
                    var nBoard = makeBoardCopy(board);
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
    return options
}


function getSimilar(list) {
    if (list.length === 0) return list
    var similar = makeBoardCopy(list[0]);
    for (var i = 1; i<list.length; i++) {

        for (var y = 0; y<similar.length; y++) {
            for (var x = 0; x<similar[0].length; x++ ) {
                if (list[i][y][x] !== similar[y][x]) similar[y][x] = "?"
            }
        }

    }
    return similar
}





/*CALCULATING COMBINATIONS*/


function combinations(array) {
    var perms = permutations(array)
    for (var i = 0; i<perms.length-1; i++) {
        for (var j = i+1; j<perms.length; j++) {
            if (equalArrays(perms[i], perms[j])) {perms.splice(j, 1); j--;}
        }
    }
    return perms
}


//slices 1 off the front of the array until we get to 2 elements, then we get the 2 permutations by rotating
//through the values
//then add back on the last element removed, rotate through to get the combinations and continue until there
//are no more sliced values to add back on.
function permutations(array) {
    var result = []
    if (array.length === 1) return array;
    if (array.length === 2) return [array.slice(),[array.pop(), array.pop()]]
    var next = permutations(array.slice(1)).map(function(each) {each.unshift(array[0]); return each})
    next.forEach(function(perm) {
        for (var i = 0; i<perm.length; i++) {
            perm.push(perm.shift());
            var arrays = perm.slice(); //copy needed otherwise the term pushed in is "circular object array"
            result.push(arrays)
        }
    });
    return result
}


function equalArrays(array1, array2) {
    for (var i = 0; i<array1.length; i++) {
        if (array1[i] !== array2[i]) return false
    }
    return true
}




/*ENDING FUNCTIONS*/

function finishedBoard(board, numMines) {
    if (numMines === 0) return transformToString(noMines(board))
    return "?"
}

//needed to match up with codewars tests
function transformToString(array) {
    var result = "";
    for (var i = 0; i<array.length; i++) {
        result += array[i].join(" ")
        if (i<array.length-1) result += "\n"
    }
    return result
}

//opening all boxes if no mines are left
function noMines(board) {
    var copy = makeBoardCopy(board)
    for (var i = 0; i<copy.length; i++) {
        for (var j = 0; j<copy[0].length; j++) {
            if (copy[i][j] === "?") {
                var int = open(i,j)
                copy[i][j]=int
            }
        }
    }
    return copy
}



/*GENERAL HELPER FUNCTIONS*/

function makeBoardCopy(board) {
    var copy = board.slice();
    return copy.map(x => x.slice())
}

function convertStringToArray(string) {
    return string.split("\n").map(x => x.trim().split(" "));
}

//only returns info if the square is a number, else just gives the contents of the box.
function getSquareInfo(board, i, j) {
    var info = {
        boxNumber: board[i][j],
        surrFlagged: [],
        surrAvailable: []
    }

    //checking that the space we're looking at is a number
    if ("x?".includes(board[i][j])) return info;

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

//makes use of equalArrays func that was used for the combinations
function equalBoards(board1, board2) {
    for (var i = 0; i<board1.length; i++) {
        if (!equalArrays(board1[i], board2[i])) return false
    }
    return true
}


function makePermanent(board) {
    var obj = {
        board: [],
        minesPlaced: 0
    }
    for (var i = 0; i<board.length;i++) {
        for (var j = 0; j<board[0].length; j++) {
            if (board[i][j] === "b") {
                board[i][j] = "x";
                obj.minesPlaced++
            }
            else if (board[i][j] === "t") {
                let int = open(i,j);
                board[i][j] = int
            }
        }
    }
    obj.board = board
    return obj
}



function open(x, y) {
    return map[x][y];
}

let solution = `1 x x 1 0 0 0
2 3 3 1 0 1 1
1 x 1 0 0 1 x
1 1 1 0 0 1 1
0 1 1 1 0 0 0
0 1 x 1 0 0 0
0 1 1 1 0 1 1
0 0 0 0 0 1 x
0 0 0 0 0 1 1`

let map = solution.split("\n").map(x => x.split(" "));

let startingGrid = `? ? ? ? 0 0 0
                    ? ? ? ? 0 ? ?
                    ? ? ? 0 0 ? ?
                    ? ? ? 0 0 ? ?
                    0 ? ? ? 0 0 0
                    0 ? ? ? 0 0 0
                    0 ? ? ? 0 ? ?
                    0 0 0 0 0 ? ?
                    0 0 0 0 0 ? ?`

// solveMine(startingGrid, 6)

module.exports = { convertStringToArray, getSquareInfo }

let starter = [["0", "?", "?", "?", "?", "?", "0", "0", "0", "?", "?", "?", "?", "?", "?", "?", "?", "0", "0", "0"],
    ["0", "?", "?", "?", "?", "?", "0", "0", "0", "?", "?", "?", "?", "?", "?", "?", "?", "0", "0", "0"],
    ["0", "?", "?", "?", "?", "?", "0", "0", "0", "?", "?", "?", "?", "?", "?", "?", "0", "0", "?", "?"],
    ["0", "0", "0", "?", "?", "?", "0", "0", "0", "0", "?", "?", "?", "?", "?", "?", "0", "0", "?", "?"],
    ["0", "0", "0", "?", "?", "?", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "?", "?", "?"],
    ["0", "?", "?", "?", "?", "?", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "?", "?", "?"],
    ["0", "?", "?", "?", "0", "?", "?", "?", "0", "0", "0", "0", "0", "?", "?", "?", "0", "?", "?", "?"],
    ["0", "?", "?", "?", "0", "?", "?", "?", "?", "?", "?", "0", "0", "?", "?", "?", "?", "?", "0", "0"],
    ["0", "?", "?", "?", "0", "?", "?", "?", "?", "?", "?", "0", "0", "?", "?", "?", "?", "?", "0", "0"],
    ["0", "?", "?", "?", "0", "0", "0", "?", "?", "?", "?", "0", "0", "0", "0", "?", "?", "?", "0", "0"],
    ["0", "?", "?", "?", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "?", "?", "?", "?", "0"],
    ["0", "?", "?", "?", "0", "0", "0", "0", "0", "?", "?", "?", "0", "0", "0", "?", "?", "?", "?", "0"],
    ["0", "?", "?", "?", "0", "0", "0", "0", "0", "?", "?", "?", "?", "?", "0", "?", "?", "?", "?", "0"],
    ["?", "?", "?", "?", "0", "0", "0", "0", "0", "?", "?", "?", "?", "?", "0", "?", "?", "?", "?", "0"],
    ["?", "?", "0", "0", "0", "0", "0", "0", "0", "0", "0", "?", "?", "?", "0", "?", "?", "?", "?", "?"],
    ["?", "?", "?", "?", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "?", "?", "?", "?", "?"],
    ["?", "?", "?", "?", "0", "0", "?", "?", "?", "?", "?", "0", "?", "?", "?", "0", "0", "?", "?", "?"],
    ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "0", "?", "?", "?", "0", "0", "0", "0", "0"],
    ["?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "0", "?", "?", "?", "?", "0", "0", "0", "0"],
    ["0", "?", "?", "?", "?", "?", "?", "?", "?", "0", "0", "0", "?", "?", "?", "?", "0", "0", "0", "0"],
    ["0", "0", "0", "0", "?", "?", "?", "?", "?", "0", "0", "0", "?", "?", "?", "?", "0", "0", "0", "0"],
    ["0", "0", "0", "0", "?", "?", "?", "0", "0", "0", "0", "0", "?", "?", "?", "?", "0", "0", "0", "0"],
    ["0", "0", "0", "0", "0", "0", "0", "?", "?", "?", "?", "0", "?", "?", "?", "?", "0", "0", "0", "0"],
    ["?", "?", "?", "?", "?", "0", "0", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "0"],
    ["?", "?", "?", "?", "?", "0", "0", "?", "?", "?", "?", "?", "?", "0", "?", "?", "?", "?", "?", "?"],
    ["?", "?", "?", "?", "?", "0", "0", "0", "0", "0", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?"],
    ["?", "?", "?", "?", "?", "?", "0", "0", "0", "0", "0", "?", "?", "?", "0", "0", "0", "?", "?", "?"],
    ["?", "?", "?", "?", "?", "?", "0", "0", "0", "0", "0", "?", "?", "?", "0", "0", "0", "?", "?", "?"],
    ["?", "?", "?", "?", "?", "?", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "?", "?", "?"]]


let solved = [["0", "1", "1", "2", "1", "1", "0", "0", "0", "1", "1", "2", "2", "2", "2", "x", "1", "0", "0", "0"],
    ["0", "1", "x", "2", "x", "1", "0", "0", "0", "1", "x", "3", "x", "x", "3", "2", "1", "0", "0", "0"],
[ "0", "1", "1", "2", "1", "1", "0", "0", "0", "1", "2", "x", "3", "3", "x", "1", "0", "0", "1", "1"],
[ "0", "0", "0", "1", "1", "1", "0", "0", "0", "0", "1", "1", "1", "1", "1", "1", "0", "0", "1", "x"],
[ "0", "0", "0", "1", "x", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "1", "2", "2"],
[ "0", "1", "1", "2", "1", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "1", "x", "1"],
[ "0", "1", "x", "1", "0", "1", "1", "1", "0", "0", "0", "0", "0", "1", "1", "1", "0", "1", "1", "1"],
[ "0", "1", "1", "1", "0", "1", "x", "2", "2", "2", "1", "0", "0", "1", "x", "2", "1", "1", "0", "0"],
[ "0", "1", "1", "1", "0", "1", "1", "2", "x", "x", "1", "0", "0", "1", "1", "2", "x", "1", "0", "0"],
[ "0", "1", "x", "1", "0", "0", "0", "1", "2", "2", "1", "0", "0", "0", "0", "2", "2", "2", "0", "0"],
[ "0", "1", "1", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "1", "x", "2", "1", "0"],
[ "0", "1", "1", "1", "0", "0", "0", "0", "0", "1", "1", "1", "0", "0", "0", "1", "2", "x", "1", "0"],
[ "0", "1", "x", "1", "0", "0", "0", "0", "0", "1", "x", "2", "1", "1", "0", "1", "3", "3", "2", "0"],
[ "1", "2", "1", "1", "0", "0", "0", "0", "0", "1", "1", "2", "x", "1", "0", "2", "x", "x", "1", "0"],
[ "x", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "1", "1", "1", "0", "2", "x", "4", "3", "2"],
[ "1", "2", "1", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "1", "1", "2", "x", "x"],
[ "1", "2", "x", "1", "0", "0", "1", "2", "3", "2", "1", "0", "1", "1", "1", "0", "0", "1", "2", "2"],
[ "1", "x", "3", "3", "1", "1", "1", "x", "x", "x", "1", "0", "2", "x", "2", "0", "0", "0", "0", "0"],
[ "1", "2", "x", "2", "x", "1", "2", "3", "4", "2", "1", "0", "2", "x", "3", "1", "0", "0", "0", "0"],
[ "0", "1", "1", "2", "2", "2", "2", "x", "1", "0", "0", "0", "1", "2", "x", "1", "0", "0", "0", "0"],
[ "0", "0", "0", "0", "1", "x", "2", "1", "1", "0", "0", "0", "1", "2", "2", "1", "0", "0", "0", "0"],
[ "0", "0", "0", "0", "1", "1", "1", "0", "0", "0", "0", "0", "1", "x", "2", "1", "0", "0", "0", "0"],
[ "0", "0", "0", "0", "0", "0", "0", "1", "2", "2", "1", "0", "1", "2", "x", "1", "0", "0", "0", "0"],
[ "1", "1", "1", "1", "1", "0", "0", "1", "x", "x", "2", "1", "1", "1", "2", "2", "2", "1", "1", "0"],
[ "x", "2", "3", "x", "2", "0", "0", "1", "2", "2", "2", "x", "1", "0", "1", "x", "2", "x", "2", "1"],
[ "2", "x", "3", "x", "2", "0", "0", "0", "0", "0", "1", "2", "2", "1", "1", "1", "2", "1", "2", "x"],
[ "2", "3", "3", "3", "2", "1", "0", "0", "0", "0", "0", "1", "x", "1", "0", "0", "0", "1", "2", "2"],
[ "x", "2", "x", "2", "x", "1", "0", "0", "0", "0", "0", "1", "1", "1", "0", "0", "0", "1", "x", "1"],
[ "1", "2", "1", "2", "1", "1", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "1", "1", "1"]];
console.log(convertStringToArray(solved));

"use strict";

const { convertStringToArray, getSquareInfo } = require('./PrevSol.js')
const assert = require('assert')

describe('map string to array', () => {
    it ('can correctly map a string input to array', () => {
        let solution = `1 x x 1 0 0 0
                    2 3 3 1 0 1 1
                    1 x 1 0 0 1 x
                    1 1 1 0 0 1 1
                    0 1 1 1 0 0 0
                    0 1 x 1 0 0 0
                    0 1 1 1 0 1 1
                    0 0 0 0 0 1 x
                    0 0 0 0 0 1 1`

        let map = convertStringToArray(solution);

        assert.equal('1', map[0][3]);
        assert.equal('3', map[1][2]);
        assert.equal('0', map[5][0]);
        assert.equal('x', map[2][6]);
        assert.equal('1', map[0][0]);
        assert.equal('1', map[8][6]);
    })
})

describe('getSquareInfo', () => {
    let board;
    let firstRowSquare, edgeSquare, lastRowSquare;
    before(() => {
        board = convertStringToArray(`? ? ? ? 0 0 0
                                            ? ? ? ? 0 b ?
                                            ? ? ? 0 0 ? ?
                                            ? ? ? 0 0 ? ?
                                            0 ? ? ? 0 0 0
                                            0 ? ? ? 0 0 2
                                            0 ? ? ? 0 x x
                                            0 0 0 0 0 ? ?
                                            0 0 0 0 0 ? ?`);

    });
    beforeEach(() => {
        firstRowSquare = getSquareInfo(board, 0,4);
        edgeSquare = getSquareInfo(board, 5,6);
        lastRowSquare = getSquareInfo(board, 8,4);
    })

    it('can correctly get box number from square', () => {
        assert.equal('0', firstRowSquare.boxNumber);
        assert.equal('2', edgeSquare.boxNumber);
        assert.equal('0', lastRowSquare.boxNumber);
    })

    it('can correctly get surrounded squares that have flags on', () => {
        assert.equal('1', firstRowSquare.surrFlagged.length);
        assert.equal('2', edgeSquare.surrFlagged.length);
        assert.equal('0', lastRowSquare.surrFlagged.length);
    })

    it ('can correctly get surrounded available squares', () => {
        assert.equal('2', firstRowSquare.surrAvailable.length);
        assert.equal('0', edgeSquare.surrAvailable.length);
        assert.equal('2', lastRowSquare.surrAvailable.length);
    })
})

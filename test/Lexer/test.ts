/// <reference path="../../typings/node.d.ts" />

import Lexer = require('../../Lexer');
import fs = require('fs');

var testLexer: Lexer.Lexer = Lexer.create(fs.readFileSync(__dirname + '/test.h', 'utf8'));

export function run(): boolean {
    var success: boolean = true;
    try {
        var token: Lexer.Token = testLexer.getNextToken();
        while (token.type !== Lexer.TokenType.END) {
            token = testLexer.getNextToken();
        }
        console.log('Lexer: [OK]');
    } catch (error) {
        success = false;
        console.log('Lexing ended with an error.');
        console.log(error.message);
        console.log(error.context);
    }
    return success;
}
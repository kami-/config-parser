/// <reference path="../../typings/node.d.ts" />

import Lexer = require('../../Lexer');
import Parser = require('../../Parser');
import fs = require('fs');

export function run(): boolean {
    var success: boolean = true,
        input: string = fs.readFileSync(__dirname + '/test.h', 'utf8');
    var testLexer: Lexer.Lexer = Lexer.create(input);
    var testParser: Parser.Parser = Parser.create(input, testLexer);

    try {
        var ast: Parser.Node = testParser.parse();
        console.log('Parser: [OK]');
    } catch (error) {
        success = false;
        console.log('Parsing ended with an error.');
        console.log(error.message);
        console.log(error.context);
    }
    return success;
}
/// <reference path="../../typings/node.d.ts" />

import Lexer = require('../../Lexer');
import Parser = require('../../Parser');
import PrettyPrinter = require('../../PrettyPrinter');
import fs = require('fs');

export function run(): boolean {
    var success: boolean = true,
        input: string = fs.readFileSync(__dirname + '/test.h', 'utf8');
    var testLexer: Lexer.Lexer = Lexer.create(input);
    var testParser: Parser.Parser = Parser.create(input, testLexer);
    var testPrettyPrinter: PrettyPrinter.PrettyPrinter = PrettyPrinter.create('    ');
    var ast: Parser.Node = testParser.parse();
    var firstResult: string = testPrettyPrinter.print(ast);
    fs.writeFileSync(__dirname + '/first-result.h', firstResult);
    input = fs.readFileSync(__dirname + '/first-result.h', 'utf8');
    testLexer = Lexer.create(input);
    testParser = Parser.create(input, testLexer);
    ast = testParser.parse();
    var secondResult: string = testPrettyPrinter.print(ast);
    fs.writeFileSync(__dirname + '/second-result.h', firstResult);
    if (firstResult != secondResult) {
        success = false;
        console.log('Results are different.');
    }
    if (success) {
        console.log('PrettyPrinter: [OK]');
    }
    return success;
}
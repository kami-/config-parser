/// <reference path="../../typings/node.d.ts" />

import Lexer = require('../../Lexer');
import Parser = require('../../Parser');
import Ast = require('../../Ast');
import PrettyPrinter = require('../../PrettyPrinter');
import Mission = require('../../Mission');
import fs = require('fs');

export function run(): boolean {
    var success: boolean = true,
        input: string = fs.readFileSync(__dirname + '/test.h', 'utf8');
    var testLexer: Lexer.Lexer = Lexer.create(input);
    var testParser: Parser.Parser = Parser.create(input, testLexer);
    var testPrettyPrinter: PrettyPrinter.PrettyPrinter = PrettyPrinter.create('    ');
    var ast: Parser.Node = testParser.parse();
    var classAItems = Ast.select(ast, 'A.Item*'),
        classB = Ast.select(ast, 'B')[0];
    Mission.mergeItems(classB, classAItems);
    if (Ast.select(classB, 'Item*').length !== 3) {
        success = false;
        console.log('Wrong number of items in class B.');
    }
    if (success) {
        console.log('Mission: [OK]');
    }
    return success;
}
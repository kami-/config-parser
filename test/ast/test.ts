/// <reference path="../../typings/node.d.ts" />

import Lexer = require('../../Lexer');
import Parser = require('../../Parser');
import Ast = require('../../Ast');
import fs = require('fs');

export function run(): boolean {
    var success: boolean = true;
    var input: string = fs.readFileSync(__dirname + '/test.h', 'utf8');
    var testLexer: Lexer.Lexer = Lexer.create(input);
    var testParser: Parser.Parser = Parser.create(input, testLexer);
    var ast: Parser.Node = testParser.parse();
    if (Ast.select(ast, 'AK12_RU')[0].fieldName !== 'AK12_RU') {
        console.log("Select failed for 'AK12_RU'!");
        success = false;
    }
    if (Ast.select(ast, 'AK12_RU.Rifleman.backpack*').length !== 6) {
        console.log("Size check for 'AK12_RU.Rifleman.backpack*' select failed!");
        success = false;
    }
    if (success) {
        console.log('Ast: [OK]');
    }
    return success;
}
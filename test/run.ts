import tsUnit = require('../node_modules/tsunit.external/tsUnit');
import LexerTest = require('./Lexer/LexerTest');
import ParserTest = require('./Parser/ParserTest');
import PrettyPrinterTest = require('./PrettyPrinter/PrettyPrinterTest');
import AstTest = require('./Ast/AstTest');
import MissionTest = require('./Mission/MissionTest');

var test = new tsUnit.Test();
test.addTestClass(new LexerTest.LexerTest(), 'LexerTest');
test.addTestClass(new ParserTest.ParserTest(), 'ParserTest');
test.addTestClass(new PrettyPrinterTest.PrettyPrinterTest(), 'PrettyPrinterTest');
test.addTestClass(new AstTest.AstTest(), 'AstTest');
test.addTestClass(new MissionTest.MissionTest(), 'MissionTest');
var result = test.run();
console.log(test.getTapResults(result));
console.log('Errors: ' + result.errors.length);
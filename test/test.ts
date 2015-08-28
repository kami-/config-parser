import LexerTest = require('./Lexer/test');
import ParserTest = require('./Parser/test');
import PrettyPrinterTest = require('./PrettyPrinter/test');
import AstTest = require('./Ast/test');
import MissionTest = require('./Mission/test');

var success: boolean = true;
success = success && LexerTest.run();
success = success && ParserTest.run();
success = success && PrettyPrinterTest.run();
success = success && AstTest.run();
success = success && MissionTest.run();

if (!success) {
    process.exit(1);
}
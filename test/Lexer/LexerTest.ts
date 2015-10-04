/// <reference path="../../typings/node.d.ts" />

import tsUnit = require('../../node_modules/tsunit.external/tsUnit');
import Lexer = require('../../src/Lexer');

function lexer(input: string): Lexer.Lexer {
    return Lexer.create(input);
}

export class LexerTest extends tsUnit.TestClass {
    getNextTokenShouldReturnEndTokenWhenInputIsEmpty(): void {
        // GIVEN
        var underTest = lexer(''),
            expectedTokenType = Lexer.TokenType.END;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldIgnoreWhitespaces(): void {
        // GIVEN
        var underTest = lexer(' \n\t'),
            expectedTokenType = Lexer.TokenType.END;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldThrowWhenInputHasUnexpectedCharacter(): void {
        // GIVEN
        var underTest = lexer('?');
        // WHEN
        this.throws(underTest.getNextToken, "Unexpected character '?' at 1:1!");
        // THEN
    }

    getNextTokenShouldReturnNumberWhenInputIsInteger(): void {
        // GIVEN
        var underTest = lexer('1234'),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldReturnNumberWhenInputIsIntegerWithExponent(): void {
        // GIVEN
        var underTest = lexer('1234e10'),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldReturnNumberWhenInputIsIntegerWithSignedExponent(): void {
        // GIVEN
        var underTest = lexer('1234e-10'),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldReturnNumberWhenInputIsFloatWithDecimalPointOnly(): void {
        // GIVEN
        var underTest = lexer('1234.'),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldReturnNumberWhenInputIsFloat(): void {
        // GIVEN
        var underTest = lexer('1234.12312'),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldReturnNumberWhenInputIsFloatWithExponent(): void {
        // GIVEN
        var underTest = lexer('1234.12312e-10'),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldReturnClassWhenInputIsClass(): void {
        // GIVEN
        var underTest = lexer('class'),
            expectedTokenType = Lexer.TokenType.CLASS;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldReturnStringWhenInputIsEmptySingleQuoteString(): void {
        // GIVEN
        var underTest = lexer("''"),
            expectedTokenType = Lexer.TokenType.STRING;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldReturnStringWhenInputIsEmptyDoubleQuoteString(): void {
        // GIVEN
        var underTest = lexer('""'),
            expectedTokenType = Lexer.TokenType.STRING;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldEscapeSingleQuoteString(): void {
        // GIVEN
        var underTest = lexer("'asd''asd'"),
            expectedTokenType = Lexer.TokenType.STRING,
            expectedLexeme = "asd'asd";
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
        this.areIdentical(actualResult.lexeme, expectedLexeme);
    }

    getNextTokenShouldEscapeDoubleQuoteString(): void {
        // GIVEN
        var underTest = lexer('"asd""asd"'),
            expectedTokenType = Lexer.TokenType.STRING,
            expectedLexeme = 'asd"asd';
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
        this.areIdentical(actualResult.lexeme, expectedLexeme);
    }

    getNextTokenShouldSkipSingleLineComment(): void {
        // GIVEN
        var underTest = lexer("//asdas = 10;\n1123"),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldSkipMultiLineComment(): void {
        // GIVEN
        var underTest = lexer("/*asdas = 10;\n*/1123"),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldRemoveMultiLineCommentNestedInSingleLineComment(): void {
        // GIVEN
        var underTest = lexer("///*asdas */= 10;\n1123"),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }

    getNextTokenShouldThrowWhenInputHasNestedMultiLineComment(): void {
        // GIVEN
        var underTest = lexer("/*/**/*/asdf"),
            expectedTokenType = Lexer.TokenType.NUMBER;
        // WHEN
        this.throws(underTest.getNextToken,"Unexpected character '*' at 1:7!");
        // THEN
    }

    getNextTokenShouldRemoveNestedSingleLineCommentNestedInMultiLineComment(): void {
        // GIVEN
        var underTest = lexer("/*a = 10;\n//asd[] = {}\n*/asdf"),
            expectedTokenType = Lexer.TokenType.ID;
        // WHEN
        var actualResult = underTest.getNextToken();
        // THEN
        this.areIdentical(actualResult.type, expectedTokenType);
    }
}
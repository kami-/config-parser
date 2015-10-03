export const enum TokenType {
    ERROR,
    END,

    NUMBER,
    STRING,
    ID,

    LB, // (
    RB, // )
    LCB, // {
    RCB, // }
    LSB, // [
    RSB, // ]

    EQUAL, // =
    MINUS, // -
    COLON, // :
    COMMA, // ,
    SEMICOLON, // ;

    CLASS
}

const enum State {
    ERROR,
    INIT,

    INT,
    FLOAT,
    EXPONENT,
    DOT,
    ID,
    SINGLE_QOUTE_STRING,
    FIRST_SINGLE_QOUTE,
    SECOND_SINGLE_QOUTE,
    DOUBLE_QOUTE_STRING,
    FIRST_DOUBLE_QOUTE,
    SECOND_DOUBLE_QOUTE,
    COMMENT_BEGIN,
    SINGLE_LINE_COMMENT,
    MULTI_LINE_COMMENT,
    MULTI_LINE_COMMENT_END
}

export const enum ErrorCode {
    NO_ERROR,
    UNEXPECTED_CHAR,
    EXPECTED_DECIMALS_OR_EXPONENT,
    EXPECTED_EXPONENT,
    EXPECTED_COMMENT
}

export interface Token {
    lexeme: string;
    type: TokenType;
    line: number;
    column: number;
}

export interface Lexer {
    getNextToken: () => Token;
}

interface LexerState {
    input: string;
    index: number;
    line: number;
    column: number;
    state: State;
    tokenFirstIndex: number;
    errorCode: ErrorCode;
}

function isDigit(ch: string): boolean {
    return ch <= '9' && ch >= '0';
}

function isAlpha(ch: string): boolean {
    return ch !== undefined && /[a-zA-Z_]/.test(ch);
}

function isIdChar(ch: string): boolean {
    return isAlpha(ch) || isDigit(ch) || ch === '_';
}

function isWhiteSpace(ch: string): boolean {
    return ch === ' ' || ch === '\n' || ch === '\t' || ch ==='\r';
}

function stringFromLexeme(lexeme: string, qoute: string): string {
    var newLexeme: string = lexeme.substring(1, lexeme.length - 1);
    return newLexeme.replace(new RegExp(qoute + qoute, 'g'), qoute);
}

function getErrorMessage(token: Token, errorCode: ErrorCode): string {
    var message: string = "",
        position: string = "" + (token.line + 1) + ":" + (token.column + 1);
    switch (errorCode) {
        case ErrorCode.UNEXPECTED_CHAR:
            message = "Unexpected character '" + token.lexeme + "' at " + position + "!"
        break;

        case ErrorCode.EXPECTED_DECIMALS_OR_EXPONENT:
            message = "Expected decimals or exponent in float '" + token.lexeme + "' at " + position + "!"
        break;

        case ErrorCode.EXPECTED_EXPONENT:
            message = "Expected exponent in float '" + token.lexeme + "' at " + position + "!"
        break;

        case ErrorCode.EXPECTED_COMMENT:
            message = "Expected single or multiline comment ('//' or '/*') in '" + token.lexeme + "' at " + position + "!"
        break;
    }
    return message;
}

function getErrorContext(input: string, token: Token): string {
    var pad: string = "        ",
        context: string = "",
        lines: string[] = input.split("\n"),
        from: number = token.line - 2 >= 0 ? token.line - 2 : token.line,
        to: number = token.line + 2 < lines.length ? token.line + 2 : token.line;
    for (var i: number = from; i <= to; i++) {
        var rowPrefix: string = (i + 1) + " | ";
        context += (pad + rowPrefix).slice(-pad.length);
        context += lines[i] + '\n';
        if (i === token.line) {
            context += Array(pad.length + token.column - 1).join('~');
            context += ' ^\n';
        }
    }
    return context;
}

function nextChar(lt: LexerState): void {
    if (lt.input[lt.index] == '\n') {
        lt.line++;
        lt.column = 0;
    } else {
        lt.column++;
    }
    lt.index++;
}

function createToken(lt: LexerState, lexeme: string, type: TokenType): Token {
    resetState(lt);
    return {
        lexeme: lexeme,
        type: type,
        line: lt.line,
        column: lt.column
    };
}

function createCharacterToken(lt: LexerState, type: TokenType): Token {
    nextChar(lt);
    return createToken(lt, lt.input[lt.tokenFirstIndex], type);
}

function resetState(lt: LexerState): void {
    lt.state = State.INIT;
    lt.tokenFirstIndex = lt.index;
}

function getNextToken(lt: LexerState): Token {
    var _nextChar = nextChar.bind(null, lt),
        _createToken = createToken.bind(null, lt),
        _createCharacterToken = createCharacterToken.bind(null, lt),
        _resetState = resetState.bind(null, lt);

    function chr(): string {
        return lt.input[lt.index];
    }

    function state(newState?: State): State {
        if (newState != undefined) { lt.state = newState }
        return lt.state;
    }

    var defaultToken: Token = { lexeme: '<END OF FILE>', type: TokenType.END, line: lt.line, column: lt.column };
    while (lt.index < lt.input.length) {
        switch (lt.state) {
            case State.INIT:
                if (isWhiteSpace(chr())) {
                    _nextChar();
                    _resetState();
                } else if (isDigit(chr())) {
                    state(State.INT);
                } else if (chr() === '-') {
                    state(State.INT);
                } else if (chr() === '.') {
                    state(State.DOT);
                } else if (isAlpha(chr())) {
                    state(State.ID);
                } else if (chr() === '(') {
                    return _createCharacterToken(TokenType.LB);
                } else if (chr() === ')') {
                    return _createCharacterToken(TokenType.RB);
                } else if (chr() === '{') {
                    return _createCharacterToken(TokenType.LCB);
                } else if (chr() === '}') {
                    return _createCharacterToken(TokenType.RCB);
                } else if (chr() === '[') {
                    return _createCharacterToken(TokenType.LSB);
                } else if (chr() === ']') {
                    return _createCharacterToken(TokenType.RSB);
                } else if (chr() === ',') {
                    return _createCharacterToken(TokenType.COMMA);
                } else if (chr() === ';') {
                    return _createCharacterToken(TokenType.SEMICOLON);
                } else if (chr() === '=') {
                    return _createCharacterToken(TokenType.EQUAL);
                } else if (chr() === ':') {
                    return _createCharacterToken(TokenType.COLON);
                } else if (chr() === '/') {
                    state(State.COMMENT_BEGIN);
                } else if (chr() === "'") {
                    state(State.SINGLE_QOUTE_STRING);
                } else if (chr() === '"') {
                    state(State.DOUBLE_QOUTE_STRING);
                } else {
                    state(State.ERROR);
                    lt.errorCode = ErrorCode.UNEXPECTED_CHAR;
                }
            break;

            case State.INT:
                _nextChar();
                if (isDigit(chr())) {
                    state(State.INT);
                } else if (chr() === '.') {
                    state(State.FLOAT);
                } else {
                    return _createToken(lt.input.substring(lt.tokenFirstIndex, lt.index), TokenType.NUMBER);
                }
            break;

            case State.DOT:
                _nextChar();
                if (isDigit(chr())) {
                    state(State.FLOAT);
                } else if (chr() === 'e') {
                    state(State.EXPONENT);
                } else {
                    state(State.ERROR);
                    lt.errorCode = ErrorCode.EXPECTED_DECIMALS_OR_EXPONENT;
                }
            break;

            case State.FLOAT:
                _nextChar();
                if (isDigit(chr())) {
                    state(State.FLOAT);
                } else if (chr() === 'e') {
                    state(State.EXPONENT);
                } else {
                    return _createToken(lt.input.substring(lt.tokenFirstIndex, lt.index), TokenType.NUMBER);
                }
            break;

            case State.EXPONENT:
                _nextChar();
                if (isDigit(chr())) {
                    state(State.FLOAT);
                } else if (chr() === '-' || chr() === '+') {
                    state(State.FLOAT);
                } else {
                    state(State.ERROR);
                    lt.errorCode = ErrorCode.EXPECTED_EXPONENT;
                }
            break;

            case State.ID:
                _nextChar();
                if (isIdChar(chr())) {
                    state(State.ID);
                } else {
                    var lexeme: string = lt.input.substring(lt.tokenFirstIndex, lt.index);
                    var type: TokenType = TokenType.ID;
                    if (lexeme.toUpperCase() === 'CLASS') {
                        type = TokenType.CLASS;
                    }
                    return _createToken(lexeme, type);
                }
            break;

            case State.SINGLE_QOUTE_STRING:
                _nextChar();
                if (chr() === "'") {
                    state(State.FIRST_SINGLE_QOUTE);
                } else {
                    state(State.SINGLE_QOUTE_STRING);
                }
            break;

            case State.FIRST_SINGLE_QOUTE:
                _nextChar();
                if (chr() === "'") {
                    state(State.SECOND_SINGLE_QOUTE);
                } else {
                    return _createToken(stringFromLexeme(lt.input.substring(lt.tokenFirstIndex, lt.index), "'"), TokenType.STRING);
                }
            break;

            case State.SECOND_SINGLE_QOUTE:
                _nextChar();
                if (chr() === "'") {
                    state(State.FIRST_SINGLE_QOUTE);
                } else {
                    state(State.SINGLE_QOUTE_STRING);
                }
            break;

            case State.DOUBLE_QOUTE_STRING:
                _nextChar();
                if (chr() === '"') {
                    state(State.FIRST_DOUBLE_QOUTE);
                } else {
                    state(State.DOUBLE_QOUTE_STRING);
                }
            break;

            case State.FIRST_DOUBLE_QOUTE:
                _nextChar();
                if (chr() === '"') {
                    state(State.SECOND_DOUBLE_QOUTE);
                } else {
                    return _createToken(stringFromLexeme(lt.input.substring(lt.tokenFirstIndex, lt.index), '"'), TokenType.STRING);
                }
            break;

            case State.SECOND_DOUBLE_QOUTE:
                _nextChar();
                if (chr() === '"') {
                    state(State.FIRST_DOUBLE_QOUTE);
                } else {
                    state(State.DOUBLE_QOUTE_STRING);
                }
            break;

            case State.COMMENT_BEGIN:
                _nextChar();
                if (chr() === '/') {
                    state(State.SINGLE_LINE_COMMENT);
                } else if (chr() === '*') {
                    state(State.MULTI_LINE_COMMENT);
                } else {
                    state(State.ERROR);
                    lt.errorCode = ErrorCode.EXPECTED_COMMENT;
                }
            break;

            case State.SINGLE_LINE_COMMENT:
                _nextChar();
                if (chr() === '\n') {
                    //return _createToken(lt.input.substring(lt.tokenFirstIndex, lt.index - 1), TokenType.COMMENT);
                    _resetState();
                }
            break;

            case State.MULTI_LINE_COMMENT:
                _nextChar();
                if (chr() === '*') {
                    state(State.MULTI_LINE_COMMENT_END);
                }
            break;

            case State.MULTI_LINE_COMMENT_END:
                _nextChar();
                if (chr() === '/') {
                    //return _createToken(lt.input.substring(lt.tokenFirstIndex, lt.index), TokenType.COMMENT);
                    _nextChar();
                    _resetState();
                } else if (chr() === '*') {
                    state(State.MULTI_LINE_COMMENT_END);
                } else {
                    state(State.MULTI_LINE_COMMENT);
                }
            break;

            case State.ERROR:
                var token: Token = _createToken(chr(), TokenType.ERROR);
                throw {
                    errorCode: lt.errorCode,
                    message: getErrorMessage(token, lt.errorCode),
                    token: token,
                    context: getErrorContext(lt.input, token)
                };
            break;
        }
    }
    if (lt.state !== State.INIT) {
        defaultToken.type = TokenType.ERROR;
    }
    return defaultToken;
}

function createInitialLexerState(input: string): LexerState {
    return {
        input: input,
        index: 0,
        line: 0,
        column: 0,
        state: State.INIT,
        tokenFirstIndex: 0,
        errorCode: ErrorCode.NO_ERROR
    };
}

export function create(input: string): Lexer {
    var lt: LexerState = createInitialLexerState(input);
    return {
        getNextToken: getNextToken.bind(null, lt)
    };
}
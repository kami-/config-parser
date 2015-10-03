import Lexer = require('./Lexer');

export const enum NodeType {
    ERROR,
    ROOT,
    NUMBER,
    STRING,
    ARRAY,
    NUMBER_FIELD,
    STRING_FIELD,
    ARRAY_FIELD,
    CLASS_FIELD
}

export const enum ErrorCode {
    NO_ERROR,
    EXPECTED_END_OF_FILE,
    EXPECTED_TOKEN,
    EXPECTED_FIELD_OR_CLASS,
    EXPECTED_ID_OR_KEYWORD_CLASS,
    EXPECTED_EQUAL_OR_ARRAY_BEGIN,
    EXPECTED_LITERAL,
    EXPECTED_ARRAY_FIELD_END,
    EXPECTED_ARRAY_OR_LITERAL,
    EXPECTED_EMPTY_ARRAY_OR_EXPRESSION,
    EXPECTED_ARRAY_END_OR_COMMA,
    EXPECTED_CLASS_FIELD_ID
}

export interface Node {
    type: NodeType;
    fieldName: string; // field or class name
    value?: any; // Literal
    values?: Node[]; // Array
    fields?: Node[]; // Class
    inheritsFrom?: string; // Class
}

export interface Parser {
    parse: () => Node;
}

interface ParserState {
    input: string;
    lexer: Lexer.Lexer;
    currentToken: Lexer.Token;
}

function parserError(input: string, token: Lexer.Token, errorCode: ErrorCode) {
    throw {
        errorCode: errorCode,
        message: getErrorMessage(token, errorCode),
        token: token,
        context: getErrorContext(input, token)
    };
}

function acceptToken(pt: ParserState, tokenType: Lexer.TokenType) {
    if (pt.currentToken.type === tokenType) {
        pt.currentToken = pt.lexer.getNextToken();
    } else {
        parserError(pt.input, pt.currentToken, ErrorCode.EXPECTED_TOKEN);
    }
}

function getErrorMessage(token: Lexer.Token, errorCode: ErrorCode): string {
    var message: string = "",
        position: string = "" + (token.line + 1) + ":" + (token.column + 1);
    switch (errorCode) {
        case ErrorCode.EXPECTED_END_OF_FILE:
            message = "Expected end of file at " + position + "!";
            break;
        case ErrorCode.EXPECTED_TOKEN:
            message = "Unexpected character '" + token.lexeme + "' at " + position + "!";
            break;
        case ErrorCode.EXPECTED_FIELD_OR_CLASS:
            message = "Expected a field or a class at " + position + "!";
            break;
        case ErrorCode.EXPECTED_ID_OR_KEYWORD_CLASS:
            message = "Expected a field name or keyword 'class' at " + position + "!";
            break;
        case ErrorCode.EXPECTED_EQUAL_OR_ARRAY_BEGIN:
            message = "Field must be followed by '=' or '[' at " + position + "!";
            break;
        case ErrorCode.EXPECTED_LITERAL:
            message = "Expected a number or string at " + position + "!";
            break;
        case ErrorCode.EXPECTED_ARRAY_FIELD_END:
            message = "Expected ']' at " + position + "! Array field must have the format 'field[] = {...};'";
            break;
        case ErrorCode.EXPECTED_ARRAY_OR_LITERAL:
            message = "Expected an array, a number or a string at " + position + "!";
            break;
        case ErrorCode.EXPECTED_EMPTY_ARRAY_OR_EXPRESSION:
            message = "Expected '}' to close the array, or ',' to separate the next element at " + position + "!";
            break;
        case ErrorCode.EXPECTED_CLASS_FIELD_ID:
            message = "Expected a class name at " + position + "!";
            break;
    }
    return message;
};

function getErrorContext(input: string, token: Lexer.Token): string {
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
};

function parse(pt: ParserState): Node {
    var _acceptToken = acceptToken.bind(null, pt),
        _parserError = parserError.bind(null, pt.input, pt.currentToken);

    function isToken(type: Lexer.TokenType): boolean {
        return pt.currentToken.type === type;
    }

    function isField(): boolean {
        return isToken(Lexer.TokenType.ID) || isToken(Lexer.TokenType.CLASS);
    }

    function isLiteral(): boolean {
        return isToken(Lexer.TokenType.NUMBER) || isToken(Lexer.TokenType.STRING);
    };

    function isExpression(): boolean {
        return isLiteral() || isToken(Lexer.TokenType.LCB);
    };

    function start(): Node {
        var node: Node = { type: NodeType.ROOT, fieldName: '<ROOT>', fields: [] };
        // Rule: start -> fields
        while (!isToken(Lexer.TokenType.END) && !isToken(Lexer.TokenType.ERROR)) {
            node.fields.push(field());
        }
        return node;
    }

    // Non-terminal: fields
    function fields(prevFields: Node[]): Node[] {
        // Rule: fields -> field fields
        if (isField()) {
            prevFields.push(field());
            prevFields = fields(prevFields);
        }

        // Rule: fields -> EPSILON
        return prevFields;
    }

    // Non-terminal: field
    function field(): Node {
        var node: Node = { type: NodeType.ERROR, fieldName: '' };
        // Rule: field -> idField ;
        if (isToken(Lexer.TokenType.ID)) {
            var fieldName: string = pt.currentToken.lexeme;
            _acceptToken(Lexer.TokenType.ID);
            node = idField();
            node.fieldName = fieldName;
            _acceptToken(Lexer.TokenType.SEMICOLON);
        }
        // Rule: field -> classField ;
        else if (isToken(Lexer.TokenType.CLASS)) {
            _acceptToken(Lexer.TokenType.CLASS);
            node = classField();
            _acceptToken(Lexer.TokenType.SEMICOLON);
        }
        // Error
        else {
            _parserError(ErrorCode.EXPECTED_ID_OR_KEYWORD_CLASS);
        }
        return node;
    }

    // Non-terminal: idField
    function idField(): Node {
        var node: Node = { type: NodeType.ERROR, fieldName: '' };
        // Rule: idField -> literalField
        if (isToken(Lexer.TokenType.EQUAL)) {
            _acceptToken(Lexer.TokenType.EQUAL);
            node = literalField();
        }
        // Rule: idField -> arrayField
        else if (isToken(Lexer.TokenType.LSB)) {
            _acceptToken(Lexer.TokenType.LSB);
            node = arrayField();
        }
        // Error
        else {
            _parserError(ErrorCode.EXPECTED_EQUAL_OR_ARRAY_BEGIN);
        }
        return node;
    };

    // Non-terminal: literalField
    function literalField(): Node {
        var node: Node = { type: NodeType.ERROR, fieldName: '' };
        // Rule: literalField -> literal
        if (isLiteral()) {
            node = literal();
            if (node.type === NodeType.NUMBER) {
                node.type = NodeType.NUMBER_FIELD;
            } else {
                node.type = NodeType.STRING_FIELD;
            }
        }
        // Error
        else {
            _parserError(ErrorCode.EXPECTED_LITERAL);
        }
        return node;
    };

    // Non-terminal: literal
    function literal(): Node {
        var node: Node = { type: NodeType.ERROR, fieldName: '', value: pt.currentToken.lexeme };
        // Rule: literal -> Number
        if (isToken(Lexer.TokenType.NUMBER)) {
            _acceptToken(Lexer.TokenType.NUMBER);
            node.type = NodeType.NUMBER;
        }
        // Rule: literal -> String
        else if (isToken(Lexer.TokenType.STRING)) {
            _acceptToken(Lexer.TokenType.STRING);
            node.type = NodeType.STRING;
        }
        // Error
        else {
            _parserError(ErrorCode.EXPECTED_LITERAL);
        }
        return node;
    };

    function arrayField(): Node {
        // Rule: arrayField -> ] = { array
        if (isToken(Lexer.TokenType.RSB)) {
            _acceptToken(Lexer.TokenType.RSB);
            _acceptToken(Lexer.TokenType.EQUAL);
            _acceptToken(Lexer.TokenType.LCB);
            return { type: NodeType.ARRAY_FIELD, fieldName: '', values: array() };
        }
        // Error
        else {
            _parserError(ErrorCode.EXPECTED_ARRAY_FIELD_END);
        }
    };

    function array(): Node[] {
        var values: Node[] = [];
        if (!isToken(Lexer.TokenType.RCB)) {
            values.push(expression());
            while (!isToken(Lexer.TokenType.RCB) && !isToken(Lexer.TokenType.ERROR)) {
                _acceptToken(Lexer.TokenType.COMMA);
                values.push(expression());
            }
        }
        _acceptToken(Lexer.TokenType.RCB);
        return values;
    };

    function expressionList(): Node[] {
        // Rule: expressionList -> expression expressionListTail
        var values: Node[] = [expression()];
        values = expressionListTail(values);
        return values;
    };

    function expression(): Node {
        // Rule: expression -> literal
        if (isLiteral()) {
            return literal();
        }
        // Rule: expression -> array
        else if (isToken(Lexer.TokenType.LCB)) {
            _acceptToken(Lexer.TokenType.LCB);
            return { type: NodeType.ARRAY, fieldName: '', values: array() };
        }
        else {
            _parserError(ErrorCode.EXPECTED_ARRAY_OR_LITERAL);
        }
    };

    function expressionListTail(values: Node[]): Node[] {
        // Rule: expressionListTail -> , expression expressionListTail
        if (isToken(Lexer.TokenType.COMMA)) {
            _acceptToken(Lexer.TokenType.COMMA);
            values.push(expression());
        }
        // Rule: expressionListTail -> EPSILON
        return values;
    };

    // Non-terminal: classField
    function classField(): Node {
        var node: Node = { type: NodeType.ERROR, fieldName: '', fields: [], inheritsFrom: '' };
        // Rule: classField -> ID inheritance { fields }
        if (isToken(Lexer.TokenType.ID)) {
            node.type = NodeType.CLASS_FIELD;
            node.fieldName = pt.currentToken.lexeme;
            _acceptToken(Lexer.TokenType.ID);
            node.inheritsFrom = inheritance();
            _acceptToken(Lexer.TokenType.LCB);
            while (!isToken(Lexer.TokenType.RCB) && !isToken(Lexer.TokenType.ERROR)) {
                node.fields.push(field());
            }
            _acceptToken(Lexer.TokenType.RCB);
        }
        else {
            _parserError(ErrorCode.EXPECTED_CLASS_FIELD_ID);
        }
        return node;
    }

    // Non-terminal: inheritance
    function inheritance(): string {
        var inheritsFrom = '';
        // Rule: inheritance -> : ID
        if (isToken(Lexer.TokenType.COLON)) {
            _acceptToken(Lexer.TokenType.COLON);
            inheritsFrom = pt.currentToken.lexeme;
            _acceptToken(Lexer.TokenType.ID);
        }
        return inheritsFrom;
    }

    var node: Node = start();
    _acceptToken(Lexer.TokenType.END);
    return node;
}

function createInitialParserState(input: string, lexer: Lexer.Lexer): ParserState {
    return {
        input: input,
        lexer: lexer,
        currentToken: lexer.getNextToken()
    };
}

export function create(input: string, lexer: Lexer.Lexer): Parser {
    var pt: ParserState = createInitialParserState(input, lexer);
    return {
        parse: parse.bind(null, pt)
    };
}
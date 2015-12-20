import Parser = require('./Parser');

export interface PrettyPrinter {
    print: (ast: Parser.Node) => string;
}

interface PrettyPrinterState {
    identation: string;
}

function isLiteral(type: Parser.NodeType): boolean {
    return type === Parser.NodeType.NUMBER || type === Parser.NodeType.STRING;
}

function isLiteralField(type: Parser.NodeType): boolean {
    return type === Parser.NodeType.NUMBER_FIELD || type === Parser.NodeType.STRING_FIELD;
}

function print(ppt: PrettyPrinterState, ast: Parser.Node): string {
    function printNode(node: Parser.Node, identation: string): string {
        var result: string = identation;
        if (node.type === Parser.NodeType.ROOT) {
            result += printRootFields(node.fields, identation);
        } else if (isLiteralField(node.type)) {
            result += printLiteralField(node);
        } else if (isLiteral(node.type)) {
            result += printLiteral(node);
        } else if (node.type === Parser.NodeType.ARRAY_FIELD) {
            result += printArrayField(node, identation);
        } else if (node.type === Parser.NodeType.ARRAY) {
            result += printArray(node.values, identation);
        } else if (node.type === Parser.NodeType.CLASS_FIELD) {
            result += printClassField(node, identation);
        }
        return result;
    }

    function printRootFields(fields: Parser.Node[], identation: string): string {
        var result: string = '',
            separator: string = '';
        for (var i = 0, len = fields.length; i < len; i++) {
            result += separator;
            separator = '\n';
            result += printNode(fields[i], identation);
        }
        return result;
    }

    function printLiteralField(node: Parser.Node): string {
        var result: string = node.fieldName;
        result += ' = ';
        result += printLiteral(node);
        return result += ';';
    }

    var printLiteral = function(node: Parser.Node): string {
        var result: string = node.value;
        if (node.type === Parser.NodeType.STRING || node.type === Parser.NodeType.STRING_FIELD) {
            result = '"' + node.value.replace(/"/g, '""') + '"';
        }
        return result;
    }

    function printArrayField(node: Parser.Node, identation: string): string {
        var result: string = node.fieldName;
        result += '[] = ';
        if (node.values.length > 0 && node.values[0].type === Parser.NodeType.ARRAY) {
            result += printNestedArray(ppt.identation, node.values, identation);
        } else {
            result += printArray(node.values, identation);
        }
        return result += ';';
    }

    function printArray(values: Parser.Node[], identation: string): string {
        var result: string = '{',
            separator: string = '';
        for (var i = 0, len = values.length; i < len; i++) {
            result += separator;
            separator = ', ';
            result += printNode(values[i], '');
            
        }
        return result + '}';
    }

    function printNestedArray(originalIdentation: string, values: Parser.Node[], identation: string): string {
        var result: string = '{',
            separator: string = '';
        for (var i = 0, len = values.length; i < len; i++) {
            result += separator;
            separator = ', ';
            result += '\n';
            result += printNode(values[i], identation + originalIdentation);
        }
        result += '\n';
        result += identation;
        return result + '}';
    }

    function printClassField(node: Parser.Node, identation: string): string {
        var result: string = 'class ';
        result += node.fieldName;
        if (node.inheritsFrom !== '') {
            result += ' : ' + node.inheritsFrom;
        }
        result += ' {';
        if (node.fields.length > 0) {
            result += '\n';
        }
        result += printClassFields(ppt.identation, node.fields, identation);
        result += '\n';
        result += identation;
        return result + '};';
    }

    function printClassFields(originalIdentation: string, fields: Parser.Node[], identation: string): string {
        var result: string = '',
            separator = '';
        for (var i = 0, len = fields.length; i < len; i++) {
            var isPrevClass: boolean = i - 1 > 0 && fields[i - 1].type === Parser.NodeType.CLASS_FIELD,
                isClass: boolean = fields[i].type === Parser.NodeType.CLASS_FIELD,
                isNextClass: boolean = i + 1 < len && fields[i + 1].type === Parser.NodeType.CLASS_FIELD;
            result += separator;
            if (isPrevClass && !isClass) {
                result += separator;
            }
            separator = '\n';
            result += printNode(fields[i], identation + originalIdentation);
            if (isNextClass) {
                result += separator;
            }
        }
        return result;
    }

    return printNode(ast, '');
}

function createInitialPrettyPrinterState(identation: string): PrettyPrinterState {
    return {
        identation: identation
    };
}

export function create(identation: string): PrettyPrinter {
    var ppt: PrettyPrinterState = createInitialPrettyPrinterState(identation);
    return {
        print: print.bind(null, ppt)
    };
}
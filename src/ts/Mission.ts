import Parser = require('./Parser');
import Ast = require('./Ast');

function updateItemsField(node: Parser.Node, itemCount: number): void {
    var itemsField: Parser.Node[] = Ast.select(node, 'items');
    if (itemsField.length === 0) {
        Ast.addLiteralNode(node, 'items', itemCount, Parser.NodeType.NUMBER_FIELD);
    } else {
        itemsField[0].value = itemCount;
    }
}

function updateItemClassNames(allItems: Parser.Node[]): void {
    for (var i = 0, len = allItems.length; i < len; i++) {
        allItems[i].fieldName = 'Item' + i;
    }
}

export function mergeItems(node: Parser.Node, newItems: Parser.Node[]): void {
    node.fields = node.fields.concat(newItems);
    var allItems: Parser.Node[] = Ast.select(node, 'Item*');
    updateItemsField(node, allItems.length);
    updateItemClassNames(allItems);
}
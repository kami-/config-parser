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

function updateIds(node: Parser.Node): number {
    var items = Ast.select(node, 'Item*');
    var count = 0;
    for (var i = 0, len = items.length; i < len; i++) {
        if (Ast.select(items[i], 'dataType')[0].value = 'Group') {
            var groupItems = Ast.select(items[i], 'Entities.Item*');
            for (var j = 0, groupLen = groupItems.length; j < groupLen; j++) {
                Ast.select(groupItems[j], 'id')[0].value = count + 1;
                count++;
            }
        }
        Ast.select(items[i], 'id')[0].value = count + 1;
        count++;
    }
    return count;
}

export function mergeItems(node: Parser.Node, newItems: Parser.Node[]): number {
    node.fields = node.fields.concat(newItems);
    var allItems: Parser.Node[] = Ast.select(node, 'Item*');
    updateItemsField(node, allItems.length);
    updateItemClassNames(allItems);
    return updateIds(node);
}
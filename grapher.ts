import * as fs from 'fs';
import { PrintAST, PrintExpression, PrintStaticVariable } from './generator/Graphviz';
import { Lexer } from './lexer';
import { TokenType } from './lexer/TokenType';

import { Parse } from './unified_parser/Parser';

import { install } from 'source-map-support';
import { TypeRegistry } from './registry/TypeRegistry';
import { StaticFunctionRegistry, StaticVariableRegistry } from './registry/StaticVariableRegistry';
import { ClassType } from './unified_parser/TypeObject';
install();

export function why_not(e: string): boolean {
    console.error(e);
    return false;
}

const source = fs.readFileSync(process.argv[2]).toString();

const lexer = new Lexer(source);
for (const tok of lexer.token_stream) {
    if (tok.type == TokenType.Name) {
        console.error(`${tok.start} ${tok.length} Name(${tok['name']})`);
    } else if (tok.type == TokenType.NumericLiteral) {
        console.error(`${tok.start} ${tok.length} NumericLiteral(${tok['value']})`);
    } else {
        console.error(`${tok.start} ${tok.length} ${TokenType[tok.type]}`);
    }
}

Parse(lexer.token_stream);

/*
console.log(PrintAST(stream));
*/

console.log("digraph {\n    rankdir=LR;");

for (const [name, type] of TypeRegistry) {
    if (type instanceof ClassType) {
        console.log(PrintExpression(type.source));
    }
}

for (const [name, func] of StaticFunctionRegistry) {
    console.log(PrintExpression(func));
}

for (const [name, {type, initializer}] of StaticVariableRegistry) {
    console.log(PrintStaticVariable(name, type, initializer));
}

console.log("}");

console.error(TypeRegistry);
console.error(StaticVariableRegistry);
console.error(StaticFunctionRegistry);
console.error("Done.");
import * as fs from 'fs';
import { Lexer } from './lexer';
import { TokenType } from './lexer/TokenType';

import { install } from 'source-map-support';
import { PrintExpression, PrintStaticVariable } from './generator/Graphviz';
import { StaticFunctionRegistry, StaticVariableRegistry } from './registry/StaticVariableRegistry';
import { TypeRegistry } from './registry/TypeRegistry';
import { Parse } from './unified_parser/Parser';
import { ClassType } from './unified_parser/TypeObject';
import { isSynthesizable } from './generator/IR';
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

for (const [name, type] of TypeRegistry) {
    if (type instanceof ClassType) {
        console.log(type.source.synthesize().statements.map(x => x.toString()).join("\n"));
    }
}

for (const [name, func] of StaticFunctionRegistry) {
    console.log(func.synthesize().statements.map(x => x.toString()).join("\n"));
}

for (const [name, { type, initializer }] of StaticVariableRegistry) {
    if (isSynthesizable(initializer)) {
        console.log(initializer.synthesize().statements.map(x => x.toString()).join("\n"));
    }
}


import * as fs from 'fs';
import { PrintAST } from './generator/Graphviz';
import { Lexer } from './lexer';
import { TokenType } from './lexer/TokenType';

import { Parse } from './unified_parser/Parser';

import { install } from 'source-map-support';
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

const stream = Parse(lexer.token_stream);

console.log(PrintAST(stream));
console.error("Done.");
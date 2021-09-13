import * as fs from 'fs';
import { PrintExpression } from './generator/Graphviz';
import { Lexer } from './lexer';
import { TokenType } from './lexer/TokenType';

import { install } from 'source-map-support';
import { Parse } from './unified_parser/Parser';
import { ASTElement } from './unified_parser/ASTElement';
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

/*
const p = new Program();
console.error(p.parse(lexer.handle()));

console.log("digraph {");
console.log("    rankdir=LR;");
PrintTree(p);
console.log("}");
*/

const ostream = Parse(lexer.token_stream);
console.log("digraph {");
console.log("    rankdir=LR;");
ostream.forEach((x) => {
    if(!(x instanceof ASTElement)) return;
    PrintExpression(x);
});
console.log("}");
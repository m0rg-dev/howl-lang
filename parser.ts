import * as fs from 'fs';
import { Program } from './ast/Program';
import { Lexer } from './lexer';
import { TokenType } from './TokenType';

export function why_not(e: string): boolean {
    console.error(e);
    return false;
}

const source = fs.readFileSync(process.argv[2]).toString();

const lexer = new Lexer(source);
for (const tok of lexer.tokenize()) {
    if(tok.type == TokenType.Name) {
        console.log(`Name(${tok['name']})`);
    } else if(tok.type == TokenType.NumericLiteral) {
        console.log(`NumericLiteral(${tok['value']})`);
    } else {
        console.log(`${TokenType[tok.type]}`);
    }
}
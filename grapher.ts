import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parse } from './parser/Parser';

import * as sms from 'source-map-support';
import { Functions, InitRegistry } from './registry/Registry';
import { RenderElement } from './graphviz/Graphviz';
sms.install();

InitRegistry();

const source = fs.readFileSync(process.argv[2]).toString();
const lexer = new Lexer(source);
const parsed = Parse(lexer.token_stream);

console.log("digraph {\n  rankdir=LR;\n");
Functions.forEach(x => console.log(RenderElement(x)));
console.log("}");

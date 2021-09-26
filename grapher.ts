import * as fs from 'fs';
import * as sms from 'source-map-support';
import { RenderElement } from './graphviz/Graphviz';
import { Lexer } from './lexer';
import { Parse } from './parser/Parser';
import { Classes, Functions, InitRegistry } from './registry/Registry';
import { RunTypeInference } from './type_inference/TypeInference';

sms.install();

InitRegistry();

const source = fs.readFileSync(process.argv[2]).toString();
const lexer = new Lexer(source);
Parse(lexer.token_stream);

Functions.forEach(RunTypeInference);

Classes.forEach((cl, name) => {
    if (cl.generics.length) Classes.delete(name);
});

console.log("digraph {\n  rankdir=LR;\n");
Functions.forEach(x => console.log(RenderElement(x)));
Classes.forEach(x => console.log(RenderElement(x)));
console.log("}");

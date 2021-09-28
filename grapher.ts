import * as fs from 'fs';
import * as sms from 'source-map-support';
import { RenderElement } from './graphviz/Graphviz';
import { Lexer } from './lexer';
import { Parse } from './parser/Parser';
import { Classes, Functions, InitRegistry } from './registry/Registry';
import { RunClassTransforms, RunFunctionTransforms } from './transform/RunTransforms';
import { RunTypeInference } from './type_inference/TypeInference';

sms.install();

InitRegistry();

const source = fs.readFileSync(process.argv[2]).toString();
const lexer = new Lexer(source);
Parse(lexer.token_stream);

Classes.forEach((cl) => {
    if (!cl.generics.length) {
        cl.is_monomorphization = true;
        cl.methods.forEach(RunTypeInference);
    }
});

Functions.forEach(RunTypeInference);

Classes.forEach((cl, name) => {
    if (!cl.is_monomorphization) Classes.delete(name);
});

if (!process.env.HOWL_SKIP_FREEZE_TYPES) {
    Classes.forEach(RunClassTransforms);
    Functions.forEach(RunFunctionTransforms);
}

console.log("digraph {\n  rankdir=LR;\n");
Functions.forEach(x => console.log(RenderElement(x)));
Classes.forEach(x => console.log(RenderElement(x)));
console.log("}");

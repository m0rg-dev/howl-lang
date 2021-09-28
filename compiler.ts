import * as fs from 'fs';
import { Lexer } from './lexer';
import { Parse } from './parser/Parser';

import * as sms from 'source-map-support';
import { Classes, Functions, InitRegistry } from './registry/Registry';
import { RunTypeInference } from './type_inference/TypeInference';
import { RunClassTransforms, RunFunctionTransforms } from './transform/RunTransforms';
import { EmitJS } from './generator/JSGenerator';
sms.install();

InitRegistry();

const source = fs.readFileSync(process.argv[2]).toString();
const lexer = new Lexer(source);
Parse(lexer.token_stream);

Functions.forEach(RunTypeInference);

Classes.forEach((cl, name) => {
    if (cl.generics.length) Classes.delete(name);
});

if (!process.env.HOWL_SKIP_FREEZE_TYPES) {
    Classes.forEach(RunClassTransforms);
    Functions.forEach(RunFunctionTransforms);

    Classes.forEach(EmitJS);
    Functions.forEach(EmitJS);
    // crt0.js
    console.log("process.exit(module_main(undefined));");
}

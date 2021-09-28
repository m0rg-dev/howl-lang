import * as fs from 'fs';
import * as sms from 'source-map-support';
import { EmitC, EmitCPrologue, EmitForwardDeclarations } from './generator/CGenerator';
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

Functions.forEach(RunTypeInference);

Classes.forEach((cl, name) => {
    if (cl.generics.length) Classes.delete(name);
});

if (!process.env.HOWL_SKIP_FREEZE_TYPES) {
    Classes.forEach(x => {
        RunClassTransforms(x);
    });
    Functions.forEach(RunFunctionTransforms);

    EmitCPrologue();

    Classes.forEach(x => {
        if (x.is_monomorphization) {
            EmitForwardDeclarations(x);
        }
    });

    Classes.forEach(x => {
        if (x.is_monomorphization) {
            EmitC(x);
        }
    });
    Functions.forEach(EmitC);
    console.log(`int main(void) { return module_main(); }`)
}

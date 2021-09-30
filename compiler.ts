import * as sms from 'source-map-support';
import { ParseFile, SetupDriver } from './driver/Driver';

sms.install();

SetupDriver();
ParseFile(process.argv[2]);

/*

InitRegistry();

const lib_source = fs.readFileSync("lib/lib.hl").toString();
const lib_lexer = new Lexer(lib_source);
Parse(lib_lexer.token_stream);

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
    Classes.forEach(x => {
        RunClassTransforms(x);
    });
    Functions.forEach(RunFunctionTransforms);

    EmitCPrologue();

    Classes.forEach(EmitForwardDeclarations);
    Classes.forEach(EmitStructures);
    Classes.forEach(EmitC);

    Functions.forEach(EmitC);
    console.log(`int main(void) { return main$Main(); }`)
}

*/

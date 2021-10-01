import * as sms from 'source-map-support';
import { ParseFile, SetupDriver } from './driver/Driver';
import { EmitC, EmitCPrologue, EmitForwardDeclarations, EmitStructures } from './generator/CGenerator';
import { RenderElement } from './graphviz/Graphviz';
import { Classes, Functions } from './registry/Registry';
import { RunClassTransforms, RunFunctionTransforms } from './transform/RunTransforms';
import { ConcreteType } from './type_inference/ConcreteType';
import { StructureType } from './type_inference/StructureType';
import { RunTypeInference } from './type_inference/TypeInference';

sms.install();

SetupDriver();
ParseFile(process.argv[2]);

Classes.forEach((cl) => {
    cl.fields.forEach(f => {
        console.error(f);
        if (f.type instanceof ConcreteType && Classes.has(f.type.name)) {
            const cl = Classes.get(f.type.name);
            f.type = cl.type();
            f.generics.forEach((g, idx) => (f.type as StructureType).generic_map.set(cl.generics[idx], g));
        }
    })
})

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
}

if (process.env["HOWL_OUTPUT_GRAPHVIZ"]) {
    console.log("digraph {\n  rankdir=LR;\n");
    Functions.forEach(x => console.log(RenderElement(x)));
    Classes.forEach(x => console.log(RenderElement(x)));
    console.log("}");
} else if (!process.env["HOWL_SKIP_FREEZE_TYPES"]) {
    EmitCPrologue();

    Classes.forEach(EmitForwardDeclarations);
    Classes.forEach(EmitStructures);
    Classes.forEach(EmitC);

    Functions.forEach(EmitC);
    console.log(`int main(void) { return main$Main(); }`)
}


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

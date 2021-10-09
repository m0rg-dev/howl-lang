import * as sms from 'source-map-support';
import { ParseFile, SetupDriver } from './driver/Driver';
import { EmitC, EmitCPrologue, EmitForwardDeclarations, EmitStructures } from './generator/CGenerator';
import { RenderElement } from './graphviz/Graphviz';
import { Classes, Functions } from './registry/Registry';
import { RunClassTransforms, RunFunctionTransforms } from './transform/RunTransforms';
import { ConcreteType } from './type_inference/ConcreteType';
import { StructureType } from './type_inference/StructureType';

sms.install();

SetupDriver();
if (!ParseFile(process.argv[2])) process.exit(1);

Classes.forEach((cl) => {
    cl.fields.forEach(f => {
        if (f.type instanceof ConcreteType && Classes.has(f.type.name)) {
            const cl = Classes.get(f.type.name);
            f.type = cl.type();
            f.generics.forEach((g, idx) => (f.type as StructureType).generic_map.set(cl.generics[idx], g));
        }
    })
});

Classes.forEach(RunClassTransforms);
Functions.forEach(RunFunctionTransforms);

if (process.env["HOWL_OUTPUT_GRAPHVIZ"]) {
    Classes.forEach((cl) => {
        if (!cl.is_monomorphization) Classes.delete(cl.name);
    });
    console.log("digraph {\n  rankdir=LR;\n");
    Functions.forEach(x => console.log(RenderElement(x)));
    Classes.forEach(x => console.log(RenderElement(x)));
    console.log("}");
} else {
    Classes.forEach(cl => cl.dropBaseMethods());

    EmitCPrologue();
    Classes.forEach(EmitForwardDeclarations);
    Classes.forEach(EmitStructures);
    Classes.forEach(c => EmitC(c));
    Functions.forEach(f => EmitC(f));
}
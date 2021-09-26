import { ClassElement } from "../ast/ClassElement";
import { FieldReferenceExpression } from "../ast/expression/FieldReferenceExpression";
import { FunctionElement } from "../ast/FunctionElement";
import { WalkAST } from "../ast/WalkAST";
import { Classes } from "../registry/Registry";
import { UnitType } from "../type_inference/UnitType";

export function RunFunctionTransforms(f: FunctionElement) {
    WalkAST(f, (x) => {
        if (x instanceof FieldReferenceExpression
            && Classes.has(x.source.resolved_type.name)
            && Classes.get(x.source.resolved_type.name).methods.some(y => y.getFQN().last() == x.name)) {
            console.error(`{IndirectMethodReference} ${x}`);
            const new_source = new FieldReferenceExpression(x.source_location, x.source, "__stable");
            new_source.resolved_type = new UnitType(`${x.source.resolved_type.name}_stable`);
            x.source = new_source;
        }
    });
}

export function RunClassTransforms(c: ClassElement) {

}

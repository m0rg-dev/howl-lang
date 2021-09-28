import { ClassElement } from "../ast/ClassElement";
import { FieldReferenceExpression } from "../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../ast/expression/FunctionCallExpression";
import { GeneratorTemporaryExpression } from "../ast/expression/GeneratorTemporaryExpression";
import { IndexExpression } from "../ast/expression/IndexExpression";
import { FunctionElement } from "../ast/FunctionElement";
import { AssignmentStatement } from "../ast/statement/AssignmentStatement";
import { WalkAST } from "../ast/WalkAST";
import { Classes } from "../registry/Registry";
import { ConcreteType } from "../type_inference/ConcreteType";

export function RunFunctionTransforms(f: FunctionElement) {
    console.error(`~~~ RunFunctionTransforms ${f} ~~~`);

    WalkAST(f, (x) => {
        if (x instanceof AssignmentStatement
            && x.lhs instanceof IndexExpression
            && Classes.has(x.lhs.source.resolved_type.name)) {
            console.error(`{Replace__L_Index__} ${x}`);
            // TODO this is really ugly
            x.lhs = new FunctionCallExpression(x.source_location,
                new FieldReferenceExpression(x.source_location, x.lhs.source, "__l_index__"),
                [x.lhs.index, x.rhs]);
            x.generator_metadata["is_fake_assignment"] = true;
        }
    })

    WalkAST(f, (x) => {
        if (x instanceof IndexExpression
            && Classes.has(x.source.resolved_type.name)) {
            console.error(`{Replace__Index__} ${x}`);
            // TODO this is also really ugly
            x.source = new FunctionCallExpression(x.source_location,
                new FieldReferenceExpression(x.source_location, x.source, "__index__"),
                [x.index]);
            x.generator_metadata["is_fake_index"] = true;
        }
    });

    WalkAST(f, (x) => {
        if (x instanceof FunctionCallExpression
            && x.source instanceof FieldReferenceExpression
            && Classes.has(x.source.source.resolved_type.name)) {
            console.error(`{AddSelfToMethodCall} ${x}`);
            const new_source = new GeneratorTemporaryExpression(x.source.source);
            x.source.source = new_source;
            x.args.unshift(new_source);
        }
    });

    WalkAST(f, (x) => {
        if (x instanceof FieldReferenceExpression
            && Classes.has(x.source.resolved_type.name)
            && Classes.get(x.source.resolved_type.name).methods.some(y => y.getFQN().last() == x.name)) {
            console.error(`{IndirectMethodReference} ${x}`);
            const new_source = new FieldReferenceExpression(x.source_location, x.source, "__stable");
            new_source.resolved_type = new ConcreteType(`${x.source.resolved_type.name}_stable`);
            x.source = new_source;
        }
    });
}

export function RunClassTransforms(c: ClassElement) {
    c.methods.forEach(RunFunctionTransforms);
}

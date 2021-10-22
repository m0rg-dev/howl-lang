import { ASTElement } from "../../ast/ASTElement";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { GeneratorTemporaryExpression } from "../../ast/expression/GeneratorTemporaryExpression";
import { FunctionElement } from "../../ast/FunctionElement";
import { Classes } from "../../registry/Registry";
import { Scope } from "../../type_inference/Scope";
import { RunElementTransforms } from "../RunTransforms";
import { Transformer } from "../Transformer";

export class MethodCall extends Transformer {
    match(src: ASTElement) {
        return src instanceof FunctionCallExpression
            && src.source instanceof FieldReferenceExpression
            && src.source.source.resolved_type
            && Classes.has(src.source.source.resolved_type.name);
    }

    apply(src: FunctionCallExpression<FieldReferenceExpression>, _: Scope, root: FunctionElement) {
        const gte = new GeneratorTemporaryExpression(src.source.source);
        let new_tree: ASTElement = new FunctionCallExpression(src.source_location,
            new FieldReferenceExpression(src.source.source_location,
                new FieldReferenceExpression(src.source.source_location, gte, "__stable"), src.source.name),
            [gte, ...src.args]);
        RunElementTransforms(new_tree, root, (n) => new_tree = n);

        return new_tree;
    }
}

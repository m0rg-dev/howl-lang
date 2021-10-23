import { ASTElement } from "../../ast/ASTElement";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { IndexExpression } from "../../ast/expression/IndexExpression";
import { FunctionElement } from "../../ast/FunctionElement";
import { Classes } from "../../registry/Registry";
import { Scope } from "../../type_inference/Scope";
import { RunElementTransforms } from "../RunTransforms";
import { Transformer } from "../Transformer";

export class IndexOverloadRHS extends Transformer {
    match(src: ASTElement) {
        return src instanceof IndexExpression
            && Classes.has(src.source.resolved_type?.name)
            && Classes.get(src.source.resolved_type.name).methods.some(x => x.name == "__index__");
    }

    apply(src: IndexExpression, _: Scope, root: FunctionElement) {
        let new_tree: ASTElement = new FunctionCallExpression(src.source_location,
            new FieldReferenceExpression(src.source_location, src.source, "__index__"), [src.index]);
        RunElementTransforms(new_tree, root, (n) => new_tree = n);
        return new_tree;
    }
}

import { ASTElement } from "../../ast/ASTElement";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { FunctionElement } from "../../ast/FunctionElement";
import { AssignmentStatement } from "../../ast/statement/AssignmentStatement";
import { SimpleStatement } from "../../ast/statement/SimpleStatement";
import { Scope } from "../../type_inference/Scope";
import { RunElementTransforms } from "../RunTransforms";
import { Transformer } from "../Transformer";

export class IndexOverloadLHS extends Transformer {
    match(src: ASTElement) {
        return src instanceof AssignmentStatement
            && src.lhs instanceof FunctionCallExpression
            && src.lhs.source instanceof FieldReferenceExpression
            && src.lhs.source.name.startsWith("__index__")
    }

    apply(src: AssignmentStatement<FunctionCallExpression<FieldReferenceExpression>, any>, _: Scope, root: FunctionElement) {
        console.error(src.lhs);

        // this will have already had its overload evaluated and been converted
        // to a method access through __stable, so we need to *undo* that
        let new_source = src.lhs.source.clone();
        new_source.source = (new_source.source as FieldReferenceExpression).source;
        new_source.name = "__index__";

        let new_tree: ASTElement = new SimpleStatement(src.source_location,
            new FunctionCallExpression(src.source_location,
                new_source, [...src.lhs.args.slice(1), src.rhs]));
        RunElementTransforms(new_tree, root, (n) => new_tree = n);
        return new_tree;
    }
}

import { ASTElement } from "../../ast/ASTElement";
import { ConstructorCallExpression } from "../../ast/expression/ConstructorCallExpression";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { MacroCallExpression } from "../../ast/expression/MacroCallExpression";
import { NameExpression } from "../../ast/expression/NameExpression";
import { FunctionElement } from "../../ast/FunctionElement";
import { LocalDefinitionStatement } from "../../ast/statement/LocalDefinitionStatement";
import { SimpleStatement } from "../../ast/statement/SimpleStatement";
import { SimpleTypeElement, TypeElement } from "../../ast/TypeElement";
import { Scope } from "../../type_inference/Scope";
import { RunElementTransforms } from "../RunTransforms";
import { Transformer } from "../Transformer";

export class VecLiteral extends Transformer {
    match(src: ASTElement) {
        return (src instanceof MacroCallExpression && src.source == "vec");
    }

    apply(src: MacroCallExpression, nearestScope: Scope, root: FunctionElement) {
        const type = src.args[0] as TypeElement;
        const vector_type = new TypeElement(
            src.source_location,
            new SimpleTypeElement(
                src.source_location,
                "lib.vec.Vec"
            ),
            [type]
        );
        const temp_local = new LocalDefinitionStatement(
            src.source_location,
            "__vec_" + src.uuid,
            vector_type,
            new ConstructorCallExpression(
                src.source_location,
                vector_type,
                []
            )
        );
        nearestScope.addType(vector_type.asTypeObject(), "__vec_" + src.uuid);
        RunElementTransforms(temp_local, root);

        const new_tree = new NameExpression(src.source_location, "__vec_" + src.uuid);
        RunElementTransforms(new_tree, root);

        new_tree.generator_metadata["requires"] ||= [];
        new_tree.generator_metadata["requires"].push(temp_local);

        src.args.slice(1).forEach(arg => {
            const push = new SimpleStatement(
                src.source_location,
                new FunctionCallExpression(
                    src.source_location,
                    new FieldReferenceExpression(
                        src.source_location,
                        new NameExpression(src.source_location, "__vec_" + src.uuid),
                        "push"
                    ),
                    [arg]
                )
            );
            RunElementTransforms(push, root);
            new_tree.generator_metadata["requires"].push(push);
        });
        return new_tree;
    }
}

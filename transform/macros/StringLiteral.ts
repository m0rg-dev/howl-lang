import { ASTElement } from "../../ast/ASTElement";
import { FFICallExpression } from "../../ast/expression/FFICallExpression";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { StringConstantExpression } from "../../ast/expression/StringConstantExpression";
import { FunctionElement } from "../../ast/FunctionElement";
import { TypeElement, SimpleTypeElement } from "../../ast/TypeElement";
import { ConcreteRawPointerType, ConcreteType } from "../../type_inference/ConcreteType";
import { Scope } from "../../type_inference/Scope";
import { RunElementTransforms } from "../RunTransforms";
import { Transformer } from "../Transformer";

export class StringLiteral extends Transformer {
    match(src: ASTElement) {
        return src instanceof StringConstantExpression && !src.generated;
    }

    apply(src: StringConstantExpression, _: Scope, root: FunctionElement) {
        src.resolved_type = new ConcreteRawPointerType(new ConcreteType("u8"));
        src.generated = true;
        let new_tree: ASTElement = new FunctionCallExpression(src.source_location,
            new FieldReferenceExpression(src.source_location,
                new TypeElement(src.source_location, new SimpleTypeElement(src.source_location, "lib.string.String"), []),
                "fromBytes"),
            [src, new FFICallExpression(src.source_location, "strlen", [src])]);
        RunElementTransforms(new_tree, root, (n) => new_tree = n);
        return new_tree;
    }
}
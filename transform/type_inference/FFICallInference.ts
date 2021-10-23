import { ASTElement } from "../../ast/ASTElement";
import { FFICallExpression } from "../../ast/expression/FFICallExpression";
import { ConcreteType } from "../../type_inference/ConcreteType";
import { Transformer } from "../Transformer";
import { SetExpressionType } from "./TIUtil";

export class FFICallInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof FFICallExpression;
    }

    apply(src: FFICallExpression) {
        SetExpressionType(src, new ConcreteType("any"));
        return src;
    }
}
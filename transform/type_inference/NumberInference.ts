import { ASTElement } from "../../ast/ASTElement";
import { NumberExpression } from "../../ast/expression/NumberExpression";
import { ConcreteType } from "../../type_inference/ConcreteType";
import { Transformer } from "../Transformer";
import { SetExpressionType } from "./TIUtil";

export class NumberInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof NumberExpression;
    }

    apply(src: NumberExpression) {
        SetExpressionType(src, new ConcreteType("i64"));
        return src;
    }
}
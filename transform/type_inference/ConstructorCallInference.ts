import { ASTElement } from "../../ast/ASTElement";
import { ConstructorCallExpression } from "../../ast/expression/ConstructorCallExpression";
import { Transformer } from "../Transformer";
import { MakeConcrete } from "./TIUtil";

export class ConstructorCallInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof ConstructorCallExpression;
    }

    apply(src: ConstructorCallExpression) {
        src.resolved_type = MakeConcrete(src.source.asTypeObject());
        return src;
    }
}
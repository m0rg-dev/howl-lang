import { ASTElement } from "../../ast/ASTElement";
import { NameExpression } from "../../ast/expression/NameExpression";
import { Scope } from "../../type_inference/Scope";
import { Transformer } from "../Transformer"
import { SetExpressionType } from "./TIUtil";

export class NameInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof NameExpression;
    }

    apply(src: NameExpression, nearestScope: Scope) {
        SetExpressionType(src, nearestScope.lookupName(src.name));
        return src;
    }
}
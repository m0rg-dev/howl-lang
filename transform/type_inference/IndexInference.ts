import { ASTElement } from "../../ast/ASTElement";
import { IndexExpression } from "../../ast/expression/IndexExpression";
import { EmitError } from "../../driver/Driver";
import { Errors } from "../../driver/Errors";
import { ConcreteRawPointerType } from "../../type_inference/ConcreteType";
import { Transformer } from "../Transformer";

export class IndexInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof IndexExpression;
    }

    apply(src: IndexExpression): ASTElement {
        if (src.source.resolved_type instanceof ConcreteRawPointerType) {
            src.resolved_type = src.source.resolved_type.source_type;
        } else {
            EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to index non-raw-pointer ${src.source} `, src.source_location);
        }
        return src;
    }
}
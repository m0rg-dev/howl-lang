import { ASTElement } from "../../ast/ASTElement";
import { ArithmeticExpression } from "../../ast/expression/ArithmeticExpression";
import { CastExpression } from "../../ast/expression/CastExpression";
import { EmitError, EmitLog } from "../../driver/Driver";
import { Errors } from "../../driver/Errors";
import { LogLevel } from "../../driver/Pass";
import { Transformer } from "../Transformer";
import { LowestCommonType, MakeConcrete } from "./TIUtil";

export class ArithmeticInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof ArithmeticExpression;
    }

    apply(src: ArithmeticExpression) {
        const common_type = LowestCommonType(src.lhs.resolved_type, src.rhs.resolved_type);
        if (!common_type) {
            EmitLog(LogLevel.TRACE, `ArithmeticInference`, `lhs: ${src.lhs} `);
            EmitLog(LogLevel.TRACE, `ArithmeticInference`, `rhs: ${src.rhs} `);
            EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to perform arithmetic on expressions of incompatible types ${src.lhs.resolved_type} and ${src.rhs.resolved_type} `, src.source_location);
        }
        if (!src.rhs.resolved_type.equals(common_type)) {
            src.rhs = CastExpression.fromExpression(src.rhs, common_type);
        }
        if (!src.lhs.resolved_type.equals(common_type)) {
            src.lhs = CastExpression.fromExpression(src.lhs, common_type);
        }
        src.resolved_type = MakeConcrete(common_type);
        return src;
    }
}
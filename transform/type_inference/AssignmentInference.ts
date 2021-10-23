import { ASTElement } from "../../ast/ASTElement";
import { CastExpression } from "../../ast/expression/CastExpression";
import { AssignmentStatement } from "../../ast/statement/AssignmentStatement";
import { EmitError, EmitLog } from "../../driver/Driver";
import { Errors } from "../../driver/Errors";
import { LogLevel } from "../../driver/Pass";
import { Transformer } from "../Transformer";
import { LowestCommonType } from "./TIUtil";

export class AssignmentInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof AssignmentStatement;
    }

    apply(src: AssignmentStatement<any, any>) {
        const common_type = LowestCommonType(src.lhs.resolved_type, src.rhs.resolved_type);
        if (!common_type) {
            EmitLog(LogLevel.TRACE, `AssignmentInference`, `lhs: ${src.lhs}`);
            EmitLog(LogLevel.TRACE, `AssignmentInference`, `rhs: ${src.rhs}`);
            EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to assign an expression of type ${src.rhs.resolved_type} to a location of type ${src.lhs.resolved_type}`, src.source_location);
        }
        if (!src.rhs.resolved_type.equals(common_type)) {
            src.rhs = CastExpression.fromExpression(src.rhs, common_type);
        }
        if (!src.lhs.resolved_type.equals(common_type)) {
            src.lhs = CastExpression.fromExpression(src.lhs, common_type);
        }
        return src;
    }
}
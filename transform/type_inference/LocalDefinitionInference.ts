import { ASTElement } from "../../ast/ASTElement";
import { CastExpression } from "../../ast/expression/CastExpression";
import { LocalDefinitionStatement } from "../../ast/statement/LocalDefinitionStatement";
import { EmitError, EmitLog } from "../../driver/Driver";
import { Errors } from "../../driver/Errors";
import { LogLevel } from "../../driver/Pass";
import { Transformer } from "../Transformer";
import { LowestCommonType, MakeConcrete } from "./TIUtil";

export class LocalDefinitionInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof LocalDefinitionStatement;
    }

    apply(src: LocalDefinitionStatement) {
        const common_type = LowestCommonType(MakeConcrete(src.type.asTypeObject()), src.initializer.resolved_type);
        if (!common_type) {
            EmitLog(LogLevel.TRACE, `LocalDefinitionInference`, `source: ${src.type.asTypeObject()} ${MakeConcrete(src.type.asTypeObject())
                } `);
            EmitLog(LogLevel.TRACE, `LocalDefinitionInference`, `initializer: ${src.initializer.resolved_type} `);
            EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to initialize a variable of type ${src.type.asTypeObject()} with an expression of type ${src.initializer.resolved_type}`, src.source_location);
        }
        if (!src.initializer.resolved_type.equals(common_type)) {
            src.initializer = CastExpression.fromExpression(src.initializer, common_type);
        }
        return src;
    }
}
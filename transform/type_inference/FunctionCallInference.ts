import { ASTElement } from "../../ast/ASTElement";
import { CastExpression } from "../../ast/expression/CastExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { EmitError, EmitLog } from "../../driver/Driver";
import { Errors } from "../../driver/Errors";
import { LogLevel } from "../../driver/Pass";
import { FunctionType } from "../../type_inference/FunctionType";
import { Transformer } from "../Transformer";
import { LowestCommonType, MakeConcrete } from "./TIUtil";

export class FunctionCallInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof FunctionCallExpression;
    }

    apply(src: FunctionCallExpression<any>) {
        if (src.source.resolved_type instanceof FunctionType) {
            src.resolved_type = MakeConcrete(src.source.resolved_type.return_type);
            let arg_offset = 1;
            if ((src.source.resolved_type as FunctionType).is_static) {
                arg_offset = 0;
            }
            src.args.slice(arg_offset).forEach((arg, index) => {
                EmitLog(LogLevel.TRACE, `FunctionCallInference`, `${index} ${(src.source.resolved_type as FunctionType).args[index]}`);
                const common_type = LowestCommonType(MakeConcrete((src.source.resolved_type as FunctionType).args[index]), arg.resolved_type);
                if (!common_type) {
                    EmitError(arg.source_location[0], Errors.TYPE_MISMATCH, `Attempt to use argument of type ${arg.resolved_type} as argument to function expecting ${(src.source.resolved_type as FunctionType).args[index]} `, arg.source_location);
                }
                if (!arg.resolved_type.equals(common_type)) {
                    src.args[index + arg_offset] = CastExpression.fromExpression(arg, common_type);
                }
            });
        } else {
            EmitError(src.source.source_location[0], Errors.TYPE_MISMATCH, `Attempt to call non-function of type ${src.source.resolved_type}`, src.source.source_location);
        }
        return src;
    }
}
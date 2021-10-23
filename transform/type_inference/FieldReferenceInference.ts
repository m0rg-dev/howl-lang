import { ASTElement } from "../../ast/ASTElement";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { EmitError, EmitLog } from "../../driver/Driver";
import { Errors } from "../../driver/Errors";
import { LogLevel } from "../../driver/Pass";
import { Classes } from "../../registry/Registry";
import { StaticTableType } from "../../type_inference/StructureType";
import { Transformer } from "../Transformer";
import { MakeConcrete, SetExpressionType } from "./TIUtil";

export class FieldReferenceInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof FieldReferenceExpression;
    }

    apply(src: FieldReferenceExpression) {
        if (src.source.resolved_type instanceof StaticTableType) {
            const field_type = MakeConcrete(src.source.resolved_type.fields.get(src.name));
            if (field_type) {
                SetExpressionType(src, field_type);
            } else {
                EmitError(src.source_location[0], Errors.NO_SUCH_FIELD, `No such static member '${src.name}' on ${src.source.resolved_type.name}`, src.source_location);
            }
        } else if (Classes.has(src.source.resolved_type?.name)) {
            const field_type = Classes.get(src.source.resolved_type.name).type().getFieldType(src.name);
            if (field_type) {
                SetExpressionType(src, field_type);
            } else {
                EmitError(src.source_location[0], Errors.NO_SUCH_FIELD, `No such field '${src.name}' on ${src.source.resolved_type.name}`, src.source_location);
                EmitLog(LogLevel.TRACE, `FieldReferenceInference`, "valid fields are:");
                Classes.get(src.source.resolved_type.name).type()["fields"].forEach((v, k) => {
                    EmitLog(LogLevel.TRACE, `FieldReferenceInference`, `  ${k} => ${v}`);
                })
            }
        } else {
            EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to access field ${src.name} on expression of non-class type ${src.source.resolved_type}`, src.source_location);
        }
        return src;
    }
}
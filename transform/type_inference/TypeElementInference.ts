import { ASTElement } from "../../ast/ASTElement";
import { TypeElement } from "../../ast/TypeElement";
import { EmitError } from "../../driver/Driver";
import { Errors } from "../../driver/Errors";
import { Classes } from "../../registry/Registry";
import { StructureType, StaticTableType } from "../../type_inference/StructureType";
import { Transformer } from "../Transformer";

export class TypeElementInference extends Transformer {
    match(src: ASTElement) {
        return src instanceof TypeElement;
    }

    apply(src: TypeElement) {
        const t = src.asTypeObject();
        if (t instanceof StructureType) {
            src.resolved_type = new StaticTableType(Classes.get(t.name));
        } else {
            EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Non-classes (such as ${t}) may not be used as type literals`, src.source_location);
        }
        return src;
    }
}
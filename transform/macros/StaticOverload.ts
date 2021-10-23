import { ASTElement } from "../../ast/ASTElement";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { FunctionElement } from "../../ast/FunctionElement";
import { Classes } from "../../registry/Registry";
import { FunctionType } from "../../type_inference/FunctionType";
import { Scope } from "../../type_inference/Scope";
import { StaticTableType } from "../../type_inference/StructureType";
import { RunElementTransforms } from "../RunTransforms";
import { Transformer } from "../Transformer";
import { CheckTypeCompatibility } from "../type_inference/TIUtil";

export class StaticOverload extends Transformer {
    match(src: ASTElement) {
        return src instanceof FunctionCallExpression
            && src.source instanceof FieldReferenceExpression
            && src.source.source.resolved_type instanceof StaticTableType
            && Classes.has(src.source.source.resolved_type.original_name)
            && Classes.get(src.source.source.resolved_type.original_name).methods_overloaded.has(src.source.name);
    }

    apply(src: FunctionCallExpression<FieldReferenceExpression>, _: Scope, root: FunctionElement) {
        const cl = Classes.get((src.source.source.resolved_type as StaticTableType).original_name);
        const candidates = cl.overload_sets.get(src.source.name);
        for (const candidate of candidates) {
            const candidate_type = cl.type().getFieldType(candidate.split(".").pop());
            if (candidate_type instanceof FunctionType
                && candidate_type.args.length == src.args.length
                && candidate_type.args.every((arg_type, index) => src.args[index] && CheckTypeCompatibility(arg_type, src.args[index].resolved_type))) {
                (src.source as FieldReferenceExpression).name = candidate.split(".").pop();
                break;
            }
        }
        RunElementTransforms(src.source, root);
        return src;
    }

}
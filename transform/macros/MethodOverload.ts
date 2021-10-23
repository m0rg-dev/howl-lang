import { Transform } from "stream";
import { ASTElement } from "../../ast/ASTElement";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { FunctionElement } from "../../ast/FunctionElement";
import { Classes } from "../../registry/Registry";
import { FunctionType } from "../../type_inference/FunctionType";
import { Scope } from "../../type_inference/Scope";
import { RunElementTransforms } from "../RunTransforms";
import { CheckTypeCompatibility } from "../type_inference/TIUtil";

export class MethodOverload extends Transform {
    match(src: ASTElement) {
        return src instanceof FunctionCallExpression
            && src.source instanceof FieldReferenceExpression
            && Classes.has(src.source.source.resolved_type.name)
            && Classes.get(src.source.source.resolved_type.name).methods_overloaded.has(src.source.name);
    }

    apply(src: FunctionCallExpression<FieldReferenceExpression>, _: Scope, root: FunctionElement): ASTElement {
        const cl = Classes.get(src.source.source.resolved_type.name);
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
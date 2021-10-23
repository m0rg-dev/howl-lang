import { ASTElement } from "../../ast/ASTElement";
import { ArithmeticExpression } from "../../ast/expression/ArithmeticExpression";
import { FieldReferenceExpression } from "../../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../../ast/expression/FunctionCallExpression";
import { FunctionElement } from "../../ast/FunctionElement";
import { Classes, RegisterTransformer } from "../../registry/Registry";
import { Scope } from "../../type_inference/Scope";
import { RunElementTransforms } from "../RunTransforms";
import { Transformer } from "../Transformer";

export class ArithmeticOverload extends Transformer {
    what: string;
    method: string;

    constructor(what: string, method: string) {
        super();
        this.what = what;
        this.method = method;
    }

    match(src: ASTElement) {
        return src instanceof ArithmeticExpression
            && src.what == this.what
            && Classes.has(src.lhs.resolved_type?.name)
            && Classes.get(src.lhs.resolved_type.name).methods.some(x => x.name == this.method);
    }

    apply(src: ArithmeticExpression, _: Scope, root: FunctionElement) {
        let new_tree: ASTElement = new FunctionCallExpression(src.source_location,
            new FieldReferenceExpression(src.source_location, src.lhs, this.method), [src.rhs]);
        RunElementTransforms(new_tree, root, (n) => new_tree = n);
        return new_tree;
    }
}

export function RegisterArithmeticOverloads() {
    RegisterTransformer(new ArithmeticOverload("+", "__add__"));
    RegisterTransformer(new ArithmeticOverload("-", "__subtract__"));
    RegisterTransformer(new ArithmeticOverload("*", "__multiply__"));
    RegisterTransformer(new ArithmeticOverload("/", "__divide__"));
}
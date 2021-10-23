import { ExpressionElement } from "../../ast/ExpressionElement";
import { EmitLog } from "../../driver/Driver";
import { LogLevel } from "../../driver/Pass";
import { Classes, RegisterTransformer } from "../../registry/Registry";
import { ConcreteType, ConcreteRawPointerType } from "../../type_inference/ConcreteType";
import { StructureType } from "../../type_inference/StructureType";
import { RawPointerType, Type } from "../../type_inference/Type";
import { ArithmeticInference } from "./ArithmeticInference";
import { AssignmentInference } from "./AssignmentInference";
import { ConstructorCallInference } from "./ConstructorCallInference";
import { FFICallInference } from "./FFICallInference";
import { FieldReferenceInference } from "./FieldReferenceInference";
import { FunctionCallInference } from "./FunctionCallInference";
import { IndexInference } from "./IndexInference";
import { LocalDefinitionInference } from "./LocalDefinitionInference";
import { NameInference } from "./NameInference";
import { NumberInference } from "./NumberInference";
import { TypeElementInference } from "./TypeElementInference";

export function RegisterTITransformers() {
    RegisterTransformer(new NameInference());
    RegisterTransformer(new NumberInference());
    RegisterTransformer(new FieldReferenceInference());
    RegisterTransformer(new AssignmentInference());
    RegisterTransformer(new LocalDefinitionInference());
    RegisterTransformer(new FFICallInference());
    RegisterTransformer(new IndexInference());
    RegisterTransformer(new ArithmeticInference());
    RegisterTransformer(new FunctionCallInference());
    RegisterTransformer(new ConstructorCallInference());
    RegisterTransformer(new TypeElementInference());
}

export function SetExpressionType(exp: ExpressionElement, t: Type) {
    exp.resolved_type = MakeConcrete(t);
}


export function MakeConcrete(t: Type): ConcreteType {
    if (t instanceof ConcreteType) {
        return t;
    }

    if (t instanceof StructureType && t.isMonomorphizable()) {
        return t.Monomorphize();
    }

    if (t instanceof RawPointerType) {
        const sub = MakeConcrete(t.source);
        if (sub) {
            return new ConcreteRawPointerType(sub);
        }
    }

    EmitLog(LogLevel.ERROR, `makeConcrete`, `COMPILER BUG: Don't know how to makeConcrete on ${t} (${t?.constructor.name})`);
    EmitLog(LogLevel.ERROR, `setExpressionType`, `${(new Error()).stack}`);
    process.exit(1);
}

export function LowestCommonType(a: Type, b: Type): Type {
    if (!(a instanceof ConcreteType)) {
        EmitLog(LogLevel.ERROR, `setExpressionType`, `COMPILER BUG: lowestCommonType called with non-ConcreteType ${a}`);
        EmitLog(LogLevel.ERROR, `setExpressionType`, `${(new Error()).stack}`);
        process.exit(1);
    }

    if (!(b instanceof ConcreteType)) {
        EmitLog(LogLevel.ERROR, `setExpressionType`, `COMPILER BUG: lowestCommonType called with non-ConcreteType ${b}`);
        EmitLog(LogLevel.ERROR, `setExpressionType`, `${(new Error()).stack}`);
        process.exit(1);
    }

    if (a.name == "any") return b;
    if (b.name == "any") return a;

    if (a.equals(b)) return a;
    if (a.name.match(/^[iu](8|16|32|64)$/) && b.name.match(/^[iu](8|16|32|64)$/)) {
        // TODO sign
        const ba = Number.parseInt(a.name.substr(1));
        const bb = Number.parseInt(b.name.substr(1));
        const target = Math.min(ba, bb);
        return new ConcreteType(a.name.charAt(0) + target.toString());
    }

    if (Classes.has(a.name) && Classes.get(a.name).hierarchyIncludes(b.name)) return b;
    if (Classes.has(b.name) && Classes.get(b.name).hierarchyIncludes(a.name)) return a;

    return undefined;
}

export function CheckTypeCompatibility(a: Type, b: Type): boolean {
    return !!LowestCommonType(MakeConcrete(a), MakeConcrete(b));
}

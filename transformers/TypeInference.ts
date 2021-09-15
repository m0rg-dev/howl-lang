import { ExactConstraint, FromScopeConstraint, OutgoingConstraint, PortIntersectionConstraint, ReturnTypeConstraint, UnionConstraint } from "../typemath/Signature";
import { ASTElement } from "../unified_parser/ASTElement";
import { FieldReferenceExpression } from "../unified_parser/FieldReferenceExpression";
import { FunctionCallExpression } from "../unified_parser/FunctionCallExpression";
import { TypeLiteral } from "../unified_parser/Parser";
import { RawPointerIndexExpression } from "../unified_parser/RawPointerIndexExpression";
import { ClassType, FunctionType, RawPointerType } from "../unified_parser/TypeObject";
import { UnaryReturnExpression } from "../unified_parser/UnaryReturnExpression";
import { VariableReferenceExpression } from "../unified_parser/VariableReferenceExpression";
import { ReferenceLocals, Transformer } from "./Transformer";

export const Infer: Transformer = (element: ASTElement, replace: (_: any) => void) => {
    let rc = false;
    rc ||= ImportLocals(element, replace);
    rc ||= ApplyPortIntersections(element, replace);
    rc ||= ExportOutgoing(element, replace);
    rc ||= ReferenceFields(element, replace);
    rc ||= IndexRawPointers(element, replace);
    rc ||= PropagateFunctionType(element, replace);
    rc ||= AddSelfToMethodCalls(element, replace);
    rc ||= ConvertStaticReferences(element, replace);
    rc ||= IndirectMethodReferences(element, replace);
    rc ||= CollapseSingleValuedUnions(element, replace);
    //rc ||= FreezeTypes(element, replace);
    return rc;
}

export const ImportLocals: Transformer = (element: ASTElement) => {
    let rc = false;
    element.signature.type_constraints.forEach((x, y) => {
        if (x instanceof FromScopeConstraint) {
            const n = new ExactConstraint(x.port, element.findName(x.scope_name));
            console.error(`[ImportLocals] ${element}: <${x}> => <${n}>`);
            element.signature.type_constraints.set(x.port, n);
            rc = true;
        } else if (x instanceof ReturnTypeConstraint && element.getReturnType()) {
            const n = new ExactConstraint("value", element.getReturnType());
            console.error(`[ImportLocals] ${element}: <${x}> => <${n}>`);
            element.signature.type_constraints.set("value", n);
            rc = true;
        }
    })
    return rc;
}

export const ApplyPortIntersections: Transformer = (element: ASTElement) => {
    let rc = false;
    element.signature.port_constraints.forEach(x => {
        if (x instanceof PortIntersectionConstraint) {
            const obj0 = x.p0 == "value" ? element : element[x.p0] as ASTElement;
            const obj1 = x.p1 == "value" ? element : element[x.p1] as ASTElement;

            const con0 = obj0.signature.type_constraints.get("value");
            if (!con0) return;
            const con1 = obj1.signature.type_constraints.get("value");
            if (!con1) return;

            if (con0.toString() == con1.toString()) return;

            const int = con0.intersect(con1);

            if (int.toString() == con0.toString() && int.toString() == con1.toString()) return;

            console.error(`[ApplyPortIntersections] ${obj0}: <${con0}> => <${int}>`);
            console.error(`[ApplyPortIntersections] ${obj1}: <${con1}> => <${int}>`);

            obj0.signature.type_constraints.set("value", int);
            obj1.signature.type_constraints.set("value", int);
            rc = true;
        }
    });
    return rc;
}

export const ExportOutgoing: Transformer = (element: ASTElement) => {
    let rc = false;
    element.signature.port_constraints.forEach((x, y) => {
        if (x instanceof OutgoingConstraint) {
            const obj = element[x.port] as ASTElement;
            const old = obj.signature.type_constraints.get("value");
            if (!old) return;
            if (old instanceof FromScopeConstraint) return;

            element.signature.port_constraints.splice(y, 1);

            const n = old.intersect(x.sub);
            console.error(`[ExportOutgoing] ${element} -> ${obj}: <${old}> => <${n}>`);
            obj.signature.type_constraints.set("value", n);
            rc = true;
        }
    });
    return rc;
}

export const ReferenceFields: Transformer = (element: ASTElement) => {
    let rc = false;
    if (element instanceof FieldReferenceExpression && !element.computed_type && element.source.singleValueType()) {
        const old = element.signature.type_constraints.get("value");
        const ct = element.source.singleValueType() as ClassType;

        let field_type = ct.source.fields.find(x => x.name == element.field)?.field_type;
        if (!field_type) {
            field_type = ct.source.methods.find(x => x.name == element.field)?.singleValueType();
        }
        if (!field_type) {
            throw new Error(`Can't find field ${element.field} on ${element}!`);
        }
        const n = old.intersect(new ExactConstraint("value", field_type));

        if (old.toString() == n.toString()) return;
        console.error(`[ReferenceFields] ${element}: <${old}> => <${n}>`);
        element.signature.type_constraints.set("value", n);
        rc = true;
    }

    return rc;
}

export const IndexRawPointers: Transformer = (element: ASTElement) => {
    let rc = false;
    if (element instanceof RawPointerIndexExpression && !element.computed_type && element.source.singleValueType()) {
        const old = element.signature.type_constraints.get("value");
        const ct = element.source.singleValueType() as RawPointerType;

        const n = old.intersect(new ExactConstraint("value", ct.subtype));

        if (old.toString() == n.toString()) return;
        console.error(`[IndexRawPointers] ${element}: <${old}> => <${n}>`);
        element.signature.type_constraints.set("value", n);
        rc = true;
    }

    return rc;
}


export const PropagateFunctionType: Transformer = (element: ASTElement) => {
    let rc = false;
    if (element instanceof FunctionCallExpression && element.source.singleValueType()) {
        const old = element.signature.type_constraints.get("value");
        const ft = (element.source.singleValueType() as FunctionType);
        const n = old.intersect(new ExactConstraint("value", ft.rc));

        if (old.toString() == n.toString()) return;
        console.error(`[PropagateFunctionType] ${element} value: <${old}> => <${n}>`);
        ft.args.forEach((x, y) => {
            const outgoing = new OutgoingConstraint(`arg${y}`, new ExactConstraint("value", x));
            console.error(`[PropagateFunctionType] ${element}: ${outgoing}`);
            element.signature.port_constraints.push(outgoing);
        })
        element.signature.type_constraints.set("value", n);
        rc = true;
    }

    return rc;
}

export const AddSelfToMethodCalls: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FunctionCallExpression
        && element.source instanceof FieldReferenceExpression
        && element.source.source.singleValueType() instanceof ClassType
        && !element.self_added) {
        const ct = element.source.source.singleValueType() as ClassType;
        if(ct.source.is_stable) return;

        console.error(`[AddSelfToMethodCalls] ${element}`);
        element.args.unshift(element.source.source);
        element.self_added = true;
        return true;
    }
}


export const IndirectMethodReferences: Transformer = (element: ASTElement) => {
    if (element instanceof FunctionCallExpression
        && element.source instanceof FieldReferenceExpression
        && element.source.source.singleValueType() instanceof ClassType) {
        const ct = element.source.source.singleValueType() as ClassType;
        if (ct.source.is_stable) return;
        const src = element.source.source;
        const method = element.source.field;

        console.error(`[IndirectMethodReferences] ${element.source}`);
        element.source = new FieldReferenceExpression(element, new FieldReferenceExpression(element, src, "__stable"), method);
        return true;
    }
}

export const ConvertStaticReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof TypeLiteral
        && element.field_type instanceof ClassType) {
        console.error(`[ConvertStaticReferences] ${element}`);
        replace(new VariableReferenceExpression(element.parent, `__${element.field_type.source.name}_stable`));
        return true;
    }
    return false;
}

export const CollapseSingleValuedUnions: Transformer = (element: ASTElement) => {
    if (element.signature.type_constraints.get("value") instanceof UnionConstraint
        && (element.signature.type_constraints.get("value") as UnionConstraint).t.length == 1) {
        console.error(`[CollapseSingleValuedUnions] ${element}`);
        element.signature.type_constraints.set("value", new ExactConstraint("value", (element.signature.type_constraints.get("value") as UnionConstraint).t[0]));
        return true;
    }
    return false;
}

export const FreezeTypes: Transformer = (element: ASTElement) => {
    let rc = false;
    if (element.signature.type_constraints.has("value")
        && element.signature.type_constraints.get("value") instanceof ExactConstraint) {
        element.computed_type = (element.signature.type_constraints.get("value") as ExactConstraint).t;
        element.signature.type_constraints.delete("value");
        console.error(`[FreezeTypes] ${element} is ${element.computed_type}`);
        rc = true;
    }
    return rc;
}

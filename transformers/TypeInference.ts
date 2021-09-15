import { AllConstraint, ExactConstraint, FieldReferenceConstraint, FromScopeConstraint, PortIntersectionConstraint, ReturnTypeConstraint, TypeConstraint } from "../typemath/Signature";
import { nextConstraintName, Specifiable } from "../typemath/Specifiable";
import { AssignmentExpression } from "../unified_parser/AssignmentExpression";
import { ASTElement } from "../unified_parser/ASTElement";
import { FieldReferenceExpression } from "../unified_parser/FieldReferenceExpression";
import { ClassType, TemplateType, TupleType } from "../unified_parser/TypeObject";
import { UnaryReturnExpression } from "../unified_parser/UnaryReturnExpression";
import { Transformer } from "./Transformer";

function importConstraint(c: TypeConstraint, temp: Specifiable): string {
    const n = nextConstraintName();
    if (c instanceof ExactConstraint && c.t instanceof ClassType) {
        const t = c.t.source.generic_fields.map(x => {
            const n2 = nextConstraintName();
            temp.addConstraint(n2, new AllConstraint());
            return temp.getTarget(n2);
        });
        const n3 = nextConstraintName();
        temp.addConstraint(n3, c);
        const tuple = new TupleType([temp.getTarget(n3), ...t]);
        temp.addConstraint(n, new ExactConstraint(tuple));
    } else {
        temp.addConstraint(n, c);
    }
    return n;
}

export const LiftConstraints: Transformer = (element: ASTElement) => {
    const temp = element.mostLocalTemplate();

    if (element.hasOwnScope) {
        element.scope.locals.forEach((v, k) => {
            element.scope.locals.set(k, new ExactConstraint(temp.getTarget(importConstraint(v, temp))));
        });
    }

    if (!element.value_constraint) return;
    if (element.computed_type) return;
    if (!temp) return;
    element.computed_type = temp.getTarget(importConstraint(element.value_constraint, temp));

    return true;
}

export const LiftBounds: Transformer = (element: ASTElement) => {
    if (element instanceof AssignmentExpression) {
        const t0 = element.lhs.computed_type as TemplateType;
        const t1 = element.rhs.computed_type as TemplateType;
        if (!t0 || !t1) return;

        const temp = element.mostLocalTemplate();
        if (!temp) return;

        console.error(`[LiftBounds] ${t0} x ${t1}`);
        temp.addBound(new PortIntersectionConstraint(
            t0.getName(),
            t1.getName()
        ));
    }
    return true;
}

export const LiftReturns: Transformer = (element: ASTElement) => {
    if (element instanceof UnaryReturnExpression) {
        const t = element.source.computed_type as TemplateType;
        const temp = element.mostLocalTemplate();
        if (!temp) return;
        console.error(`[LiftReturns] ${t}`);
        const n = nextConstraintName();
        temp.addConstraint(n, new ReturnTypeConstraint(element));
        temp.addBound(new PortIntersectionConstraint(n, t.getName()));
    }
    return true;
}

export const LiftFieldReferences: Transformer = (element: ASTElement) => {
    if (element instanceof FieldReferenceExpression) {
        const t = element.source.computed_type as TemplateType;
        const temp = element.mostLocalTemplate();
        if (!temp) return;
        console.error(`[LiftFieldReferences] ${t}.${element.field}`);
        const n = nextConstraintName();
        temp.addConstraint(n, new FieldReferenceConstraint(element.source.computed_type, element.field));
        element.computed_type = temp.getTarget(n);
    }
    return true;
}

export function Infer(source: ASTElement & Specifiable): boolean {
    let rc = false;
    rc ||= ImportLocals(source);
    rc ||= DestructureTupleIntersections(source);
    rc ||= ReferenceFields(source);
    rc ||= Propagate(source);
    rc ||= ApplyIntersections(source);
    rc ||= FreezeTypes(source);
    return rc;
}

function ImportLocals(source: ASTElement & Specifiable): boolean {
    let rc = false;
    source.getAllPorts().forEach(x => {
        const c = source.getConstraint(x);
        if (c instanceof FromScopeConstraint) {
            const t = c.scope.findName(c.scope_name);
            source.replaceConstraint(x, t);
            console.error(`[ImportLocals] ${source}: ${x} => ${t}`);
            rc = true;
        } else if (c instanceof ReturnTypeConstraint) {
            const t = c.scope.getReturnType();
            source.replaceConstraint(x, t);
            console.error(`[ImportLocals] ${source}: ${x} => ${t}`);
            rc = true;
        }
    });
    return rc;
}

function DestructureTupleIntersections(source: ASTElement & Specifiable): boolean {
    let rc = false;
    const b = source.getAllBounds();
    b.forEach((x, y) => {
        if (x instanceof PortIntersectionConstraint) {
            const con0 = source.getConstraint(x.p0);
            const con1 = source.getConstraint(x.p1);
            if (!con0 || !con1) return;
            if (!(con0 instanceof ExactConstraint) || !(con1 instanceof ExactConstraint)) return;
            if (!(con0.t instanceof TupleType) || !(con1.t instanceof TupleType)) return;

            console.error(`[DestructureTupleIntersections] ${x} (${con0}, ${con1})`);
            b.splice(y, 1);

            con0.t.subtypes.forEach((x, y) => {
                source.addBound(new PortIntersectionConstraint(
                    (x as TemplateType).getName(),
                    ((con1.t as TupleType).subtypes[y] as TemplateType).getName(),
                ));
            });

            rc = true;
        }
    });
    return rc;
}

function ApplyIntersections(source: ASTElement & Specifiable): boolean {
    let rc = false;
    const b = source.getAllBounds();
    b.forEach((x, y) => {
        if (x instanceof PortIntersectionConstraint) {
            const con0 = source.getConstraint(x.p0);
            const con1 = source.getConstraint(x.p1);
            if (!con0 || !con1) {
                console.error(`[ApplyIntersections] Removing ${x} (${con0} ${con1})`);
                b.splice(y, 1);
                return;
            }
            if (!con0.canIntersect() || !con1.canIntersect()) return;
            b.splice(y, 1);

            const int = con0.intersect(con1);

            console.error(`[ApplyIntersections] ${x} (${con0}, ${con1}) => ${int}`);

            source.replaceConstraint(x.p0, int);
            source.merge(x.p0, x.p1);
            rc = true;
        }
    })
    return rc;
}

function ReferenceFields(source: ASTElement & Specifiable): boolean {
    let rc = false;
    source.getAllPorts().forEach(x => {
        const c = source.getConstraint(x);
        if (c instanceof FieldReferenceConstraint
            && c.source instanceof TemplateType) {
            const t = source.getConstraint(c.source.getName());
            if (!(t instanceof ExactConstraint
                && t.t instanceof TupleType)) return;
            const tuple = t.t;
            if (tuple.subtypes[0] instanceof TemplateType) {
                const t2 = source.getConstraint(tuple.subtypes[0].getName());
                if (!(t2 instanceof ExactConstraint && t2.t instanceof ClassType)) return;
                const n = new ExactConstraint(t2.t.source.fieldType(c.field_name, tuple.subtypes.slice(1)));
                console.error(`[ReferenceFields] ${c} ${x} ${c.field_name} => ${n}`);
                source.replaceConstraint(x, n);
                rc = true;
            }
        }
    });
    return rc;
}

function Propagate(source: ASTElement & Specifiable): boolean {
    let rc = false;
    source.getAllPorts().forEach(x => {
        const t = source.getTarget(x);
        const n = source.getConstraint(t.getName());
        if (n instanceof ExactConstraint
            && n.t instanceof TemplateType) {
            console.error(`[Propagate] ${t} => ${n}`);
            source.merge(n.t.getName(), x);
            rc = true;
        }
    });
    return rc;
}

export function FreezeTypes(source: ASTElement & Specifiable): boolean {
    let rc = false;
    source.getAllPorts().forEach(x => {
        const t = source.getTarget(x);
        const c = source.getConstraint(t.getName());
        if (c instanceof ExactConstraint) {
            t.resolve(c.t);
            console.error(`[FreezeTypes] ${x} => ${c.t}`);
            source.removeConstraint(x);
            rc = true;
        }
    });
    return rc;
}

// ------
/*
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
            let obj = element[x.port] as ASTElement;
            if (!obj && x.port.startsWith("arg")) {
                obj = element["args"][x.port.substr(3)];
            }
            const old = obj.signature.type_constraints.get("value");
            if (!old) return;
            if (old instanceof FromScopeConstraint) return;

            element.signature.port_constraints.splice(y, 1);

            const n = old.intersect(x.sub);
            console.error(`[ExportOutgoing] ${element} -> ${obj} (${x.port}): <${old}> => <${n}>`);
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
        const ft = (element.source.singleValueType() as FunctionType);
        if (!element.args_generated) {
            ft.args.forEach((x, y) => {
                const outgoing = new OutgoingConstraint(`arg${y}`, new ExactConstraint("value", x));
                console.error(`[PropagateFunctionType] ${element}: ${outgoing}`);
                element.signature.port_constraints.push(outgoing);
            });
            element.args_generated = true;
        }
        const old = element.signature.type_constraints.get("value");

        const n = old.intersect(new ExactConstraint("value", ft.rc));

        if (old.toString() == n.toString()) return;
        console.error(`[PropagateFunctionType] ${element} value: <${old}> => <${n}>`);
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
        if (ct.source.is_stable) return;

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

export const WrapStringConstants: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof StringLiteralExpression && !element.wrapped) {
        replace(new FunctionCallExpression(element.parent,
            new FieldReferenceExpression(element.parent,
                new VariableReferenceExpression(element.parent, "__String_stable"),
                "fromBytes"),
            [element, new NumericLiteralExpression(element.parent, element.value.length)]));
        console.error(`[WrapStringConstants] ${element}`);
        element.walk(FixHierarchy, replace);
        element.wrapped = true;
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
*/
import { ExactConstraint, FromScopeConstraint, IntersectionConstraint, TypeConstraint } from "../typemath/Signature";
import { ASTElement } from "../unified_parser/ASTElement";
import { Transformer } from "./Transformer";

export const ImportLocals: Transformer = (element: ASTElement) => {
    let rc = false;
    element.signature.port_constraints.forEach((x, y) => {
        if(x instanceof FromScopeConstraint) {
            const n = new ExactConstraint(x.port, element.findName(x.scope_name));
            console.error(`[ImportLocals] ${element}: <${x}> => <${n}>`);
            element.signature.type_constraints.set(x.port, n);
            element.signature.port_constraints.splice(y, 1);
            rc = true;
        }
    })
    return rc;
}

export const ApplyIntersections: Transformer = (element: ASTElement) => {
    let rc = false;
    element.signature.port_constraints.forEach(x => {
        if(x instanceof IntersectionConstraint) {
            const obj0 = element[x.p0] as ASTElement;
            const obj1 = element[x.p1] as ASTElement;

            const con0 = obj0.signature.type_constraints.get("value");
            if(!con0) return;
            const con1 = obj1.signature.type_constraints.get("value");
            if(!con1) return;

            if(con0.toString() == con1.toString()) return;

            const int = con0.intersect(con1);

            if(int.toString() == con0.toString() && int.toString() == con1.toString()) return;

            console.error(`[ApplyIntersections] ${obj0}: <${con0}> => <${int}>`);
            console.error(`[ApplyIntersections] ${obj1}: <${con1}> => <${int}>`);

            obj0.signature.type_constraints.set("value", int);
            obj1.signature.type_constraints.set("value", int);
            rc = true;
        }
    });
    return rc;
}
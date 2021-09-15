import { StaticFunctionRegistry } from "../registry/StaticVariableRegistry";
import { TypeRegistry } from "../registry/TypeRegistry";
import { AssignmentExpression } from "../unified_parser/AssignmentExpression";
import { AssignmentStatement } from "../unified_parser/AssignmentStatement";
import { ASTElement } from "../unified_parser/ASTElement";
import { FieldReferenceExpression } from "../unified_parser/FieldReferenceExpression";
import { FunctionCallExpression } from "../unified_parser/FunctionCallExpression";
import { MethodReferenceExpression } from "../unified_parser/MethodReferenceExpression";
import { ElidedElement, LocalDefinition, NameExpression } from "../unified_parser/Parser";
import { SimpleStatement } from "../unified_parser/SimpleStatement";
import { ClassType } from "../unified_parser/TypeObject";
import { UnaryReturnExpression } from "../unified_parser/UnaryReturnExpression";
import { UnaryReturnStatement } from "../unified_parser/UnaryReturnStatement";
import { VariableReferenceExpression } from "../unified_parser/VariableReferenceExpression";

export type Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent?: ASTElement) => boolean;

export function ApplyToAll(t: Transformer): boolean {
    let did_apply = false;

    let u = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
        let rc = t(element, replace, parent);
        if (rc) did_apply = true;
        return rc;
    }

    // console.error(`Applying transformer ${t.name}`);
    for (const [name, type] of TypeRegistry) {
        if (type instanceof ClassType) {
            type.source.walk(u, (n: ASTElement) => { });
        }
    }

    for (const [name, func] of StaticFunctionRegistry) {
        func.walk(u, (n: ASTElement) => { });
    }
    return did_apply;
}

/*
export const ReplaceTypes: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof NameExpression
        && TypeRegistry.has(element.name)) {
        replace(new TypeLiteral(TypeRegistry.get(element.name)));
        return true;
    } else if (element instanceof UnresolvedTypeLiteral
        && TypeRegistry.has(element.name)) {
        if (element.ptrflag) {
            replace(new TypeLiteral(new RawPointerType(TypeRegistry.get(element.name))));
        } else {
            replace(new TypeLiteral(TypeRegistry.get(element.name)));
        }
        return true;
    }
};
*/

export const FixHierarchy: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    element.parent = parent;
    return true;
}

export const SpecifyStatements: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    if (element instanceof SimpleStatement
        && element.source[0] instanceof AssignmentExpression) {
        replace(new AssignmentStatement(element.parent, element.source[0]));
        return true;
    } else if (element instanceof SimpleStatement
        && (element.source[0] instanceof UnaryReturnExpression)) {
        replace(new UnaryReturnStatement(element.parent, element.source[0]));
        return true;
    }
}

export const PropagateLocalDefinitions: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    if (element instanceof SimpleStatement
        && element.source[0] instanceof LocalDefinition
        && parent.scope) {
        parent.scope.locals.set(element.source[0].name, element.source[0].local_type);
        replace(new ElidedElement(element.parent));
        return true;
    }
}

export const ReferenceLocals: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof NameExpression) {
        const type = element.findName(element.name);
        if (type) {
            console.error(`REFERENCELOCALS ${element.parent} ${element.name} ${type}`);
            replace(new VariableReferenceExpression(element.parent, element.name));
            return true;
        }
    }
}

export const AddSelfToMethodCalls: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FunctionCallExpression
        && element.source instanceof MethodReferenceExpression
        && !element.self_added) {
        element.args.unshift(element.source.source);
        element.self_added = true;
        return true;
    }
}

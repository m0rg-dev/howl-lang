import { StaticFunctionRegistry } from "../registry/StaticVariableRegistry";
import { TypeRegistry } from "../registry/TypeRegistry";
import { ArithmeticExpression } from "../unified_parser/ArithmeticExpression";
import { AssignmentExpression } from "../unified_parser/AssignmentExpression";
import { AssignmentStatement } from "../unified_parser/AssignmentStatement";
import { ASTElement } from "../unified_parser/ASTElement";
import { ComparisonExpression } from "../unified_parser/ComparisonExpression";
import { FieldReferenceExpression } from "../unified_parser/FieldReferenceExpression";
import { FunctionCallExpression } from "../unified_parser/FunctionCallExpression";
import { MethodReferenceExpression } from "../unified_parser/MethodReferenceExpression";
import { NumericLiteralExpression } from "../unified_parser/NumericLiteralExpression";
import { ElidedElement, LocalDefinition, NameExpression } from "../unified_parser/Parser";
import { RawPointerIndexExpression } from "../unified_parser/RawPointerIndexExpression";
import { SimpleStatement } from "../unified_parser/SimpleStatement";
import { ClassType, FunctionType, RawPointerType, UnionType } from "../unified_parser/TypeObject";
import { TypeRequest } from "../unified_parser/TypeRequest";
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


export const SpecifyMath: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof ArithmeticExpression
        && element.lhs.value_type != TypeRegistry.get("_unknown")) {
        element.value_type = element.lhs.value_type;
        return true;
    }
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
            console.error(`REFERENCELOCALS ${element.name} ${type}`);
            replace(new VariableReferenceExpression(element.parent, type, element.name));
            return true;
        }
    }
}

export const SpecifyMethodReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FieldReferenceExpression
        && (element.source)
        && element.source.value_type instanceof ClassType) {
        if (element.source.value_type.source.methods.some(x => x.name == element.field)) {
            replace(new MethodReferenceExpression(element.parent, element.source as ASTElement, element.field));
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

export const IndirectMethodReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FunctionCallExpression
        && element.source instanceof MethodReferenceExpression) {
        const src = element.source.source;
        const method = element.source.method;

        element.source = new FieldReferenceExpression(element, new FieldReferenceExpression(element, src, "__stable"), method);
        return true;
    }
}

export const SpecifyFieldReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FieldReferenceExpression
        && element.source.value_type instanceof ClassType) {
        if (element.source.value_type.source.fields.some(x => x.name == element.field)) {
            element.value_type = element.source.value_type.source.fields.find(x => x.name == element.field).value_type;
            return true;
        }
    }
}

export const SpecifyFunctionCalls: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FunctionCallExpression
        && element.value_type == TypeRegistry.get("_unknown")
        && element.source.value_type instanceof FunctionType) {
        element.value_type = (element.source.value_type as FunctionType).rc;
        return true;
    }
}

export const AddTypeRequests: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FunctionCallExpression) {
        element.args.forEach((x, y) => {
            const desired_type = (element.source.value_type as FunctionType).args[y];
            element.args[y] = new TypeRequest(element.parent, element.args[y], desired_type);
        });
    } else if (element instanceof RawPointerIndexExpression) {
        element.index = new TypeRequest(element.parent, element.index, TypeRegistry.get("i64"));
    } else if (element instanceof AssignmentExpression && element.lhs.value_type != TypeRegistry.get("_unknown")) {
        element.rhs = new TypeRequest(element.parent, element.rhs, element.lhs.value_type);
    } else if (element instanceof UnaryReturnExpression) {
        element.source = new TypeRequest(element.parent, element.source, element.getReturnType())
    } else if (element instanceof ArithmeticExpression) {
        if (element.value_type != TypeRegistry.get("_unknown")) {
            element.lhs = new TypeRequest(element.parent, element.lhs, element.value_type);
            element.rhs = new TypeRequest(element.parent, element.rhs, element.value_type);
        } else if(element.lhs.value_type != TypeRegistry.get("_unknown")) {
            element.rhs = new TypeRequest(element.parent, element.rhs, element.lhs.value_type);
        } else if(element.rhs.value_type != TypeRegistry.get("_unknown")) {
            element.lhs = new TypeRequest(element.parent, element.lhs, element.rhs.value_type);
        }
    } else if (element instanceof ComparisonExpression) {
        if(element.lhs.value_type != TypeRegistry.get("_unknown")) {
            element.rhs = new TypeRequest(element.parent, element.rhs, element.lhs.value_type);
        } else if(element.rhs.value_type != TypeRegistry.get("_unknown")) {
            element.lhs = new TypeRequest(element.parent, element.lhs, element.rhs.value_type);
        }
    } else {
        return false;
    }
    return true;
}

export const SpecifyRawPointerIndexes: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof RawPointerIndexExpression
        && element.value_type == TypeRegistry.get("_unknown")
        && element.source.value_type instanceof RawPointerType) {
        element.value_type = (element.source.value_type as RawPointerType).subtype;
        return true;
    }
}

export const RemoveRedundantTypeRequests: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof TypeRequest && (
        element.value_type.toString() == element.source.value_type.toString()
        || element.value_type instanceof UnionType && (element.value_type as UnionType).subtypes.some(x => x.toString() == element.source.value_type.toString())
    )) {
        replace(element.source);
        return true;
    }
}

export const SpecifyNumericLiterals: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof TypeRequest
        && element.source instanceof NumericLiteralExpression) {
        // TODO check and make sure it's actually a numeric type
        element.source.value_type = element.value_type;
        replace(element.source);
        return true;
    }
}

export const SpecifyArithmeticExpressions: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof TypeRequest
        && element.source instanceof ArithmeticExpression) {
        // TODO check and make sure it's actually a numeric type
        element.source.value_type = element.value_type;
        replace(element.source);
        return true;
    }
}
import { TypeRegistry } from "../registry/TypeRegistry";
import { ClassType, FunctionType, RawPointerType, UnionType } from "../unified_parser/TypeObject";
import { ASTElement } from "../unified_parser/ASTElement";
import { ElidedElement, LocalDefinition, NameExpression, UnresolvedTypeLiteral, TypeLiteral, ClassField } from "../unified_parser/Parser";
import { CompoundStatement } from "../unified_parser/CompoundStatement";
import { FunctionConstruct } from "../unified_parser/FunctionConstruct";
import { AssignmentExpression } from "../unified_parser/AssignmentExpression";
import { UnaryReturnExpression } from "../unified_parser/UnaryReturnExpression";
import { ClassConstruct } from "../unified_parser/ClassConstruct";
import { SimpleStatement } from "../unified_parser/SimpleStatement";
import { AssignmentStatement } from "../unified_parser/AssignmentStatement";
import { UnaryReturnStatement } from "../unified_parser/UnaryReturnStatement";
import { MethodReferenceExpression } from "../unified_parser/TypedElement";
import { NumericLiteralExpression } from "../unified_parser/NumericLiteralExpression";
import { FunctionCallExpression } from "../unified_parser/FunctionCallExpression";
import { VariableReferenceExpression } from "../unified_parser/VariableReferenceExpression";
import { FieldReferenceExpression } from "../unified_parser/FieldReferenceExpression";
import { StaticFunctionRegistry } from "../registry/StaticVariableRegistry";
import { TypeRequest } from "../unified_parser/TypeRequest";
import { NewExpression } from "../unified_parser/NewExpression";
import { RawPointerIndexExpression } from "../unified_parser/RawPointerIndexExpression";
import { ArithmeticExpression } from "../unified_parser/ArithmeticExpression";
import { ComparisonExpression } from "../unified_parser/ComparisonExpression";

export type Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent?: ASTElement) => boolean;

export function ApplyToAll(t: Transformer): boolean {
    let did_apply = false;

    let u = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
        let rc = t(element, replace, parent);
        if (rc) did_apply = true;
        return rc;
    }

    console.error(`Applying transformer ${t.name}`);
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

export const ExtractClassTypes: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof ClassConstruct) {
        console.error(`Extracted class type: ${element.name}`);
        TypeRegistry.set(element.name, new ClassType(element));
        return true;
    }
};

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

// TODO get rid of this crap
export const SpecifyClassFields: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof ClassField && element.type_literal instanceof TypeLiteral) {
        element.value_type = element.type_literal.value_type;
        return true;
    }
}

export const SpecifyNews: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof NewExpression && element.type_literal instanceof TypeLiteral) {
        element.value_type = element.type_literal.value_type;
        return true;
    }
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
        replace(new AssignmentStatement(element.source[0]));
        return true;
    } else if (element instanceof SimpleStatement
        && (element.source[0] instanceof UnaryReturnExpression)) {
        replace(new UnaryReturnStatement(element.source[0]));
        return true;
    }
}

export const GenerateScopes: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    if (element instanceof FunctionConstruct) {
        element.scope.parent = parent;
        for (const arg of element.args) {
            element.scope.locals.set(arg.name, arg.type_literal.value_type);
        }
        element.scope.return_type = element.return_type_literal.value_type;
        element.hasOwnScope = true;
        return true;
    } else if (element instanceof CompoundStatement) {
        element.scope.parent = parent;
        element.hasOwnScope = true;
        return true;
    } else {
        element.scope.parent = parent;
        return true;
    }
}

export const PropagateLocalDefinitions: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    if (element instanceof SimpleStatement
        && element.source[0] instanceof LocalDefinition
        && parent.scope) {
        parent.scope.locals.set(element.source[0].name.name, element.source[0].type_literal.value_type);
        replace(new ElidedElement());
        return true;
    }
}

export const ReferenceLocals: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof NameExpression && element.scope) {
        const type = element.scope.find(element.name);
        if (type) {
            replace(new VariableReferenceExpression(type, element.name));
            return true;
        }
    }
}

export const SpecifyMethodReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FieldReferenceExpression
        && (element.source)
        && element.source.value_type instanceof ClassType) {
        if (element.source.value_type.source.methods.some(x => x.name == element.field)) {
            replace(new MethodReferenceExpression(element.source as ASTElement, element.field));
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

        element.source = new FieldReferenceExpression(new FieldReferenceExpression(src, "__stable"), method);
        return true;
    }
}

export const SpecifyFieldReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FieldReferenceExpression
        && element.source.value_type instanceof ClassType) {
        if (element.source.value_type.source.fields.some(x => x.name == element.field)) {
            element.value_type = element.source.value_type.source.fields.find(x => x.name == element.field).type_literal.value_type;
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
            element.args[y] = new TypeRequest(element.args[y], desired_type);
        });
    } else if (element instanceof RawPointerIndexExpression) {
        element.index = new TypeRequest(element.index, TypeRegistry.get("i64"));
    } else if (element instanceof AssignmentExpression && element.lhs.value_type != TypeRegistry.get("_unknown")) {
        element.rhs = new TypeRequest(element.rhs, element.lhs.value_type);
    } else if (element instanceof UnaryReturnExpression) {
        element.source = new TypeRequest(element.source, element.scope.get_return())
    } else if (element instanceof ArithmeticExpression) {
        if (element.value_type != TypeRegistry.get("_unknown")) {
            element.lhs = new TypeRequest(element.lhs, element.value_type);
            element.rhs = new TypeRequest(element.rhs, element.value_type);
        } else if(element.lhs.value_type != TypeRegistry.get("_unknown")) {
            element.rhs = new TypeRequest(element.rhs, element.lhs.value_type);
        } else if(element.rhs.value_type != TypeRegistry.get("_unknown")) {
            element.lhs = new TypeRequest(element.lhs, element.rhs.value_type);
        }
    } else if (element instanceof ComparisonExpression) {
        if(element.lhs.value_type != TypeRegistry.get("_unknown")) {
            element.rhs = new TypeRequest(element.rhs, element.lhs.value_type);
        } else if(element.rhs.value_type != TypeRegistry.get("_unknown")) {
            element.lhs = new TypeRequest(element.lhs, element.rhs.value_type);
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
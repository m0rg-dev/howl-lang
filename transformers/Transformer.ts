import { TypeRegistry } from "../registry/TypeRegistry";
import { CustomTypeObject, FunctionType, TypeObject } from "../unified_parser/TypeObject";
import { ASTElement, isAstElement, TokenStream } from "../unified_parser/ASTElement";
import { AssignmentExpression, CompoundStatement, ElidedElement, FunctionConstruct, LocalDefinition, NameExpression, NullaryReturnExpression, UnresolvedTypeLiteral, UnaryReturnExpression, TypeLiteral, ClassField } from "../unified_parser/Parser";
import { ClassConstruct } from "../unified_parser/ClassConstruct";
import { AssignmentStatement, SimpleStatement, UnaryReturnStatement } from "../unified_parser/SimpleStatement";
import { FunctionCallExpression, MethodReferenceExpression, VariableReferenceExpression } from "../unified_parser/TypedElement";
import { FieldReferenceExpression } from "../unified_parser/FieldReferenceExpression";

export type Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent?: ASTElement) => void;

export function ApplyToAll(stream: TokenStream, t: Transformer) {
    console.error(`Applying transformer ${t.name}`);
    stream.forEach((x, y) => {
        if (isAstElement(x)) x.walk(t, (n: ASTElement) => stream[y] = n);
    })
}

export const ExtractClassTypes: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof ClassConstruct) {
        console.error(`Extracted class type: ${element.name}`);
        TypeRegistry.set(element.name, new CustomTypeObject(element));
    }
};

export const ReplaceTypes: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof NameExpression
        && TypeRegistry.has(element.name)) {
        replace(new TypeLiteral(TypeRegistry.get(element.name)))
    } else if (element instanceof UnresolvedTypeLiteral
        && TypeRegistry.has(element.name)) {
        replace(new TypeLiteral(TypeRegistry.get(element.name)))
    }
};

export const SpecifyClassFields: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof ClassField && element.type_literal instanceof TypeLiteral) {
        element.value_type = element.type_literal.value_type;
    }
}

export const SpecifyStatements: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    if (element instanceof SimpleStatement
        && element.source[0] instanceof AssignmentExpression) {
        replace(new AssignmentStatement(element.source[0]));
    } else if (element instanceof SimpleStatement
        && (element.source[0] instanceof UnaryReturnExpression)) {
        replace(new UnaryReturnStatement(element.source[0]));
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
    } else if (element instanceof CompoundStatement) {
        element.scope.parent = parent;
        element.hasOwnScope = true;
    } else {
        element.scope.parent = parent;
    }
}

export const PropagateLocalDefinitions: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    if (element instanceof SimpleStatement
        && element.source[0] instanceof LocalDefinition
        && parent.scope) {
        parent.scope.locals.set(element.source[0].name.name, element.source[0].type_literal.value_type);
        replace(new ElidedElement());
    }
}

export const ReferenceLocals: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof NameExpression && element.scope) {
        const type = element.scope.find(element.name);
        if (type) {
            replace(new VariableReferenceExpression(type, element.name));
        }
    }
}

export const SpecifyMethodReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FieldReferenceExpression
        && (element.source)
        && element.source.value_type instanceof CustomTypeObject
        && element.source.value_type.source instanceof ClassConstruct) {
        if (element.source.value_type.source.methods.some(x => x.name == element.field)) {
            replace(new MethodReferenceExpression(element.source as ASTElement, element.field));
        }
    }
}

export const AddSelfToMethodCalls: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FunctionCallExpression
        && element.source instanceof MethodReferenceExpression
        && !element.self_added) {
        element.args.unshift(element.source.source);
        element.self_added = true;
    }
}

export const IndirectMethodReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FunctionCallExpression
        && element.source instanceof MethodReferenceExpression) {
            const src = element.source.source;
            const method = element.source.method;

            element.source = new FieldReferenceExpression(new FieldReferenceExpression(src, "__stable"), method);
    }
}

export const SpecifyFieldReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FieldReferenceExpression
        && element.source.value_type instanceof CustomTypeObject
        && element.source.value_type.source instanceof ClassConstruct) {
        if (element.source.value_type.source.fields.some(x => x.name == element.field)) {
            element.value_type = element.source.value_type.source.fields.find(x => x.name == element.field).type_literal.value_type;
        }
    }
}

export const SpecifyFunctionCalls: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof FunctionCallExpression
        && element.value_type == TypeRegistry.get("_unknown")
        && element.source.value_type instanceof FunctionType) {
        element.value_type = (element.source.value_type as FunctionType).rc;
    }
}
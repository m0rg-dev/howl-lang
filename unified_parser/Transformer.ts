import { CustomTypeObject, TypeObject, TypeRegistry } from "../registry/TypeRegistry";
import { ASTElement, isAstElement, TokenStream } from "./ASTElement";
import { AssignmentExpression, ClassConstruct, CompoundStatement, ElidedElement, FunctionCallExpression, FunctionConstruct, LocalDefinition, NameExpression, NullaryReturnExpression, TypeLiteral, UnaryReturnExpression, UntypedFieldReferenceExpression } from "./Parser";
import { AssignmentStatement, SimpleStatement, UnaryReturnStatement } from "./SimpleStatement";
import { isTypedElement, MethodReferenceExpression, TypedElement, TypedFieldReferenceExpression, VariableReferenceExpression } from "./TypedElement";
import { Scope } from "./Scope";

export type Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent?: ASTElement) => void;

export function ApplyToAll(stream: TokenStream, t: Transformer) {
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
        replace(TypeRegistry.get(element.name))
    } else if (element instanceof TypeLiteral
        && TypeRegistry.has(element.name)) {
        replace(TypeRegistry.get(element.name))
    }
};

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
            element.scope.locals.set(arg.name, arg.type as TypeObject);
        }
        element.scope.return_type = element.returnType as TypeObject;
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
        parent.scope.locals.set(element.source[0].name.name, element.source[0].type as TypeObject);
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
    if (element instanceof UntypedFieldReferenceExpression
        && isTypedElement(element.source)
        && element.source.type instanceof CustomTypeObject
        && element.source.type.source instanceof ClassConstruct) {
        if (element.source.type.source.methods.some(x => x.name == element.field)) {
            replace(new MethodReferenceExpression(element.source as TypedElement, element.field));
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

export const SpecifyFieldReferences: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if (element instanceof UntypedFieldReferenceExpression
        && isTypedElement(element.source)
        && element.source.type instanceof CustomTypeObject
        && element.source.type.source instanceof ClassConstruct) {
        if (element.source.type.source.fields.some(x => x.name == element.field)) {
            replace(new TypedFieldReferenceExpression(element.source as TypedElement, element.field));
        }
    }
}
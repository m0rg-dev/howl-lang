import { CustomTypeObject, TypeObject, TypeRegistry } from "../registry/TypeRegistry";
import { ASTElement, isAstElement, TokenStream } from "./ASTElement";
import { ClassConstruct, CompoundStatement, FunctionConstruct, LocalDefinition, NameExpression, SimpleStatement, TypeLiteral } from "./Parser";
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

export const GenerateScopes: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    if (element instanceof FunctionConstruct) {
        const s = new Scope();
        s.parent = parent;
        for (const arg of element.args) {
            s.locals.set(arg.name, arg.type as TypeObject);
        }
        s.return_type = element.returnType as TypeObject;
        element.scope = s;
    } else if (element instanceof CompoundStatement) {
        const s = new Scope();
        s.parent = parent;
        element.scope = s;
    }
}

export const PropagateLocalDefinitions: Transformer = (element: ASTElement, replace: (n: ASTElement) => void, parent: ASTElement) => {
    if (element instanceof SimpleStatement
        && element.source[0] instanceof LocalDefinition
        && parent.scope) {
        parent.scope.locals.set(element.source[0].name.name, element.source[0].type as TypeObject);
    }
}
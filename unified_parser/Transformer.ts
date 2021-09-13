import { ASTElement, isAstElement, TokenStream } from "./ASTElement";
import { ClassConstruct } from "./Parser";

export type Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => void;

export function ApplyToAll(stream: TokenStream, t: Transformer) {
    stream.forEach((x, y) => {
        if(isAstElement(x)) x.walk(t, (n: ASTElement) => stream[y] = n);
    })
}

export const ExtractClassTypes: Transformer = (element: ASTElement, replace: (n: ASTElement) => void) => {
    if(element instanceof ClassConstruct) {
        console.error(`Extracted class type: %${element.name}`);
    }
}


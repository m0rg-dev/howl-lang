import { ASTElement } from "../ast/ASTElement";
import { FunctionElement } from "../ast/FunctionElement";
import { Scope } from "../type_inference/Scope";

export abstract class Transformer {
    abstract match(src: ASTElement): boolean;
    abstract apply(src: ASTElement, nearestScope: Scope, root: FunctionElement): ASTElement;
}

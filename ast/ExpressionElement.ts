import { TypeLocation } from "../type_inference/Type";
import { ASTElement } from "./ASTElement";

export abstract class ExpressionElement extends ASTElement {
    type: TypeLocation;
}


import { TokenType } from "../lexer/TokenType";
import { ClassifyNames, ApplyPass } from "../parser/Parser";
import { ParseFunctionParts } from "../parser/rules/ParseFunctionParts";
import { PartialFunctions } from "../registry/Registry";
import { Type } from "../type_inference/Type";
import { PartialElement, SourceLocation, ASTElement } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { FunctionElement } from "./FunctionElement";
import { NameElement } from "./NameElement";
import { PartialArgumentListElement } from "./PartialArgumentListElement";
import { TokenElement } from "./TokenElement";
import { TypeElement } from "./TypeElement";


export class PartialFunctionElement extends PartialElement {
    name: string;

    constructor(loc: SourceLocation, body: ASTElement[], name: string) {
        super(loc, body);
        this.name = name;

        PartialFunctions.add(this);
    }

    toString() {
        return `PartialFunction(${this.name})`;
    }

    parse(self_type: Type): FunctionElement {
        console.error("~~~ Parsing function: " + this.name + " ~~~");
        ClassifyNames(this.body);
        this.body = ApplyPass(this.body, ParseFunctionParts)[0];
        if (this.body[0] instanceof TokenElement && this.body[0].token.type == TokenType.Static) {
            // TODO
            this.body.shift();
        }
        if (this.body[0] instanceof TokenElement
            && this.body[1] instanceof TypeElement
            && this.body[2] instanceof NameElement
            && this.body[3] instanceof PartialArgumentListElement
            && this.body[4] instanceof CompoundStatementElement) {
            return new FunctionElement(
                this.source_location,
                this.name,
                this.body[1].asTypeObject(),
                self_type,
                this.body[3].parse(),
                this.body[4]
            );
        } else {
            return undefined;
        }
    }
}

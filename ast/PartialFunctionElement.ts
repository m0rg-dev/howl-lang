import { TokenType } from "../lexer/TokenType";
import { ApplyPass, ClassifyNames } from "../parser/Parser";
import { ParseFunctionParts } from "../parser/rules/ParseFunctionParts";
import { ParseTypes } from "../parser/rules/ParseType";
import { PartialFunctions } from "../registry/Registry";
import { ASTElement, PartialElement, SourceLocation } from "./ASTElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { FQN, HasFQN } from "./FQN";
import { FunctionElement } from "./FunctionElement";
import { NameElement } from "./NameElement";
import { PartialArgumentListElement } from "./PartialArgumentListElement";
import { TokenElement } from "./TokenElement";
import { TypeElement } from "./TypeElement";


export class PartialFunctionElement extends PartialElement implements HasFQN {
    private parent: HasFQN;
    private name: string;

    constructor(loc: SourceLocation, body: ASTElement[], parent: HasFQN, name: string) {
        super(loc, body);
        this.parent = parent;
        this.name = name;

        PartialFunctions.add(this);
    }

    toString() {
        return `PartialFunction(${this.getFQN()})`;
    }

    parse(): FunctionElement {
        console.error("~~~ Parsing function: " + this.getFQN().toString() + " ~~~");
        ClassifyNames(this.body);
        this.body = ApplyPass(this.body, ParseTypes)[0];
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
                this.parent,
                this.name,
                this.body[1].asTypeObject(),
                undefined,
                this.body[3].parse(),
                this.body[4]
            );
        } else {
            return undefined;
        }
    }

    getFQN() {
        return new FQN(this.parent, this.name);
    }
}

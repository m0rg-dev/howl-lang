import { parseExpression } from "../unified_parser/ExpressionParser";
import { LocalDefinitionExpression } from "../expression/LocalDefinitionExpression";
import { Expression } from "../expression/Expression";
import { LexerHandle } from "../lexer";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { old_ASTElement, Ok, ParseResult } from "./ASTElement";
import { Scope } from "./Scope";

export class SimpleStatement extends old_ASTElement {
    statement_text: string;
    parent: Scope;
    expression: Expression;

    constructor(parent: Scope) {
        super();
        this.parent = parent;
    }

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.consume_through(TokenType.Semicolon);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        const tokens: Token[] = [];

        this.statement_text = handle.toString().trim();

        while (handle.lookahead().type != TokenType.Semicolon) {
            tokens.push(handle.consume());
        }

        this.expression = parseExpression(tokens, this.parent);
        if(this.expression && this.expression instanceof LocalDefinitionExpression) {
            this.parent.register_local(this.expression.name, this.expression.type);
        }

        return Ok();
    }

    synthesize(): string {
        return `;; ${this.statement_text}\n    ${this.expression.synthesize().code}\n`;
    }
}

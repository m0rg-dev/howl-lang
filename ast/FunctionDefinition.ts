import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { FunctionArguments } from "./FunctionArguments";
import { Block } from "./Block";
import { Name } from "./Name";
import { ParsedUnit } from "./ParsedUnit";
import { Terminal } from "./Terminal";
import { ParseResult } from "./ParseResult";

export class FunctionDefinition extends ParsedUnit implements Synthesizable {
    name: string;
    args: FunctionArguments;
    body: Block;

    accept(): ParseResult {
        const keyword = new Terminal(this.source, this.mark);
        if (!keyword.accept_token(TokenType.Function)) return ParseResult.WrongToken(this, TokenType.Function);
        this.accepted(keyword);

        const name = new Name(this.source, this.mark);
        if (!name.accept()) return ParseResult.WrongToken(this, TokenType.Name);
        this.accepted(name);

        const args = new FunctionArguments(this.source, this.mark);
        let err = args.accept()
        if (!err.ok) return err.append(ParseResult.Fail(this, "Expected function arguments"));
        this.accepted(args);

        const body = new Block(this.source, this.mark);
        err = body.accept();
        if (!err.ok) return err.append(ParseResult.Fail(this, "Expected function body"));
        this.accepted(body);

        this.name = name.name;
        this.args = args;
        this.body = body;

        this.parts.push(keyword, name, args, body);
        return ParseResult.Ok();
    }

    synthesize(): string {
        let parts = [`define i32 @${this.name}() {`];
        parts.push(this.body.synthesize());
        parts.push("}");
        return parts.join("\n");
    }
}
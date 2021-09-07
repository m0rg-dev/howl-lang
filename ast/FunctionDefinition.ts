import { Synthesizable } from "../generator";
import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { FunctionArguments } from "./FunctionArguments";
import { Block } from "./Block";
import { Name } from "./Name";
import { ParsedUnit } from "./ParsedUnit";
import { Terminal } from "./Terminal";

export class FunctionDefinition extends ParsedUnit implements Synthesizable {
    name: string;
    args: FunctionArguments;
    body: Block;

    accept(): boolean {
        const keyword = new Terminal(this.source, this.mark);
        if (!keyword.accept_token(TokenType.Function)) return why_not("Expected keyword: fn");
        this.accepted(keyword);

        const name = new Name(this.source, this.mark);
        if (!name.accept()) return why_not("Expected function name");
        this.accepted(name);

        const args = new FunctionArguments(this.source, this.mark);
        if (!args.accept()) return why_not("Expected function arguments");
        this.accepted(args);

        const body = new Block(this.source, this.mark);
        if (!body.accept()) return why_not("Expected function body");
        this.accepted(body);

        this.name = name.name;
        this.args = args;
        this.body = body;

        this.parts.push(keyword, name, args, body);
        return true;
    }

    synthesize(): string {
        let parts = [`define i32 @${this.name}() {`];
        parts.push(this.body.synthesize());
        parts.push("}");
        return parts.join("\n");
    }
}
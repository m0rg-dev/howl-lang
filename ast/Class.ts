import { why_not } from "../parser";
import { TokenType } from "../TokenType";
import { Synthesizable } from "../generator";
import { ClassBody } from "./ClassBody";
import { ParsedUnit } from "./ParsedUnit";
import { Terminal } from "./Terminal";
import { Name } from "./Name";

export class Class extends ParsedUnit implements Synthesizable {
    name: string;
    body: ClassBody;

    accept(): boolean {
        const keyword = new Terminal(this.source, this.mark);
        if (!keyword.accept_token(TokenType.Class)) return why_not("Expected keyword: class");
        this.accepted(keyword);

        const name = new Name(this.source, this.mark);
        if (!name.accept()) return why_not("Expected class name");
        this.accepted(name);

        const body = new ClassBody(this.source, this.mark);
        if (!body.accept()) return why_not("Expected class body");
        this.accepted(body);

        this.name = name.name;
        this.body = body;

        this.parts.push(keyword, name, body);
        return true;
    }

    pretty_print(depth = 0): string {
        let parts: string[] = [];
        for (const part of this.parts) {
            parts.push(part.pretty_print(depth + 1));
        }
        return " ".repeat(depth) + `(${this.start}, ${this.end}) Class (${this.name}):\n` + parts.join("\n");
    }

    synthesize(): string {
        let parts = [`%${this.name} = type {`];
        for (const index in this.body.fields) {
            switch (this.body.fields[index].type) {
                case TokenType.Int32: parts.push(`    i32${(Number.parseInt(index) == this.body.fields.length - 1) ? " " : ","}        ;; ${this.body.fields[index].name}`); break;
            }
        }
        parts.push("}");
        return parts.join("\n");
    }
}
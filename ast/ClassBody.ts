import { why_not } from '../parser';
import { TokenType } from "../TokenType";
import { FieldDeclaration } from "./FieldDeclaration";
import { ParsedUnit } from "./ParsedUnit";
import { ParseResult } from './ParseResult';
import { Terminal } from "./Terminal";

export class ClassBody extends ParsedUnit {
    fields: FieldDeclaration[];

    accept(): ParseResult {
        const open = new Terminal(this.source, this.mark);
        if (!open.accept_token(TokenType.OpenBrace))
            return ParseResult.WrongToken(this, TokenType.OpenBrace);
        this.accepted(open);

        const fields: FieldDeclaration[] = [];
        let close: Terminal;
        while (this.mark <= this.source.length) {
            close = new Terminal(this.source, this.mark);
            if (close.accept_token(TokenType.CloseBrace)) {
                this.accepted(close);
                break;
            } else {
                const f = new FieldDeclaration(this.source, this.mark);
                const err = f.accept();
                if(!err.ok) return err.append(ParseResult.Fail(this, "Expected field declaration or closing brace"));
                this.accepted(f);
                fields.push(f);
            }
        }

        this.fields = fields;

        this.parts.push(open, ...fields, close);
        return ParseResult.Ok();
    }

    pretty_print(depth = 0): string {
        let parts: string[] = [];
        for (const part of this.parts) {
            parts.push(part.pretty_print(depth + 1));
        }
        return " ".repeat(depth) + `(${this.start}, ${this.end}) ClassBody (${this.fields.length} fields):\n` + parts.join("\n");
    }
}
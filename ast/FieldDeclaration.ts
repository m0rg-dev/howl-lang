import { why_not } from '../parser';
import { TokenType } from "../TokenType";
import { BaseType } from './BaseType';
import { Name } from './Name';
import { ParsedUnit } from './ParsedUnit';
import { Terminal } from './Terminal';

export class FieldDeclaration extends ParsedUnit {
    type: TokenType;
    name: string;

    accept(): boolean {
        const type = new BaseType(this.source, this.mark);
        if (!type.accept()) return why_not("Expected type name");
        this.accepted(type);

        const name = new Name(this.source, this.mark);
        if (!name.accept()) return why_not("Expected field name");
        this.accepted(name);

        const semi = new Terminal(this.source, this.mark);
        if (!semi.accept_token(TokenType.Semicolon)) return false;
        this.accepted(semi);

        this.type = type.token_type;
        this.name = name.name;

        this.parts.push(type, name, semi);
        return true;
    }

    pretty_print(depth = 0): string {
        let parts: string[] = [];
        for (const part of this.parts) {
            parts.push(part.pretty_print(depth + 1));
        }
        return " ".repeat(depth) + `(${this.start}, ${this.end}) FieldName (${TokenType[this.type]} ${this.name}):\n` + parts.join("\n");
    }
}
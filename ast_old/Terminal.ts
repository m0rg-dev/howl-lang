import {why_not} from '../parser';
import { NumericLiteralToken } from "../lexer/NumericLiteralToken";
import { NameToken } from "../lexer/NameToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";

const KEYWORD_TABLE = {
    "class": TokenType.Class,
    "fn": TokenType.Function,
    "return": TokenType.Return,
    "i32": TokenType.Int32
}

const PUNCTUATION_TABLE = {
    "{": TokenType.OpenBrace,
    "}": TokenType.CloseBrace,
    "(": TokenType.OpenParen,
    ")": TokenType.CloseParen,
    ";": TokenType.Semicolon,
}

export class Terminal {
    source: String;
    start: number;
    end: number;
    mark: number;
    token_type: TokenType;
    raw: string;

    constructor(source: String, start: number) {
        this.source = source;
        this.start = start;
        this.mark = start;
    }

    protected match_keyword(): Token | undefined {
        const m = this.source.substr(this.mark).match(/^(class|fn|i32|return)\s+/s);
        if (!m) return undefined;

        return { type: KEYWORD_TABLE[m[1]], length: m[0].length, start: this.mark };
    }

    protected match_punctuation(): Token | undefined {
        const m = this.source.substr(this.mark).match(/^([{};()])\s*/s);
        if (!m) return undefined;

        return { type: PUNCTUATION_TABLE[m[1]], length: m[0].length, start: this.mark };
    }

    protected match_name(): NameToken | undefined {
        const m = this.source.substr(this.mark).match(/^([_a-zA-Z][_a-zA-Z0-9-]*)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: TokenType.Name, name: m[1], length: m[0].length, start: this.mark };
    }

    protected match_numeric(): NumericLiteralToken | undefined {
        const m = this.source.substr(this.mark).match(/^(\d+)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: TokenType.NumericLiteral, value: Number.parseInt(m[1]), length: m[0].length, start: this.mark };
    }

    next_token(): Token | undefined {
        if (this.mark >= this.source.length) {
            return { type: TokenType.EOF, length: 0, start: this.mark };
        }

        const keyword = this.match_keyword();
        if (keyword) return keyword;

        const punctuation = this.match_punctuation();
        if (punctuation) return punctuation;

        const name = this.match_name();
        if (name) return name;

        const numeric = this.match_numeric();
        if(numeric) return numeric;
    }

    protected update_raw() {
        this.raw = this.source.substr(this.start, this.end - this.start);
    }

    protected accepted(element: Terminal) {
        this.mark = this.end = element.end;
        this.update_raw();
    }

    accept_token(accept_type: TokenType): boolean {
        var m = this.next_token();
        console.error(`  (looking for: ${TokenType[accept_type]}; got ${TokenType[m.type]})`)
        if (m.type != accept_type) {
            return why_not(`Expecting a ${TokenType[accept_type]}, got a ${TokenType[m.type]}.`);
        }
        this.token_type = accept_type;
        this.end = this.start + m.length;
        this.update_raw();
        return true;
    }

    pretty_print(depth = 0): string {
        return " ".repeat(depth) + `(${this.start}, ${this.end}) Terminal: ${TokenType[this.token_type]}`;
    }
}

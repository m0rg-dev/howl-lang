import { NameToken } from "./ast/NameToken";
import { NumericLiteralToken } from "./ast/NumericLiteralToken";
import { Token } from "./ast/Token";
import { TokenType } from "./TokenType";

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

export class Lexer {
    source: String;
    mark: number;

    constructor(source: String) {
        this.source = source;
        this.mark = 0;
    }

    protected match_keyword(): Token | undefined {
        const m = this.source.substr(this.mark).match(/^(class|fn|i32|return)\s+/s);
        if (!m) return undefined;

        return { type: KEYWORD_TABLE[m[1]], length: m[0].length };
    }

    protected match_punctuation(): Token | undefined {
        const m = this.source.substr(this.mark).match(/^([{};()])\s*/s);
        if (!m) return undefined;

        return { type: PUNCTUATION_TABLE[m[1]], length: m[0].length };
    }

    protected match_name(): NameToken | undefined {
        const m = this.source.substr(this.mark).match(/^([_a-zA-Z][_a-zA-Z0-9-]*)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: TokenType.Name, name: m[1], length: m[0].length };
    }

    protected match_numeric(): NumericLiteralToken | undefined {
        const m = this.source.substr(this.mark).match(/^(\d+)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: TokenType.NumericLiteral, value: Number.parseInt(m[1]), length: m[0].length };
    }

    next_token(): Token | undefined {
        if (this.mark >= this.source.length) {
            return { type: TokenType.EOF, length: 0 };
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

    tokenize(): Token[] {
        const rc: Token[] = [];
        let tok: Token;
        do {
            tok = this.next_token();
            rc.push(tok);
            this.mark += tok.length;
        } while(tok.type != TokenType.EOF);

        return rc;
    }
}
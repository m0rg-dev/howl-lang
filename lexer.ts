import { NameToken } from "./lexer/NameToken";
import { NumericLiteralToken } from "./lexer/NumericLiteralToken";
import { Token } from "./lexer/Token";
import { TokenType } from "./lexer/TokenType";

const KEYWORD_TABLE = {
    "class": TokenType.Class,
    "fn": TokenType.Function,
    "return": TokenType.Return,
}

const PUNCTUATION_TABLE = {
    "{": TokenType.OpenBrace,
    "}": TokenType.CloseBrace,
    "(": TokenType.OpenParen,
    ")": TokenType.CloseParen,
    ";": TokenType.Semicolon,
}

export class Lexer {
    private source: String;
    private mark: number = 0;
    token_stream: Token[] = [];

    constructor(source: String) {
        this.source = source;

        let tok: Token;
        do {
            tok = this.next_token();
            this.token_stream.push(tok);
            this.mark += tok.length;
        } while (tok.type != TokenType.EOF);
    }

    private match_keyword(): Token | undefined {
        const m = this.source.substr(this.mark).match(/^(class|fn|return)\s+/s);
        if (!m) return undefined;

        return { type: KEYWORD_TABLE[m[1]], length: m[0].length, start: this.mark };
    }

    private match_punctuation(): Token | undefined {
        const m = this.source.substr(this.mark).match(/^([{};()])\s*/s);
        if (!m) return undefined;

        return { type: PUNCTUATION_TABLE[m[1]], length: m[0].length, start: this.mark };
    }

    private match_name(): NameToken | undefined {
        const m = this.source.substr(this.mark).match(/^([_a-zA-Z][_a-zA-Z0-9-]*)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: TokenType.Name, name: m[1], length: m[0].length, start: this.mark };
    }

    private match_numeric(): NumericLiteralToken | undefined {
        const m = this.source.substr(this.mark).match(/^(\d+)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: TokenType.NumericLiteral, value: Number.parseInt(m[1]), length: m[0].length, start: this.mark };
    }

    private next_token(): Token | undefined {
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
        if (numeric) return numeric;
    }

    tokenize(): Token[] {
        const rc: Token[] = [];
        let tok: Token;
        do {
            tok = this.next_token();
            rc.push(tok);
            this.mark += tok.length;
        } while (tok.type != TokenType.EOF);

        return rc;
    }

    handle(): LexerHandle {
        return new LexerHandle(this);
    }

    get_source(): String {
        return this.source;
    }
}

export class LexerHandle {
    private ref: Lexer;
    private mark: number = 0;
    private end: number;
    rolling: boolean = true;

    constructor(ref: Lexer) {
        this.ref = ref;
        this.end = this.ref.token_stream.length;
    }

    lookahead(): Token {
        return this.ref.token_stream[this.mark];
    }

    consume(count = 1): Token {
        this.mark += count;
        if (this.mark <= this.end) {
            return this.ref.token_stream[this.mark - 1];
        } else {
            throw new Error("attempted to read off the end of a LexerHandle!");
        }
    }

    expect(type: TokenType) {
        if (!this.rolling) return;
        if (this.lookahead().type == type) {
            this.consume();
        } else {
            this.rolling = false;
        }
    }

    check(type: TokenType) {
        if (!this.rolling) return;
        if (this.lookahead().type != type) {
            this.rolling = false;
        }
    }

    clone(): LexerHandle {
        const rc = new LexerHandle(this.ref);
        rc.mark = this.mark;
        rc.end = this.end;
        return rc;
    }

    match(...tokens: TokenType[]): boolean {
        for (const index in tokens) {
            if (this.ref.token_stream[this.mark + Number.parseInt(index)].type != tokens[index]) return false;
        }
        return true;
    }

    bracket(start: number, end: number): LexerHandle {
        const rc = new LexerHandle(this.ref);
        if (this.mark + end > this.end) {
            throw new Error("attempted to bracket off the end of a LexerHandle!");
        }
        rc.mark = this.mark + start;
        rc.end = this.mark + end;
        this.mark += end;
        return rc;
    }

    consume_through(...tokens: TokenType[]) {
        tokens.push(TokenType.EOF);
        while(this.lookahead() && tokens.every(x => this.lookahead().type != x))
            this.consume();
        if(this.lookahead().type != TokenType.EOF) this.consume();
    }

    compare(other: LexerHandle): number {
        return other.mark - this.mark;
    }

    toString(): string {
        const src_start = this.ref.token_stream[this.mark].start;
        const src_end = this.ref.token_stream[this.end - 1].start + this.ref.token_stream[this.end - 1].length;

        return this.ref.get_source().substr(src_start, src_end - src_start);
    }
}
import { AsmLiteralToken } from "./lexer/AsmLiteralToken";
import { CommentToken } from "./lexer/CommentToken";
import { NameToken } from "./lexer/NameToken";
import { NumericLiteralToken } from "./lexer/NumericLiteralToken";
import { Token } from "./lexer/Token";
import { TokenType } from "./lexer/TokenType";

const KEYWORD_TABLE = {
    "class": TokenType.Class,
    "fn": TokenType.Function,
    "return": TokenType.Return,
    "new": TokenType.New,
    "let": TokenType.Let,
    "module": TokenType.Module,
    "static": TokenType.Static,
    "if": TokenType.If,
}

const PUNCTUATION_TABLE = {
    "{": TokenType.OpenBrace,
    "}": TokenType.CloseBrace,
    "(": TokenType.OpenParen,
    ")": TokenType.CloseParen,
    "[": TokenType.OpenBracket,
    "]": TokenType.CloseBracket,
    ";": TokenType.Semicolon,
    ",": TokenType.Comma,
    ".": TokenType.Period,
    "=": TokenType.Equals,
    "*": TokenType.Asterisk,
    "<": TokenType.OpenAngle,
    ">": TokenType.CloseAngle,
    "+": TokenType.Plus,
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
            if (!tok) {
                throw new Error(`your token sucks! ${this.source_location(this.token_stream[this.token_stream.length - 1].start)}`)
            }
            if (tok.type != TokenType.Comment) {
                this.token_stream.push(tok);
            }
            this.mark += tok.length;
        } while (tok.type != TokenType.EOF);
    }

    source_location(offset: number): string {
        let line = 1;
        let column = 1;
        for (let i = 0; i < offset; i++) {
            if (this.source.charAt(i) == "\n") {
                line++;
                column = 1;
            } else {
                column++;
            }
        }
        return `${line}:${column}`;
    }

    private match_keyword(): Token | undefined {
        const m = this.source.substr(this.mark).match(/^(class|fn|return|new|let|module|static|if)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: KEYWORD_TABLE[m[1]], length: m[0].length, start: this.mark, text: m[0] };
    }

    private match_punctuation(): Token | undefined {
        const m = this.source.substr(this.mark).match(/^([{};(),.=\[\]*<>+])\s*/s);
        if (!m) return undefined;

        return { type: PUNCTUATION_TABLE[m[1]], length: m[0].length, start: this.mark, text: m[0] };
    }

    private match_name(): NameToken | undefined {
        const m = this.source.substr(this.mark).match(/^([_a-zA-Z][_a-zA-Z0-9-]*)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: TokenType.Name, name: m[1], length: m[0].length, start: this.mark, text: m[0] };
    }

    private match_numeric(): NumericLiteralToken | undefined {
        const m = this.source.substr(this.mark).match(/^(\d+)\s*(?:\s|(?=[^_a-zA-Z0-9-]))/s);
        if (!m) return undefined;

        return { type: TokenType.NumericLiteral, value: Number.parseInt(m[1]), length: m[0].length, start: this.mark, text: m[0] };
    }

    private match_asm_literal(): AsmLiteralToken | undefined {
        const m = this.source.substr(this.mark).match(/^__asm__ ([^;]*)/s);
        if (!m) return undefined;

        return { type: TokenType.AsmLiteral, source: m[1], length: m[0].length, start: this.mark, text: m[0] };
    }

    private match_comment(): CommentToken | undefined {
        const m = this.source.substr(this.mark).match(/^\s*\/\/[^\n]*\n\s*/s);
        if (!m) return undefined;

        return { type: TokenType.Comment, length: m[0].length, start: this.mark, text: m[0] };
    }

    private next_token(): Token | undefined {
        if (this.mark >= this.source.length) {
            return { type: TokenType.EOF, length: 0, start: this.mark, text: "" };
        }

        const comment = this.match_comment();
        if (comment) return comment;

        const keyword = this.match_keyword();
        if (keyword) return keyword;

        const punctuation = this.match_punctuation();
        if (punctuation) return punctuation;

        const asm = this.match_asm_literal();
        if (asm) return asm;

        const name = this.match_name();
        if (name) return name;

        const numeric = this.match_numeric();
        if (numeric) return numeric;
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
        while (this.lookahead() && tokens.every(x => this.lookahead().type != x))
            this.consume();
        if (this.lookahead().type != TokenType.EOF) this.consume();
    }

    rollback() {
        if (this.mark > 0) this.mark--;
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
import { Synthesizable } from "../generator/Synthesizable";
import { LexerHandle } from "../lexer";
import { TokenType } from "../lexer/TokenType";

export type ParseError = {
    location: number,
    description: string
};

export type ParseResult = {
    ok: boolean,
    errors: ParseError[],
};

export function Ok(): ParseResult {
    return { ok: true, errors: [] };
}

export type Segment = {
    handle: LexerHandle,
    ast: ASTElement
}

export function ErrorBadToken(handle: LexerHandle, ...allowable: TokenType[]): ParseError {
    return {
        location: handle.lookahead().start,
        description: `Found a ${TokenType[handle.lookahead().type]} (acceptable: ${allowable.map(x => TokenType[x]).join(", ")})`,
    };
}

export function ErrorEOF(handle: LexerHandle): ParseError {
    return {
        location: handle.lookahead().start,
        description: `Unexpected end of file`
    };
}

export function ErrorBadType(handle: LexerHandle, type: string): ParseError {
    return {
        location: handle.lookahead().start,
        description: `Unknown type ${type}`
    };
}

export function ErrorExpressionFailed(handle: LexerHandle): ParseError {
    return {
        location: handle.lookahead().start,
        description: `Expression failed to parse completely`
    }
}

export abstract class ASTElement implements Synthesizable {
    synthesize(): string {
        throw new Error(`Method not implemented (${this.constructor.name}).`);
    }
    abstract bracket(handle: LexerHandle): LexerHandle;
    abstract parse(handle: LexerHandle): ParseResult;
}

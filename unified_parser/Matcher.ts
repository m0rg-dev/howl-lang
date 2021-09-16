import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, isAstElement, TokenStream } from "./ASTElement";

export type Matcher = (stream: (Token | ASTElement)[]) => { matched: boolean; length: number; };
export function Literal(what: string): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        if (!stream[0])
            return { matched: false, length: 0 };
        if (isAstElement(stream[0])) {
            return { matched: stream[0]?.constructor.name == what, length: 1 };
        } else {
            return { matched: TokenType[stream[0].type] == what, length: 1 };
        }
    };
}
export function InOrder(...what: Matcher[]): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        const rc = { matched: true, length: 0 };
        for (const m of what) {
            const rc2 = m(stream.slice(rc.length));
            if (!rc2.matched)
                return { matched: false, length: 0 };
            rc.length += rc2.length;
        }
        return rc;
    };
}

export function First(...what: Matcher[]): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        for (const m of what) {
            const rc = m(stream);
            if (rc.matched)
                return rc;
        }
        return { matched: false, length: 0 };
    };
}

export function Star(what: Matcher): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        const rc = { matched: true, length: 0 };
        while (true) {
            const rc2 = what(stream.slice(rc.length));
            if (!rc2.matched)
                break;
            rc.length += rc2.length;
        }
        return rc;
    };
}

export function Optional(what: Matcher): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        const rc = what(stream);
        if (rc.matched)
            return rc;
        return { matched: true, length: 0 };
    };
}

export function Invert(what: Matcher): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        const rc = what(stream);
        return { matched: !rc.matched, length: rc.length };
    };
}

export function Rest(): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        return { matched: true, length: stream.length };
    };
}

export function Assert(what: Matcher): Matcher {
    return (stream: TokenStream) => {
        const rc = what(stream);
        if (rc.matched) return { matched: true, length: 0 };
        return { matched: false, length: 0 };
    }
}

export function End(): Matcher {
    return (stream: TokenStream) => {
        if (stream.length == 0) return { matched: true, length: 0 };
        return { matched: false, length: 0 };
    }
}

export function Any(): Matcher {
    return () => { return { matched: true, length: 1 }; }
}


export function Braces(): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        let ptr = 0;
        const stack: TokenType[] = [];

        while (ptr < stream.length) {
            const tok = stream[ptr++];
            if (isAstElement(tok)) continue;
            switch (tok.type) {
                case TokenType.OpenBrace:
                    stack.push(TokenType.OpenBrace);
                    break;
                case TokenType.OpenParen:
                    stack.push(TokenType.OpenParen);
                    break;
                case TokenType.CloseBrace:
                    if (stack.pop() != TokenType.OpenBrace) return { matched: false, length: 0 };
                    break;
                case TokenType.CloseParen:
                    if (stack.pop() != TokenType.OpenParen) return { matched: false, length: 0 };
                    break;
            }
            if (stack.length == 0) return { matched: true, length: ptr };
        }
        return { matched: false, length: 0 };
    };
}

export function BracesWithAngle(): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        let ptr = 0;
        const stack: TokenType[] = [];

        while (ptr < stream.length) {
            const tok = stream[ptr++];
            if (isAstElement(tok)) continue;
            switch (tok.type) {
                case TokenType.OpenBrace:
                    stack.push(TokenType.OpenBrace);
                    break;
                case TokenType.OpenParen:
                    stack.push(TokenType.OpenParen);
                    break;
                case TokenType.OpenAngle:
                    stack.push(TokenType.OpenAngle);
                    break;
                case TokenType.CloseBrace:
                    if (stack.pop() != TokenType.OpenBrace) return { matched: false, length: 0 };
                    break;
                case TokenType.CloseParen:
                    if (stack.pop() != TokenType.OpenParen) return { matched: false, length: 0 };
                    break;
                case TokenType.CloseAngle:
                    if (stack.pop() != TokenType.OpenAngle) return { matched: false, length: 0 };
                    break;
            }
            if (stack.length == 0) return { matched: true, length: ptr };
        }
        return { matched: false, length: 0 };
    };
}
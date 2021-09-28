import { ASTElement } from "../ast/ASTElement";
import { TokenElement } from "../ast/TokenElement";
import { TokenType } from "../lexer/TokenType";

export type Matcher = (ast_stream: ASTElement[]) => [boolean, number];

export function MatchToken(type: TokenType): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream[0] instanceof TokenElement
            && ast_stream[0].token.type == type) {
            return [true, 1];
        } else {
            return [false, 0];
        }
    }
}

export function MatchElementType(type: string): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream[0].constructor.name == type) {
            return [true, 1];
        } else {
            return [false, 0];
        }
    }
}

export function InOrder(...what: Matcher[]): Matcher {
    return (ast_stream: ASTElement[]) => {
        let idx = 0;
        for (const m of what) {
            const [match, length] = m(ast_stream.slice(idx));
            if (!match) return [false, 0];
            idx += length;
        }
        return [true, idx];
    }
}

export function Assert(what: Matcher): Matcher {
    return (ast_stream: ASTElement[]) => {
        const [match, _] = what(ast_stream);
        return [match, 0];
    }
}

export function AssertNegative(what: Matcher): Matcher {
    return (ast_stream: ASTElement[]) => {
        const [match, _] = what(ast_stream);
        return [!match, 0];
    }
}

export function AssertEnd(): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream.length) {
            return [false, 0];
        }
        return [true, 0];
    }
}

export function Any(): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (ast_stream.length) {
            return [true, 1];
        } else {
            return [false, 0];
        }
    }
}

export function First(...what: Matcher[]): Matcher {
    return (ast_stream: ASTElement[]) => {
        for (const m of what) {
            const [match, length] = m(ast_stream);
            if (match) return [match, length];
        }
        return [false, 0];
    }
}

export function Star(what: Matcher): Matcher {
    return (ast_stream: ASTElement[]) => {
        let len = 0;
        let matched = false;
        do {
            let length: number;
            [matched, length] = what(ast_stream.slice(len));
            if (matched) len += length;
        } while (matched);
        return [true, len];
    }
}

export function Plus(what: Matcher): Matcher {
    return InOrder(what, Star(what));
}

export function Optional(what: Matcher): Matcher {
    return (ast_stream: ASTElement[]) => {
        const [_, len] = what(ast_stream);
        return [true, len];
    }
}

export function Hug(what: TokenType): Matcher {
    return (ast_stream: ASTElement[]) => {
        if (!(ast_stream[0] instanceof TokenElement && ast_stream[0].token.type == what)) return [false, 0];
        let idx = 0;
        let stack: TokenType[] = [];

        for (const el of ast_stream) {
            idx++;
            if (!(el instanceof TokenElement)) continue;
            switch (el.token.type) {
                case TokenType.OpenAngle:
                    if (what == TokenType.OpenAngle) stack.push(TokenType.OpenAngle);
                    break;
                case TokenType.OpenBrace:
                    stack.push(TokenType.OpenBrace);
                    break;
                case TokenType.OpenBracket:
                    stack.push(TokenType.OpenBracket);
                    break;
                case TokenType.OpenParen:
                    stack.push(TokenType.OpenParen);
                    break;
                case TokenType.CloseParen:
                    if (stack.pop() != TokenType.OpenParen) return [false, 0];
                    break;
                case TokenType.CloseBracket:
                    if (stack.pop() != TokenType.OpenBracket) return [false, 0];
                    break;
                case TokenType.CloseBrace:
                    if (stack.pop() != TokenType.OpenBrace) return [false, 0];
                    break;
                case TokenType.CloseAngle:
                    if (what == TokenType.OpenAngle && stack.pop() != TokenType.OpenAngle) return [false, 0];
                    break;
            }

            if (stack.length == 0) return [true, idx];
        }
        return [false, 0];
    }
}

export function Until(what: Matcher): Matcher {
    return Plus(InOrder(AssertNegative(what), Any()));
}

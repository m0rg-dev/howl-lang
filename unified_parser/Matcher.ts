import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { Expression, isExpression } from "../expression/Expression";

export type Matcher = (stream: (Token | Expression)[]) => { matched: boolean; length: number; };
export function Literal(what: string): Matcher {
    return (stream: (Token | Expression)[]) => {
        if (!stream[0])
            return { matched: false, length: 0 };
        if (isExpression(stream[0])) {
            return { matched: stream[0]?.constructor.name == what, length: 1 };
        } else {
            return { matched: TokenType[stream[0].type] == what, length: 1 };
        }
    };
}
export function InOrder(...what: Matcher[]): Matcher {
    return (stream: (Token | Expression)[]) => {
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
    return (stream: (Token | Expression)[]) => {
        for (const m of what) {
            const rc = m(stream);
            if (rc.matched)
                return rc;
        }
        return { matched: false, length: 0 };
    };
}
export function Star(what: Matcher): Matcher {
    return (stream: (Token | Expression)[]) => {
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
    return (stream: (Token | Expression)[]) => {
        const rc = what(stream);
        if (rc.matched)
            return rc;
        return { matched: true, length: 0 };
    };
}
function Invert(what: Matcher): Matcher {
    return (stream: (Token | Expression)[]) => {
        const rc = what(stream);
        return { matched: !rc.matched, length: rc.length };
    };
}
function Rest(): Matcher {
    return (stream: (Token | Expression)[]) => {
        return { matched: true, length: stream.length };
    };
}

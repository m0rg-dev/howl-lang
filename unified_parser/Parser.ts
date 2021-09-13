import { TypeRegistry } from "../generator/TypeRegistry";
import { NameToken } from "../lexer/NameToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, isAstElement, TokenStream } from "./ASTElement";
import { InOrder, Literal, Matcher } from "./Matcher";

export function Parse(token_stream: Token[]): (Token | ASTElement)[] {
    const stream: (Token | ASTElement)[] = [...token_stream];

    ApplyPass(stream, FindTopLevelConstructs);

    return stream;
}

export function ApplyPass(stream: (Token | ASTElement)[], pass: Pass) {
    console.error(`Running pass: ${pass.name}`);
    let did_match = false;
    outer: do {
        did_match = false;
        for (const rule of pass.rules) {
            let ptr = 0;
            inner: for (ptr = 0; ptr < stream.length; ptr++) {
                const m = rule.match(stream.slice(ptr));
                if (m.matched) {
                    const repl = rule.replace(stream.slice(ptr, ptr + m.length));
                    if (!repl) continue inner;
                    console.error(`Applied rule ${rule.name}`);
                    did_match = true;
                    const prev = stream.splice(ptr, m.length, ...repl);
                    console.error(`[${prev.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}] => [${repl.map(x => x.toString()).join(", ")}]`);
                    continue outer;
                }
            }
        }
    } while (did_match);
    console.error(`\x1b[1mResult:\x1b[0m [${stream.map(x => x['start'] ? TokenType[x['type']] : x.toString()).join(", ")}]`);
}

type ProductionRule = {
    name: string,
    match: Matcher,
    replace: (input: (Token | ASTElement)[]) => ASTElement[];
}

type Pass = {
    name: string,
    rules: ProductionRule[]
}

export class ParseError extends ASTElement {
    description: string;
    constructor(description: string) {
        super();
        this.description = description;
    }

    toString = () => `ParseError: ${this.description}`;
    valueType = () => TypeRegistry.get("void");
}

export class ModuleConstruct extends ASTElement {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }
    toString = () => `Module(${this.name})`;
}

export class PartialClassConstruct extends ASTElement {
    name: string;
    body: TokenStream;
    constructor(name: string, body: TokenStream) {
        super();
        this.name = name;
        this.body = [...body];
    }
    toString = () => `PartialClass(${this.name})`;
}

const FindTopLevelConstructs: Pass = {
    name: "FindTopLevelConstructs",
    rules: [
        {
            name: "ModuleConstruct",
            match: InOrder(Literal("Module"), Literal("Name"), Literal("Semicolon")),
            replace: (input: [Token, NameToken, Token]) => [
                new ModuleConstruct(input[1].name)
            ]
        },
        {
            name: "ModuleConstructNegative",
            match: InOrder(Literal("Module")),
            replace: (input: [Token]) => [
                new ParseError("Expected module name")
            ]
        },
        {
            name: "ClassConstruct",
            match: InOrder(Literal("Class"), Literal("Name"), Braces()),
            replace: (input: [Token, NameToken, ...(Token | ASTElement)[]]) => [
                new PartialClassConstruct(input[1].name, input.slice(2))
            ]
        }
    ]
};

function Braces(): Matcher {
    return (stream: (Token | ASTElement)[]) => {
        let ptr = 0;
        const stack: TokenType[] = [];

        while(ptr < stream.length) {
            const tok = stream[ptr++];
            if(isAstElement(tok)) continue;
            switch(tok.type) {
                case TokenType.OpenBrace:
                    stack.push(TokenType.OpenBrace);
                    break;
                case TokenType.OpenParen:
                    stack.push(TokenType.OpenParen);
                    break;
                case TokenType.CloseBrace:
                    if(stack.pop() != TokenType.OpenBrace) return { matched: false, length: 0 };
                    break;
                case TokenType.CloseParen:
                    if(stack.pop() != TokenType.OpenParen) return { matched: false, length: 0 };
                    break;
            }
            if(stack.length == 0) return { matched: true, length: ptr };
        }
        return { matched: false, length: 0 };
    };
}
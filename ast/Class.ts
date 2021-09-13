import { LexerHandle } from "../lexer";
import { NameToken } from "../lexer/NameToken";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ErrorBadToken, Ok, ParseResult } from "./ASTElement";
import { Mangle, RecognizeBlock } from "./ASTUtil";
import { FunctionDefinition } from "./FunctionDefinition";
import { TypedItem } from "./TypedItem";
import { ClassRegistry, ClassType, PointerType, Type, TypeRegistry } from "../generator/TypeRegistry";
import { Scope } from "./Scope";

export class Class extends ASTElement implements Scope {
    name: string;
    fields: TypedItem[] = [];
    methods: Map<string, FunctionDefinition> = new Map();
    parent: Scope;
    stable: Class;

    constructor(parent: Scope) {
        super();
        this.parent = parent;
    }

    lookup_symbol(symbol: string): Type {
        return this.parent.lookup_symbol(symbol);
    }

    register_local(name: string, type: Type) {
        this.parent.register_local(name, type);
    }
    current_return = () => undefined;

    lookup_field(name: string): TypedItem {
        for (const field of this.fields) {
            if (field.name == name) return field;
        }
        return undefined;
    }

    field_index(name: string): number {
        for (const index in this.fields) {
            if (this.fields[index].name == name) return Number.parseInt(index);
        }
        return -1;
    }

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.expect(TokenType.Class);
        sub.expect(TokenType.Name);

        sub.check(TokenType.OpenBrace);
        RecognizeBlock(sub);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        if (handle.lookahead().type != TokenType.Class) throw new Error("COMPILER BUG");
        handle.consume();

        if (handle.lookahead().type != TokenType.Name) return { ok: false, errors: [ErrorBadToken(handle, TokenType.Name)] };
        const name = (handle.consume() as NameToken);

        if (handle.lookahead().type != TokenType.OpenBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.OpenBrace)] };
        handle.consume();

        this.name = name.name;

        this.stable = new Class(this);
        this.stable.name = `__${this.name}_static`;
        ClassRegistry.set(this.stable.name, this.stable);
        const stable_type = new ClassType(this.stable.name);
        TypeRegistry.set(this.stable.name, stable_type);
        this.fields.push(TypedItem.build('__stable', new PointerType(stable_type)));

        TypeRegistry.set(this.name, new PointerType(new ClassType(this.name)));

        while (handle.lookahead() && handle.lookahead().type != TokenType.CloseBrace) {
            switch (handle.lookahead().type) {
                case TokenType.Name:
                    const field = new TypedItem();
                    const rc = field.parse(handle);
                    if (rc.ok) {
                        this.fields.push(field);
                    } else {
                        return rc;
                    }
                    if (handle.lookahead().type == TokenType.Semicolon) {
                        handle.consume();
                    } else {
                        return { ok: false, errors: [ErrorBadToken(handle, TokenType.Semicolon)] };
                    }
                    break;
                case TokenType.Function:
                    const func = new FunctionDefinition(this);
                    const rc2 = func.parse(handle, new PointerType(new ClassType(this.name)));
                    if (rc2.ok) {
                        Mangle(func, this);
                        this.methods.set(func.signature.name, func);
                        const sig = new TypedItem();
                        sig.name = func.signature.name;
                        sig.type = new PointerType(func.signature.type);

                        this.stable.fields.push(sig);
                    } else {
                        return rc2;
                    }
                    break;
            }
            // TODO this is kind of a hack
            ClassRegistry.set(this.name, this);
        }

        if (handle.lookahead().type != TokenType.CloseBrace) return { ok: false, errors: [ErrorBadToken(handle, TokenType.CloseBrace)] };
        return Ok();
    }

    synthesize(): string {
        const lines: string[] = [];
        if (this.stable) {
            lines.push(this.stable.synthesize());
            lines.push(`@__${this.name}_stable = constant %${this.stable.name} {`);
            lines.push(this.stable.fields.map((field =>
                `    ${field.type.to_ir()} @__${this.name}_${field.name}`
            )).join(",\n"));
            lines.push("}\n");
        }

        lines.push(`%${this.name} = type {`,
            ...this.fields.map((x, y) => `    ${x.type.to_ir()}${y == this.fields.length - 1 ? " " : ","}        ;; ${x.name}`),
            `}\n`);
        lines.push(...Array.from(this.methods.entries()).map((entry: [string, FunctionDefinition]): string => {
            return entry[1].synthesize();
        }));

        return lines.join("\n");
    }
}

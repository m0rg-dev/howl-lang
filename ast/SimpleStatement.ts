import { AllocaStatement, GetElementPtrStatement, LoadStatement, StoreStatement } from "../generator/IR";
import { count } from "../generator/Synthesizable";
import { ClassRegistry, ClassType, FunctionType, PointerType, Type, TypeRegistry } from "../generator/TypeRegistry";
import { LexerHandle } from "../lexer";
import { NameToken } from "../lexer/NameToken";
import { Token } from "../lexer/Token";
import { TokenType } from "../lexer/TokenType";
import { ASTElement, ErrorBadType, ErrorExpressionFailed, Ok, ParseError, ParseResult } from "./ASTElement";
import { Scope } from "./Scope";

export class SimpleStatement extends ASTElement {
    statement_text: string;
    parent: Scope;
    expression: ExpressionPart;

    constructor(parent: Scope) {
        super();
        this.parent = parent;
    }

    bracket(handle: LexerHandle): LexerHandle {
        const sub = handle.clone();
        sub.consume_through(TokenType.Semicolon);

        return handle.bracket(0, handle.compare(sub));
    }

    parse(handle: LexerHandle): ParseResult {
        const tokens: Token[] = [];

        while (handle.lookahead().type != TokenType.Semicolon) {
            tokens.push(handle.consume());
        }

        const parts = tokens.map(x => new ExpressionToken(x));

        for (const rule of PRODUCTION_RULES) {
            rule.apply(handle, this.parent, parts);
        }

        this.statement_text = ";; " + parts.map(x => x.toString()).join(", ");

        if (parts.length > 1) {
            // TODO 
            return { ok: false, errors: [ErrorExpressionFailed(handle)] };
        }

        this.expression = parts[0];

        return Ok();
    }

    synthesize(): string {
        let s = "";
        switch (this.expression.what()) {
            case ExpressionPartType.Assignment:
                let rhs = (this.expression as Assignment).rhs.as_value();
                let lhs = (this.expression as Assignment).lhs.as_mutptr();
                s += rhs.code;
                s += lhs.code;
                const inter = `%${count()}`;
                s += new LoadStatement(rhs.type, rhs.var, inter).synthesize();
                s += new StoreStatement(lhs.type, inter, lhs.var).synthesize();
                break;
            case ExpressionPartType.FunctionCall:
                let exp = this.expression.as_value();
                s += exp.code;
                break;
        }
        return ";; " + this.expression.toString() + "\n" + s + "\n";
    }
}

enum ExpressionPartType {
    ExpressionToken,
    PossiblyQualifiedName,
    FunctionCall,
    Assignment
};

abstract class ExpressionPart {
    abstract what(): ExpressionPartType;
    abstract get_type(): { type: Type, error: ParseError };
    abstract toString(): string;
    as_value(): { code: string, type: Type, var: string } { throw new Error("NYI for " + this.constructor.name) };
    as_mutptr(): { code: string, type: Type, var: string } { throw new Error("NYI for " + this.constructor.name) };
}

class ExpressionToken extends ExpressionPart {
    token: Token;
    constructor(token: Token) {
        super();
        this.token = token;
    }
    what(): ExpressionPartType { return ExpressionPartType.ExpressionToken; }
    get_type(): { type: Type, error: ParseError } { return { type: undefined, error: undefined }; }
    toString(): string { return `ExpressionToken(${TokenType[this.token.type]})`; }
}

class PossiblyQualifiedName extends ExpressionPart {
    handle_ref: LexerHandle;
    parts: string[];
    scope: Scope;

    constructor(handle: LexerHandle, scope: Scope, parts: string[]) {
        super();
        this.handle_ref = handle;
        this.parts = parts;
        this.scope = scope;
    }

    what(): ExpressionPartType { return ExpressionPartType.PossiblyQualifiedName; }

    get_type(): { type: Type, error: ParseError } {
        let cur_type = this.scope.lookup_symbol(this.parts[0]);
        for (const part of this.parts.slice(1)) {
            if (cur_type instanceof PointerType && cur_type.get_sub() instanceof ClassType) {
                cur_type = ClassRegistry.get((cur_type.get_sub() as ClassType).get_name()).lookup_field(part);
            } else {
                return { type: undefined, error: ErrorBadType(this.handle_ref, part) };
            }
        }
        return { type: cur_type, error: undefined }; // TODO: is this correct?
    }

    toString(): string {
        const t = this.get_type();
        return `PossiblyQualifiedName<${t.type ? t.type.to_ir() : "UNTYPED"}>(${this.parts.join(".")})`;
    }

    as_value(): { code: string, type: Type, var: string } {
        const rc = `%${count()}`;
        let s = "";
        if (this.parts.length == 1) {
            // it's just some local variable! easy!
            s += new AllocaStatement(this.get_type().type, rc).synthesize();
            s += new StoreStatement(new PointerType(this.get_type().type), "%" + this.parts[0], rc).synthesize();
        } else {
            let cur_type = this.scope.lookup_symbol(this.parts[0]);
            const gep = new GetElementPtrStatement((cur_type as PointerType).get_sub(), "%" + this.parts[0], rc);
            gep.add_step(TypeRegistry.get("i64"), 0);
            for (const part of this.parts.slice(1)) {
                if (cur_type instanceof PointerType && cur_type.get_sub() instanceof ClassType) {
                    gep.add_step(TypeRegistry.get("i32"), ClassRegistry.get((cur_type.get_sub() as ClassType).get_name()).field_index(part));
                    cur_type = ClassRegistry.get((cur_type.get_sub() as ClassType).get_name()).lookup_field(part);
                } else {
                    throw new Error("heck");
                }
            }
            s += gep.synthesize()
        }
        return { code: `    ;; as_value ${this.get_type().type.to_ir()} ${rc} = ${this.parts.join(".")}\n${s}\n`, type: this.get_type().type, var: rc };
    }

    as_mutptr(): { code: string, type: PointerType, var: string } {
        let rc = `%${count()}`;
        let s = "";
        if (this.parts.length == 1) {
            s += new AllocaStatement(this.get_type().type, rc).synthesize();
            s += new StoreStatement(new PointerType(this.get_type().type), "%" + this.parts[0], rc).synthesize();
        } else {
            let cur_type = this.scope.lookup_symbol(this.parts[0]);
            const gep = new GetElementPtrStatement((cur_type as PointerType).get_sub(), "%" + this.parts[0], rc);
            gep.add_step(TypeRegistry.get("i64"), 0);
            for (const part of this.parts.slice(1)) {
                if (cur_type instanceof PointerType && cur_type.get_sub() instanceof ClassType) {
                    gep.add_step(TypeRegistry.get("i32"), ClassRegistry.get((cur_type.get_sub() as ClassType).get_name()).field_index(part));
                    cur_type = ClassRegistry.get((cur_type.get_sub() as ClassType).get_name()).lookup_field(part);
                } else {
                    throw new Error("heck");
                }
            }
            s += gep.synthesize()
        }
        return { code: `    ;; as_mutptr ${new PointerType(this.get_type().type).to_ir()} ${rc} = ${this.parts.join(".")}\n${s}\n`, type: new PointerType(this.get_type().type), var: rc };
    }
}

class FunctionCall extends ExpressionPart {
    name: string;
    signature: FunctionType;
    args: ExpressionPart[];

    constructor(name: string, signature: FunctionType, args: ExpressionPart[]) {
        super();
        this.name = name;
        this.signature = signature;
        this.args = args;
    }

    what(): ExpressionPartType { return ExpressionPartType.FunctionCall; }
    get_type(): { type: Type, error: ParseError } {
        return { type: this.signature.return_type(), error: undefined };
    }
    toString(): string {
        return `${this.name}<${this.signature.to_ir()}>(${this.args.map(x => x.toString()).join(",")})`;
    }

    as_value(): { code: string, type: Type, var: string } {
        const rc = `%${count()}`;
        let code = `    ${rc} = alloca ${this.signature.return_type().to_ir()}\n`;
        const args: string[] = [];
        for (const arg of this.args) {
            const arg_ir = arg.as_value();
            code += arg_ir.code;
            const inter = `%${count()}`;
            code += `    ${inter} = load ${arg_ir.type.to_ir()}, ${new PointerType(arg_ir.type).to_ir()} ${arg_ir.var}\n`;
            args.push(`${arg_ir.type.to_ir()} ${inter}`);
        }
        const inter = `%${count()}`;
        code += `    ${inter} = call ${this.signature.return_type().to_ir()} @${this.name}(${args.join(", ")})\n`;
        code += `    store ${this.signature.return_type().to_ir()} ${inter}, ${new PointerType(this.signature.return_type()).to_ir()} ${rc}\n`;
        return { code: code, type: this.get_type().type, var: rc };
    }
}

class Assignment extends ExpressionPart {
    lhs: PossiblyQualifiedName;
    rhs: ExpressionPart;

    constructor(lhs: PossiblyQualifiedName, rhs: ExpressionPart) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
    }

    what(): ExpressionPartType { return ExpressionPartType.Assignment; }
    get_type(): { type: Type, error: ParseError } { return { type: TypeRegistry.get("void"), error: undefined } };
    toString(): string {
        return `${this.lhs.toString()} = ${this.rhs.toString()}`;
    }
}

abstract class ProductionRule {
    abstract apply(handle: LexerHandle, scope: Scope, parts: ExpressionPart[]): void;
}

class QualifiedNameRule extends ProductionRule {
    apply(handle: LexerHandle, scope: Scope, parts: ExpressionPart[]) {
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].what() == ExpressionPartType.ExpressionToken
                && (parts[i] as ExpressionToken).token.type == TokenType.Name) {
                const qn_parts: string[] = [];
                qn_parts.push(((parts[i] as ExpressionToken).token as NameToken).name);
                let j = i + 1;
                while (j < parts.length
                    && parts[j].what() == ExpressionPartType.ExpressionToken
                    && (parts[j] as ExpressionToken).token.type == TokenType.Period
                    && parts[j + 1].what() == ExpressionPartType.ExpressionToken
                    && (parts[j + 1] as ExpressionToken).token.type == TokenType.Name) {
                    qn_parts.push(((parts[j + 1] as ExpressionToken).token as NameToken).name);
                    j += 2;
                }
                parts.splice(i, j - i, new PossiblyQualifiedName(handle, scope, qn_parts));
            }
        }
    }
}

class FunctionCallRule extends ProductionRule {
    apply(handle: LexerHandle, scope: Scope, parts: ExpressionPart[]) {
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].what() == ExpressionPartType.PossiblyQualifiedName
                && (parts[i] as PossiblyQualifiedName).get_type().type instanceof FunctionType) {
                if (!(parts[i + 1].what() == ExpressionPartType.ExpressionToken
                    && (parts[i + 1] as ExpressionToken).token.type == TokenType.OpenParen)) continue;
                const args: ExpressionPart[] = [];
                let j = i + 2;
                while (j < parts.length && !(parts[j].what() == ExpressionPartType.ExpressionToken
                    && (parts[j] as ExpressionToken).token.type == TokenType.CloseParen)) {
                    args.push(parts[j]);
                    j++;
                }
                parts.splice(i, j - i + 1, new FunctionCall((parts[i] as PossiblyQualifiedName).parts.join("."), (parts[i] as PossiblyQualifiedName).get_type().type as FunctionType, args));
            }
        }
    }
}

class AssignmentRule extends ProductionRule {
    apply(handle: LexerHandle, scope: Scope, parts: ExpressionPart[]) {
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].what() == ExpressionPartType.PossiblyQualifiedName
                && parts[i + 1].what() == ExpressionPartType.ExpressionToken
                && (parts[i + 1] as ExpressionToken).token.type == TokenType.Equals) {
                parts.splice(i, 3, new Assignment(parts[i] as PossiblyQualifiedName, parts[i + 2]));
            }
        }
    }
}

const PRODUCTION_RULES: ProductionRule[] = [
    new QualifiedNameRule(),
    new FunctionCallRule(),
    new AssignmentRule()
];

import { ASTElement, SourceLocation } from "../ast/ASTElement";
import { LocationFrom, ProductionRule, RuleList } from "../parser/Parser";
import { CompilationUnit } from "./CompilationUnit";
import { emitError, log } from "./Driver";
import { Errors } from "./Errors";

export enum LogLevel {
    TRACE,
    INFO,
    WARN,
    ERROR
};

export abstract class Pass {
    cu: CompilationUnit;
    constructor(cu: CompilationUnit) {
        this.cu = cu;
    }

    abstract apply(): any;

    log(level: LogLevel, message: string, source_location?: SourceLocation) {
        let s = `[`;
        if (source_location) {
            s += " " + this.cu.source_location(source_location[0]);
        } else {
            s += " " + this.cu.filename;
        }
        if (this.cu.module) {
            s += " " + this.cu.module.getFQN().toString();
        }
        s += `] ${message}`;
        log(level, this.constructor.name, message);
    }

    emitCompilationError(id: Errors, message: string, source_location: SourceLocation) {
        this.log(LogLevel.ERROR, `${id} ${message}`, source_location);
        emitError(this.cu, id, message, source_location);
    }

    ApplySingleProductionRule(rule: ProductionRule, ast_stream?: ASTElement[]): boolean {
        let rc = false;
        if (!ast_stream) ast_stream = this.cu.ast_stream;
        let idx = 0;
        while (idx < ast_stream.length) {
            const [matched, length] = rule.match(ast_stream.slice(idx));
            if (matched) {
                const repl = rule.replace(ast_stream.slice(idx, idx + length));
                if (repl) {
                    this.log(LogLevel.TRACE, `${rule.name} [${ast_stream.slice(idx, idx + length).map(x => x.toString()).join(" ")}] => [${repl.map(x => x.toString()).join(" ")}]`,
                        LocationFrom(ast_stream.slice(idx, idx + length)));
                    ast_stream.splice(idx, length, ...repl);
                    rc = true;
                }
            }
            idx++;
        }
        return rc;
    }

    // Attempts to apply every rule, in order, at every position of the input stream.
    ApplyMultipleProductionRules(rules: ProductionRule[], ast_stream?: ASTElement[]): boolean {
        let rc = false;
        if (!ast_stream) ast_stream = this.cu.ast_stream;
        let idx = 0;
        while (idx < ast_stream.length) {
            for (const rule of rules) {
                const [matched, length] = rule.match(ast_stream.slice(idx));
                if (matched) {
                    const repl = rule.replace(ast_stream.slice(idx, idx + length));
                    if (repl) {
                        this.log(LogLevel.TRACE, `${rule.name} [${ast_stream.slice(idx, idx + length).map(x => x.toString()).join(" ")}] => [${repl.map(x => x.toString()).join(" ")}]`,
                            LocationFrom(ast_stream.slice(idx, idx + length)));
                        ast_stream.splice(idx, length, ...repl);
                        rc = true;
                    }
                }
            }
            idx++;
        }
        return rc;
    }
}

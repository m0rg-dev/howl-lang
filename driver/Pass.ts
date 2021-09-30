import { ASTElement, SourceLocation } from "../ast/ASTElement";
import { LocationFrom, ProductionRule, RuleList } from "../parser/Parser";
import { CompilationUnit } from "./CompilationUnit";
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
        let s = `[${LogLevel[level].padStart(5)} ${this.constructor.name}`;
        if (source_location) {
            s += " " + this.cu.source_location(source_location[0]);
        } else {
            s += " " + this.cu.filename;
        }
        if (this.cu.module) {
            s += " " + this.cu.module.getFQN().toString();
        }
        s += `] ${message}`;
        if (process.env["HOWL_PRINT_COMPILER_LOG"])
            console.error(s);
    }

    emitCompilationError(id: Errors, message: string, source_location: SourceLocation) {
        this.log(LogLevel.ERROR, `${id} ${message}`, source_location);
        this.cu.valid = false;

        console.error(`\x1b[1;31mError:\x1b[0m HL${id.toString().padStart(4, '0')} \x1b[1m${message}\x1b[0m`);
        console.error(`    \x1b[3;90mat ${this.cu.source_location(source_location[0])} - ${this.cu.source_location(source_location[1])}\x1b[0m`);

        const start_loc = this.cu.getSourceLocation(source_location[0]);
        const end_loc = this.cu.getSourceLocation(source_location[1]);

        if (start_loc.line == end_loc.line) {
            const line = this.cu.getSourceLine(start_loc.line);
            console.error(`\x1b[32;1m${start_loc.line.toString().padStart(5)}\x1b[0m ${line}`);
            console.error(`     ${" ".repeat(start_loc.column)}\x1b[31m${"^".repeat(end_loc.column - start_loc.column)}\x1b[0m`);
        } else {
            let i = start_loc.line;
            for (; i <= end_loc.line; i++) {
                const line = this.cu.getSourceLine(i);
                console.error(`\x1b[32;1m${i.toString().padStart(5)}\x1b[0m ${line}`);
            }
        }
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

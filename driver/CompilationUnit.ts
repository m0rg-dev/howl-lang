import { ASTElement, MarkerElement } from "../ast/ASTElement";
import { FQN } from "../ast/FQN";
import { TokenElement } from "../ast/TokenElement";
import { Manifest } from "../config/manifest";
import { Lexer } from "../lexer";
import { CurrentNamespace, TypeNames } from "../registry/Registry";

export class CompilationUnit {
    private raw_source: string;
    private lexer: Lexer;
    filename: string;
    ast_stream: ASTElement[];
    valid = true;
    manifest: Manifest;

    class_names: Set<string> = new Set();

    constructor(source: string, filename: string, manifest: Manifest) {
        this.filename = filename;
        this.raw_source = source;
        this.lexer = new Lexer(source);
        this.ast_stream = this.lexer.token_stream.map(x => new TokenElement(x, this));
        this.manifest = manifest;
    }

    source_location(offset: number): string {
        let line = 1;
        let column = 1;
        for (let i = 0; i < offset; i++) {
            if (this.raw_source.charAt(i) == "\n") {
                line++;
                column = 1;
            } else {
                column++;
            }
        }
        return `${this.filename}:${line}:${column}`;
    }

    getSourceLocation(offset: number): { file: string, line: number, column: number } {
        let line = 1;
        let column = 1;
        for (let i = 0; i < offset; i++) {
            if (this.raw_source.charAt(i) == "\n") {
                line++;
                column = 1;
            } else {
                column++;
            }
        }
        return { file: this.filename, line, column };
    }

    getSourceLine(line: number): string {
        return this.raw_source.split("\n")[line - 1];
    }

    logFailure() {
        console.error("(compilation aborted)");
        return false;
    }

    registerNames() {
        this.class_names.forEach(x => {
            TypeNames.add(CurrentNamespace() + "." + x);
        });
    }

    // TODO: this doesn't do overlap properly (it should ONLY produce segments
    // where the innermost selector is in selector[])
    static mapWithin(selector: string[], ast_stream: ASTElement[], callback: (segment: ASTElement[]) => void) {
        const stack: { selector: string, started: number }[] = [];
        let i: number;
        for (i = 0; i < ast_stream.length; i++) {
            if (ast_stream[i] instanceof MarkerElement) {
                if ((ast_stream[i] as MarkerElement).is_closer) {
                    const prev = stack.pop();
                    if (prev && selector.some(x => x == prev.selector)) {
                        const slice = ast_stream.slice(prev.started, i);
                        const l1 = slice.length;
                        callback(slice);
                        const l2 = slice.length;
                        ast_stream.splice(prev.started, i - prev.started, ...slice);
                        const ldiff = l2 - l1; // positive if the slice got longer
                        i += ldiff;
                    }
                } else {
                    stack.push({
                        selector: (ast_stream[i] as MarkerElement).type,
                        started: i + 1
                    });
                }
            }
        }
    }
}
import * as fs from 'fs';
import * as path from 'path';
import { ASTElement, SourceLocation } from '../ast/ASTElement';
import { ClassElement } from '../ast/ClassElement';
import { ConstructorCallExpression } from '../ast/expression/ConstructorCallExpression';
import { FunctionElement } from '../ast/FunctionElement';
import { ImportElement } from '../ast/ImportElement';
import { LocalDefinitionStatement } from '../ast/statement/LocalDefinitionStatement';
import { TypeElement } from '../ast/TypeElement';
import { WalkAST } from '../ast/WalkAST';
import { Manifest } from '../config/manifest';
import { Classes, Functions, InitRegistry, SeenFiles } from "../registry/Registry";
import { ConcreteType } from '../type_inference/ConcreteType';
import { StructureType } from '../type_inference/StructureType';
import { CompilationUnit } from "./CompilationUnit";
import { DropTagsPass } from './DropTagsPass';
import { Errors } from './Errors';
import { ExpressionPass } from './ExpressionPass';
import { FindClassNamesPass } from './FindClassNamesPass';
import { FindImportsPass } from './FindImportsPass';
import { MakeClassesPass } from './MakeClassesPass';
import { MakeFunctionsPass } from './MakeFunctionsPass';
import { MarkClassesPass } from './MarkClassesPass';
import { MarkFunctionsPass } from './MarkFunctionsPass';
import { ParseClassFieldsPass } from './ParseClassFieldsPass';
import { ParseClassHeadersPass } from './ParseClassHeadersPass';
import { ParseFunctionHeadersPass } from './ParseFunctionHeadersPass';
import { ParseTypesPass } from './ParseTypesPass';
import { LogLevel } from './Pass';
import { QualifyLocalNamesPass } from './QualifyLocalNamesPass';
import { ReferenceNamesPass } from './ReferenceNamesPass';
import { ReplaceClassGenericsPass } from './ReplaceClassGenericsPass';
import { ReplaceTypesPass } from './ReplaceTypesPass';
import { StatementPass } from './StatementPass';

export function EmitError(cu: CompilationUnit, id: Errors, message: string, source_location: SourceLocation) {
    cu.valid = false;

    console.error(`\x1b[1;31mError:\x1b[0m HL${id.toString().padStart(4, '0')} \x1b[1m${message}\x1b[0m`);
    console.error(`    \x1b[3mat ${cu.source_location(source_location[1])} - ${cu.source_location(source_location[2])}\x1b[0m`);

    const start_loc = cu.getSourceLocation(source_location[1]);
    const end_loc = cu.getSourceLocation(source_location[2]);

    if (start_loc.line == end_loc.line) {
        const line = cu.getSourceLine(start_loc.line);
        console.error(`\x1b[32;1m${start_loc.line.toString().padStart(5)}\x1b[0m ${line}`);
        console.error(`     ${" ".repeat(start_loc.column)}\x1b[31m${"^".repeat(end_loc.column - start_loc.column)}\x1b[0m`);
    } else {
        let i = start_loc.line;
        for (; i <= end_loc.line; i++) {
            const line = cu.getSourceLine(i);
            console.error(`\x1b[32;1m${i.toString().padStart(5)}\x1b[0m ${line}`);
        }
    }
}

export function EmitLog(level: LogLevel, source: string, message: string) {
    let s = `[${LogLevel[level].padStart(5)} ${source}] ${message}`;
    if (process.env["HOWL_PRINT_COMPILER_LOG"])
        console.error(s);
}

export function ParseFile(pkg_root: string, file: string, manifest: Manifest, prepend = ""): boolean {
    console.error(` ==> ${file}`);
    const source = fs.readFileSync(file).toString();
    const cu = new CompilationUnit(source, file, manifest);

    new FindImportsPass(cu).apply();

    cu.ast_stream.filter(x => x instanceof ImportElement).map((x: ImportElement) => {
        if (fs.existsSync(path.join(pkg_root, x.name.replaceAll(".", "/") + ".hl"))) {
            if (!SeenFiles.has(path.join(pkg_root, x.name.replaceAll(".", "/") + ".hl"))) {
                SeenFiles.add(path.join(pkg_root, x.name.replaceAll(".", "/") + ".hl"));
                ParseFile(pkg_root, path.join(pkg_root, x.name.replaceAll(".", "/") + ".hl"), manifest);
                Rebase("module", x.name);
            }
        }
    });

    new FindClassNamesPass(cu).apply();
    new QualifyLocalNamesPass(cu).apply();
    cu.registerNames();
    new ReferenceNamesPass(cu).apply();
    new MarkClassesPass(cu).apply();
    new MarkFunctionsPass(cu).apply();

    new ParseClassHeadersPass(cu).apply();
    // no class header = no generics = no parse!
    if (!cu.valid) return cu.logFailure();
    new DropTagsPass(cu, "cdecl").apply();
    new ReplaceClassGenericsPass(cu).apply();

    // Types are the same everywhere, so these passes aren't bounded.
    new ReplaceTypesPass(cu).apply();
    new ParseTypesPass(cu).apply();

    new ParseFunctionHeadersPass(cu).apply();
    new DropTagsPass(cu, "fdecl").apply();

    // Bail out before expression parsing just so we don't print absolute nonsense.
    if (!cu.valid) return cu.logFailure();

    new ExpressionPass(cu).apply();
    new StatementPass(cu).apply();
    new DropTagsPass(cu, "compound").apply();

    if (!cu.valid) return cu.logFailure();

    new MakeFunctionsPass(cu).apply();

    new ParseClassFieldsPass(cu).apply();
    new MakeClassesPass(cu).apply();

    if (!cu.valid) return cu.logFailure();

    cu.ast_stream.forEach(x => {
        if (x instanceof ClassElement) {
            Classes.set(x.name, x);
        } else if (x instanceof FunctionElement) {
            Functions.add(x);
        }
    });

    return cu.valid;
}

export function Rebase(from: string, to: string) {
    Classes.forEach(c => {
        if (c.name.startsWith(from)) {
            Classes.delete(c.name);
            c.name = c.name.replace(from, to);
            Classes.set(c.name, c);
            c.methods.forEach(m => {
                if (m.parent.startsWith(from)) {
                    m.parent = m.parent.replace(from, to);
                }
            });

            if (c.parent.startsWith(from)) {
                c.parent = c.parent.replace(from, to);
            }

            c.interfaces.forEach((i, idx) => {
                if (i.startsWith(from)) {
                    c.interfaces[idx] = i.replace(from, to);
                }
            });
        }

        WalkAST(c, src => rebaseElement(src, from, to));

        c.fields.forEach(f => {
            if (f.type instanceof StructureType && f.type.name.startsWith(from)) {
                f.type = Classes.get(f.type.name).type();
            } else if (f.type instanceof ConcreteType && f.type.name.startsWith(from)) {
                f.type.name = f.type.name.replace(from, to);
            }
        });
    });

    Functions.forEach(m => {
        if (m.parent.startsWith(from)) {
            m.parent = m.parent.replace(from, to);
        }

        WalkAST(m, src => rebaseElement(src, from, to));
    });
}

function rebaseElement(src: ASTElement, from: string, to: string) {
    if (src instanceof TypeElement && src.source.name.startsWith(from)) {
        src.source.name = src.source.name.replace(from, to);
        src.generics.map(g => rebaseElement(g, from, to));
    }

    if (src instanceof LocalDefinitionStatement) {
        rebaseElement(src.type, from, to);
    }

    if (src instanceof ConstructorCallExpression) {
        rebaseElement(src.source, from, to);
    }

    if (src instanceof FunctionElement) {
        if (src.return_type instanceof StructureType || src.return_type instanceof ConcreteType && src.return_type.name.startsWith(from)) {
            src.return_type.name = src.return_type.name.replace(from, to);
        }

        if (src.self_type instanceof StructureType || src.self_type instanceof ConcreteType && src.self_type.name.startsWith(from)) {
            src.self_type.name = src.self_type.name.replace(from, to);
        }

        src.args.forEach(arg => {
            if (arg.type instanceof StructureType || arg.type instanceof ConcreteType && arg.type.name.startsWith(from)) {
                arg.type.name = arg.type.name.replace(from, to);
            }
        })
    }
}

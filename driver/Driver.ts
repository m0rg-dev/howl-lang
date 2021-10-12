import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';
import { SourceLocation } from '../ast/ASTElement';
import { ClassElement } from '../ast/ClassElement';
import { FunctionElement } from '../ast/FunctionElement';
import { ImportElement } from '../ast/ImportElement';
import { EmptyManifest, Manifest, MergeManifest } from '../config/manifest';
import { Classes, CurrentNamespace, Functions, PopNamespace, PushNamespace, SearchPath, SeenFiles, SetCurrentNamespace } from "../registry/Registry";
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
    console.error(` ==> ${CurrentNamespace() || "<top-level>"}`);
    const source = fs.readFileSync(file).toString();
    const cu = new CompilationUnit(source, file, manifest);

    new FindImportsPass(cu).apply();

    cu.ast_stream.filter(x => x instanceof ImportElement).map((x: ImportElement) => {
        if (fs.existsSync(path.join(pkg_root, x.name.replaceAll(".", "/") + ".hl"))) {
            if (!SeenFiles.has(path.join(pkg_root, x.name.replaceAll(".", "/") + ".hl"))) {
                SeenFiles.add(path.join(pkg_root, x.name.replaceAll(".", "/") + ".hl"));
                PushNamespace(x.name);
                ParseFile(pkg_root, path.join(pkg_root, x.name.replaceAll(".", "/") + ".hl"), manifest);
                PopNamespace();
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

export function BuildPackage(pkg_path: string, prepend = ""): Manifest {
    const pkg_manifest = MergeManifest(
        MergeManifest(EmptyManifest, "/snapshot/howl-lang/assets/pack.json"),
        path.join(pkg_path, "pack.json")
    );

    SearchPath.push(...pkg_manifest.search_path.map(x => CurrentNamespace() + "." + x));

    // console.error(`Processing module: ${pkg_path}`);
    // console.error(`  Current namespace is: ${CurrentNamespace()}`);
    // console.error(`  Search path is: ${SearchPath.join(", ")}`);

    Object.entries(pkg_manifest.always_import).forEach(v => {
        if (!v[1]) return;
        const depname = v[0];
        const url = new URL(v[1]);

        if (url.protocol != "file:") {
            throw new Error("non-file dependency URLS not yet supported");
        }

        if (url.pathname == pkg_path) {
            return;
        }

        PushNamespace(depname);
        BuildPackage(url.pathname, prepend + depname + ".");
        PopNamespace();
    });

    if (pkg_manifest.entry) {
        ParseFile(pkg_path, path.join(pkg_path, pkg_manifest.entry + ".hl"), pkg_manifest, prepend);
        SetCurrentNamespace(pkg_manifest.entry);
    }

    return pkg_manifest;
}

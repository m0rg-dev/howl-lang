import * as fs from 'fs';
import { Classes, Functions, InitRegistry } from "../registry/Registry";
import { CompilationUnit } from "./CompilationUnit";
import { FindClassNamesPass } from './FindClassNamesPass';
import { FindModuleNamePass } from './FindModuleNamePass';
import { MarkClassesPass } from './MarkClassesPass';
import { QualifyLocalNamesPass } from './QualifyLocalNamesPass';
import { ReferenceNamesPass } from './ReferenceNamesPass';
import { MarkFunctionsPass } from './MarkFunctionsPass';
import { ParseClassHeadersPass } from './ParseClassHeadersPass';
import { DropTagsPass } from './DropTagsPass';
import { ReplaceClassGenericsPass } from './ReplaceClassGenericsPass';
import { ReplaceTypesPass } from './ReplaceTypesPass';
import { ParseTypesPass } from './ParseTypesPass';
import { ExpressionPass } from './ExpressionPass';
import { StatementPass } from './StatementPass';
import { ParseFunctionHeadersPass } from './ParseFunctionHeadersPass';
import { MakeFunctionsPass } from './MakeFunctionsPass';
import { ParseClassFieldsPass } from './ParseClassFieldsPass';
import { MakeClassesPass } from './MakeClassesPass';
import { ClassElement } from '../ast/ClassElement';
import { FunctionElement } from '../ast/FunctionElement';
import { RenderElement } from '../graphviz/Graphviz';

export function SetupDriver() {
    InitRegistry();

    ParseFile("lib/lib.hl");
}

export function ParseFile(file: string) {
    const source = fs.readFileSync(file).toString();
    const cu = new CompilationUnit(source, file);

    new FindModuleNamePass(cu).apply();
    // no module name = no parse!
    if (!cu.valid) return cu.logFailure();

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
    console.error(cu.ast_stream.map(x => x.toString()).join(" "));

    cu.ast_stream.forEach(x => {
        if (x instanceof ClassElement) {
            Classes.set(x.name, x);
        } else if (x instanceof FunctionElement) {
            Functions.add(x);
        }
    });
}

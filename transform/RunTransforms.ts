import { ASTElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { FunctionElement, OverloadedFunctionElement } from "../ast/FunctionElement";
import { IfStatement } from "../ast/statement/IfStatement";
import { LocalDefinitionStatement } from "../ast/statement/LocalDefinitionStatement";
import { TryCatchStatement } from "../ast/statement/TryCatchStatement";
import { WhileStatement } from "../ast/statement/WhileStatement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { TypeElement } from "../ast/TypeElement";
import { WalkAST } from "../ast/WalkAST";
import { EmitError, EmitLog } from "../driver/Driver";
import { Errors } from "../driver/Errors";
import { LogLevel } from "../driver/Pass";
import { Classes, TransformerRegistry } from "../registry/Registry";
import { Scope } from "../type_inference/Scope";
import { StaticTableType, StructureType } from "../type_inference/StructureType";
import { MakeConcrete } from "./type_inference/TIUtil";

export function RunClassTransforms(c: ClassElement) {
    if (c.is_monomorphization) {
        if (c.fields[0]?.name != "__stable")
            c.fields.unshift(new TypedItemElement(c.source_location, "__stable", new StaticTableType(c)));
        c.methods.forEach(RunFunctionTransforms);
    }
}

export function RunFunctionTransforms(f: FunctionElement) {
    if (f instanceof OverloadedFunctionElement) return;
    EmitLog(LogLevel.TRACE, `FunctionTransforms ${f.name}`, `Started.`);

    AddScopes(f, f);
    RunElementTransforms(f, f);
}

export function RunElementTransforms(e: ASTElement, root: FunctionElement, repl = (n: ASTElement) => { }) {
    WalkAST(e, (src: ASTElement, nearestScope: Scope, repl: (n: ASTElement) => void) => {
        EmitLog(LogLevel.TRACE, `ElementTransforms ${e}`, `${src}`);

        TransformerRegistry.forEach(xfrm => {
            if (xfrm.match(src)) {
                const org = src.clone();
                const new_tree = xfrm.apply(src, nearestScope, root);
                EmitLog(LogLevel.TRACE, `ElementTransforms ${e}`, `${xfrm.constructor.name} ${org} => ${new_tree}`);
                repl(new_tree);
                src = new_tree;
            }
        });
    }, root.body.scope, repl);
}

function AddScopes(el: FunctionElement | CompoundStatementElement, root: FunctionElement, parent?: Scope) {
    EmitLog(LogLevel.TRACE, `TypeInference ${el}`, `(AddScopes) ${el}`);
    if (el instanceof FunctionElement) {
        const s = new Scope(el, undefined);
        s.addType(el.return_type, "__return");
        s.addType(el.self_type, "self");

        el.args.forEach(x => {
            s.addType(x.type, x.name);
        });

        el.addScope(s);
        if (el instanceof OverloadedFunctionElement) return;
        AddScopes(el.body, root, el.scope);
    } else {
        const s = new Scope(root, parent);
        el.addScope(s);
        el.statements.forEach(x => {
            if (x instanceof CompoundStatementElement) {
                AddScopes(x, root, el.scope);
            } else if (x instanceof WhileStatement) {
                AddScopes(x.body, root, el.scope);
            } else if (x instanceof IfStatement) {
                x.bodies.forEach(b => AddScopes(b, root, el.scope));
            } else if (x instanceof TryCatchStatement) {
                AddScopes(x.body, root, el.scope);
                x.cases.forEach(c => {
                    AddScopes(c.body, root, el.scope);
                    c.body.scope.addType(MakeConcrete(c.type.asTypeObject()), c.local_name);
                })
            } else if (x instanceof LocalDefinitionStatement) {
                el.scope.addType(MakeConcrete(x.type.asTypeObject()), x.name);
            }
        })
    }
}

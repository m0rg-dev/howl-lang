import { ASTElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ArithmeticExpression } from "../ast/expression/ArithmeticExpression";
import { CastExpression } from "../ast/expression/CastExpression";
import { ComparisonExpression } from "../ast/expression/ComparisonExpression";
import { ConstructorCallExpression } from "../ast/expression/ConstructorCallExpression";
import { FFICallExpression } from "../ast/expression/FFICallExpression";
import { FieldReferenceExpression } from "../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../ast/expression/FunctionCallExpression";
import { GeneratorTemporaryExpression } from "../ast/expression/GeneratorTemporaryExpression";
import { IndexExpression } from "../ast/expression/IndexExpression";
import { NameExpression } from "../ast/expression/NameExpression";
import { NumberExpression } from "../ast/expression/NumberExpression";
import { StringConstantExpression } from "../ast/expression/StringConstantExpression";
import { ExpressionElement } from "../ast/ExpressionElement";
import { FunctionElement, OverloadedFunctionElement } from "../ast/FunctionElement";
import { AssignmentStatement } from "../ast/statement/AssignmentStatement";
import { IfStatement } from "../ast/statement/IfStatement";
import { LocalDefinitionStatement } from "../ast/statement/LocalDefinitionStatement";
import { NullaryReturnStatement } from "../ast/statement/NullaryReturnStatement";
import { SimpleStatement } from "../ast/statement/SimpleStatement";
import { ThrowStatement } from "../ast/statement/ThrowStatement";
import { TryCatchStatement } from "../ast/statement/TryCatchStatement";
import { UnaryReturnStatement } from "../ast/statement/UnaryReturnStatement";
import { WhileStatement } from "../ast/statement/WhileStatement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { TypeElement } from "../ast/TypeElement";
import { Classes } from "../registry/Registry";
import { ConcreteType } from "../type_inference/ConcreteType";
import { FunctionType } from "../type_inference/FunctionType";
import { StaticTableType, StructureType } from "../type_inference/StructureType";
import { RawPointerType, Type } from "../type_inference/Type";

// export function EmitCPrologue() {
//     lines.push(`#include <stdint.h>`);
//     lines.push(`#include <stdio.h>`);
//     lines.push(`#include <stdlib.h>`);
//     lines.push(`#include <string.h>`);
//     lines.push(`#include <unistd.h>`);
//     lines.push(`#include <setjmp.h>`);
//     lines.push(``);
//     lines.push(`#include "runtime/howl_runtime.h"`);
// }

export function StandardHeaders(): string {
    return [
        "stdint", "stdio", "stdlib", "string", "unistd", "setjmp"
    ].map(h => `#include <${h}.h>`).join("\n") + "\n\n";
}

var temp_counter = 0;
function newtemp() {
    return `temp_${temp_counter++}`;
}

var genex_map = new Map<string, string>();

export function EmitForwardDeclarations(root: ClassElement): string {
    const lines: string[] = [];

    if (!root.is_monomorphization) return "";
    const method_list = root.synthesizeMethods();

    lines.push(`// Forward declarations for class: ${root.name}`);
    lines.push(`struct ${SanitizeName(root.name)}_t;`);
    if (root.is_interface) {
        lines.push(`typedef struct {struct ${SanitizeName(root.name)}_t *obj; struct ${SanitizeName(root.name)}_itable_t *stable; } ${SanitizeName(root.name)};`);
    } else {
        lines.push(`typedef struct {struct ${SanitizeName(root.name)}_t *obj; struct ${SanitizeName(root.name)}_stable_t *stable; } ${SanitizeName(root.name)};`);
        let cargs: TypedItemElement[] = [];
        const cidx = method_list.findIndex(x => x.name == "constructor");
        if (cidx >= 0) {
            cargs = method_list[cidx].args;
        }
        lines.push(`${SanitizeName(root.name)} ${SanitizeName(root.name)}_alloc(${cargs.map(x => `${ConvertType(x.type)} ${x.name}`).join(", ")});`);

        method_list.forEach(m => {
            const args = [{ t: m.self_type, n: "self" }];
            if (m.is_static) args.shift();
            m.args.forEach(e => args.push({ t: e.type, n: e.name }));
            lines.push(`${ConvertType(m.return_type)} ${SanitizeName(m.full_name())}(${args.map(x => `${ConvertType(x.t)} ${x.n}`).join(", ")});`);
        });
    }
    lines.push("");
    return lines.join("\n");
}

export function EmitStructures(root: ClassElement): string {
    const lines: string[] = [];
    if (!root.is_monomorphization) return "";
    const field_list = root.synthesizeFields();
    const method_list = root.synthesizeMethods();

    // Static table.
    lines.push(`// Structures for class: ${root.name}`);

    if (root.is_interface) {
        lines.push(`struct ${SanitizeName(root.name)}_itable_t {`);
        method_list.forEach(m => {
            lines.push(`  ${GenerateFunctionPointerType(new FunctionType(m), m.name)};`)
        });
        lines.push(`};`);
    } else {
        // Static table (external declaration.)
        lines.push(`extern struct ${SanitizeName(root.name)}_stable_t {\n  char *__typename;\n  struct stable_common *parent;`);
        method_list.forEach(m => {
            lines.push(`  ${GenerateFunctionPointerType(new FunctionType(m), m.name)};`)
        });
        lines.push(`} ${SanitizeName(root.name)}_stable_obj;`);
        lines.push(`typedef struct ${SanitizeName(root.name)}_stable_t *${SanitizeName(root.name)}_stable;\n`);

        // Interface tables, if present.
        root.interfaces.forEach(iface => {
            const iclass = Classes.get(iface);
            lines.push(`struct ${SanitizeName(iface)}_itable_t ${SanitizeName(root.name)}_${SanitizeName(iface)}_itable = {`);
            iclass.synthesizeMethods().forEach(m => {
                lines.push(`  (${GenerateFunctionPointerType(new FunctionType(m), "")}) ${SanitizeName(root.name)}__${m.name},`)
            });
            lines.push(`};`);
        });

        // Class structure itself.
        lines.push(`struct ${SanitizeName(root.name)}_t {`);
        field_list.slice(1).forEach(f => {
            if (method_list.some(m => m.name == f.name)) return;
            lines.push(`  ${ConvertType(f.type)} ${f.name};`);
        });
        lines.push(`};\n`);
    }
    return lines.join("\n");
}

export function EmitC(root: ASTElement, lines: string[] = []): string {
    if (root.generator_metadata["replace"]) {
        const rep = root[root.generator_metadata["replace"]];
        if (rep instanceof ExpressionElement) {
            return EmitC(new SimpleStatement(rep.source_location, rep));
        } else {
            return EmitC(rep);
        }
    }

    if (root instanceof ClassElement) {
        if (!root.is_monomorphization) return;
        if (root.is_interface) return "";

        lines.push(`// Class: ${root.name}`);

        // Static table.
        lines.push(`struct ${SanitizeName(root.name)}_stable_t ${SanitizeName(root.name)}_stable_obj = {\n  "${root.name}",`);
        if (root.parent && Classes.has(root.parent)) {
            lines.push(`  (struct stable_common *) &${SanitizeName(root.parent)}_stable_obj,`);
        } else {
            lines.push(`  (struct stable_common *) 0,`);
        }
        root.synthesizeMethods().forEach(m => {
            lines.push(`  ${SanitizeName(m.full_name())},`);
        })
        lines.push(`};\n`);
        // Constructor.
        let cargs: TypedItemElement[] = [];
        const cidx = root.methods.findIndex(x => x.name == "constructor");
        if (cidx >= 0) {
            cargs = root.methods[cidx].args;
        }

        lines.push(`${SanitizeName(root.name)} ${SanitizeName(root.name)}_alloc(${cargs.map(x => `${ConvertType(x.type)} ${x.name}`).join(", ")}) {`);
        lines.push(`  ${SanitizeName(root.name)} rc;`);
        lines.push(`  rc.obj = calloc(1, sizeof(struct ${SanitizeName(root.name)}_t));`);
        lines.push(`  rc.stable = &${SanitizeName(root.name)}_stable_obj;`);
        if (cidx >= 0) {
            lines.push(`  ${SanitizeName(root.name)}__constructor(${["rc", ...cargs.map(x => x.name)].join(", ")});`);
        }
        lines.push(`  return rc;`);
        lines.push(`}\n`);

        // Methods.
        root.methods.forEach(m => EmitC(m, lines));
    } else if (root instanceof FunctionElement) {
        if (root instanceof OverloadedFunctionElement) return;
        lines.push(`// Function: ${root.full_name()} (${root.args.join(", ")})`);
        // // TODO 
        // if (root.self_type instanceof VoidType) {
        //     root.self_type = new ConcreteType("void *");
        // }

        const args = [{ t: root.self_type, n: "self" }];
        if (root.is_static) args.shift();
        root.args.forEach(e => args.push({ t: e.type, n: e.name }));
        lines.push(`${ConvertType(root.return_type)} ${SanitizeName(root.full_name())}(${args.map(x => `${ConvertType(x.t)} ${x.n}`).join(", ")}) {`);
        EmitC(root.body, lines);
        lines.push(`}\n`);
    } else if (root instanceof IfStatement) {
        lines.push(`if (${ExpressionToC(root.condition, lines)}) {`);
        EmitC(root.body, lines);
        lines.push(`}`);
    } else if (root instanceof WhileStatement) {
        lines.push(`while (${ExpressionToC(root.condition, lines)}) {`);
        EmitC(root.body, lines);
        lines.push(`}`);
    } else if (root instanceof CompoundStatementElement) {
        root.statements.forEach(s => EmitC(s, lines));
    } else if (root instanceof UnaryReturnStatement) {
        lines.push(`  return ${ExpressionToC(root.source, lines)};`);
    } else if (root instanceof ThrowStatement) {
        const tmpnam = newtemp();
        lines.push(`  ${ConvertType(root.source.resolved_type)} ${tmpnam} = ${ExpressionToC(root.source, lines)};`);
        lines.push(`  cur_exception = ((struct object) { (void *) ${tmpnam}.obj, (struct stable_common *) ${tmpnam}.stable });`);
        lines.push(`  longjmp(cur_handler, 1);`);
    } else if (root instanceof TryCatchStatement) {
        const tmpnam = newtemp();
        lines.push(`  jmp_buf ${tmpnam};`);
        lines.push(`  memcpy(&${tmpnam}, &cur_handler, sizeof(jmp_buf));`);
        lines.push(`  if(setjmp(cur_handler)) {`);
        // We've received an exception.
        root.cases.forEach(c => {
            const selector_type = c.type.asTypeObject() as StructureType;
            lines.push(`    if(typeIncludes(*cur_exception.stable, "${selector_type.name}")) {`);
            lines.push(`      ${ConvertType(selector_type)} ${c.local_name} = ((${ConvertType(selector_type)}) {(struct ${SanitizeName(selector_type.name)}_t *) cur_exception.obj, (struct ${SanitizeName(selector_type.name)}_stable_t *) cur_exception.stable});`);
            EmitC(c.body, lines);
            lines.push(`      goto try_end_${root.uuid};`);
            lines.push(`    }`);

        });
        // We didn't handle the exception - rethrow.
        lines.push(`    memcpy(&cur_handler, &${tmpnam}, sizeof(jmp_buf));`);
        lines.push(`    longjmp(cur_handler, 1);`);
        lines.push(`  } else {`);
        EmitC(root.body, lines);
        lines.push(`  }`);
        lines.push(`  try_end_${root.uuid}:`);
        lines.push(`  memcpy(&cur_handler, &${tmpnam}, sizeof(jmp_buf));`);
    } else if (root instanceof AssignmentStatement) {
        lines.push(`  ${ExpressionToC(root.lhs, lines)} = ${ExpressionToC(root.rhs, lines)};`);
    } else if (root instanceof NullaryReturnStatement) {
        lines.push(`  return;`);
    } else if (root instanceof LocalDefinitionStatement) {
        lines.push(`  ${ConvertType(root.type.asTypeObject())} ${root.name} = ${ExpressionToC(root.initializer, lines)};`);
    } else if (root instanceof SimpleStatement) {
        lines.push(`  ${ExpressionToC(root.exp, lines)};`);
    } else {
        throw new Error(`Don't know how to emit C for ${root.constructor.name}`);
    }

    return lines.join("\n");
}

const genexes_emitted = new Set<string>();

function ExpressionToC(e: ExpressionElement, lines: string[]): string {
    if (e.generator_metadata["replace"]) {
        const rep = e[e.generator_metadata["replace"]];
        if (rep instanceof ExpressionElement) {
            return ExpressionToC(rep, lines);
        }
    }

    if (e.generator_metadata["requires"]) {
        for (const statement of e.generator_metadata["requires"]) {
            if (statement instanceof ASTElement) {
                EmitC(statement, lines);
            }
        }
    }

    if (e instanceof FieldReferenceExpression) {
        if (e.name == "__stable") {
            return `${ExpressionToC(e.source, lines)}.stable`;
        } else if (e.source.resolved_type instanceof StaticTableType) {
            return `${ExpressionToC(e.source, lines)}->${e.name}`;
        } else {
            return `${ExpressionToC(e.source, lines)}.obj->${e.name}`;
        }
    } else if (e instanceof NameExpression) {
        return e.name;
    } else if (e instanceof NumberExpression) {
        return e.value.toString();
    } else if (e instanceof StringConstantExpression) {
        return `((uint8_t *) "${e.value}")`;
    } else if (e instanceof ConstructorCallExpression) {
        return `${ConvertType(e.type_location?.get() || e.resolved_type)}_alloc(${e.args.map(a => ExpressionToC(a, lines)).join(", ")})`;
    } else if (e instanceof FFICallExpression) {
        return `${e.source}(${e.args.map(a => ExpressionToC(a, lines)).join(", ")})`;
    } else if (e instanceof FunctionCallExpression) {
        return `${ExpressionToC(e.source, lines)}(${e.args.map(a => ExpressionToC(a, lines)).join(", ")})`;
    } else if (e instanceof ComparisonExpression || e instanceof ArithmeticExpression) {
        return `(${ExpressionToC(e.lhs, lines)} ${e.what} ${ExpressionToC(e.rhs, lines)})`;
    } else if (e instanceof TypeElement) {
        return `(&${ConvertType(e.asTypeObject())}_stable_obj)`;
    } else if (e instanceof IndexExpression) {
        return `${ExpressionToC(e.source, lines)}[${ExpressionToC(e.index, lines)}]`;
    } else if (e instanceof CastExpression) {
        if (Classes.has(e.cast_to.name)) {
            const cl = Classes.get(e.cast_to.name);
            if (cl.is_interface) {
                return `((${ConvertType(e.cast_to)}) {(struct ${SanitizeName(e.cast_to.name)}_t *) ${ExpressionToC(e.source, lines)}.obj, &${SanitizeName(e.source.resolved_type.name)}_${SanitizeName(e.cast_to.name)}_itable})`;
            } else {
                const tmpnam = newtemp();
                // we're going to reference the source twice - once to get the object, once to get the stable. put it in a temporary
                lines.push(`  ${ConvertType(e.source.resolved_type)} ${tmpnam} = ${ExpressionToC(e.source, lines)};`);
                return `((${ConvertType(e.cast_to)}) {(struct ${SanitizeName(e.cast_to.name)}_t *) ${tmpnam}.obj, (struct ${SanitizeName(e.cast_to.name)}_stable_t *) ${tmpnam}.stable})`;
            }
        } else {
            // TODO
            return ExpressionToC(e.source, lines);
        }
    } else if (e instanceof GeneratorTemporaryExpression) {
        if (!(genexes_emitted.has(e.uuid))) {
            // TODO
            genex_map.set(e.uuid, newtemp());
            lines.push(`  ${ConvertType(e.resolved_type)} ${genex_map.get(e.uuid)} = ${ExpressionToC(e.source, lines)};`);
            genexes_emitted.add(e.uuid);
        }
        return genex_map.get(e.uuid);
    } else {
        throw new Error(`Don't know how to emit C for ${e.constructor.name}`);
    }
}

function SanitizeName(n: string): string {
    return n.replaceAll(".", "__");
}

function ConvertType(t: Type): string {
    if (t instanceof ConcreteType) {
        if (t.name.match(/^[iu](8|16|32|64)$/)) {
            return ((t.name.startsWith("u")) ? "u" : "") + "int" + t.name.substr(1) + "_t";
        }
        return SanitizeName(t.ir_type());
    } else if (t instanceof StructureType) {
        const mmt = t.Monomorphize();
        return SanitizeName(mmt.name);
    } else if (t instanceof RawPointerType) {
        return ConvertType(t.source) + "*";
    } else {
        throw new Error(`Don't know how to emit C for ${t.constructor.name} ${t}`);
    }
}

function GenerateFunctionPointerType(t: FunctionType, name: string): string {
    const args = [t.self_type, ...t.args];
    if (t.is_static) args.shift();
    return `${ConvertType(t.return_type)}(*${name})(${args.map(ConvertType).join(", ")})`;
}

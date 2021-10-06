import { ASTElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ArithmeticExpression } from "../ast/expression/ArithmeticExpression";
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
import { FunctionElement } from "../ast/FunctionElement";
import { AssignmentStatement } from "../ast/statement/AssignmentStatement";
import { IfStatement } from "../ast/statement/IfStatement";
import { LocalDefinitionStatement } from "../ast/statement/LocalDefinitionStatement";
import { NullaryReturnStatement } from "../ast/statement/NullaryReturnStatement";
import { SimpleStatement } from "../ast/statement/SimpleStatement";
import { UnaryReturnStatement } from "../ast/statement/UnaryReturnStatement";
import { WhileStatement } from "../ast/statement/WhileStatement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { TypeElement } from "../ast/TypeElement";
import { ConcreteType } from "../type_inference/ConcreteType";
import { FunctionType } from "../type_inference/FunctionType";
import { StructureType } from "../type_inference/StructureType";
import { RawPointerType, Type } from "../type_inference/Type";

export function EmitCPrologue() {
    console.log(`#include <stdint.h>`);
    console.log(`#include <stdio.h>`);
    console.log(`#include <stdlib.h>`);
    console.log(`#include <string.h>`);
    console.log(`#include <unistd.h>`);
    console.log(``);
    console.log(`int32_t main__Main(); `)
    console.log(`int32_t main() { return main__Main(); }`);
}

export function EmitForwardDeclarations(root: ClassElement) {
    if (!root.is_monomorphization) return;
    const method_list = root.synthesizeMethods();

    console.log(`// Forward declarations for class: ${root.name}`);
    console.log(`struct ${SanitizeName(root.name)}_t;`);
    console.log(`typedef struct ${SanitizeName(root.name)}_t* ${SanitizeName(root.name)};`);
    let cargs: TypedItemElement[] = [];
    const cidx = method_list.findIndex(x => x.getFQN().last() == "constructor");
    if (cidx >= 0) {
        cargs = method_list[cidx].args;
    }
    console.log(`${SanitizeName(root.name)} ${SanitizeName(root.name)}_alloc(${cargs.map(x => `${ConvertType(x.type)} ${x.name}`).join(", ")});`);

    method_list.forEach(m => {
        const args = [{ t: m.self_type, n: "self" }];
        if (m.is_static) args.shift();
        m.args.forEach(e => args.push({ t: e.type, n: e.name }));
        console.log(`${ConvertType(m.return_type)} ${SanitizeName(m.getFQN().toString())}(${args.map(x => `${ConvertType(x.t)} ${x.n}`).join(", ")});`);
    });

    console.log("\n");
}

export function EmitStructures(root: ClassElement) {
    if (!root.is_monomorphization) return;
    const field_list = root.synthesizeFields();
    const method_list = root.synthesizeMethods();

    // Static table.
    console.log(`// Structures for class: ${root.name}`);
    console.log(`struct ${SanitizeName(root.name)}_stable_t {`);
    method_list.forEach(m => {
        console.log(`  ${GenerateFunctionPointerType(new FunctionType(m), m.getFQN().last().split(".").pop())};`)
    });
    console.log(`} ${SanitizeName(root.name)}_stable_obj = {`);
    method_list.forEach(m => {
        console.log(`  ${SanitizeName(m.getFQN().toString())},`);
    })
    console.log(`};\n`);
    console.log(`typedef struct ${SanitizeName(root.name)}_stable_t *${SanitizeName(root.name)}_stable;\n`);

    // Class structure itself.
    console.log(`struct ${SanitizeName(root.name)}_t {`);
    field_list.forEach(f => {
        console.log(`  ${ConvertType(f.type)} ${f.name};`);
    });
    console.log(`};\n`);
}

export function EmitC(root: ASTElement) {
    if (root.generator_metadata["replace"]) {
        const rep = root[root.generator_metadata["replace"]];
        if (rep instanceof ExpressionElement) {
            EmitC(new SimpleStatement(rep.source_location, rep));
        } else {
            EmitC(rep);
        }
        return;
    }

    if (root instanceof ClassElement) {
        if (!root.is_monomorphization) return;

        console.log(`// Class: ${root.name}`);

        // Constructor.
        let cargs: TypedItemElement[] = [];
        const cidx = root.methods.findIndex(x => x.getFQN().last().split(".").pop() == "constructor");
        if (cidx >= 0) {
            cargs = root.methods[cidx].args;
        }

        console.log(`${SanitizeName(root.name)} ${SanitizeName(root.name)}_alloc(${cargs.map(x => `${ConvertType(x.type)} ${x.name}`).join(", ")}) {`);
        console.log(`  ${SanitizeName(root.name)} rc = calloc(1, sizeof(struct ${SanitizeName(root.name)}_t));`);
        console.log(`  rc->__stable = &${SanitizeName(root.name)}_stable_obj;`);
        if (cidx >= 0) {
            console.log(`  ${SanitizeName(root.name)}__constructor(${["rc", ...cargs.map(x => x.name)].join(", ")});`);
        }
        console.log(`  return rc;`);
        console.log(`}\n`);

        // Methods.
        root.methods.forEach(EmitC);
    } else if (root instanceof FunctionElement) {
        console.log(`// Function: ${root.getFQN()} (${root.args.join(", ")})`);
        // // TODO 
        // if (root.self_type instanceof VoidType) {
        //     root.self_type = new ConcreteType("void *");
        // }

        const args = [{ t: root.self_type, n: "self" }];
        if (root.is_static) args.shift();
        root.args.forEach(e => args.push({ t: e.type, n: e.name }));
        console.log(`${ConvertType(root.return_type)} ${SanitizeName(root.getFQN().toString())}(${args.map(x => `${ConvertType(x.t)} ${x.n}`).join(", ")}) {`);
        EmitC(root.body);
        console.log(`}\n`);
    } else if (root instanceof IfStatement) {
        console.log(`if (${ExpressionToC(root.condition)}) {`);
        EmitC(root.body);
        console.log(`}`);
    } else if (root instanceof WhileStatement) {
        console.log(`while (${ExpressionToC(root.condition)}) {`);
        EmitC(root.body);
        console.log(`}`);
    } else if (root instanceof CompoundStatementElement) {
        root.statements.forEach(EmitC);
    } else if (root instanceof UnaryReturnStatement) {
        console.log(`  return ${ExpressionToC(root.source)};`);
    } else if (root instanceof AssignmentStatement) {
        if (root.generator_metadata["is_fake_assignment"]) console.log(`  ${ExpressionToC(root.lhs)};`);
        else console.log(`  ${ExpressionToC(root.lhs)} = ${ExpressionToC(root.rhs)};`);
    } else if (root instanceof NullaryReturnStatement) {
        console.log(`  return;`);
    } else if (root instanceof LocalDefinitionStatement) {
        console.error(root.type.asTypeObject());
        console.log(`  ${ConvertType(root.type.asTypeObject())} ${root.name} = ${ExpressionToC(root.initializer)};`);
    } else if (root instanceof SimpleStatement) {
        console.log(`  ${ExpressionToC(root.exp)};`);
    } else {
        throw new Error(`Don't know how to emit C for ${root.constructor.name}`);
    }
}

const genexes_emitted = new Set<string>();

function ExpressionToC(e: ExpressionElement): string {
    if (e.generator_metadata["replace"]) {
        const rep = e[e.generator_metadata["replace"]];
        if (rep instanceof ExpressionElement) {
            return ExpressionToC(rep);
        }
    }
    if (e instanceof FieldReferenceExpression) {
        return `${ExpressionToC(e.source)}->${e.name}`;
    } else if (e instanceof NameExpression) {
        return e.name;
    } else if (e instanceof NumberExpression) {
        return e.value.toString();
    } else if (e instanceof StringConstantExpression) {
        return `((uint8_t *) "${e.value}")`;
    } else if (e instanceof ConstructorCallExpression) {
        return `${ConvertType(e.type_location?.get() || e.resolved_type)}_alloc(${e.args.map(ExpressionToC).join(", ")})`;
    } else if (e instanceof FFICallExpression) {
        return `${e.source}(${e.args.map(ExpressionToC).join(", ")})`;
    } else if (e instanceof FunctionCallExpression) {
        return `${ExpressionToC(e.source)}(${e.args.map(ExpressionToC).join(", ")})`;
    } else if (e instanceof ComparisonExpression || e instanceof ArithmeticExpression) {
        return `${ExpressionToC(e.lhs)} ${e.what} ${ExpressionToC(e.rhs)}`;
    } else if (e instanceof TypeElement) {
        return `(&${ConvertType(e.asTypeObject())}_stable_obj)`;
    } else if (e instanceof IndexExpression) {
        return `${ExpressionToC(e.source)}[${ExpressionToC(e.index)}]`;
    } else if (e instanceof GeneratorTemporaryExpression) {
        if (!(genexes_emitted.has(e.uuid))) {
            // TODO
            console.log(`  ${ConvertType(e.resolved_type)} temp_${e.uuid} = ${ExpressionToC(e.source)};`);
            genexes_emitted.add(e.uuid);
        }
        return `temp_${e.uuid}`;
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

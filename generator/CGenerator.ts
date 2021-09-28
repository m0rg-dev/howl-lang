import { ASTElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ConstructorCallExpression } from "../ast/expression/ConstructorCallExpression";
import { FieldReferenceExpression } from "../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../ast/expression/FunctionCallExpression";
import { GeneratorTemporaryExpression } from "../ast/expression/GeneratorTemporaryExpression";
import { NameExpression } from "../ast/expression/NameExpression";
import { NumberExpression } from "../ast/expression/NumberExpression";
import { ExpressionElement } from "../ast/ExpressionElement";
import { FunctionElement } from "../ast/FunctionElement";
import { AssignmentStatement } from "../ast/statement/AssignmentStatement";
import { LocalDefinitionStatement } from "../ast/statement/LocalDefinitionStatement";
import { NullaryReturnStatement } from "../ast/statement/NullaryReturnStatement";
import { SimpleStatement } from "../ast/statement/SimpleStatement";
import { UnaryReturnStatement } from "../ast/statement/UnaryReturnStatement";
import { ConcreteType } from "../type_inference/ConcreteType";
import { FunctionType } from "../type_inference/FunctionType";
import { StructureType } from "../type_inference/StructureType";
import { Type } from "../type_inference/Type";
import { VoidType } from "../type_inference/VoidType";

export function EmitCPrologue() {
    console.log(`#include <stdint.h>`);
    console.log(`#include <stdio.h>`);
    console.log(`#include <stdlib.h>`);
    console.log(`typedef int32_t i32;`);
    console.log("");
}

export function EmitC(root: ASTElement) {
    if (root instanceof ClassElement) {
        console.log(`// Class: ${root.getFQN()}`);

        console.log(`struct ${SanitizeName(root.getFQN().toString())}_t;`);
        console.log(`typedef struct ${SanitizeName(root.getFQN().toString())}_t* ${SanitizeName(root.getFQN().toString())};`);

        root.methods.forEach(m => {
            const args = [{ t: (m.self_type as ConcreteType), n: "self" }];
            m.args.forEach(e => args.push({ t: (e.type as ConcreteType), n: e.name }));
            console.log(`${(m.return_type as ConcreteType).ir_type()} ${SanitizeName(m.getFQN().toString())}(${args.map(x => `${SanitizeName(x.t.ir_type())} ${x.n}`).join(", ")});`);
        });

        console.log(`struct ${SanitizeName(root.getFQN().toString())}_stable_t {`);
        root.methods.forEach(m => {
            console.log(`  ${GenerateFunctionPointerType(new FunctionType(m), m.getFQN().last())};`)
        });
        console.log(`} ${SanitizeName(root.getFQN().toString())}_stable = {`);
        root.methods.forEach(m => {
            console.log(`  ${SanitizeName(m.getFQN().toString())},`);
        })
        console.log(`};\n`);

        console.log(`struct ${SanitizeName(root.getFQN().toString())}_t {`);
        console.log(`  struct ${SanitizeName(root.getFQN().toString())}_stable_t *__stable;`);
        root.fields.forEach(f => {
            console.log(`  ${(f.type as ConcreteType).ir_type()} ${f.name};`);
        });
        console.log(`};\n`);

        console.log(`${SanitizeName(root.getFQN().toString())} ${SanitizeName(root.getFQN().toString())}_alloc() {`);
        console.log(`  ${SanitizeName(root.getFQN().toString())} rc = calloc(1, sizeof(struct ${SanitizeName(root.getFQN().toString())}_t));`);
        console.log(`  rc->__stable = &${SanitizeName(root.getFQN().toString())}_stable;`);
        console.log(`  return rc;`);
        console.log(`}\n`);

        root.methods.forEach(EmitC);
    } else if (root instanceof FunctionElement) {
        console.log(`// Function: ${root.getFQN()} (${root.args.join(", ")})`);
        // TODO 
        if (root.self_type instanceof VoidType) {
            root.self_type = new ConcreteType("void *");
        }

        const args = [{ t: (root.self_type as ConcreteType), n: "self" }];
        root.args.forEach(e => args.push({ t: (e.type as ConcreteType), n: e.name }));
        console.log(`${(root.return_type as ConcreteType).ir_type()} ${SanitizeName(root.getFQN().toString())}(${args.map(x => `${SanitizeName(x.t.ir_type())} ${x.n}`).join(", ")}) {`);
        EmitC(root.body);
        console.log(`}\n`);
    } else if (root instanceof CompoundStatementElement) {
        root.statements.forEach(EmitC);
    } else if (root instanceof UnaryReturnStatement) {
        console.log(`  return ${ExpressionToC(root.source)};`);
    } else if (root instanceof AssignmentStatement) {
        console.log(`  ${ExpressionToC(root.lhs)} = ${ExpressionToC(root.rhs)};`);
    } else if (root instanceof NullaryReturnStatement) {
        console.log(`  return;`);
    } else if (root instanceof LocalDefinitionStatement) {
        console.log(`  ${ConvertType(root.type)} ${root.name};`);
    } else if (root instanceof SimpleStatement) {
        console.log(`  ${ExpressionToC(root.exp)};`);
    } else {
        throw new Error(`Don't know how to emit C for ${root.constructor.name}`);
    }
}

const genexes_emitted = new Set<string>();

function ExpressionToC(e: ExpressionElement): string {
    if (e instanceof FieldReferenceExpression) {
        return `${ExpressionToC(e.source)}->${e.name}`;
    } else if (e instanceof NameExpression) {
        return e.name;
    } else if (e instanceof NumberExpression) {
        return e.value.toString();
    } else if (e instanceof ConstructorCallExpression) {
        return `${SanitizeName(e.resolved_type.ir_type())}_alloc()`;
    } else if (e instanceof FunctionCallExpression) {
        return `${ExpressionToC(e.source)}(${e.args.map(ExpressionToC).join(", ")})`;
    } else if (e instanceof GeneratorTemporaryExpression) {
        if (!(genexes_emitted.has(e.uuid))) {
            // TODO
            console.log(`  const ${SanitizeName(e.resolved_type.ir_type())} temp_${e.uuid} = ${ExpressionToC(e.source)};`);
            genexes_emitted.add(e.uuid);
        }
        return `temp_${e.uuid}`;
    } else {
        throw new Error(`Don't know how to emit C for ${e.constructor.name}`);
    }
}

function SanitizeName(n: string): string {
    return n.replaceAll(".", "_");
}

function ConvertType(t: Type): string {
    if (t instanceof ConcreteType) {
        return SanitizeName(t.ir_type());
    } else if (t instanceof StructureType) {
        const generic_keys = [...t.generic_map.keys()];
        if (generic_keys.length && generic_keys.every(k => t.generic_map.get(k) instanceof ConcreteType)) {
            const mmn = `${t.fqn.repl_last(`__${t.fqn.last()}`)}_${generic_keys.map(x => (t.generic_map.get(x) as ConcreteType).name).join("_")}`;
            return SanitizeName(mmn);
        } else {
            throw new Error(`h ${t}`);
        }
    } else {
        throw new Error(`Don't know how to emit C for ${t.constructor.name} ${t}`);
    }
}

function GenerateFunctionPointerType(t: FunctionType, name: string): string {
    const args = [t.self_type, ...t.args];
    return `${ConvertType(t.return_type)}(*${name})(${args.map(ConvertType).join(", ")})`;
}

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

export function EmitJS(root: ASTElement) {
    if (root instanceof ClassElement) {
        console.log(`// Class: ${root.getFQN()}`);

        console.log(`var __${SanitizeName(root.getFQN().toString())}_stable = {`);
        root.methods.forEach(m => {
            console.log(`  ${m.getFQN().last()}: ${SanitizeName(m.getFQN().toString())},`);
        });
        console.log(`};\n`);

        console.log(`function __${SanitizeName(root.getFQN().toString())}_alloc() {`);
        console.log(`  return {`);
        console.log(`    __stable: __${SanitizeName(root.getFQN().toString())}_stable,`);
        root.fields.forEach(f => {
            console.log(`    ${f.name}: undefined,`);
        });
        console.log(`  };`);
        console.log(`}\n`);

        root.methods.forEach(EmitJS);
    } else if (root instanceof FunctionElement) {
        console.log(`// Function: ${root.getFQN()}`);
        console.log(`function ${SanitizeName(root.getFQN().toString())}(self, ${root.args.map(x => x.name).join(", ")}) {`);
        EmitJS(root.body);
        console.log(`}\n`);
    } else if (root instanceof CompoundStatementElement) {
        root.statements.forEach(EmitJS);
    } else if (root instanceof UnaryReturnStatement) {
        console.log(`  return ${ExpressionToJS(root.source)};`);
    } else if (root instanceof AssignmentStatement) {
        console.log(`  ${ExpressionToJS(root.lhs)} = ${ExpressionToJS(root.rhs)};`);
    } else if (root instanceof NullaryReturnStatement) {
        console.log(`  return;`);
    } else if (root instanceof LocalDefinitionStatement) {
        console.log(`  let ${root.name};`);
    } else if (root instanceof SimpleStatement) {
        console.log(`  ${ExpressionToJS(root.exp)};`);
    } else {
        throw new Error(`Don't know how to emit JS for ${root.constructor.name}`);
    }
}

const genexes_emitted = new Set<string>();

function ExpressionToJS(e: ExpressionElement): string {
    if (e instanceof FieldReferenceExpression) {
        return `${ExpressionToJS(e.source)}.${e.name}`;
    } else if (e instanceof NameExpression) {
        return e.name;
    } else if (e instanceof NumberExpression) {
        return e.value.toString();
    } else if (e instanceof ConstructorCallExpression) {
        return `__${SanitizeName(e.resolved_type.ir_type())}_alloc()`;
    } else if (e instanceof FunctionCallExpression) {
        return `${ExpressionToJS(e.source)}(${e.args.map(ExpressionToJS).join(", ")})`;
    } else if (e instanceof GeneratorTemporaryExpression) {
        if (!(genexes_emitted.has(e.uuid))) {
            // TODO
            console.log(`  const temp_${e.uuid} = ${ExpressionToJS(e.source)};`);
            genexes_emitted.add(e.uuid);
        }
        return `temp_${e.uuid}`;
    } else {
        throw new Error(`Don't know how to emit JS for ${e.constructor.name}`);
    }
}

function SanitizeName(n: string): string {
    return n.replaceAll(".", "_");
}

import { ASTElement } from "./ASTElement";
import { ClassElement } from "./ClassElement";
import { CompoundStatementElement } from "./CompoundStatementElement";
import { ConstructorCallExpression } from "./expression/ConstructorCallExpression";
import { FunctionCallExpression } from "./expression/FunctionCallExpression";
import { FieldReferenceExpression } from "./expression/FieldReferenceExpression";
import { NumberExpression } from "./expression/NumberExpression";
import { NameExpression } from "./expression/NameExpression";
import { FunctionElement } from "./FunctionElement";
import { UnaryReturnStatement } from "./statement/UnaryReturnStatement";
import { NullaryReturnStatement } from "./statement/NullaryReturnStatement";
import { LocalDefinitionStatement } from "./statement/LocalDefinitionStatement";
import { AssignmentStatement } from "./statement/AssignmentStatement";
import { SimpleStatement } from "./statement/SimpleStatement";
import { TypedItemElement } from "./TypedItemElement";
import { Scope } from "../type_inference/Scope";
import { GeneratorTemporaryExpression } from "./expression/GeneratorTemporaryExpression";
import { IndexExpression } from "./expression/IndexExpression";
import { FFICallExpression } from "./expression/FFICallExpression";
import { IfStatement } from "./statement/IfStatement";
import { ComparisonExpression } from "./expression/ComparisonExpression";
import { ArithmeticExpression } from "./expression/ArithmeticExpression";
import { TypeExpression } from "./expression/TypeExpression";
import { StringConstantExpression } from "./expression/StringConstantExpression";
import { WhileStatement } from "./statement/WhileStatement";

export function WalkAST(root: ASTElement, cb: (src: ASTElement, nearestScope: Scope) => void, _nearestScope?: Scope) {
    if (root instanceof ClassElement) {
        root.methods.forEach(x => {
            WalkAST(x, cb, _nearestScope);
        });
        root.fields.forEach(x => {
            WalkAST(x, cb, _nearestScope);
        });
        cb(root, _nearestScope);
    } else if (root instanceof FunctionElement) {
        WalkAST(root.body, cb, root.scope);
        cb(root, root.scope);
    } else if (root instanceof IndexExpression) {
        WalkAST(root.source, cb, _nearestScope);
        WalkAST(root.index, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof CompoundStatementElement) {
        root.statements.forEach(x => {
            WalkAST(x, cb, root.scope);
        });
        cb(root, root.scope);
    } else if (root instanceof AssignmentStatement
        || root instanceof ComparisonExpression
        || root instanceof ArithmeticExpression) {
        WalkAST(root.lhs, cb, _nearestScope);
        WalkAST(root.rhs, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof FunctionCallExpression) {
        WalkAST(root.source, cb, _nearestScope);
        root.args.forEach(x => {
            WalkAST(x, cb, _nearestScope);
        });
        cb(root, _nearestScope);
    } else if (root instanceof ConstructorCallExpression || root instanceof FFICallExpression) {
        root.args.forEach(x => {
            WalkAST(x, cb, _nearestScope);
        });
        cb(root, _nearestScope);
    } else if (root instanceof IfStatement
        || root instanceof WhileStatement) {
        WalkAST(root.condition, cb, _nearestScope);
        WalkAST(root.body, cb, root.body.scope);
        cb(root, _nearestScope);
    } else if (root instanceof FieldReferenceExpression
        || root instanceof UnaryReturnStatement
        || root instanceof GeneratorTemporaryExpression) {
        WalkAST(root.source, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof SimpleStatement) {
        WalkAST(root.exp, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof LocalDefinitionStatement) {
        WalkAST(root.initializer, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof NullaryReturnStatement
        || root instanceof NameExpression
        || root instanceof TypeExpression
        || root instanceof NumberExpression
        || root instanceof StringConstantExpression
        || root instanceof TypedItemElement) {
        cb(root, _nearestScope);
    } else {
        throw new Error(`can't walk a ${root.constructor.name} (${root} ${root.source_location})`);
    }
}

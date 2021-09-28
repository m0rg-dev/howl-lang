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
    } else if (root instanceof AssignmentStatement) {
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
    } else if (root instanceof FieldReferenceExpression
        || root instanceof UnaryReturnStatement
        || root instanceof GeneratorTemporaryExpression) {
        WalkAST(root.source, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof SimpleStatement) {
        WalkAST(root.exp, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof LocalDefinitionStatement
        || root instanceof NullaryReturnStatement
        || root instanceof NameExpression
        || root instanceof NumberExpression
        || root instanceof TypedItemElement) {
        cb(root, _nearestScope);
    } else {
        throw new Error(`can't walk a ${root.constructor.name}`);
    }
}

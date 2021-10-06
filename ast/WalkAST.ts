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
import { StringConstantExpression } from "./expression/StringConstantExpression";
import { WhileStatement } from "./statement/WhileStatement";
import { log } from "../driver/Driver";
import { LogLevel } from "../driver/Pass";
import { ExpressionElement } from "./ExpressionElement";
import { TypeElement } from "./TypeElement";

export function WalkAST(root: ASTElement, cb: (src: ASTElement, nearestScope: Scope, repl: (n: ASTElement) => void) => void, _nearestScope?: Scope, repl = (n: ASTElement) => { }) {
    if (root instanceof ClassElement) {
        root.methods.forEach((method, index) => {
            WalkAST(method, cb, _nearestScope, (n: ASTElement) => {
                if (n instanceof FunctionElement) {
                    root.methods[index] = n;
                } else {
                    log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace method ${method} on ${root} with non-FunctionElement ${n}`);
                    log(LogLevel.ERROR, "WalkAST", new Error().stack);
                }
            });
        });
        root.fields.forEach((field, index) => {
            WalkAST(field, cb, _nearestScope, (n: ASTElement) => {
                if (n instanceof TypedItemElement) {
                    root.fields[index] = n;
                } else {
                    log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace field ${field} on ${root} with non-TypedItemElement ${n}`);
                    log(LogLevel.ERROR, "WalkAST", new Error().stack);
                }
            });
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof FunctionElement) {
        WalkAST(root.body, cb, root.scope, (n: ASTElement) => {
            if (n instanceof CompoundStatementElement) {
                root.body = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace body of ${root} with non-CompoundStatementElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        cb(root, root.scope, repl);
    } else if (root instanceof IndexExpression) {
        WalkAST(root.source, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                root.source = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace source of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        WalkAST(root.index, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                root.index = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace index of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof CompoundStatementElement) {
        root.statements.forEach((statement, index) => {
            WalkAST(statement, cb, root.scope, (n: ASTElement) => {
                log(LogLevel.TRACE, `WalkAST`, `repl CompoundStatement ${root.statements[index]} ${n}`);
                root.statements[index] = n;
            });
        });
        cb(root, root.scope, repl);
    } else if (root instanceof AssignmentStatement
        || root instanceof ComparisonExpression
        || root instanceof ArithmeticExpression) {
        WalkAST(root.lhs, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                log(LogLevel.TRACE, `WalkAST`, `repl ${root.constructor.name} lhs ${root.lhs} ${n}`);
                root.lhs = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace lhs of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        WalkAST(root.rhs, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                log(LogLevel.TRACE, `WalkAST`, `repl ${root.constructor.name} rhs ${root.rhs} ${n}`);
                root.rhs = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace rhs of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof FunctionCallExpression) {
        WalkAST(root.source, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                root.source = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace source of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        root.args.forEach((argument, index) => {
            WalkAST(argument, cb, _nearestScope, (n: ASTElement) => {
                if (n instanceof ExpressionElement) {
                    root.args[index] = n;
                } else {
                    log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace argument ${index} of ${root} with non-ExpressionElement ${n}`);
                    log(LogLevel.ERROR, "WalkAST", new Error().stack);
                }
            });
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof ConstructorCallExpression || root instanceof FFICallExpression) {
        root.args.forEach((argument, index) => {
            WalkAST(argument, cb, _nearestScope, (n: ASTElement) => {
                if (n instanceof ExpressionElement) {
                    root.args[index] = n;
                } else {
                    log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace argument ${index} of ${root} with non-ExpressionElement ${n}`);
                    log(LogLevel.ERROR, "WalkAST", new Error().stack);
                }
            });
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof IfStatement
        || root instanceof WhileStatement) {
        WalkAST(root.condition, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                root.condition = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace condition of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        WalkAST(root.body, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof CompoundStatementElement) {
                root.body = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace body of ${root} with non-CompoundStatementElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof FieldReferenceExpression
        || root instanceof UnaryReturnStatement
        || root instanceof GeneratorTemporaryExpression) {
        WalkAST(root.source, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                root.source = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace source of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof SimpleStatement) {
        WalkAST(root.exp, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                log(LogLevel.TRACE, `WalkAST`, `repl SimpleStatement ${root.exp} ${n}`);
                root.exp = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace source of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof LocalDefinitionStatement) {
        WalkAST(root.initializer, cb, _nearestScope, (n: ASTElement) => {
            if (n instanceof ExpressionElement) {
                root.initializer = n;
            } else {
                log(LogLevel.ERROR, "WalkAST", `COMPILER BUG: Attempt to replace initializer of ${root} with non-ExpressionElement ${n}`);
                log(LogLevel.ERROR, "WalkAST", new Error().stack);
            }
        });
        cb(root, _nearestScope, repl);
    } else if (root instanceof NullaryReturnStatement
        || root instanceof NameExpression
        || root instanceof TypeElement
        || root instanceof NumberExpression
        || root instanceof StringConstantExpression
        || root instanceof TypedItemElement) {
        cb(root, _nearestScope, repl);
    } else {
        throw new Error(`can't walk a ${root.constructor.name} (${root} ${root.source_location})`);
    }
}

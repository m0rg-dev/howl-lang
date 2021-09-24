import { ASTElement } from "../ast/ASTElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ConstructorCallExpression, FieldReferenceExpression, FunctionCallExpression, NameExpression, NumberExpression } from "../ast/ExpressionElement";
import { FunctionElement } from "../ast/FunctionElement";
import { Scope } from "../ast/Scope";
import { AssignmentStatement, LocalDefinitionStatement, NullaryReturnStatement, SimpleStatement, UnaryReturnStatement } from "../ast/StatementElement";
import { Functions } from "../registry/Registry";
import { BaseType, FromExpression, TypeLocation, UnionType } from "./Type";

export function RunTypeInference() {
    Functions.forEach(f => {
        AddScopes(f, f);
    });

    Functions.forEach(f => {
        Walk(f, (x, s) => {
            if (x instanceof NumberExpression) {
                const idx = s.addType(new UnionType([
                    new BaseType("i8"),
                    new BaseType("i16"),
                    new BaseType("i32"),
                    new BaseType("i64"),
                ]));
                x.type = new TypeLocation(s, idx);
                console.error(`(NumericLiteral) ${x.getTypeLocation(s)}`);
            }
        });
    });

    Functions.forEach(f => {
        Walk(f, (x, s) => {
            if (x instanceof AssignmentStatement) {
                console.error(`(Assignment) ${x.lhs.getTypeLocation(s)} = ${x.rhs.getTypeLocation(s)}`);
                s.constraints.push(`${x.lhs.getTypeLocation(s)} = ${x.rhs.getTypeLocation(s)}`);
            }
        })
    })
}

export function AddScopes(el: FunctionElement | CompoundStatementElement, root: FunctionElement, parent?: Scope) {
    console.error(`(AddScopes) ${el}`);
    if (el instanceof FunctionElement) {
        const s = new Scope(el, undefined);
        s.addName("__return");
        s.addName("self");

        el.type.expressions.forEach(x => s.addType(FromExpression(x)));
        el.args.forEach(x => s.addName(x));

        el.addScope(s);
        AddScopes(el.body, root, el.scope);
    } else {
        const s = new Scope(root, parent);
        el.type.expressions.forEach(x => s.addType(FromExpression(x)));
        el.addScope(s);
        el.statements.forEach(x => {
            if (x instanceof CompoundStatementElement) {
                AddScopes(x, root, el.scope);
            } else if (x instanceof LocalDefinitionStatement) {
                el.scope.addName(x.name);
            }
        })
    }
}

function Walk(root: ASTElement, cb: (src: ASTElement, nearestScope: Scope) => void, _nearestScope?: Scope) {
    if (root instanceof FunctionElement) {
        cb(root, root.scope);
        Walk(root.body, cb, root.scope);
    } else if (root instanceof CompoundStatementElement) {
        cb(root, root.scope);
        root.statements.forEach(x => {
            Walk(x, cb, root.scope);
        });
    } else if (root instanceof AssignmentStatement) {
        cb(root, _nearestScope);
        Walk(root.lhs, cb, _nearestScope);
        Walk(root.rhs, cb, _nearestScope);
    } else if (root instanceof FunctionCallExpression) {
        cb(root, _nearestScope);
        Walk(root.source, cb, _nearestScope);
        root.args.forEach(x => {
            Walk(x, cb, _nearestScope);
        });
    } else if (root instanceof ConstructorCallExpression) {
        cb(root, _nearestScope);
        root.args.forEach(x => {
            Walk(x, cb, _nearestScope);
        });
    } else if (root instanceof FieldReferenceExpression
        || root instanceof UnaryReturnStatement) {
        cb(root, _nearestScope);
        Walk(root.source, cb, _nearestScope);
    } else if (root instanceof SimpleStatement) {
        cb(root, _nearestScope);
        Walk(root.exp, cb, _nearestScope);
    } else if (root instanceof LocalDefinitionStatement
        || root instanceof NullaryReturnStatement
        || root instanceof NameExpression
        || root instanceof NumberExpression) {
        cb(root, _nearestScope);
    } else {
        throw new Error(`can't walk a ${root.constructor.name}`);
    }
}

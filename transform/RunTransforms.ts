import { ASTElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ArithmeticExpression } from "../ast/expression/ArithmeticExpression";
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
import { SimpleStatement } from "../ast/statement/SimpleStatement";
import { WhileStatement } from "../ast/statement/WhileStatement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { SimpleTypeElement, TypeElement } from "../ast/TypeElement";
import { WalkAST } from "../ast/WalkAST";
import { emitError, log } from "../driver/Driver";
import { Errors } from "../driver/Errors";
import { LogLevel } from "../driver/Pass";
import { Classes } from "../registry/Registry";
import { ConcreteRawPointerType, ConcreteType } from "../type_inference/ConcreteType";
import { FunctionType } from "../type_inference/FunctionType";
import { Scope } from "../type_inference/Scope";
import { StaticTableType, StructureType } from "../type_inference/StructureType";
import { RawPointerType, Type } from "../type_inference/Type";

export function RunClassTransforms(c: ClassElement) {
    if (c.is_monomorphization) {
        c.fields.unshift(new TypedItemElement(c.source_location, "__stable", new StaticTableType(c)));
        c.methods.forEach(RunFunctionTransforms);
    }
}

export function RunFunctionTransforms(f: FunctionElement) {
    log(LogLevel.TRACE, `FunctionTransforms ${f.name}`, `Started.`);

    AddScopes(f, f);
    RunElementTransforms(f, f);
}

function RunElementTransforms(e: ASTElement, root: FunctionElement, repl = (n: ASTElement) => { }) {
    WalkAST(e, (src: ASTElement, nearestScope: Scope, repl: (n: ASTElement) => void) => {
        log(LogLevel.TRACE, `ElementTransforms ${e}`, `${src}`);

        // Operator overloading, where appropriate.
        if (src instanceof IndexExpression
            && Classes.has(src.source.resolved_type.name)
            && Classes.get(src.source.resolved_type.name).methods.some(x => x.name.split(".").pop() == "__index__")) {
            log(LogLevel.TRACE, `ElementTransforms ${e}`, `Overload: __index__`);
            let new_tree: ASTElement = new FunctionCallExpression(src.source_location, new FieldReferenceExpression(src.source_location, src.source, "__index__"), [src.index]);
            RunElementTransforms(new_tree, root, (n) => new_tree = n);
            repl(new_tree);
            return;
        }

        if (src instanceof AssignmentStatement
            && src.lhs instanceof FunctionCallExpression
            && src.lhs.source instanceof FieldReferenceExpression
            && src.lhs.source.name == "__index__") {
            log(LogLevel.TRACE, `ElementTransforms ${e}`, `Overload: __l_index__`);
            let new_tree: ASTElement = new SimpleStatement(src.source_location, new FunctionCallExpression(src.source_location, new FieldReferenceExpression(src.source_location, src.lhs.source.source, "__l_index__"), [src.lhs.args[0], src.rhs]));
            RunElementTransforms(new_tree, root, (n) => new_tree = n);
            repl(new_tree);
            return;
        }

        if (src instanceof FunctionCallExpression
            && src.source instanceof FieldReferenceExpression
            && src.source.source.resolved_type
            && Classes.has(src.source.source.resolved_type.name)) {
            log(LogLevel.TRACE, `ElementTransforms ${e}`, `Method call`);
            const gte = new GeneratorTemporaryExpression(src.source.source);
            let new_tree: ASTElement = new FunctionCallExpression(src.source_location,
                new FieldReferenceExpression(src.source.source_location,
                    new FieldReferenceExpression(src.source.source_location, gte, "__stable"), src.source.name),
                [gte, ...src.args]);
            RunElementTransforms(new_tree, root, (n) => new_tree = n);
            log(LogLevel.TRACE, `ElementTransforms ${e}`, `Method call ${new_tree}`);
            repl(new_tree);
            return;
        }

        if (src instanceof StringConstantExpression && !src.generated) {
            log(LogLevel.TRACE, `ElementTransforms ${e}`, `String literal`);
            src.generated = true;
            let new_tree: ASTElement = new FunctionCallExpression(src.source_location,
                new FieldReferenceExpression(src.source_location,
                    new TypeElement(src.source_location, new SimpleTypeElement(src.source_location, "lib.String"), []),
                    "fromBytes"),
                [src]);
            RunElementTransforms(new_tree, root, (n) => new_tree = n);
            repl(new_tree);
            return;
        }

        // Type analysis.
        if (src instanceof NameExpression) {
            log(LogLevel.TRACE, `ElementTransforms ${e}`, `    ${nearestScope.lookupName(src.name)}`);
            setExpressionType(src, nearestScope.lookupName(src.name));
        } else if (src instanceof NumberExpression) {
            setExpressionType(src, new ConcreteType("i64"));
        } else if (src instanceof FieldReferenceExpression) {
            if (src.source.resolved_type instanceof StaticTableType) {
                const field_type = makeConcrete(src.source.resolved_type.fields.get(src.name));
                if (field_type) {
                    setExpressionType(src, field_type);
                } else {
                    emitError(src.source_location[0], Errors.NO_SUCH_FIELD, `No such static member '${src.name}' on ${src.source.resolved_type.name}`, src.source_location);
                }
            } else if (Classes.has(src.source.resolved_type?.name)) {
                const field_type = Classes.get(src.source.resolved_type.name).type().getFieldType(src.name);
                if (field_type) {
                    setExpressionType(src, field_type);
                } else {
                    emitError(src.source_location[0], Errors.NO_SUCH_FIELD, `No such field '${src.name}' on ${src.source.resolved_type.name}`, src.source_location);
                }
            } else {
                emitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to access field ${src.name} on expression of non-class type ${src.source.resolved_type}`, src.source_location);
            }
        } else if (src instanceof AssignmentStatement) {
            const common_type = lowestCommonType(src.lhs.resolved_type, src.rhs.resolved_type);
            if (!common_type) {
                log(LogLevel.TRACE, `ElementTransforms ${e}`, `lhs: ${src.lhs}`);
                log(LogLevel.TRACE, `ElementTransforms ${e}`, `rhs: ${src.rhs}`);
                emitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to assign an expression of type ${src.rhs.resolved_type} to a location of type ${src.lhs.resolved_type}`, src.source_location);
            }
        } else if (src instanceof LocalDefinitionStatement) {
            const common_type = lowestCommonType(makeConcrete(src.type.asTypeObject()), src.initializer.resolved_type);
            if (!common_type) {
                log(LogLevel.TRACE, `ElementTransforms ${e}`, `source: ${src.type.asTypeObject()} ${makeConcrete(src.type.asTypeObject())}`);
                log(LogLevel.TRACE, `ElementTransforms ${e}`, `initializer: ${src.initializer.resolved_type}`);
                emitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to initialize a variable of type ${src.type.asTypeObject()} with an expression of type ${src.initializer.resolved_type}`, src.source_location);
            }
        } else if (src instanceof FFICallExpression) {
            src.resolved_type = new ConcreteType("any");
        } else if (src instanceof IndexExpression) {
            if (src.source.resolved_type instanceof ConcreteRawPointerType) {
                src.resolved_type = src.source.resolved_type.source_type;
            } else {
                emitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to index non-raw-pointer ${src.source}`, src.source_location);
            }
        } else if (src instanceof ArithmeticExpression) {
            const common_type = lowestCommonType(src.lhs.resolved_type, src.rhs.resolved_type);
            if (!common_type) {
                log(LogLevel.TRACE, `ElementTransforms ${e}`, `lhs: ${src.lhs}`);
                log(LogLevel.TRACE, `ElementTransforms ${e}`, `rhs: ${src.rhs}`);
                emitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to perform arithmetic on expressions of incompatible types ${src.lhs.resolved_type} and ${src.rhs.resolved_type}`, src.source_location);
            }
            src.resolved_type = makeConcrete(common_type);
        } else if (src instanceof FunctionCallExpression) {
            // TODO check arguments
            if (src.source.resolved_type instanceof FunctionType) {
                src.resolved_type = makeConcrete(src.source.resolved_type.return_type);
            } else {
                emitError(src.source.source_location[0], Errors.TYPE_MISMATCH, `Attempt to call non-function of type ${src.source.resolved_type}`, src.source.source_location);
            }
        } else if (src instanceof ConstructorCallExpression) {
            src.resolved_type = makeConcrete(src.source.asTypeObject());
        } else if (src instanceof TypeElement) {
            const t = src.asTypeObject();
            if (t instanceof StructureType) {
                src.resolved_type = new StaticTableType(Classes.get(t.name));
            } else {
                emitError(src.source_location[0], Errors.TYPE_MISMATCH, `Non-classes may not be used as type literals`, src.source_location);
            }
        }
    }, root.body.scope, repl);
}

function makeConcrete(t: Type): ConcreteType {
    if (t instanceof ConcreteType) {
        return t;
    }

    if (t instanceof StructureType && t.isMonomorphizable()) {
        return t.Monomorphize();
    }

    if (t instanceof RawPointerType) {
        const sub = makeConcrete(t.source);
        if (sub) {
            return new ConcreteRawPointerType(sub);
        }
    }

    log(LogLevel.ERROR, `makeConcrete`, `COMPILER BUG: Don't know how to makeConcrete on ${t} (${t.constructor.name})`);

    return undefined;
}

function setExpressionType(exp: ExpressionElement, t: Type) {
    exp.resolved_type = makeConcrete(t);
}

function lowestCommonType(a: Type, b: Type): Type {
    if (!(a instanceof ConcreteType)) {
        log(LogLevel.ERROR, `setExpressionType`, `COMPILER BUG: lowestCommonType called with non-ConcreteType ${a}`);
        return;
    }

    if (!(b instanceof ConcreteType)) {
        log(LogLevel.ERROR, `setExpressionType`, `COMPILER BUG: lowestCommonType called with non-ConcreteType ${b}`);
        return;
    }

    if (a.name == "any") return b;
    if (b.name == "any") return a;

    if (a.equals(b)) return a;
    if (a.name.match(/^[iu](8|16|32|64)$/) && b.name.match(/^[iu](8|16|32|64)$/)) {
        // TODO sign
        const ba = Number.parseInt(a.name.substr(1));
        const bb = Number.parseInt(b.name.substr(1));
        const target = Math.min(ba, bb);
        return new ConcreteType(a.name.charAt(0) + target.toString());
    }

    return undefined;
}

function AddScopes(el: FunctionElement | CompoundStatementElement, root: FunctionElement, parent?: Scope) {
    log(LogLevel.TRACE, `TypeInference ${el}`, `(AddScopes) ${el}`);
    if (el instanceof FunctionElement) {
        const s = new Scope(el, undefined);
        s.addType(el.return_type, "__return");
        s.addType(el.self_type, "self");

        el.args.forEach(x => {
            s.addType(x.type, x.name);
        });

        el.addScope(s);
        AddScopes(el.body, root, el.scope);
    } else {
        const s = new Scope(root, parent);
        el.addScope(s);
        el.statements.forEach(x => {
            if (x instanceof CompoundStatementElement) {
                AddScopes(x, root, el.scope);
            } else if (x instanceof IfStatement || x instanceof WhileStatement) {
                AddScopes(x.body, root, el.scope);
            } else if (x instanceof LocalDefinitionStatement) {
                el.scope.addType(makeConcrete(x.type.asTypeObject()), x.name);
            }
        })
    }
}

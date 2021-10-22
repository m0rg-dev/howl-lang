import { ASTElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ArithmeticExpression } from "../ast/expression/ArithmeticExpression";
import { CastExpression } from "../ast/expression/CastExpression";
import { ConstructorCallExpression } from "../ast/expression/ConstructorCallExpression";
import { FFICallExpression } from "../ast/expression/FFICallExpression";
import { FieldReferenceExpression } from "../ast/expression/FieldReferenceExpression";
import { FunctionCallExpression } from "../ast/expression/FunctionCallExpression";
import { GeneratorTemporaryExpression } from "../ast/expression/GeneratorTemporaryExpression";
import { IndexExpression } from "../ast/expression/IndexExpression";
import { MacroCallExpression } from "../ast/expression/MacroCallExpression";
import { NameExpression } from "../ast/expression/NameExpression";
import { NumberExpression } from "../ast/expression/NumberExpression";
import { StringConstantExpression } from "../ast/expression/StringConstantExpression";
import { ExpressionElement } from "../ast/ExpressionElement";
import { FunctionElement, OverloadedFunctionElement } from "../ast/FunctionElement";
import { AssignmentStatement } from "../ast/statement/AssignmentStatement";
import { IfStatement } from "../ast/statement/IfStatement";
import { LocalDefinitionStatement } from "../ast/statement/LocalDefinitionStatement";
import { SimpleStatement } from "../ast/statement/SimpleStatement";
import { TryCatchStatement } from "../ast/statement/TryCatchStatement";
import { WhileStatement } from "../ast/statement/WhileStatement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { SimpleTypeElement, TypeElement } from "../ast/TypeElement";
import { WalkAST } from "../ast/WalkAST";
import { EmitError, EmitLog } from "../driver/Driver";
import { Errors } from "../driver/Errors";
import { LogLevel } from "../driver/Pass";
import { Classes, TransformerRegistry } from "../registry/Registry";
import { ConcreteRawPointerType, ConcreteType } from "../type_inference/ConcreteType";
import { FunctionType } from "../type_inference/FunctionType";
import { Scope } from "../type_inference/Scope";
import { StaticTableType, StructureType } from "../type_inference/StructureType";
import { RawPointerType, Type } from "../type_inference/Type";

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

        if (src instanceof FunctionCallExpression
            && src.source instanceof FieldReferenceExpression
            && src.source.source.resolved_type
            && Classes.has(src.source.source.resolved_type.name)) {
            EmitLog(LogLevel.TRACE, `ElementTransforms ${e} `, `Method call`);
            const gte = new GeneratorTemporaryExpression(src.source.source);
            let new_tree: ASTElement = new FunctionCallExpression(src.source_location,
                new FieldReferenceExpression(src.source.source_location,
                    new FieldReferenceExpression(src.source.source_location, gte, "__stable"), src.source.name),
                [gte, ...src.args]);
            RunElementTransforms(new_tree, root, (n) => new_tree = n);
            EmitLog(LogLevel.TRACE, `ElementTransforms ${e} `, `Method call ${new_tree} `);
            repl(new_tree);
            return;
        }

        if (src instanceof StringConstantExpression && !src.generated) {
            EmitLog(LogLevel.TRACE, `ElementTransforms ${e} `, `String literal`);
            src.resolved_type = new ConcreteRawPointerType(new ConcreteType("u8"));
            src.generated = true;
            let new_tree: ASTElement = new FunctionCallExpression(src.source_location,
                new FieldReferenceExpression(src.source_location,
                    new TypeElement(src.source_location, new SimpleTypeElement(src.source_location, "lib.string.String"), []),
                    "fromBytes"),
                [src, new FFICallExpression(src.source_location, "strlen", [src])]);
            RunElementTransforms(new_tree, root, (n) => new_tree = n);
            repl(new_tree);
            return;
        }

        // Type analysis.
        if (src instanceof NameExpression) {
            EmitLog(LogLevel.TRACE, `ElementTransforms ${e} `, `    ${nearestScope.lookupName(src.name)} `);
            setExpressionType(src, nearestScope.lookupName(src.name));
        } else if (src instanceof NumberExpression) {
            setExpressionType(src, new ConcreteType("i64"));
        } else if (src instanceof FieldReferenceExpression) {
            if (src.source.resolved_type instanceof StaticTableType) {
                const field_type = makeConcrete(src.source.resolved_type.fields.get(src.name));
                if (field_type) {
                    setExpressionType(src, field_type);
                } else {
                    EmitError(src.source_location[0], Errors.NO_SUCH_FIELD, `No such static member '${src.name}' on ${src.source.resolved_type.name}`, src.source_location);
                }
            } else if (Classes.has(src.source.resolved_type?.name)) {
                const field_type = Classes.get(src.source.resolved_type.name).type().getFieldType(src.name);
                if (field_type) {
                    setExpressionType(src, field_type);
                } else {
                    EmitError(src.source_location[0], Errors.NO_SUCH_FIELD, `No such field '${src.name}' on ${src.source.resolved_type.name}`, src.source_location);
                    EmitLog(LogLevel.TRACE, `ElementTransforms ${e}`, "valid fields are:");
                    Classes.get(src.source.resolved_type.name).type()["fields"].forEach((v, k) => {
                        EmitLog(LogLevel.TRACE, `ElementTransforms ${e}`, `  ${k} => ${v}`);
                    })
                }
            } else {
                EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to access field ${src.name} on expression of non-class type ${src.source.resolved_type}`, src.source_location);
            }
        } else if (src instanceof AssignmentStatement) {
            const common_type = lowestCommonType(src.lhs.resolved_type, src.rhs.resolved_type);
            if (!common_type) {
                EmitLog(LogLevel.TRACE, `ElementTransforms ${e}`, `lhs: ${src.lhs}`);
                EmitLog(LogLevel.TRACE, `ElementTransforms ${e}`, `rhs: ${src.rhs}`);
                EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to assign an expression of type ${src.rhs.resolved_type} to a location of type ${src.lhs.resolved_type}`, src.source_location);
            }
            if (!src.rhs.resolved_type.equals(common_type)) {
                src.rhs = CastExpression.fromExpression(src.rhs, common_type);
            }
            if (!src.lhs.resolved_type.equals(common_type)) {
                src.lhs = CastExpression.fromExpression(src.lhs, common_type);
            }
        } else if (src instanceof LocalDefinitionStatement) {
            const common_type = lowestCommonType(makeConcrete(src.type.asTypeObject()), src.initializer.resolved_type);
            if (!common_type) {
                EmitLog(LogLevel.TRACE, `ElementTransforms ${e}`, `source: ${src.type.asTypeObject()} ${makeConcrete(src.type.asTypeObject())
                    } `);
                EmitLog(LogLevel.TRACE, `ElementTransforms ${e} `, `initializer: ${src.initializer.resolved_type} `);
                EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to initialize a variable of type ${src.type.asTypeObject()} with an expression of type ${src.initializer.resolved_type}`, src.source_location);
            }
            if (!src.initializer.resolved_type.equals(common_type)) {
                src.initializer = CastExpression.fromExpression(src.initializer, common_type);
            }
        } else if (src instanceof FFICallExpression) {
            src.resolved_type = new ConcreteType("any");
        } else if (src instanceof IndexExpression) {
            if (src.source.resolved_type instanceof ConcreteRawPointerType) {
                src.resolved_type = src.source.resolved_type.source_type;
            } else {
                EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to index non-raw-pointer ${src.source} `, src.source_location);
            }
        } else if (src instanceof ArithmeticExpression) {
            const common_type = lowestCommonType(src.lhs.resolved_type, src.rhs.resolved_type);
            if (!common_type) {
                EmitLog(LogLevel.TRACE, `ElementTransforms ${e} `, `lhs: ${src.lhs} `);
                EmitLog(LogLevel.TRACE, `ElementTransforms ${e} `, `rhs: ${src.rhs} `);
                EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Attempt to perform arithmetic on expressions of incompatible types ${src.lhs.resolved_type} and ${src.rhs.resolved_type} `, src.source_location);
            }
            if (!src.rhs.resolved_type.equals(common_type)) {
                src.rhs = CastExpression.fromExpression(src.rhs, common_type);
            }
            if (!src.lhs.resolved_type.equals(common_type)) {
                src.lhs = CastExpression.fromExpression(src.lhs, common_type);
            }
            src.resolved_type = makeConcrete(common_type);
        } else if (src instanceof FunctionCallExpression) {
            const s2 = src;
            if (src.source.resolved_type instanceof FunctionType) {
                src.resolved_type = makeConcrete(src.source.resolved_type.return_type);
                let arg_offset = 1;
                if ((src.source.resolved_type as FunctionType).is_static) {
                    arg_offset = 0;
                }
                src.args.slice(arg_offset).forEach((arg, index) => {
                    EmitLog(LogLevel.TRACE, `ElementTransforms ${e}`, `${index} ${(s2.source.resolved_type as FunctionType).args[index]}`);
                    const common_type = lowestCommonType(makeConcrete((s2.source.resolved_type as FunctionType).args[index]), arg.resolved_type);
                    if (!common_type) {
                        EmitError(arg.source_location[0], Errors.TYPE_MISMATCH, `Attempt to use argument of type ${arg.resolved_type} as argument to function expecting ${(s2.source.resolved_type as FunctionType).args[index]} `, arg.source_location);
                    }
                    if (!arg.resolved_type.equals(common_type)) {
                        s2.args[index + arg_offset] = CastExpression.fromExpression(arg, common_type);
                    }
                });
            } else {
                EmitError(src.source.source_location[0], Errors.TYPE_MISMATCH, `Attempt to call non-function of type ${src.source.resolved_type}`, src.source.source_location);
            }
        } else if (src instanceof ConstructorCallExpression) {
            src.resolved_type = makeConcrete(src.source.asTypeObject());
        } else if (src instanceof TypeElement) {
            const t = src.asTypeObject();
            if (t instanceof StructureType) {
                src.resolved_type = new StaticTableType(Classes.get(t.name));
            } else {
                EmitError(src.source_location[0], Errors.TYPE_MISMATCH, `Non-classes (such as ${t}) may not be used as type literals`, src.source_location);
            }
        }
    }, root.body.scope, repl);
}

export function makeConcrete(t: Type): ConcreteType {
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

    EmitLog(LogLevel.ERROR, `makeConcrete`, `COMPILER BUG: Don't know how to makeConcrete on ${t} (${t?.constructor.name})`);
    EmitLog(LogLevel.ERROR, `setExpressionType`, `${(new Error()).stack}`);
    process.exit(1);
}

function setExpressionType(exp: ExpressionElement, t: Type) {
    exp.resolved_type = makeConcrete(t);
}

function lowestCommonType(a: Type, b: Type): Type {
    if (!(a instanceof ConcreteType)) {
        EmitLog(LogLevel.ERROR, `setExpressionType`, `COMPILER BUG: lowestCommonType called with non-ConcreteType ${a}`);
        EmitLog(LogLevel.ERROR, `setExpressionType`, `${(new Error()).stack}`);
        process.exit(1);
    }

    if (!(b instanceof ConcreteType)) {
        EmitLog(LogLevel.ERROR, `setExpressionType`, `COMPILER BUG: lowestCommonType called with non-ConcreteType ${b}`);
        EmitLog(LogLevel.ERROR, `setExpressionType`, `${(new Error()).stack}`);
        process.exit(1);
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

    if (Classes.has(a.name) && Classes.get(a.name).hierarchyIncludes(b.name)) return b;
    if (Classes.has(b.name) && Classes.get(b.name).hierarchyIncludes(a.name)) return a;

    return undefined;
}

export function CheckTypeCompatibility(a: Type, b: Type): boolean {
    return !!lowestCommonType(makeConcrete(a), makeConcrete(b));
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
                    c.body.scope.addType(makeConcrete(c.type.asTypeObject()), c.local_name);
                })
            } else if (x instanceof LocalDefinitionStatement) {
                el.scope.addType(makeConcrete(x.type.asTypeObject()), x.name);
            }
        })
    }
}

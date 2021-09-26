import { ASTElement } from "../ast/ASTElement";
import { ClassElement } from "../ast/ClassElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ConstructorCallExpression, ExpressionElement, FieldReferenceExpression, FunctionCallExpression, NameExpression, NumberExpression } from "../ast/ExpressionElement";
import { FunctionElement } from "../ast/FunctionElement";
import { AssignmentStatement, LocalDefinitionStatement, NullaryReturnStatement, SimpleStatement, UnaryReturnStatement } from "../ast/StatementElement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { Classes } from "../registry/Registry";
import { Scope } from "./Scope";
import { AnyType, ConsumedType, FieldReferenceType, FunctionCallType, FunctionType, GenericType, IntersectionType, ClosureType, ScopeReferenceType, StructureType, Type, TypeLocation, UnionType, UnitType } from "./Type";

export function RunTypeInference(f: FunctionElement) {
    AddScopes(f, f);

    Walk(f, (x, s) => {
        if (x instanceof NumberExpression) {
            const idx = s.addType(new UnionType([
                new UnitType("i8"),
                new UnitType("i16"),
                new UnitType("i32"),
                new UnitType("i64"),
            ]));
            x.type = new TypeLocation(s, idx);
            console.error(`(NumericLiteral) ${x.type}`);
        } else if (x instanceof ConstructorCallExpression) {
            const idx = s.addType(x.source);
            x.type = new TypeLocation(s, idx);
            console.error(`(ConstructorCall) ${x.type}`);
        } else if (x instanceof NameExpression) {
            x.type = s.lookupName(x.name);
            console.error(`(Name) ${x.type}`);
        }
    });

    Walk(f, (x, s) => {
        if (x instanceof AssignmentStatement) {
            console.error(`(Assignment) ${x.lhs.type} = ${x.rhs.type}`);
            const idx = s.addType(new IntersectionType(x.lhs.type, x.rhs.type));
            ReplaceTypes(s.root, x.lhs.type, new TypeLocation(s, idx));
            ReplaceTypes(s.root, x.rhs.type, new TypeLocation(s, idx));
        } else if (x instanceof FieldReferenceExpression) {
            const idx = s.addType(new FieldReferenceType(x.source.type, x.name));
            x.type = new TypeLocation(s, idx);
            console.error(`(FieldReference) ${x.type}`);
        } else if (x instanceof FunctionCallExpression) {
            const idx = s.addType(new FunctionCallType(x.source.type));
            x.type = new TypeLocation(s, idx);
            console.error(`(FunctionCall) ${x.type}`);
        }
    })

    let changed = true;
    while (changed) {
        changed = false;
        Walk(f, (x, s) => {
            if (x instanceof FunctionElement || x instanceof CompoundStatementElement) {
                changed ||= ApplyRulesToScope(x.scope, x);
            } else if (x instanceof FunctionCallExpression) {
                if (x.source.type.get() instanceof FunctionType) {
                    console.error(`(FunctionCall) ${x.source.type.get()}`);
                    const ft = x.source.type.get() as FunctionType;
                    if (!ft.args.every(x => x instanceof ScopeReferenceType)) return;
                    if (ft._propagated) return;
                    ft._propagated = true;

                    x.args.forEach((arg, arg_index) => {
                        if (ft.args[arg_index] instanceof ScopeReferenceType) {
                            const srt = ft.args[arg_index] as ScopeReferenceType;
                            const orig_scope = srt.source.location;
                            const orig_index = srt.source.index;

                            const new_index = orig_scope.addType(srt.source.get());
                            const t = new IntersectionType(arg.type, new TypeLocation(orig_scope, new_index));
                            orig_scope.types[orig_index] = t;
                            console.error(`(FunctionArgument) ${arg.type} ${ft.args[arg_index]} => ${t}`);
                        }
                    });
                    changed = true;
                }
            }
        })
    }
}

function ApplyRulesToScope(s: Scope, el: ASTElement): boolean {
    let rc = false;
    s.types.forEach((t, index) => {
        if (t instanceof ClosureType && t.evaluable()) {
            const new_type = t.evaluator()();
            console.error(`(EvaluatePi) ${t} => ${new_type}`);
            s.types[index] = new_type;
            rc = true;
        } else if (t instanceof StructureType) {
            const generic_map = t.generic_map || new Map<string, Type>();
            if (MapGenerics(s, t, () => { }, generic_map)) {
                rc = true;
                t.generic_map = generic_map;
                console.error(`(MapGenerics) ${t}`);
            }

            const generic_keys = [...generic_map.keys()];
            if (generic_keys.length && generic_keys.every(k => generic_map.get(k) instanceof UnitType) && Classes.has(t.name)) {
                console.error(`(Monomorphize) ${t.name}<${generic_keys.map(x => generic_map.get(x).toString()).join(", ")}>`);
                const new_class = Classes.get(t.name).clone();

                new_class.name = `__${t.name}_${generic_keys.map(x => (generic_map.get(x) as UnitType).name).join("_")}`;

                Walk(new_class, (x, s) => {
                    if (x instanceof FunctionElement) {
                        if (x.return_type instanceof GenericType) x.return_type = generic_map.get(x.return_type.name);
                        x.args.forEach((arg) => {
                            if (arg.type instanceof GenericType) arg.type = generic_map.get(arg.type.name);
                        });
                    } else if (x instanceof TypedItemElement) {
                        if (x.type instanceof GenericType) x.type = generic_map.get(x.type.name);
                    }
                });
                new_class.generics = [];
                new_class.methods.forEach(x => {
                    x.self_type = new_class.type();
                });
                new_class.methods.forEach(RunTypeInference);

                Classes.set(new_class.name, new_class);

                s.types[index] = new UnitType(new_class.name);
                rc = true;
            }
        } else if (t instanceof ScopeReferenceType) {
            console.error(`(LiftScope) ${index}@${s.n} => ${t.source}`);
            ReplaceTypes(s.root, new TypeLocation(s, index), t.source);
            s.types[index] = new ConsumedType();
            rc = true;
        } else if (t instanceof IntersectionType) {
            const t0 = t.source0.get();
            const t1 = t.source1.get();

            if (t0 instanceof StructureType && t1 instanceof StructureType
                && t0.name == t1.name
                && t0.generic_map && t1.generic_map) {
                console.error(`(IntersectSigma) ${t0} ${t1}`);
                t0.generic_map.forEach((old_type, generic_key) => {
                    const ot1 = t1.generic_map.get(generic_key);
                    if (old_type instanceof ScopeReferenceType && ot1 instanceof ScopeReferenceType) {
                        console.error(`  (IntersectSigma) ${generic_key} ${old_type}`);
                        const orig_scope = old_type.source.location;
                        const orig_index = old_type.source.index;

                        const new_index = orig_scope.addType(old_type.source.get());
                        const t = new IntersectionType(ot1.source, new TypeLocation(orig_scope, new_index));
                        orig_scope.types[orig_index] = t;
                    }
                });
                s.types[index] = t0;
            }
        }
    });
    return rc;
}

function ReplaceTypes(el: ASTElement, from: TypeLocation, to: TypeLocation) {
    console.error(`(ReplaceTypes) ${from} -> ${to}`);
    Walk(el, (x) => {
        if (x instanceof ExpressionElement) {
            if (x.type && x.type.location == from.location && x.type.index == from.index) {
                x.type = to;
            }
        }
    });
}

function MapGenerics(s: Scope, t: Type, repl: (n: Type) => void, map: Map<string, Type>): boolean {
    let rc = false;
    if (t instanceof GenericType) {
        if (!map.has(t.name)) {
            const new_idx = s.addType(new AnyType());
            const new_type = new ScopeReferenceType(new TypeLocation(s, new_idx));
            map.set(t.name, new_type);
        }
        console.error(`(LiftGenerics) ${t} => ${map.get(t.name)}`);
        repl(map.get(t.name));
        rc = true;
    } else if (t instanceof ScopeReferenceType && t.source.get() instanceof UnitType) {
        console.error(`(LiftConcrete) ${t} => ${t.source.get()}`);
        repl(t.source.get());
        rc = true;
    } else if (t instanceof StructureType) {
        const updates = new Map<string, Type>();
        t.fields.forEach((old_type, field_name) => {
            if (MapGenerics(s, old_type, (n: Type) => updates.set(field_name, n), map)) rc = true;
        });
        t.generic_map?.forEach((old_type, generic_name) => {
            if (MapGenerics(s, old_type, (n: ScopeReferenceType) => t.generic_map.set(generic_name, n), map)) rc = true;
        })
        updates.forEach((x, y) => t.fields.set(y, x));
    } else if (t instanceof FunctionType) {
        if (MapGenerics(s, t.return_type, (n: Type) => t.return_type = n, map)) rc = true;
        if (MapGenerics(s, t.self_type, (n: Type) => t.self_type = n, map)) rc = true;
        t.args.forEach((old_type, index) => {
            if (MapGenerics(s, old_type, (n: Type) => t.args[index] = n, map)) rc = true;
        });
    }
    return rc;
}

export function AddScopes(el: FunctionElement | CompoundStatementElement, root: FunctionElement, parent?: Scope) {
    console.error(`(AddScopes) ${el}`);
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
            } else if (x instanceof LocalDefinitionStatement) {
                el.scope.addType(x.type, x.name);
            }
        })
    }
}

function Walk(root: ASTElement, cb: (src: ASTElement, nearestScope: Scope) => void, _nearestScope?: Scope) {
    if (root instanceof ClassElement) {
        root.methods.forEach(x => {
            Walk(x, cb, _nearestScope);
        });
        root.fields.forEach(x => {
            Walk(x, cb, _nearestScope);
        });
        cb(root, _nearestScope);
    } else if (root instanceof FunctionElement) {
        Walk(root.body, cb, root.scope);
        cb(root, root.scope);
    } else if (root instanceof CompoundStatementElement) {
        root.statements.forEach(x => {
            Walk(x, cb, root.scope);
        });
        cb(root, root.scope);
    } else if (root instanceof AssignmentStatement) {
        Walk(root.lhs, cb, _nearestScope);
        Walk(root.rhs, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof FunctionCallExpression) {
        Walk(root.source, cb, _nearestScope);
        root.args.forEach(x => {
            Walk(x, cb, _nearestScope);
        });
        cb(root, _nearestScope);
    } else if (root instanceof ConstructorCallExpression) {
        root.args.forEach(x => {
            Walk(x, cb, _nearestScope);
        });
        cb(root, _nearestScope);
    } else if (root instanceof FieldReferenceExpression
        || root instanceof UnaryReturnStatement) {
        Walk(root.source, cb, _nearestScope);
        cb(root, _nearestScope);
    } else if (root instanceof SimpleStatement) {
        Walk(root.exp, cb, _nearestScope);
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

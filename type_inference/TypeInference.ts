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

    // First, add types to any expression whose type can be determined at this
    // point. Numbers are always i8 | i16 | i32 | i64, constructor calls have
    // their own type, and names are already in the scope table from AddScopes.
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

    // Now, add type constraints to any expression whose type constraints can be
    // determined. Assignments always generate intersections, field references
    // always have a known field name, and generating a FunctionCallType doesn't
    // require knowledge of the exact type of the source element.
    Walk(f, (x, s) => {
        if (x instanceof AssignmentStatement) {
            console.error(`(Assignment) ${x.lhs.type} = ${x.rhs.type}`);
            const idx = s.addType(new IntersectionType(x.lhs.type, x.rhs.type));
            // This is the "easy" way to do back-propagation. We know at this
            // point that nothing references x.lhs.type or x.rhs.type from a
            // ScopeReferenceType (since there's no way to create one at this
            // point), so we can just run ReplaceTypes.
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

    // Propagate types and constraints.
    let changed = true;
    while (changed) {
        changed = false;
        Walk(f, (x) => {
            if (x instanceof FunctionElement || x instanceof CompoundStatementElement) {
                // Type propagation and constraint evaluation at the scope level
                // rather than the AST level. This is capable of handling most
                // expression types, but stuff like function calls where the
                // argument list is stored in the AST need to be handled
                // separately.
                changed ||= ApplyRulesToScope(x.scope);
            } else if (x instanceof FunctionCallExpression) {
                if (x.source.type.get() instanceof FunctionType) {
                    // This is the second half of function call handling. Once
                    // we know the type of a function call's source, we can
                    // back-propagate the type constraints on its arguments.
                    console.error(`(FunctionCall) ${x.source.type.get()}`);
                    const ft = x.source.type.get() as FunctionType;
                    if (!ft.args.every(x => x instanceof ScopeReferenceType)) return;
                    if (ft._propagated) return;
                    ft._propagated = true;

                    x.args.forEach((arg, arg_index) => {
                        // This is the "hard" way to do back-propagation.
                        // SwivelIntersection is more powerful but less flexible
                        // than ReplaceTypes - it doesn't let you merge type
                        // registers like we did for AssignmentExpressions.
                        if (ft.args[arg_index] instanceof ScopeReferenceType) {
                            SwivelIntersection((ft.args[arg_index] as ScopeReferenceType).source, arg.type);
                            console.error(`(FunctionArgument) ${arg.type} ${ft.args[arg_index]}`);
                        }
                    });
                    changed = true;
                }
            }
        })
    }

    // Remove any un-referenced types from scopes to make the graph output a little cleaner.
    Walk(f, (x) => {
        if (x instanceof ExpressionElement) {
            x.type.location.gc_temp.add(x.type.index);
        }
    });

    Walk(f, (x) => {
        if (x instanceof FunctionElement || x instanceof CompoundStatementElement) {
            x.scope.types.forEach((type, index) => {
                if (!x.scope.gc_temp.has(index)) {
                    x.scope.types[index] = new ConsumedType();
                }
            });
        }
    })
}

function ApplyRulesToScope(s: Scope): boolean {
    let rc = false;
    s.types.forEach((t, index) => {
        if (t instanceof ClosureType && t.evaluable()) {
            // EvaluateClosure: Replace any evaluable ClosureType with its
            // result.
            const new_type = t.evaluator()();
            console.error(`(EvaluateClosure) ${t} => ${new_type}`);
            s.types[index] = new_type;
            rc = true;
        } else if (t instanceof StructureType) {
            // A whole lot of StructureType-related stuff that probably should
            // get split out.

            // First, MapGenerics - replaces any generic elements within a
            // StructureType with a reference to a type register in the local
            // scope. In other words, this is what brings the T in Structure<T>
            // out into the scope of whatever's referencing it.
            const generic_map = t.generic_map || new Map<string, Type>();
            if (MapGenerics(s, t, () => { }, generic_map)) {
                rc = true;
                t.generic_map = generic_map;
                console.error(`(MapGenerics) ${t}`);
            }

            // Now, see if we can monomorphize the type, if necessary. This is
            // possible if it has generics (if it doesn't, it's already
            // monomorphized and we need to *not* do so again), and all the
            // generic fields are of known type.
            const generic_keys = [...generic_map.keys()];
            if (generic_keys.length && generic_keys.every(k => generic_map.get(k) instanceof UnitType) && Classes.has(t.fqn.toString())) {
                console.error(`(Monomorphize) ${t.fqn.toString()}<${generic_keys.map(x => generic_map.get(x).toString()).join(", ")}>`);
                // This is basically a template evaluation. We'll clone the original class...
                const new_class = Classes.get(t.fqn.toString()).clone();

                new_class.setName(`__${t.fqn.last()}_${generic_keys.map(x => (generic_map.get(x) as UnitType).name).join("_")}`);
                // ...replace all the GenericTypes in its AST...
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
                // ...update the type of `self` on all its methods...
                new_class.methods.forEach(x => {
                    x.self_type = new_class.type();
                    x.setParent(new_class);
                });
                // ...and run type checking on the result. I might eventually
                // add support to the type checker for handling generic types
                // directly, which would let us type-check classes prior to
                // template substitution and probably result in better type
                // error handling.
                new_class.methods.forEach(RunTypeInference);

                Classes.set(new_class.getFQN().toString(), new_class);

                // Now, we can just treat it as a concrete type.
                s.types[index] = new UnitType(new_class.getFQN().toString());
                rc = true;
            }
        } else if (t instanceof ScopeReferenceType) {
            // LiftScope: Handles the case where you have a ScopeReferenceType
            // directly in a Scope instead of as a sub-type. This just lets us
            // not have to handle indirecting through ScopeReferenceTypes
            // anytime we're using a type.
            console.error(`(LiftScope) ${index}@${s.n} => ${t.source}`);
            ReplaceTypes(s.root, new TypeLocation(s, index), t.source);
            s.types[index] = new ConsumedType();
            rc = true;
        } else if (t instanceof IntersectionType) {
            // IntersectStructure: Handles intersections between structure
            // types. This requires special handling because performing that
            // intersection requires side effects (the SwivelIntersection call),
            // so we can't just do it in IntersectionType.evaluator.
            const t0 = t.source0.get();
            const t1 = t.source1.get();

            // The actual intersection is handled by intersecting the types'
            // generic fields. We can assume that if two types have the same
            // name, all their components will be identical (= intersectable)
            // down to their generics, so we can distribute the intersection
            // over the generic fields rather than having to interact with the
            // types' contents.
            if (t0 instanceof StructureType && t1 instanceof StructureType
                && t0.fqn.equals(t1.fqn)
                && t0.generic_map && t1.generic_map) {
                console.error(`(IntersectStructure) ${t0} ${t1}`);
                t0.generic_map.forEach((old_type, generic_key) => {
                    const ot1 = t1.generic_map.get(generic_key);
                    if (old_type instanceof ScopeReferenceType && ot1 instanceof ScopeReferenceType) {
                        console.error(`  (IntersectStructure) ${generic_key} ${old_type}`);
                        SwivelIntersection(old_type.source, ot1.source);
                    }
                });
                s.types[index] = t0;
            }
        }
    });
    return rc;
}

// Helper function to replace a type register with an intersection between that
// register and a new type.
// For example, if you have:
// #2   (i32 | i64)
// #3   i32
// and you call SwivelIntersection(#2, #3), that turns into
// #2   #3 ∩ #4
// #3   i32
// #4   (i32 | i64)
//
// This allows you to intersect the type of #2 with #3 while keeping the result
// of that intersection in #2. It's a bit of a hack, but that lets you take that
// intersection without having to change references to #2 to point somewhere
// else - very useful if there are ScopeReferenceTypes referencing #2 in play.
function SwivelIntersection(source: TypeLocation, new_type: TypeLocation) {
    const orig_scope = source.location;
    const orig_index = source.index;

    const new_index = orig_scope.addType(source.get());
    const t = new IntersectionType(new_type, new TypeLocation(orig_scope, new_index));
    orig_scope.types[orig_index] = t;
}

// Replaces any references to one TypeLocation with another. This only affects
// types directly referenced by an Expression as its result location - if you
// need to mess with types that might be referenced by a ScopeReferenceType
// somewhere you probably want to use SwivelIntersection instead.
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

// Replace any generic types in `t` and its subtypes with ScopeReferenceTypes.
// Each generic parameter will map to one register on the local scope. Also
// replaces ScopeReferenceTypes referencing concrete types with the referenced
// concrete type, mostly because it's a convenient place to do so.
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

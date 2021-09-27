import { ASTElement } from "../ast/ASTElement";
import { CompoundStatementElement } from "../ast/CompoundStatementElement";
import { ExpressionElement } from "../ast/ExpressionElement";
import { ConstructorCallExpression } from "../ast/expression/ConstructorCallExpression";
import { FunctionCallExpression } from "../ast/expression/FunctionCallExpression";
import { FieldReferenceExpression } from "../ast/expression/FieldReferenceExpression";
import { NumberExpression } from "../ast/expression/NumberExpression";
import { NameExpression } from "../ast/expression/NameExpression";
import { FunctionElement } from "../ast/FunctionElement";
import { LocalDefinitionStatement } from "../ast/statement/LocalDefinitionStatement";
import { AssignmentStatement } from "../ast/statement/AssignmentStatement";
import { TypedItemElement } from "../ast/TypedItemElement";
import { Classes } from "../registry/Registry";
import { Scope } from "./Scope";
import { ClosureType, Type } from "./Type";
import { TypeLocation } from "./TypeLocation";
import { FunctionCallType } from "./FunctionCallType";
import { FieldReferenceType } from "./FieldReferenceType";
import { FunctionType } from "./FunctionType";
import { ScopeReferenceType } from "./ScopeReferenceType";
import { IntersectionType } from "./IntersectionType";
import { StructureType } from "./StructureType";
import { UnionType } from "./UnionType";
import { AnyType } from "./AnyType";
import { ConsumedType } from "./ConsumedType";
import { GenericType } from "./GenericType";
import { ConcreteFunctionType, ConcreteType } from "./ConcreteType";
import { WalkAST } from "../ast/WalkAST";
import { ClassElement } from "../ast/ClassElement";

export function RunTypeInference(f: FunctionElement) {
    AddScopes(f, f);

    // First, add types to any expression whose type can be determined at this
    // point. Numbers are always i8 | i16 | i32 | i64, constructor calls have
    // their own type, and names are already in the scope table from AddScopes.
    WalkAST(f, (x, s) => {
        if (x instanceof NumberExpression) {
            const idx = s.addType(new UnionType([
                new ConcreteType("i8"),
                new ConcreteType("i16"),
                new ConcreteType("i32"),
                new ConcreteType("i64"),
            ]));
            x.type_location = new TypeLocation(s, idx);
            console.error(`(NumericLiteral) ${x.type_location}`);
        } else if (x instanceof ConstructorCallExpression) {
            const idx = s.addType(x.source);
            x.type_location = new TypeLocation(s, idx);
            console.error(`(ConstructorCall) ${x.type_location}`);
        } else if (x instanceof NameExpression) {
            x.type_location = s.lookupName(x.name);
            console.error(`(Name) ${x.type_location}`);
        }
    });

    // Now, add type constraints to any expression whose type constraints can be
    // determined. Assignments always generate intersections, field references
    // always have a known field name, and generating a FunctionCallType doesn't
    // require knowledge of the exact type of the source element.
    WalkAST(f, (x, s) => {
        if (x instanceof AssignmentStatement) {
            console.error(`(Assignment) ${x.lhs.type_location} = ${x.rhs.type_location}`);
            const idx = s.addType(new IntersectionType(x.lhs.type_location, x.rhs.type_location));
            // This is the "easy" way to do back-propagation. We know at this
            // point that nothing references x.lhs.type or x.rhs.type from a
            // ScopeReferenceType (since there's no way to create one at this
            // point), so we can just run ReplaceTypes.
            ReplaceTypes(s.root, x.lhs.type_location, new TypeLocation(s, idx));
            ReplaceTypes(s.root, x.rhs.type_location, new TypeLocation(s, idx));
        } else if (x instanceof FieldReferenceExpression) {
            const idx = s.addType(new FieldReferenceType(x.source.type_location, x.name));
            x.type_location = new TypeLocation(s, idx);
            console.error(`(FieldReference) ${x.type_location} = ${s.types[idx]}`);
        } else if (x instanceof FunctionCallExpression) {
            const idx = s.addType(new FunctionCallType(x.source.type_location));
            x.type_location = new TypeLocation(s, idx);
            console.error(`(FunctionCall) ${x.type_location}`);
        }
    })

    // Propagate types and constraints.
    let changed = true;
    while (changed) {
        changed = false;
        WalkAST(f, (x) => {
            if (x instanceof FunctionElement || x instanceof CompoundStatementElement) {
                // Type propagation and constraint evaluation at the scope level
                // rather than the AST level. This is capable of handling most
                // expression types, but stuff like function calls where the
                // argument list is stored in the AST need to be handled
                // separately.
                changed ||= ApplyRulesToScope(x.scope);
            } else if (x instanceof FunctionCallExpression) {
                if (x.source.type_location.get() instanceof FunctionType) {
                    // This is the second half of function call handling. Once
                    // we know the type of a function call's source, we can
                    // back-propagate the type constraints on its arguments.
                    console.error(`(FunctionCall) ${x.source.type_location.get()}`);
                    const ft = x.source.type_location.get() as FunctionType;
                    if (!ft.args.every(x => x instanceof ScopeReferenceType)) return;
                    if (ft._propagated) return;
                    ft._propagated = true;

                    x.args.forEach((arg, arg_index) => {
                        // This is the "hard" way to do back-propagation.
                        // SwivelIntersection is more powerful but less flexible
                        // than ReplaceTypes - it doesn't let you merge type
                        // registers like we did for AssignmentExpressions.
                        if (ft.args[arg_index] instanceof ScopeReferenceType) {
                            SwivelIntersection((ft.args[arg_index] as ScopeReferenceType).source, arg.type_location);
                            console.error(`(FunctionArgument) ${arg.type_location} ${ft.args[arg_index]}`);
                        }
                    });
                    changed = true;
                }
            }
        })
    }

    if (!process.env.HOWL_SKIP_SCOPE_GC) {
        // Remove any un-referenced types from scopes to make the graph output a little cleaner.
        WalkAST(f, (x) => {
            if (x instanceof ExpressionElement) {
                x.type_location.location.gc_temp.add(x.type_location.index);
            }
        });

        WalkAST(f, (x) => {
            if (x instanceof FunctionElement || x instanceof CompoundStatementElement) {
                x.scope.types.forEach((type, index) => {
                    if (!x.scope.gc_temp.has(index)) {
                        x.scope.types[index] = new ConsumedType();
                    }
                });
            }
        });
    }

    if (!process.env.HOWL_SKIP_FREEZE_TYPES) {
        // Replace function types with concrete function pointers, and structure types with concrete structure names.
        WalkAST(f, (x) => {
            if (x instanceof FunctionElement || x instanceof CompoundStatementElement) {
                x.scope.types.forEach((type, index) => {
                    if (type instanceof FunctionType) {
                        if (type.return_type instanceof ConcreteType
                            && type.self_type instanceof ConcreteType
                            && type.args.every(x => x instanceof ConcreteType)) {
                            const all_args = [type.self_type, ...type.args] as ConcreteType[];
                            x.scope.types[index] = new ConcreteFunctionType(type.return_type, all_args);
                        }
                    } else if (type instanceof StructureType) {
                        x.scope.types[index] = new ConcreteType(type.fqn.toString());
                    }
                });
            }
        });

        WalkAST(f, (x) => {
            if (x instanceof ExpressionElement) {
                const rt = x.type_location.get();
                if (rt instanceof ConcreteType) {
                    x.resolved_type = rt;
                } else {
                    console.error(`(FreezeTypes) ${x} doesn't have a concrete type? (${x.type_location} ${x.type_location.get()})`);
                }
            }
        });

        WalkAST(f, (x) => {
            if (x instanceof FunctionElement || x instanceof CompoundStatementElement) {
                x.scope = undefined;
            }
        });
    }
}

function ApplyRulesToScope(s: Scope): boolean {
    let rc = false;
    s.types.forEach((t, index) => {
        if (t instanceof ClosureType && t.evaluable()) {
            // EvaluateClosure: Replace any evaluable ClosureType with its
            // result.
            const new_type = t.evaluator()();
            console.error(`(EvaluateClosure ${s.n} ${index}) ${t} => ${new_type}`);
            s.types[index] = new_type;
            rc = true;
        } else if (t instanceof FunctionType) {
            if (LiftConcrete(t, () => { })) rc = true;
        } else if (t instanceof StructureType) {
            // A whole lot of StructureType-related stuff that probably should
            // get split out.

            if (LiftConcrete(t, () => { })) rc = true;

            // First, MapGenerics - replaces any generic elements within a
            // StructureType with a reference to a type register in the local
            // scope. In other words, this is what brings the T in Structure<T>
            // out into the scope of whatever's referencing it.
            t.generic_map.forEach((old_type, generic_name) => {
                if (old_type instanceof GenericType) {
                    const idx = s.addType(new AnyType());
                    const n = new ScopeReferenceType(new TypeLocation(s, idx));
                    t.generic_map.set(generic_name, n);
                    console.error(`(MapGenerics) ${old_type} -> ${n}`);
                    rc = true;
                }
            })

            // Now, see if we can monomorphize the type, if necessary. This is
            // possible if it has generics (if it doesn't, it's already
            // monomorphized and we need to *not* do so again), and all the
            // generic fields are of known type.
            const generic_keys = [...t.generic_map.keys()];
            if (generic_keys.length && generic_keys.every(k => t.generic_map.get(k) instanceof ConcreteType) && Classes.has(t.fqn.toString())) {
                console.error(`(Monomorphize ${s.n} ${index}) ${t.fqn.toString()}<${generic_keys.map(x => t.generic_map.get(x).toString()).join(", ")}>`);
                const mmn = `__${t.fqn.last()}_${generic_keys.map(x => (t.generic_map.get(x) as ConcreteType).name).join("_")}`;
                const new_fqn = t.fqn.repl_last(mmn);
                let new_class: ClassElement;
                if (Classes.has(new_fqn.toString())) {
                    new_class = Classes.get(new_fqn.toString());
                } else {
                    // This is basically a template evaluation. We'll clone the original class...
                    new_class = Classes.get(t.fqn.toString()).clone();

                    new_class.setName(mmn);
                    // ...replace all the GenericTypes in its AST...
                    WalkAST(new_class, (x, s) => {
                        if (x instanceof FunctionElement) {
                            if (x.return_type instanceof GenericType) x.return_type = t.generic_map.get(x.return_type.name);
                            x.args.forEach((arg) => {
                                if (arg.type instanceof GenericType) arg.type = t.generic_map.get(arg.type.name);
                            });
                        } else if (x instanceof TypedItemElement) {
                            if (x.type instanceof GenericType) x.type = t.generic_map.get(x.type.name);
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
                }

                // Now, we can just treat it as a concrete type.
                s.types[index] = new ConcreteType(new_class.getFQN().toString());
                rc = true;
            }
        } else if (t instanceof ScopeReferenceType) {
            // LiftScope: Handles the case where you have a ScopeReferenceType
            // directly in a Scope instead of as a sub-type. This just lets us
            // not have to handle indirecting through ScopeReferenceTypes
            // anytime we're using a type.
            console.error(`(LiftScope ${s.n} ${index}) ${index}@${s.n} => ${t.source}`);
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
                console.error(`(IntersectStructure ${s.n} ${index}) ${t0} ${t1}`);
                t0.generic_map.forEach((old_type, generic_key) => {
                    const ot1 = t1.generic_map.get(generic_key);
                    if (old_type instanceof ScopeReferenceType && ot1 instanceof ScopeReferenceType) {
                        console.error(`  (IntersectStructure ${s.n} ${index}) ${generic_key} ${old_type}`);
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
    WalkAST(el, (x) => {
        if (x instanceof ExpressionElement) {
            if (x.type_location && x.type_location.location == from.location && x.type_location.index == from.index) {
                x.type_location = to;
            }
        }
    });
}

export function LiftConcrete(t: Type, repl: (n: Type) => void): boolean {
    let rc = false;
    if (t instanceof ScopeReferenceType && t.source.get() instanceof ConcreteType) {
        console.error(`(LiftConcrete) ${t} => ${t.source.get()}`);
        repl(t.source.get());
        rc = true;
    } else if (t instanceof StructureType) {
        const generic_keys = [...t.generic_map.keys()];
        if (generic_keys.length && generic_keys.every(k => t.generic_map.get(k) instanceof ConcreteType) && Classes.has(t.fqn.toString())) {
            const mmn = `__${t.fqn.last()}_${generic_keys.map(x => (t.generic_map.get(x) as ConcreteType).name).join("_")}`;
            const new_fqn = t.fqn.repl_last(mmn);
            let new_class: ClassElement;
            if (Classes.has(new_fqn.toString())) {
                new_class = Classes.get(new_fqn.toString());
                console.error(`(Monomorphize LC) ${t.fqn.toString()}<${generic_keys.map(x => t.generic_map.get(x).toString()).join(", ")}>`);
                repl(new ConcreteType(new_class.getFQN().toString()));
                rc = true;
                return;
            }
        }

        t.generic_map.forEach((old_type, generic_name) => {
            if (LiftConcrete(old_type, (n: Type) => t.generic_map.set(generic_name, n))) {
                rc = true;
            }
        });
    } else if (t instanceof FunctionType) {
        if (LiftConcrete(t.return_type, (n: Type) => t.return_type = n)) rc = true;
        if (LiftConcrete(t.self_type, (n: Type) => t.self_type = n)) rc = true;
        t.args.forEach((old_type, index) => {
            if (LiftConcrete(old_type, (n: Type) => t.args[index] = n)) rc = true;
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

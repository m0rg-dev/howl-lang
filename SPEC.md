This describes an early attempt at formalizing the type system. It doesn't really apply anymore.

Type system and scopes
---

There are no truly "global" variables - everything is scoped.

Note that, prior to type analysis, local variables do not have type explicitly associated with them. The "usual" local variable definition syntax is a combination of a local variable definition and a type constraint.

An example of a program with fully-specified types and constraints:

```rust
module Test;

class Foo<0 | 0 = any> {
    value;

    /* The first two type parameters on a function represent the function's return type and the type of "self". */
    fn get<0, 1, 2 | 0 = 2, 1 = Foo<2>>() {
        return self.value;
    }
    
    fn set<0, 1, 2, 3 | 0 = void, 1 = Foo<3>, 2 = 3>(value) {
        self.value = value;
        return;
    }

}

/* This could also be specified as <0, 1 | 0 = i32, 1 = 0>, but this represents a more realistic
   parse if the original structure specified i32 explicitly for both fields. */
class Point<0, 1 | 0 = i32, 1 = i32> {
    x_position;
    y_position;
}

/* The first two type parameters on the block represent its local variables.
   The remaining parameters represent initially-unbound internal types. */
static fn main<0, 1 | 0 = i32, 1 = Test>() <0, 1, 2, 3, 4 | 0 = i32, 1 = Foo<2>, 3 = Foo<4>>{
    let val;
    let obj;
    val = 42;
    obj = new 3();        // "3" here refers to the type parameter numbered 3 in the enclosing scope.
    obj.set(val);
    return obj.get();
}
```

Type expressions exist at the scope level. Specifically, each scope is representable by a tuple containing all the types used within the scope, in order, and a list of additional type constraints. Scopes must re-declare any types imported from a higher scope, and must reference such imported types only once in their list of constraints.

The intent is that many of these type parameters and notations will be inferred automatically by the compiler. A more usual way to write the above program might be as follows:

```rust
/* In general, named type parameters may be used. If so, ordering of the type parameter definition is not assumed,
   and explicit type annotations must be used alongside variable, argument, and field names. */
class Foo<T> {
    T value;

    fn T get() {
        return self.value;
    }

    fn void set(T value) {
        self.value = value;
    }
}

class Point {
    i32 x_position;
    i32 y_position;
}

static fn i32 main() {
    let val = 42;
    let obj = new Foo();
    obj.set(val);
    return obj.get();
}
```
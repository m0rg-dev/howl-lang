List of constructs that should be disallowed by the compiler:

- Referring to parameterized types without their parameters.
  - Real-world example:
    ```
    class Vec<T> {
        extern fn *i8 malloc(i64 size);
        fn void constructor() {
            Vec.malloc(0);
        }
    }
    ```
  - The `Vec.malloc(0)` call here results in us attempting to synthesize `Vec`, which is going to break horribly. We need to detect this and say "you need to use `Vec<T>` or `Self` here".
- Declaring conflicting `extern` functions.
  - This should work:
    ```
    class A {
        extern fn i8 foo();
    }

    class B {
        extern fn i8 foo();
    }
    ```
  - This shouldn't work:
    ```
    class A {
        extern fn i8 foo();
    }

    class B {
        extern fn i32 foo();
    }
    ```
  - The latter case is going to blow up the IR with type mismatches (plus it's just not going to work right)

A prototype programming language. Shades of Java, but compiles to LLVM IR.

```
$ make
$ java -jar target/howlc-1.0-SNAPSHOT.jar test.hl
$ cc -o test howl_target/*.ll hrt0.c -Wno-override-module
$ ./test
Hello, World!
```

Requires Rust, Java 1.17, and Maven (at least).

Language documentation is coming.

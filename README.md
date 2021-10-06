A prototype programming language. Shades of Java, but compiles to LLVM IR.

```
$ npm install
$ npx tsc --build
$ node compiler.js hello.hl | clang -xc - -o hello
$ ./hello
Awoooooooo~!
```

Most of the "interesting" syntax is in `lib/lib.hl` for now. Documentation is coming...

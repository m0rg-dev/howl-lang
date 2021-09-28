A prototype programming language. Shades of Java, but compiles to LLVM IR.

Currently the easiest way to compile a Howl program is to use the C generator. `node compiler.js | gcc -xc - -o <file>` or so.

Also, I need to make my parser rule DSL better so that I can write rules to emit reasonable compilation errors. Right now, you get unreasonable compilation errors at best on bad input, and more likely nothing or a crash.

Check `test_input.hl` for example syntax. What's in there is what you get, for now.

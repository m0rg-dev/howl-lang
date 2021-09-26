A prototype programming language. Shades of Java, but compiles to LLVM IR.

I need to rewrite the IR generator, so right now the best you can get is Graphviz AST output. If you want to play around with that, `grapher.ts <input>` will build the AST, run type inference on it, and print the result as .dot to stdout.

Also, I need to make my parser rule DSL better so that I can write rules to emit reasonable compilation errors. Right now, you get unreasonable compilation errors at best on bad input, and more likely nothing or a crash.

Check `test_input.hl` for example syntax. What's in there is what you get, for now.

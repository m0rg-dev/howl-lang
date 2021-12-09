package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

public class FFICallExpression extends CallExpressionBase {
    String name;

    public FFICallExpression(Span span, String name) {
        super(span);
        this.name = name;
    }

    @Override
    public ASTElement detach() {
        FFICallExpression rc = new FFICallExpression(span, name);
        this.copyArguments(rc);
        return rc;
    }

    @Override
    public String format() {
        return "fficall " + this.name + this.getArgString();
    }

    public void transform(ASTTransformer t) {
        this.transformArguments(t);
    }

    @Override
    public TypeElement getType() {
        return new NamedType(span, "__any");
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        addFields(rc);
        return rc;
    }

    @Override
    protected TypeElement getTypeForArgument(int index) {
        return new NamedType(this.span, "__any");
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        Optional<LLVMFunction> callee = builder.getModule().getFunction(this.name);
        if (callee.isPresent()) {
            List<LLVMValue> args = new ArrayList<>(this.args.size());
            for (Expression e : this.args) {
                args.add(e.generate(builder));
            }
            return builder.buildCall(callee.get(), args, "");
        } else {
            Logger.error("no prototype. expr was " + format());
            throw new IllegalArgumentException("no prototype for FFI function " + name);
        }
    }
}

package dev.m0rg.howl.ast.expression;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMGlobalVariable;
import dev.m0rg.howl.llvm.LLVMType;
import dev.m0rg.howl.llvm.LLVMValue;

public class NameExpression extends Expression implements Lvalue {
    String name;
    String[] split;

    public NameExpression(Span span, String name) {
        super(span);
        this.name = name;
        this.split = name.split("\\.");
    }

    @Override
    public ASTElement detach() {
        return new NameExpression(span, name);
    }

    @Override
    public String format() {
        String resolution = "\u001b[31m/* = <unresolved> */\u001b[0m";
        Optional<ASTElement> target = this.resolveName(this.name);
        if (target.isPresent()) {
            resolution = "\u001b[32m/* = " + target.get().getPath() + " */\u001b[0m";
        }
        return this.name + " " + resolution;
    }

    public void transform(ASTTransformer t) {
        ;
    }

    public String getName() {
        return this.name;
    }

    public String[] getSplit() {
        return split;
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        return rc;
    }

    @Override
    public LLVMValue generate(LLVMBuilder builder) {
        ASTElement target = this.resolveName(this.name).get();
        if (target instanceof LocalDefinitionStatement) {
            return builder.buildLoad(((LocalDefinitionStatement) target).getStorage(), "");
        } else if (target instanceof Argument) {
            Function f = this.getContainingFunction();
            int index;
            List<Argument> args = f.getArgumentList();
            for (index = 0; index < args.size(); index++) {
                if (args.get(index).getName().equals(this.name)) {
                    return builder.getModule().getFunction(f.getPath()).get().getParam(index);
                }
            }
            throw new IllegalStateException();
        } else if (target instanceof Class) {
            Class c = (Class) target;
            LLVMType static_type = c.getStaticType().generate(builder.getModule());
            LLVMGlobalVariable g = builder.getModule().getOrInsertGlobal(static_type, c.getPath() + "_static");
            return g;
        } else if (target instanceof Function) {
            Function f = (Function) target;
            LLVMFunctionType type = (LLVMFunctionType) f.getOwnType().resolve().generate(builder.getModule());
            if (f.isExtern()) {
                return builder.getModule().getOrInsertFunction(type, f.getOriginalName(), x -> x.setExternal(), true);
            } else {
                return builder.getModule().getOrInsertFunction(type, f.getPath(), x -> x.setExternal(), true);
            }
        } else {
            throw new RuntimeException(
                    "unimplemented NameExpression resolution of type " + target.getClass().getName());
        }
    }

    @Override
    public LLVMValue getPointer(LLVMBuilder builder) {
        ASTElement target = this.resolveName(this.name).get();
        if (target instanceof LocalDefinitionStatement) {
            return ((LocalDefinitionStatement) target).getStorage();
        } else {
            throw new RuntimeException(
                    "unimplemented NameExpression lvalue resolution of type " + target.getClass().getName());
        }
    }
}

package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMValue;
import dev.m0rg.howl.logger.Logger;

public class NameExpression extends Expression {
    String name;

    public NameExpression(Span span, String name) {
        super(span);
        this.name = name;
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

    @Override
    public TypeElement getType() {
        Optional<ASTElement> target = this.resolveName(this.name);
        if (target.isPresent()) {
            if (target.get() instanceof TypeElement) {
                return (TypeElement) target.get();
            } else if (target.get() instanceof Class) {
                Class c = (Class) target.get();
                return (TypeElement) new ClassStaticType(c.getSpan(), c.getPath()).setParent(c);
            } else if (target.get() instanceof HasOwnType) {
                return ((HasOwnType) target.get()).getOwnType();
            } else {
                return new NamedType(span, "__error");
            }
        } else {
            return new NamedType(span, "__error");
        }
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
        } else {
            Logger.error("unimplemented NameExpression resolution of type " + target.getClass().getName());
            return super.generate(builder);
        }
    }
}

package dev.m0rg.howl.ast.statement;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.FieldHandle;
import dev.m0rg.howl.ast.HasUpstreamFields;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;

public class ReturnStatement extends Statement implements HasUpstreamFields {
    Optional<Expression> source;

    public ReturnStatement(Span span) {
        super(span);
        this.source = Optional.empty();
    }

    @Override
    public ASTElement detach() {
        ReturnStatement rc = new ReturnStatement(span);
        if (source.isPresent()) {
            rc.setSource((Expression) source.get().detach());
        }
        return rc;
    }

    @Override
    public String format() {
        if (this.source.isPresent()) {
            return "return " + this.source.get().format() + ";";
        } else {
            return "return;";
        }
    }

    public Optional<Expression> getSource() {
        return source;
    }

    public void setSource(Expression source) {
        this.source = Optional.of((Expression) source.setParent(this));
    }

    public void transform(ASTTransformer t) {
        if (source.isPresent()) {
            this.source.get().transform(t);
            this.setSource(t.transform(this.source.get()));
        }
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        if (this.source.isPresent()) {
            rc.put("source", new FieldHandle(() -> this.getSource().get(), (e) -> this.setSource(e),
                    () -> (TypeElement) this.getContainingFunction().getReturn().detach()));
        }
        return rc;
    }

    @Override
    public void generate(LLVMFunction f) {
        try (LLVMBuilder builder = new LLVMBuilder(f.getModule())) {
            builder.positionAtEnd(f.lastBasicBlock());
            if (this.source.isPresent()) {
                builder.buildReturn(this.source.get().generate(builder));
            } else {
                builder.buildReturn();
            }
        }
    }
}

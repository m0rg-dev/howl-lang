package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMBasicBlock;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMValue;

public class IfStatement extends Statement implements HasUpstreamFields {
    Expression condition;
    CompoundStatement body;

    // TODO, probably
    Optional<CompoundStatement> alternative;

    public IfStatement(Span span) {
        super(span);
        alternative = Optional.empty();
    }

    @Override
    public ASTElement detach() {
        IfStatement rc = new IfStatement(span);
        rc.setBody((CompoundStatement) body.detach());
        rc.setCondition((Expression) condition.detach());
        return rc;
    }

    @Override
    public String format() {
        String rc = "if " + this.condition.format() + " " + this.body.format();
        if (alternative.isPresent()) {
            rc += " else " + this.alternative.get().format();
        }
        return rc;
    }

    public Expression getCondition() {
        return condition;
    }

    public void setCondition(Expression condition) {
        this.condition = (Expression) condition.setParent(this);
    }

    public void setAlternative(CompoundStatement alternative) {
        this.alternative = Optional.of((CompoundStatement) alternative.setParent(this));
    }

    public void setBody(CompoundStatement body) {
        this.body = (CompoundStatement) body.setParent(this);
    }

    public void transform(ASTTransformer t) {
        condition.transform(t);
        this.setCondition(t.transform(condition));
        body.transform(t);
        this.setBody(t.transform(body));
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("condition", new FieldHandle(() -> this.getCondition(), (e) -> this.setCondition(e),
                () -> NumericType.build(span, 1, true)));
        return rc;
    }

    @Override
    public void generate(LLVMFunction f) {
        try (LLVMBuilder builder = new LLVMBuilder(f.getModule())) {
            LLVMBasicBlock entry_block = f.lastBasicBlock();
            builder.positionAtEnd(entry_block);
            LLVMValue condition = this.condition.generate(builder);

            LLVMBasicBlock true_block = f.appendBasicBlock("true");
            body.generate(f);

            LLVMBasicBlock false_block = f.appendBasicBlock("false");
            if (this.alternative.isPresent()) {
                this.alternative.get().generate(f);
            }

            // and now to stick it all together
            builder.positionAtEnd(entry_block);
            builder.buildCondBr(condition, true_block, false_block);

            // some shenanigans to avoid generating blocks with 2 or 0 terminators
            if (!true_block.hasTerminator() || !false_block.hasTerminator()) {
                LLVMBasicBlock exit_block = f.appendBasicBlock("exit");
                if (!true_block.hasTerminator()) {
                    builder.positionAtEnd(true_block);
                    builder.buildBr(exit_block);
                }

                if (!false_block.hasTerminator()) {
                    builder.positionAtEnd(false_block);
                    builder.buildBr(exit_block);
                }
            }
        }
    }

}

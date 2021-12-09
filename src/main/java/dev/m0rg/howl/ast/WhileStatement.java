package dev.m0rg.howl.ast;

import java.util.HashMap;
import java.util.Map;

import dev.m0rg.howl.llvm.LLVMBasicBlock;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMValue;

public class WhileStatement extends Statement implements HasUpstreamFields {
    Expression condition;
    CompoundStatement body;

    public WhileStatement(Span span) {
        super(span);
    }

    @Override
    public ASTElement detach() {
        WhileStatement rc = new WhileStatement(span);
        rc.setBody((CompoundStatement) body.detach());
        rc.setCondition((Expression) condition.detach());
        return rc;
    }

    @Override
    public String format() {
        return "while " + this.condition.format() + " " + this.body.format();
    }

    public Expression getCondition() {
        return condition;
    }

    public void setCondition(Expression condition) {
        this.condition = (Expression) condition.setParent(this);
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
            LLVMBasicBlock condition_block = f.appendBasicBlock("condition");
            builder.positionAtEnd(condition_block);
            LLVMValue condition = this.condition.generate(builder);

            LLVMBasicBlock true_block = f.appendBasicBlock("true");
            body.generate(f);

            LLVMBasicBlock exit_block = f.appendBasicBlock("exit");

            // and now to stick it all together
            builder.positionAtEnd(entry_block);
            builder.buildBr(condition_block);

            builder.positionAtEnd(condition_block);
            builder.buildCondBr(condition, true_block, exit_block);

            // some shenanigans to avoid generating blocks with 2 terminators
            if (!true_block.hasTerminator()) {
                builder.positionAtEnd(true_block);
                builder.buildBr(condition_block);
            }
        }
    }
}

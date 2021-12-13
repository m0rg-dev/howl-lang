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
import dev.m0rg.howl.ast.type.algebraic.ABaseType;
import dev.m0rg.howl.llvm.LLVMBasicBlock;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMValue;

public class IfStatement extends Statement implements HasUpstreamFields {
    Expression condition;
    CompoundStatement body;

    // TODO, probably
    Optional<CompoundStatement> alternative;
    public Optional<TryStatement> originalTry;

    public IfStatement(Span span) {
        super(span);
        alternative = Optional.empty();
        originalTry = Optional.empty();
    }

    @Override
    public ASTElement detach() {
        IfStatement rc = new IfStatement(span);
        rc.setBody((CompoundStatement) body.detach());
        rc.setCondition((Expression) condition.detach());
        if (this.alternative.isPresent()) {
            rc.setAlternative((CompoundStatement) this.alternative.get().detach());
        }
        rc.originalTry = originalTry;
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
        if (this.alternative.isPresent()) {
            this.alternative.get().transform(t);
            this.setAlternative(t.transform(this.alternative.get()));
        }
    }

    @Override
    public Map<String, FieldHandle> getUpstreamFields() {
        HashMap<String, FieldHandle> rc = new HashMap<>();
        rc.put("condition", new FieldHandle(() -> this.getCondition(), (e) -> this.setCondition(e),
                () -> new ABaseType("bool")));
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
            LLVMBasicBlock last_true_block = f.lastBasicBlock();

            LLVMBasicBlock false_block = f.appendBasicBlock("false");
            if (this.alternative.isPresent()) {
                this.alternative.get().generate(f);
            }
            LLVMBasicBlock last_false_block = f.lastBasicBlock();

            // and now to stick it all together
            builder.positionAtEnd(entry_block);
            builder.buildCondBr(condition, true_block, false_block);

            // some shenanigans to avoid generating blocks with 2 or 0 terminators
            if (!last_true_block.hasTerminator() || !last_false_block.hasTerminator()) {
                LLVMBasicBlock exit_block = f.appendBasicBlock("exit");
                if (!last_true_block.hasTerminator()) {
                    builder.positionAtEnd(last_true_block);
                    builder.buildBr(exit_block);
                }

                if (!last_false_block.hasTerminator()) {
                    builder.positionAtEnd(last_false_block);
                    builder.buildBr(exit_block);
                }
            }
        }
    }

}

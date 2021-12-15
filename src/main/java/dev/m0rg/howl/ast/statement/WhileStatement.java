package dev.m0rg.howl.ast.statement;

import java.util.HashMap;
import java.util.Map;

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

    public Statement getBody() {
        return body;
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
                () -> new ABaseType("bool")));
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
            LLVMBasicBlock last_true_block = f.lastBasicBlock();

            LLVMBasicBlock exit_block = f.appendBasicBlock("exit");

            // and now to stick it all together
            builder.positionAtEnd(entry_block);
            builder.buildBr(condition_block);

            builder.positionAtEnd(condition_block);
            builder.buildCondBr(condition, true_block, exit_block);

            builder.positionAtEnd(last_true_block);
            builder.buildBr(condition_block);
        }
    }
}

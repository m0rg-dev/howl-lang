package dev.m0rg.howl.ast.statement;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;

public class BreakContinueStatement extends Statement {
    boolean is_break;

    public BreakContinueStatement(Span span, boolean is_break) {
        super(span);
        this.is_break = is_break;
    }

    @Override
    public ASTElement detach() {
        BreakContinueStatement rc = new BreakContinueStatement(span, is_break);
        rc.setAnnotation(annotation);
        return rc;
    }

    @Override
    public String format() {
        if (is_break) {
            return "break;";
        } else {
            return "continue;";
        }
    }

    public void transform(ASTTransformer t) {
        ;
    }

    @Override
    public void generate(LLVMFunction f) {
        try (LLVMBuilder builder = new LLVMBuilder(f.getModule())) {
            builder.positionAtEnd(f.lastBasicBlock());
            WhileStatement enclosing_loop = (WhileStatement) this.nearest(x -> x instanceof WhileStatement).get();
            if (is_break) {
                builder.buildBr(enclosing_loop.break_block);
            } else {
                builder.buildBr(enclosing_loop.continue_block);
            }
        }
    }
}

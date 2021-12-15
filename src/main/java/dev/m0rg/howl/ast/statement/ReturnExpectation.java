package dev.m0rg.howl.ast.statement;

import java.util.List;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.ASTTransformer;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Span;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.llvm.LLVMBasicBlock;
import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMFunction;

public class ReturnExpectation extends Statement {
    Function func;

    public ReturnExpectation(Function f) {
        super(f.getSpan());
        List<Statement> s = f.getBody().get().getContents();
        Span new_span = f.getBody().get().getSpan();
        if (s.size() > 0) {
            new_span.start = s.get(s.size() - 1).getSpan().start;
        }
        this.span = new_span;
        func = f;
    }

    @Override
    public void generate(LLVMFunction f) {
        try (LLVMBuilder builder = new LLVMBuilder(f.getModule())) {
            LLVMBasicBlock last = f.lastBasicBlock();
            if (!last.hasTerminator()) {
                builder.positionAtEnd(f.lastBasicBlock());
                if (func.getReturn() instanceof NamedType && ((NamedType) func.getReturn()).getName().equals("void")) {
                    builder.buildReturn();
                } else {
                    builder.buildUnreachable();
                }
            }
        }
    }

    @Override
    public ASTElement detach() {
        return new ReturnExpectation(func);
    }

    @Override
    public String format() {
        return "/* return guard */";
    }

    @Override
    public void transform(ASTTransformer t) {
        ;
    }

}

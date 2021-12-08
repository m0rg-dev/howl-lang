package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMValueRef;
import static org.bytedeco.llvm.global.LLVM.*;

public abstract class LLVMValue {
    LLVMValueRef obj;

    public final LLVMValueRef getInternal() {
        return obj;
    }

    public static LLVMValue build(LLVMModule module, LLVMValueRef source) {
        switch (LLVMGetValueKind(source)) {
            case LLVMArgumentValueKind:
                return new LLVMArgument(source);
            case LLVMFunctionValueKind:
                return new LLVMFunction(module, source);
            case LLVMConstantIntValueKind:
                return new LLVMConstant(source);
            case LLVMInstructionValueKind:
                return new LLVMInstruction(source);
            default:
                throw new IllegalArgumentException("LLVMValue of kind " + LLVMGetValueKind(source));
        }
    }
}

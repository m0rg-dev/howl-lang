package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMTypeRef;
import static org.bytedeco.llvm.global.LLVM.*;

public abstract class LLVMType {
    LLVMTypeRef obj;

    public final LLVMTypeRef getInternal() {
        return obj;
    }

    public static LLVMType build(LLVMTypeRef source) {
        switch (LLVMGetTypeKind(source)) {
            case LLVMIntegerTypeKind:
                return new LLVMIntType(source);
            case LLVMFunctionTypeKind:
                return new LLVMFunctionType(source);
            case LLVMStructTypeKind:
                return new LLVMStructureType(source);
            case LLVMPointerTypeKind:
                return new LLVMPointerType<LLVMType>(source);
            default:
                throw new IllegalArgumentException("LLVMType of kind " + LLVMGetTypeKind(source));
        }
    }

    public void dump() {
        LLVMDumpType(obj);
        System.out.println();
    }
}

package dev.m0rg.howl.llvm;

import org.bytedeco.llvm.LLVM.LLVMContextRef;
import org.bytedeco.llvm.LLVM.LLVMTypeRef;

import static org.bytedeco.llvm.global.LLVM.*;

import java.util.function.Supplier;

public class LLVMContext {
    LLVMContextRef obj;

    public LLVMContext() {
        obj = LLVMContextCreate();
    }

    public LLVMContextRef getInternal() {
        return obj;
    }

    public LLVMStructureType getOrCreateStructureType(String name, Supplier<LLVMStructureType> source) {
        LLVMTypeRef t = LLVMGetTypeByName2(this.getInternal(), name);
        if (t != null) {
            return new LLVMStructureType(t);
        }
        return source.get();
    }
}

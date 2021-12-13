package dev.m0rg.howl.llvm;

import org.bytedeco.javacpp.Pointer;
import org.bytedeco.javacpp.PointerPointer;
import org.bytedeco.llvm.LLVM.LLVMTypeRef;

import static org.bytedeco.llvm.global.LLVM.*;

import java.util.List;

public class LLVMFunctionType extends LLVMType {
    public LLVMFunctionType(LLVMType returntype, List<LLVMType> parameters) {
        PointerPointer<Pointer> parameters_raw = new PointerPointer<>(parameters.size());
        for (int i = 0; i < parameters.size(); i++) {
            parameters_raw.put(i, parameters.get(i).getInternal());
        }
        obj = LLVMFunctionType(returntype.getInternal(), parameters_raw, parameters.size(), 0);
    }

    public LLVMFunctionType(LLVMTypeRef obj) {
        this.obj = obj;
    }

    public LLVMConstant getNull(LLVMModule module) {
        throw new UnsupportedOperationException();
    }
}

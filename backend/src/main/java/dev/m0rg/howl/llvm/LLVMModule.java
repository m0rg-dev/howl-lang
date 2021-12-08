package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.LLVMDumpModule;
import static org.bytedeco.llvm.global.LLVM.LLVMModuleCreateWithNameInContext;

import java.lang.ref.WeakReference;

import org.bytedeco.llvm.LLVM.LLVMModuleRef;

public class LLVMModule {
    LLVMModuleRef obj;
    WeakReference<LLVMContext> context;

    public LLVMModule(String name, LLVMContext context) {
        this.obj = LLVMModuleCreateWithNameInContext(name, context.getInternal());
        this.context = new WeakReference<LLVMContext>(context);
    }

    public LLVMContext getContext() {
        return context.get();
    }

    public LLVMModuleRef getInternal() {
        return obj;
    }

    public void dump() {
        LLVMDumpModule(obj);
    }
}

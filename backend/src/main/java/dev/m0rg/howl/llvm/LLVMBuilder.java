package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

import java.lang.ref.WeakReference;
import java.util.List;

import org.bytedeco.javacpp.Pointer;
import org.bytedeco.javacpp.PointerPointer;
import org.bytedeco.llvm.LLVM.LLVMBuilderRef;

public class LLVMBuilder implements AutoCloseable {
    LLVMBuilderRef obj;
    WeakReference<LLVMModule> module;

    public LLVMBuilder(LLVMModule module) {
        obj = LLVMCreateBuilderInContext(module.getContext().getInternal());
        this.module = new WeakReference<LLVMModule>(module);
    }

    public final LLVMBuilderRef getInternal() {
        return obj;
    }

    public LLVMContext getContext() {
        return this.getModule().getContext();
    }

    public LLVMModule getModule() {
        return module.get();
    }

    public void positionAtEnd(LLVMBasicBlock block) {
        LLVMPositionBuilderAtEnd(this.getInternal(), block.getInternal());
    }

    public void close() {
        LLVMDisposeBuilder(obj);
    }

    public LLVMValue buildAlloca(LLVMType type, String name) {
        return LLVMValue.build(this.getModule(), LLVMBuildAlloca(this.getInternal(), type.getInternal(), name));
    }

    public LLVMValue buildCall(LLVMFunction f, List<LLVMValue> args, String name) {
        PointerPointer<Pointer> args_raw = new PointerPointer<>(args.size());
        for (int i = 0; i < args.size(); i++) {
            args_raw.put(i, args.get(i).getInternal());
        }
        return LLVMValue.build(this.getModule(),
                LLVMBuildCall(this.getInternal(), f.getInternal(), args_raw, args.size(), name));
    }

    public LLVMValue buildLoad(LLVMValue source, String name) {
        return LLVMValue.build(this.getModule(), LLVMBuildLoad(this.getInternal(), source.getInternal(), name));
    }

    public LLVMValue buildStore(LLVMValue source, LLVMValue dest) {
        return LLVMValue.build(this.getModule(),
                LLVMBuildStore(this.getInternal(), source.getInternal(), dest.getInternal()));
    }
}

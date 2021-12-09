package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.*;

import java.lang.ref.WeakReference;
import java.util.Arrays;
import java.util.Optional;
import java.util.function.Consumer;

import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.llvm.LLVM.LLVMModuleRef;
import org.bytedeco.llvm.LLVM.LLVMValueRef;

public class LLVMModule {
    LLVMModuleRef obj;
    final WeakReference<LLVMContext> context;
    String name;

    public LLVMModule(String name, LLVMContext context) {
        this.name = name;
        this.obj = LLVMModuleCreateWithNameInContext(name, context.getInternal());
        this.context = new WeakReference<LLVMContext>(context);

        // TODO.
        this.getOrInsertFunction(new LLVMFunctionType(new LLVMIntType(context, 64), Arrays.asList(new LLVMType[] {
                new LLVMIntType(context, 32),
                new LLVMPointerType<>(new LLVMIntType(context, 8)),
                new LLVMIntType(context, 64),
        })), "write", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMIntType(context, 64), Arrays.asList(new LLVMType[] {
                new LLVMIntType(context, 32),
                new LLVMPointerType<>(new LLVMIntType(context, 8)),
                new LLVMIntType(context, 64),
        })), "read", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMIntType(context, 32), Arrays.asList(new LLVMType[] {
                new LLVMIntType(context, 32),
        })), "close", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMVoidType(context), Arrays.asList(new LLVMType[] {
                new LLVMPointerType<>(new LLVMIntType(context, 8)),
        })), "free", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMPointerType<>(new LLVMIntType(context, 8)),
                Arrays.asList(new LLVMType[] {
                        new LLVMIntType(context, 32),
                })), "strerror", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMIntType(context, 32),
                Arrays.asList(new LLVMType[] {})), "__get_errno", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMIntType(context, 32), Arrays.asList(new LLVMType[] {
                new LLVMIntType(context, 32),
                new LLVMPointerType<>(new LLVMIntType(context, 8)),
                new LLVMPointerType<>(new LLVMIntType(context, 32)),
        })), "accept", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMIntType(context, 64), Arrays.asList(new LLVMType[] {
                new LLVMIntType(context, 32),
                new LLVMPointerType<>(new LLVMIntType(context, 8)),
                new LLVMIntType(context, 32),
        })), "bind", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMIntType(context, 32), Arrays.asList(new LLVMType[] {
                new LLVMIntType(context, 32),
                new LLVMIntType(context, 32),
        })), "listen", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMPointerType<>(new LLVMIntType(context, 8)),
                Arrays.asList(new LLVMType[] {
                        new LLVMIntType(context, 64),
                })), "malloc", f -> f.setExternal());

        this.getOrInsertFunction(new LLVMFunctionType(new LLVMIntType(context, 64), Arrays.asList(new LLVMType[] {
                new LLVMPointerType<>(new LLVMIntType(context, 8)),
        })), "strlen", f -> f.setExternal());
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

    public LLVMGlobalVariable getOrInsertGlobal(LLVMType type, String name) {
        LLVMValueRef r = LLVMGetNamedGlobal(this.getInternal(), name);
        if (r != null) {
            return new LLVMGlobalVariable(r);
        }
        return new LLVMGlobalVariable(LLVMAddGlobalInAddressSpace(this.getInternal(), type.getInternal(), name, 0));
    }

    public Optional<LLVMFunction> getFunction(String name) {
        LLVMValueRef r = LLVMGetNamedFunction(this.getInternal(), name);
        return Optional.ofNullable(r).map(r2 -> new LLVMFunction(this, r2));
    }

    public LLVMFunction getOrInsertFunction(LLVMFunctionType type, String name, Consumer<LLVMFunction> callback) {
        LLVMValueRef r = LLVMGetNamedFunction(this.getInternal(), name);
        if (r != null) {
            return new LLVMFunction(this, r);
        }
        LLVMFunction rc = new LLVMFunction(this, name, type);
        callback.accept(rc);
        return rc;
    }

    public String getName() {
        return name;
    }

    public boolean verify() {
        BytePointer error = new BytePointer();
        if (LLVMVerifyModule(this.getInternal(), LLVMPrintMessageAction, error) != 0) {
            LLVMDisposeMessage(error);
            return false;
        }
        return true;
    }

    public LLVMConstant stringConstant(String s) {
        return new LLVMConstant(LLVMConstStringInContext(this.getContext().getInternal(), s, s.length(), 0));
    }

    public String toString() {
        BytePointer p = LLVMPrintModuleToString(obj);
        String rc = new String(p.getString());
        LLVMDisposeMessage(p);
        return rc;
    }
}

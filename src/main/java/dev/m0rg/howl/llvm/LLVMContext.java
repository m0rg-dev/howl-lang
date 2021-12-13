package dev.m0rg.howl.llvm;

import static org.bytedeco.llvm.global.LLVM.LLVMContextCreate;
import static org.bytedeco.llvm.global.LLVM.LLVMGetTypeByName2;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

import org.bytedeco.llvm.LLVM.LLVMContextRef;
import org.bytedeco.llvm.LLVM.LLVMTypeRef;

public class LLVMContext {
    LLVMContextRef obj;

    static Map<String, Exception> types_created = new HashMap<>();

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
        if (types_created.containsKey(name)) {
            types_created.get(name).printStackTrace();
            throw new RuntimeException(name);
        }
        types_created.put(name, new Exception());
        return source.get();
    }
}

package dev.m0rg.howl.ast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import dev.m0rg.howl.llvm.LLVMBuilder;
import dev.m0rg.howl.llvm.LLVMContext;
import dev.m0rg.howl.llvm.LLVMFunction;
import dev.m0rg.howl.llvm.LLVMFunctionType;
import dev.m0rg.howl.llvm.LLVMIntType;
import dev.m0rg.howl.llvm.LLVMModule;
import dev.m0rg.howl.logger.Logger;

public class Module extends ASTElement implements NamedElement, NameHolder {
    String name;
    List<ASTElement> contents;
    Map<String, ASTElement> named_contents;
    List<String> imported_paths;

    public Module(String name) {
        super(null);
        this.name = name;
        this.contents = new ArrayList<ASTElement>();
        this.named_contents = new HashMap<>();
        this.imported_paths = new ArrayList<>();
    }

    @Override
    public ASTElement detach() {
        Module rc = new Module(name);
        for (ASTElement item : contents) {
            rc.insertItem(item.detach());
        }
        return rc;
    }

    @Override
    public String format() {
        List<String> contents = new ArrayList<String>(this.contents.size());
        for (ASTElement s : this.contents) {
            contents.add(s.format());
        }
        return "mod " + this.name + " {\n" + String.join("\n\n", contents).indent(2) + "}";
    }

    public void insertItem(ASTElement item) {
        ASTElement associated = item.setParent(this);
        if (item instanceof NamedElement) {
            this.named_contents.put(((NamedElement) item).getName(), associated);
        }
        if (item instanceof ImportStatement) {
            imported_paths.add(((ImportStatement) item).getImportPath());
        }
        this.contents.add(associated);
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        if (this.parent != null) {
            throw new RuntimeException("setting the name on an owned Module is a terrible idea");
        }
        this.name = name;
    }

    public List<String> getImportedPaths() {
        return Collections.unmodifiableList(imported_paths);
    }

    public Optional<ASTElement> getChild(String name) {
        return Optional.ofNullable(this.named_contents.get(name));
    }

    public void insertPath(String path, ASTElement item) {
        String[] parts = path.split("\\.");
        if (parts.length == 1) {
            this.insertItem(item);
        } else {
            for (ASTElement e : this.contents) {
                if (e instanceof NamedElement) {
                    NamedElement as_named = (NamedElement) e;
                    if (as_named.getName().equals(parts[0])) {
                        if (e instanceof Module) {
                            Module m = (Module) e;
                            m.insertPath(String.join(".", Arrays.copyOfRange(parts, 1, parts.length)), item);
                            return;
                        } else {
                            throw new RuntimeException("attempt to set path containing non-Module");
                        }
                    }
                }
            }

            Module new_module = new Module(parts[0]);
            new_module.insertPath(String.join(".", Arrays.copyOfRange(parts, 1, parts.length)), item);
            this.insertItem(new_module);
        }
    }

    public void transform(ASTTransformer t) {
        int index = 0;
        ASTElement[] contents = this.contents.toArray(new ASTElement[0]);
        for (ASTElement item : contents) {
            item.transform(t);
            ASTElement rc = t.transform(item).setParent(this);
            this.contents.set(index, rc);
            if (rc instanceof NamedElement) {
                this.named_contents.put(((NamedElement) rc).getName(), rc);
            }
            if (rc instanceof ImportStatement) {
                throw new UnsupportedOperationException("dude what are you doing");
            }
            index++;
        }
    }

    // this is a class method because we're gonna mutate this.contents
    public void dropGenerics() {
        List<ASTElement> alias = new ArrayList<>(this.contents);
        for (ASTElement item : alias) {
            if (item instanceof Class) {
                if (((Class) item).isGeneric()) {
                    this.contents.remove(item);
                }
            } else if (item instanceof Interface) {
                if (((Interface) item).getGenericNames().size() > 0) {
                    this.contents.remove(item);
                }
            }
        }
    }

    public List<LLVMModule> generate(LLVMContext context, boolean isMain) {
        List<LLVMModule> rc = new ArrayList<>();
        LLVMModule this_module = new LLVMModule(this.getPath(), context);
        rc.add(this_module);

        int last_len = 0;
        while (last_len != contents.size()) {
            // shenanigans to not blow up when new (monomorphized) classes are inserted
            List<ASTElement> c = new ArrayList<>(contents);
            last_len = c.size();
            for (ASTElement item : c) {
                if (item instanceof Module) {
                    List<LLVMModule> submodules = ((Module) item).generate(context, false);
                    rc.addAll(submodules);
                } else if (item instanceof GeneratesTopLevelItems) {
                    ((GeneratesTopLevelItems) item).generate(this_module);
                }
            }
        }

        for (ASTElement item : contents) {
            if (item instanceof Class) {
                ((Class) item).generateMethods(this_module);
            } else if (item instanceof Function) {
                ((Function) item).generate(this_module);
            }
        }

        if (isMain) {
            LLVMFunctionType mainType = new LLVMFunctionType(new LLVMIntType(context, 32), new ArrayList<>());
            this_module.getOrInsertFunction(mainType, "main", (LLVMFunction f) -> {
                try (LLVMBuilder builder = new LLVMBuilder(f.getModule())) {
                    f.appendBasicBlock("entry");
                    builder.positionAtEnd(f.lastBasicBlock());
                    builder.buildReturn(builder.buildCall(
                            this_module.getOrInsertFunction(mainType, "root.lib.entry.setup",
                                    g -> g.setExternal(), true),
                            new ArrayList<>(), ""));
                }
            }, false);
        }

        return rc;
    }
}

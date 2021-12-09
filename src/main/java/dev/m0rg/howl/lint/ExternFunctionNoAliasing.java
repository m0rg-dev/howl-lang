package dev.m0rg.howl.lint;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.type.FunctionType;
import dev.m0rg.howl.ast.type.TypeElement;

public class ExternFunctionNoAliasing extends LintPass {
    class Location {
        public String path;
        public String signature;

        public Location(String path, String signature) {
            this.path = path;
            this.signature = signature;
        }

        public String toString() {
            return this.signature + " at " + this.path;
        }
    }

    Map<String, Location> signatures = new HashMap<>();

    public void check(ASTElement e) {
        if (e instanceof Function) {
            Function as_function = (Function) e;
            if (as_function.isExtern()) {
                FunctionType ft = as_function.getOwnType();
                String signature = ft.getReturnType().resolve().format() + "(";
                List<String> args_strings = new ArrayList<>();
                for (TypeElement a : ft.getArgumentTypes()) {
                    args_strings.add(a.format());
                }
                signature += String.join(", ", args_strings) + ")";
                if (signatures.containsKey(as_function.getOriginalName())) {
                    if (!signatures.get(as_function.getOriginalName()).signature.equals(signature)) {
                        e.getSpan().addError("extern function " + as_function.getOriginalName() + " redeclared",
                                "Original type was " + signatures.get(as_function.getOriginalName()) + ".");
                    }
                } else {
                    signatures.put(as_function.getOriginalName(),
                            new Location(e.getParent().getPath() + "." + as_function.getOriginalName(), signature));
                }
            }
        }
    }
}

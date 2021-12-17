package dev.m0rg.howl.lint;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Interface;
import dev.m0rg.howl.ast.type.NewType;
import dev.m0rg.howl.ast.type.TypeElement;
import dev.m0rg.howl.ast.type.algebraic.AFunctionReference;
import dev.m0rg.howl.ast.type.algebraic.ALambdaTerm;
import dev.m0rg.howl.ast.type.algebraic.AStructureReference;
import dev.m0rg.howl.logger.Logger;

public class CheckInterfaceImplementations {
    public static Boolean apply(ASTElement e) {
        if (e instanceof Class) {
            Class c = (Class) e;
            for (TypeElement t : c.interfaces()) {
                ALambdaTerm itype = ALambdaTerm.evaluateFrom(t);
                for (AFunctionReference f : ((AStructureReference) itype).getMethods()) {
                    if (!c.getFunctionFromInterface(f).isPresent()) {
                        c.getHeaderSpan().addError("class " + c.getName() + " does not implement method "
                                + f.formatPretty() + " from interface " + itype.formatPretty());
                    }
                }
            }
            return true;
        } else if (e instanceof Interface || e instanceof Function || e instanceof NewType) {
            return true;
        } else {
            return false;
        }
    }
}

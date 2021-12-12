package dev.m0rg.howl.ast.type.algebraic;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import dev.m0rg.howl.ast.Argument;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.logger.Logger;

public class AFunctionType extends AlgebraicType {
    AlgebraicType returntype;
    List<AlgebraicType> arguments;

    public AFunctionType(Function source, Map<String, AlgebraicType> typemap) {
        returntype = AlgebraicType.derive(source.getReturn(), typemap);
        arguments = new ArrayList<>();
        for (Argument a : source.getArgumentList()) {
            arguments.add(AlgebraicType.derive(a.getOwnType(), typemap));
        }
    }

    AFunctionType(AFunctionType other, Map<String, AlgebraicType> evalmap) {
        returntype = other.returntype.evaluate(evalmap);
        arguments = new ArrayList<>();
        for (AlgebraicType a : other.arguments) {
            arguments.add(a.evaluate(evalmap));
        }
    }

    AFunctionType(AFunctionType other) {
        returntype = other.returntype.half_evaluate();
        arguments = new ArrayList<>();
        for (AlgebraicType a : other.arguments) {
            arguments.add(a.half_evaluate());
        }
    }

    public String format() {
        List<String> afmt = new ArrayList<>();
        for (AlgebraicType a : arguments) {
            afmt.add(a.format());
        }

        return "fn " + returntype.format() + "(" + String.join(", ", afmt) + ")";
    }

    public AlgebraicType getArgument(int index) {
        return arguments.get(index);
    }

    public AlgebraicType evaluate(Map<String, AlgebraicType> evalmap) {
        return new AFunctionType(this, evalmap);
    }

    public AlgebraicType half_evaluate() {
        return new AFunctionType(this);
    }
}
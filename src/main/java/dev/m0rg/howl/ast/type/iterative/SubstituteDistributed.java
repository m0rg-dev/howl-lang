package dev.m0rg.howl.ast.type.iterative;

import java.util.Map;

import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.logger.Logger;

public class SubstituteDistributed extends ProductionRule {
    @Override
    boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source instanceof ParameterSubstitution) {
            ParameterSubstitution sub = (ParameterSubstitution) source;
            if (sub.source instanceof Distributive) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    @Override
    public TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
        if (source instanceof ParameterSubstitution) {
            ParameterSubstitution sub = (ParameterSubstitution) source;
            if (sub.source instanceof Distributive) {
                Distributive d = (Distributive) sub.source;
                d.apply(new SubstituteDistributedInner(sub.from, sub.to), environment);
                return sub.source;
            } else {
                throw new RuntimeException();
            }
        } else {
            throw new RuntimeException();
        }
    }

    class SubstituteDistributedInner extends ProductionRule {
        int index;
        TypeObject to;

        SubstituteDistributedInner(int index, TypeObject to) {
            this.index = index;
            this.to = to;
        }

        @Override
        public boolean matches(TypeObject source, Map<Expression, TypeObject> environment) {
            return !(source instanceof Distributive);
        }

        @Override
        public TypeObject apply(TypeObject source, Map<Expression, TypeObject> environment) {
            if (source instanceof AnyType)
                return source;
            FreeVariable v = new FreeVariable();
            environment.put(v, source);
            return new ParameterSubstitution(new TypeAlias(v), index, to);
        }
    }

}

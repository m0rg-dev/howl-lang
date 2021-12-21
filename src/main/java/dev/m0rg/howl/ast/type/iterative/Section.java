package dev.m0rg.howl.ast.type.iterative;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import dev.m0rg.howl.ast.expression.Expression;
import dev.m0rg.howl.ast.statement.Annotation;
import dev.m0rg.howl.ast.statement.AssignmentStatement;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.IfStatement;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.ast.statement.ReturnExpectation;
import dev.m0rg.howl.ast.statement.ReturnStatement;
import dev.m0rg.howl.ast.statement.SimpleStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.logger.Logger;

public class Section {
    static List<ProductionRule> rules = new ArrayList<>();

    Statement source_statement;
    Map<Expression, TypeObject> environment;

    Section() {
        this.environment = new LinkedHashMap<>();
    }

    static {
        rules.add(new Dereference());
        rules.add(new IntersectEquals());
    }

    public boolean isEmpty() {
        return environment.isEmpty();
    }

    public static Section derive(Statement source) {
        Section rc = new Section();
        rc.source_statement = source;

        if (source instanceof AssignmentStatement) {
            AssignmentStatement as_assign = (AssignmentStatement) source;
            as_assign.getLHS().deriveType(rc.environment);
            as_assign.getRHS().deriveType(rc.environment);
            FreeVariable lhs_reg = new FreeVariable();
            FreeVariable rhs_reg = new FreeVariable();
            rc.environment.put(lhs_reg, rc.environment.get(as_assign.getLHS()));
            rc.environment.put(rhs_reg, rc.environment.get(as_assign.getRHS()));
            rc.environment.put(as_assign.getLHS(),
                    new IntersectionType(new TypeAlias(lhs_reg),
                            new TypeAlias(rhs_reg)));
            rc.environment.put(as_assign.getRHS(), new TypeAlias(as_assign.getLHS()));
        } else if (source instanceof LocalDefinitionStatement) {
            LocalDefinitionStatement as_let = (LocalDefinitionStatement) source;
            as_let.getInitializer().deriveType(rc.environment);
            FreeVariable init_reg = new FreeVariable();
            rc.environment.put(init_reg, rc.environment.get(as_let.getInitializer()));
            rc.environment.put(as_let.getInitializer(),
                    new IntersectionType(new TypeAlias(init_reg),
                            new TypeAlias(as_let.getOwnType().deriveType(rc.environment))));
        } else if (source instanceof ReturnStatement) {
            ReturnStatement as_ret = (ReturnStatement) source;
            if (as_ret.getSource().isPresent()) {
                as_ret.getSource().get().deriveType(rc.environment);
                rc.environment.put(as_ret.getSource().get(),
                        new IntersectionType(
                                new TypeAlias(as_ret.getContainingFunction().getReturn().deriveType(rc.environment)),
                                rc.environment.get(as_ret.getSource().get())));
            }
        } else if (source instanceof SimpleStatement) {
            SimpleStatement as_simple = (SimpleStatement) source;
            as_simple.getExpression().deriveType(rc.environment);
        } else if (source instanceof IfStatement) {
            // TODO
        } else if (source instanceof ReturnExpectation || source instanceof CompoundStatement
                || source instanceof Annotation) {
            ;
        } else {
            throw new UnsupportedOperationException(source.getClass().getName());
        }

        return rc;
    }

    public void evaluate(boolean noisy) {
        boolean did_change = true;
        while (did_change) {
            did_change = false;
            for (ProductionRule r : Section.rules) {
                for (Entry<Expression, TypeObject> e : environment.entrySet()) {
                    if (r.matches(e.getValue(), environment)) {
                        TypeObject result = r.apply(e.getValue(), environment);
                        if (noisy) {
                            Logger.trace(String.format("%40s: %s", r.getName(), e.getValue().format()));
                        }
                        environment.put(e.getKey(), result);
                        did_change = true;
                    } else if (e.getValue() instanceof Distributive) {
                        Distributive d = (Distributive) e.getValue();
                        if (d.anyMatch(r, environment)) {
                            if (noisy) {
                                Logger.trace(String.format("%40s: %s", r.getName(), e.getValue().format()));
                            }
                            d.apply(r, environment);
                            did_change = true;
                        }
                    }
                }
            }
        }
        if (noisy) {
            Logger.trace("");
        }
    }

    public void dump() {
        Logger.trace("Section: " + source_statement.format());
        for (Entry<Expression, TypeObject> e : environment.entrySet()) {
            if (e.getKey() instanceof FreeVariable && ((FreeVariable) e.getKey()).reference_count == 0) {
                continue;
            }
            Logger.trace(String.format("%40s: %s%s\u001b[0m", e.getKey().format(),
                    e.getValue().isUniquelyDetermined() ? "\u001b[32m" : "", e.getValue().format()));
        }
        Logger.trace("");
    }
}

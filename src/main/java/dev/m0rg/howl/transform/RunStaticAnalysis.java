package dev.m0rg.howl.transform;

import java.util.HashSet;
import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.statement.ReturnExpectation;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.type.NamedType;
import dev.m0rg.howl.lint.LintPass;
import dev.m0rg.howl.logger.Logger;
import dev.m0rg.howl.static_analysis.CFGNode;
import dev.m0rg.howl.static_analysis.StaticAnalysis;

public class RunStaticAnalysis {
    public static Boolean apply(ASTElement e) {
        if (e instanceof Function) {
            Function f = (Function) e;
            if (f.getBody().isPresent()) {
                ReturnExpectation re = new ReturnExpectation(f);
                f.getBody().get().insertStatement(re);

                CFGNode g = StaticAnalysis.buildGraph(f.getBody().get());
                Logger.trace("Graph for " + f.getPath() + ":\n" + g.format());

                Set<Statement> live = findReachable(g);
                f.transform((new DeadCodeFinder(live)));

                if (!(f.getReturn() instanceof NamedType && ((NamedType) f.getReturn()).getName().equals("void"))) {
                    if (live.contains(re)) {
                        re.getSpan().addError("non-void function must return a value");
                    }
                }
            }
            return true;
        }
        return false;
    }

    static Set<Statement> findReachable(CFGNode g) {
        return findReachable(g, new HashSet<>());
    }

    static Set<Statement> findReachable(CFGNode g, Set<Statement> found) {
        found.add(g.getStatement());
        for (CFGNode succ : g.getSuccessors()) {
            findReachable(succ, found);
        }
        return found;
    }

    static class DeadCodeFinder extends LintPass {
        Set<Statement> live_set;

        public DeadCodeFinder(Set<Statement> live_set) {
            this.live_set = live_set;
        }

        public void check(ASTElement e) {
            if (e instanceof Statement && !(e instanceof ReturnExpectation)) {
                if (!live_set.contains(e)) {
                    Logger.trace("found dead statement");
                    e.getSpan().addError("dead code");
                }
            }
        }
    }
}

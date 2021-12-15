package dev.m0rg.howl.transform;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import dev.m0rg.howl.ast.ASTElement;
import dev.m0rg.howl.ast.Function;
import dev.m0rg.howl.ast.Class;
import dev.m0rg.howl.ast.expression.NameExpression;
import dev.m0rg.howl.ast.statement.AssignmentStatement;
import dev.m0rg.howl.ast.statement.ReturnExpectation;
import dev.m0rg.howl.ast.statement.ReturnStatement;
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
                if (f.getOriginalName().equals("constructor")) {
                    f.transform((new UninitializedFieldFinder(g)));
                }

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
        HashSet<Statement> rc = new HashSet<>();
        g.walk(n -> rc.add(n.getStatement()));
        return rc;
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

    static class UninitializedFieldFinder extends LintPass {
        CFGNode graph;
        Map<Statement, Long> node_cache;
        Map<Long, Set<String>> initialized_cache;

        public UninitializedFieldFinder(CFGNode graph) {
            this.graph = graph;
            this.initialized_cache = new HashMap<>();
            this.node_cache = new HashMap<>();
            graph.walk(n -> {
                Set<String> this_statement = new HashSet<>();
                for (CFGNode pred : n.getPredecessors()) {
                    this_statement.addAll(initialized_cache.get(pred.getID()));
                }

                if (n.getStatement() instanceof AssignmentStatement) {
                    AssignmentStatement as_assign = (AssignmentStatement) n.getStatement();
                    if (as_assign.getLHS() instanceof NameExpression) {
                        NameExpression lhs_name = (NameExpression) as_assign.getLHS();
                        if (lhs_name.getName().startsWith("self.")) {
                            String fieldname = lhs_name.getName().substring(5);
                            if (!fieldname.contains(".")) {
                                Logger.trace("UninitializedFieldFinder " + n.getID() + " " + fieldname);
                                this_statement.add(fieldname);
                            }
                        }
                    }
                }

                initialized_cache.put(n.getID(), this_statement);
                node_cache.put(n.getStatement(), n.getID());
            });
        }

        public void check(ASTElement e) {
            if (e instanceof NameExpression) {
                // Obviously, we shouldn't be checking the left side of assignment statements.
                if (e.getParent() instanceof AssignmentStatement
                        && (((AssignmentStatement) e.getParent()).getLHS() == e)) {
                    return;
                }

                NameExpression as_name = (NameExpression) e;
                if (as_name.getName().startsWith("self.")) {
                    String fieldname = as_name.getName().substring(5);
                    if (!fieldname.contains(".")) {
                        if (!initialized_cache.get(node_cache.get(as_name.nearestStatement())).contains(fieldname)) {
                            e.getSpan().addError("field self." + fieldname + " may be used uninitialized");
                        }
                    }
                }
            } else if (e instanceof ReturnStatement || e instanceof ReturnExpectation) {
                Class c = (Class) e.nearest(x -> x instanceof Class).get();
                c.getFields().forEach(f -> {
                    if (f.isStatic())
                        return;
                    if (!initialized_cache.get(node_cache.get(e)).contains(f.getName())) {
                        e.getSpan().addError(
                                "field self." + f.getName() + " is not initialized at constructor return");
                    }
                });
            }
        }
    }
}

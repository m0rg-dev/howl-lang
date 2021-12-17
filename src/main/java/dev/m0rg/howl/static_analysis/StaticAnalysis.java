package dev.m0rg.howl.static_analysis;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Optional;

import dev.m0rg.howl.ast.statement.AssignmentStatement;
import dev.m0rg.howl.ast.statement.BreakContinueStatement;
import dev.m0rg.howl.ast.statement.CatchStatement;
import dev.m0rg.howl.ast.statement.CompoundStatement;
import dev.m0rg.howl.ast.statement.ForStatement;
import dev.m0rg.howl.ast.statement.IfStatement;
import dev.m0rg.howl.ast.statement.LocalDefinitionStatement;
import dev.m0rg.howl.ast.statement.ReturnExpectation;
import dev.m0rg.howl.ast.statement.ReturnStatement;
import dev.m0rg.howl.ast.statement.SimpleStatement;
import dev.m0rg.howl.ast.statement.Statement;
import dev.m0rg.howl.ast.statement.ThrowStatement;
import dev.m0rg.howl.ast.statement.TryStatement;
import dev.m0rg.howl.ast.statement.WhileStatement;
import dev.m0rg.howl.logger.Logger;

public class StaticAnalysis {
    public static CFGNode buildGraph(Statement s) {
        return buildGraph(s, Optional.empty());
    }

    public static CFGNode buildGraph(Statement s, Optional<CFGNode> next_sibling) {
        if (s instanceof CompoundStatement) {
            CompoundStatement block = (CompoundStatement) s;
            if (block.getContents().isEmpty()) {
                return new CFGNode(block);
            }

            CFGNode head = new CFGNode(block);
            Deque<CFGNode> nodes = new ArrayDeque<>();
            for (int i = block.getContents().size() - 1; i >= 0; i--) {
                if (nodes.isEmpty()) {
                    nodes.addFirst(buildGraph(block.getContents().get(i), next_sibling));
                } else {
                    CFGNode next = nodes.peekFirst();
                    CFGNode curr = buildGraph(block.getContents().get(i), Optional.of(next));
                    next.addPredecessor(curr);
                    nodes.addFirst(curr);
                }
            }

            head.addReflexive(nodes.peekFirst());

            return head;
        } else if (s instanceof AssignmentStatement
                || s instanceof LocalDefinitionStatement
                || s instanceof SimpleStatement) {
            CFGNode rc = new CFGNode(s);
            if (next_sibling.isPresent()) {
                rc.addSuccessor(next_sibling.get());
            }
            return rc;
        } else if (s instanceof ReturnStatement || s instanceof ThrowStatement || s instanceof ReturnExpectation) {
            return new CFGNode(s);
        } else if (s instanceof BreakContinueStatement) {
            // TODO
            CFGNode rc = new CFGNode(s);
            if (next_sibling.isPresent()) {
                rc.addSuccessor(next_sibling.get());
            }
            return rc;
        } else if (s instanceof IfStatement) {
            IfStatement as_if = (IfStatement) s;
            CFGNode rc = new CFGNode(s);

            rc.addReflexive(buildGraph(as_if.getBody(), next_sibling));

            if (as_if.getAlternative().isPresent()) {
                rc.addReflexive(buildGraph(as_if.getAlternative().get(), next_sibling));
            } else if (as_if.getChain().isPresent()) {
                rc.addReflexive(buildGraph(as_if.getChain().get(), next_sibling));
            } else if (next_sibling.isPresent()) {
                rc.addSuccessor(next_sibling.get());
            }

            return rc;
        } else if (s instanceof TryStatement) {
            TryStatement as_try = (TryStatement) s;
            CFGNode rc = new CFGNode(s);
            CFGNode try_node = buildGraph(as_try.getBody(), next_sibling);
            rc.addReflexive(try_node);
            for (CatchStatement c : as_try.getAlternatives()) {
                CFGNode catch_node = buildGraph(c, next_sibling);
                try_node.addReflexive(catch_node);
            }

            if (next_sibling.isPresent()) {
                rc.addSuccessor(next_sibling.get());
            }

            return rc;
        } else if (s instanceof CatchStatement) {
            CFGNode rc = new CFGNode(s);
            rc.addReflexive(buildGraph(((CatchStatement) s).getBody(), next_sibling));
            if (next_sibling.isPresent()) {
                rc.addSuccessor(next_sibling.get());
            }
            return rc;
        } else if (s instanceof WhileStatement) {
            WhileStatement as_while = (WhileStatement) s;
            CFGNode rc = new CFGNode(s);
            rc.addReflexive(buildGraph(as_while.getBody(), next_sibling));

            if (next_sibling.isPresent()) {
                rc.addSuccessor(next_sibling.get());
            }

            return rc;
        } else if (s instanceof ForStatement) {
            ForStatement as_for = (ForStatement) s;
            CFGNode rc = new CFGNode(s);
            rc.addReflexive(buildGraph(as_for.getBody(), next_sibling));

            if (next_sibling.isPresent()) {
                rc.addSuccessor(next_sibling.get());
            }

            return rc;
        }

        throw new RuntimeException("buildGraph unsupported " + s.getClass().getName() + " " + s.getPath());
    }
}

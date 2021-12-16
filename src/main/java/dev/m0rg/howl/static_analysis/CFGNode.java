package dev.m0rg.howl.static_analysis;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

import dev.m0rg.howl.ast.statement.Statement;

public class CFGNode {
    static long counter = 0;

    long id;
    Statement statement;
    Set<CFGNode> predecessors;
    Set<CFGNode> successors;

    public CFGNode(Statement statement) {
        this.statement = statement;
        this.successors = new HashSet<>();
        this.predecessors = new HashSet<>();
        this.id = counter++;
    }

    public void addSuccessor(CFGNode successor) {
        successors.add(successor);
    }

    public void addPredecessor(CFGNode predecessor) {
        predecessors.add(predecessor);
    }

    public void addReflexive(CFGNode successor) {
        successors.add(successor);
        successor.addPredecessor(this);
    }

    public Set<CFGNode> getPredecessors() {
        return Collections.unmodifiableSet(predecessors);
    }

    public Set<CFGNode> getSuccessors() {
        return Collections.unmodifiableSet(successors);
    }

    public Statement getStatement() {
        return statement;
    }

    public void walk(Consumer<CFGNode> c) {
        c.accept(this);
        this.getSuccessors().forEach((n) -> n.walk(c));
    }

    public String format() {
        StringBuilder rc = new StringBuilder("#" + this.id + " " + statement.getClass().getSimpleName());

        if (predecessors.size() > 0) {
            rc.append(" <- ");
            predecessors.forEach((CFGNode n) -> rc.append("" + n.id));
        }

        rc.append("\n");

        for (CFGNode successor : successors) {
            List<String> lines = new ArrayList<>(successor.format().lines().toList());
            rc.append("- " + lines.remove(0) + "\n");
            for (String l : lines) {
                rc.append("| " + l + "\n");
            }
        }
        return rc.toString();
    }

    public long getID() {
        return id;
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + (int) (id ^ (id >>> 32));
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        CFGNode other = (CFGNode) obj;
        if (id != other.id)
            return false;
        return true;
    }

}

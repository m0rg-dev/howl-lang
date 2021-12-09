package dev.m0rg.howl.ast;

import java.util.Map;

public interface HasUpstreamFields {
    public Map<String, FieldHandle> getUpstreamFields();
}

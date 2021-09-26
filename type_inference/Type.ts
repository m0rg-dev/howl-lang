export abstract class Type {
    abstract toString(): string;
    abstract equals(other: Type): boolean;
}

export abstract class ClosureType extends Type {
    abstract evaluable(): boolean
    abstract evaluator(): () => Type;
}


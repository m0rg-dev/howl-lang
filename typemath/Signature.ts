import { ClassType, FunctionType, RawPointerType, TypeObject } from "../unified_parser/TypeObject";

export abstract class TypeConstraint {
    port: string;
    constructor(port: string) {
        this.port = port;
    }
    abstract toString(): string;
    abstract intersect(other: TypeConstraint): TypeConstraint
};

export abstract class PortConstraint {
    abstract toString(): string;
};

export class Signature {
    ports: Set<string> = new Set();
    type_constraints: Map<string, TypeConstraint> = new Map();
    port_constraints: PortConstraint[] = [];

    toString(): string {
        let parts: string[] = [];
        this.ports.forEach((v, k) => parts.push(k));
        this.type_constraints.forEach(x => parts.push(x.toString()));
        this.port_constraints.forEach(x => parts.push(x.toString()));
        return `<${parts.join(", ")}>`;
    }
};

export class PortIntersectionConstraint extends PortConstraint {
    p0: string;
    p1: string;
    constructor(p0: string, p1: string) {
        super();
        this.p0 = p0;
        this.p1 = p1;
    }

    toString = () => `${this.p0} x ${this.p1}`;
}

export class EmptyConstraint extends TypeConstraint {
    toString = () => `${this.port} = <empty>`;
    intersect(other: TypeConstraint) {
        return new EmptyConstraint(this.port);
    }
}

export class AllConstraint extends TypeConstraint {
    toString = () => `${this.port} = <all>`;
    intersect(other: TypeConstraint) {
        return other;
    }
}

export class AnyFunctionConstraint extends TypeConstraint {
    intersect(other: TypeConstraint): TypeConstraint {
        if (other instanceof AllConstraint || other instanceof AnyFunctionConstraint) {
            return this;
        } else if (other instanceof ExactConstraint) {
            return other.intersect(this);
        } else {
            throw new Error(`don't know how to intersect with <${other}>`);
        }
    }

    toString = () => `${this.port} is Function`;
}

export class AnyClassConstraint extends TypeConstraint {
    intersect(other: TypeConstraint): TypeConstraint {
        if (other instanceof AllConstraint || other instanceof AnyClassConstraint) {
            return this;
        } else if (other instanceof ExactConstraint) {
            return other.intersect(this);
        } else {
            throw new Error(`don't know how to intersect with <${other}>`);
        }
    }

    toString = () => `${this.port} is Class`;
}

export class AnyRawPointerConstraint extends TypeConstraint {
    intersect(other: TypeConstraint): TypeConstraint {
        if (other instanceof AllConstraint || other instanceof AnyRawPointerConstraint) {
            return this;
        } else if (other instanceof ExactConstraint) {
            return other.intersect(this);
        } else {
            throw new Error(`don't know how to intersect with <${other}>`);
        }
    }

    toString = () => `${this.port} is RawPointer<T>`;
}

export class UnionConstraint extends TypeConstraint {
    t: TypeObject[];
    constructor(port: string, t: TypeObject[]) {
        super(port);
        this.t = t;
    }

    toString = () => `${this.port} = {${this.t.join(", ")}}`;
    intersect(other: TypeConstraint): TypeConstraint {
        let u: TypeObject[];
        if (other instanceof UnionConstraint) {
            u = [...other.t];
        } else if (other instanceof ExactConstraint) {
            u = [other.t];
        } else if (other instanceof AllConstraint) {
            return this;
        } else if (other instanceof ReturnTypeConstraint) {
            // TODO
            return other;
        } else {
            throw new Error(`don't know how to intersect with ${other}`);
        }

        u = u.filter(x => this.t.some(y => y.toString() == x.toString()));
        return new UnionConstraint(this.port, u);
    }
}

export class ExactConstraint extends TypeConstraint {
    t: TypeObject;
    constructor(port: string, t: TypeObject) {
        super(port);
        this.t = t;
    }

    toString = () => `${this.port}=${this.t}`;
    intersect(other: TypeConstraint): TypeConstraint {
        let match: boolean;
        if (other instanceof UnionConstraint) {
            match = other.t.some(x => x.toString() == this.t.toString());
        } else if (other instanceof ExactConstraint) {
            match = other.t.toString() == this.t.toString();
        } else if (other instanceof AnyClassConstraint) {
            match = this.t instanceof ClassType;
        } else if (other instanceof AnyFunctionConstraint) {
            match = this.t instanceof FunctionType;
        } else if (other instanceof AnyRawPointerConstraint) {
            match = this.t instanceof RawPointerType;
        } else if (other instanceof ReturnTypeConstraint) {
            // TODO
            return other;
        } else if (other instanceof AllConstraint) {
            match = true;
        } else {
            throw new Error(`don't know how to intersect with ${other}`);
        }

        if (match) {
            return this;
        } else {
            return new EmptyConstraint(this.port);
        }
    }
}

export class FromScopeConstraint extends TypeConstraint {
    intersect(other: TypeConstraint): TypeConstraint {
        throw new Error("Method not implemented.");
    }
    scope_name: string;
    constructor(port: string, scope_name: string) {
        super(port);
        this.scope_name = scope_name;
    }

    toString = () => `${this.port} <- typeof ${this.scope_name}`;
}

export class ReturnTypeConstraint extends TypeConstraint {
    intersect(other: TypeConstraint): TypeConstraint {
        throw new Error("Method not implemented.");
    }
    constructor(port: string) {
        super(port);
    }

    toString = () => `${this.port} <- typeof return`;
}

export class OutgoingConstraint extends PortConstraint {
    port: string;
    sub: TypeConstraint;
    constructor(port: string, sub: TypeConstraint) {
        super();
        this.port = port;
        this.sub = sub;
    }

    toString = () => `(${this.sub}) -> ${this.port}`;
}
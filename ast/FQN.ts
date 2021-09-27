export class FQN {
    private parent: HasFQN;
    private part: string;

    constructor(parent: HasFQN, part: string) {
        this.parent = parent;
        this.part = part;
    }

    toString() {
        if (this.parent) {
            return this.parent.getFQN().toString() + "." + this.part;
        } else {
            return this.part;
        }
    }

    equals(other: FQN) {
        return this.toString() == other.toString();
    }

    last() {
        return this.part;
    }

    repl_last(n: string): FQN {
        return new FQN(this.parent, n);
    }
}

export interface HasFQN {
    getFQN(): FQN;
}

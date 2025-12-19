export class Quantity {
    private constructor(private readonly value: number) {
        if (value < 0) {
            throw new Error('Quantity cannot be negative');
        }
        if (!Number.isInteger(value)) {
            throw new Error('Quantity must be an integer');
        }
    }

    static create(value: number): Quantity {
        return new Quantity(value);
    }

    getValue(): number {
        return this.value;
    }

    add(other: Quantity): Quantity {
        return new Quantity(this.value + other.value);
    }

    subtract(other: Quantity): Quantity {
        return new Quantity(this.value - other.value);
    }

    equals(other: Quantity): boolean {
        return this.value === other.value;
    }

    isZero(): boolean {
        return this.value === 0;
    }

    toString(): string {
        return this.value.toString();
    }
}

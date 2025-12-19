export class ProductId {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('ProductId cannot be empty');
        }
    }

    static create(value: string): ProductId {
        return new ProductId(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: ProductId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

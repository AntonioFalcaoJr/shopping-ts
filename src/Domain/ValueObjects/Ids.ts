export class CustomerId {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('CustomerId cannot be empty');
        }
    }

    static create(value: string): CustomerId {
        return new CustomerId(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CustomerId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

export class CartId {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('CartId cannot be empty');
        }
    }

    static create(value: string): CartId {
        return new CartId(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CartId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

export class CheckoutId {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('CheckoutId cannot be empty');
        }
    }

    static create(value: string): CheckoutId {
        return new CheckoutId(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CheckoutId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

export class OrderId {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('OrderId cannot be empty');
        }
    }

    static create(value: string): OrderId {
        return new OrderId(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: OrderId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

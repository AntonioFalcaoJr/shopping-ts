export enum PaymentMethodType {
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    PAYPAL = 'PAYPAL',
    BANK_TRANSFER = 'BANK_TRANSFER',
}

export class PaymentMethod {
    private constructor(
        private readonly type: PaymentMethodType,
        private readonly details: string
    ) {
        if (!details || details.trim().length === 0) {
            throw new Error('Payment method details cannot be empty');
        }
    }

    static create(type: PaymentMethodType, details: string): PaymentMethod {
        return new PaymentMethod(type, details);
    }

    getType(): PaymentMethodType {
        return this.type;
    }

    getDetails(): string {
        return this.details;
    }

    equals(other: PaymentMethod): boolean {
        return this.type === other.type && this.details === other.details;
    }

    toString(): string {
        return `${this.type}: ${this.details}`;
    }
}

export class CouponCode {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('Coupon code cannot be empty');
        }
    }

    static create(value: string): CouponCode {
        return new CouponCode(value.toUpperCase());
    }

    getValue(): string {
        return this.value;
    }

    equals(other: CouponCode): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

export class GiftCardCode {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('Gift card code cannot be empty');
        }
    }

    static create(value: string): GiftCardCode {
        return new GiftCardCode(value);
    }

    getValue(): string {
        return this.value;
    }

    equals(other: GiftCardCode): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}

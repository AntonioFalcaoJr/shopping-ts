import { v4 as uuidv4 } from 'uuid';
import { CartId, CustomerId, CheckoutId, OrderId } from '../../src/Domain/ValueObjects/Ids';
import { ProductId } from '../../src/Domain/ValueObjects/ProductId';
import { Money } from '../../src/Domain/ValueObjects/Money';
import { Quantity } from '../../src/Domain/ValueObjects/Quantity';
import { PaymentMethod, PaymentMethodType, CouponCode, GiftCardCode } from '../../src/Domain/ValueObjects/PaymentMethod';

export class TestDataBuilders {
    static createCartId(): CartId {
        return CartId.create(uuidv4());
    }

    static createCustomerId(): CustomerId {
        return CustomerId.create(uuidv4());
    }

    static createCheckoutId(): CheckoutId {
        return CheckoutId.create(uuidv4());
    }

    static createOrderId(): OrderId {
        return OrderId.create(uuidv4());
    }

    static createProductId(id?: string): ProductId {
        return ProductId.create(id || uuidv4());
    }

    static createMoney(amount: number = 10.00, currency: string = 'USD'): Money {
        return Money.create(amount, currency);
    }

    static createQuantity(value: number = 1): Quantity {
        return Quantity.create(value);
    }

    static createPaymentMethod(
        type: PaymentMethodType = PaymentMethodType.CREDIT_CARD,
        details: string = '4111111111111111'
    ): PaymentMethod {
        return PaymentMethod.create(type, details);
    }

    static createCouponCode(code: string = 'SAVE10'): CouponCode {
        return CouponCode.create(code);
    }

    static createGiftCardCode(code: string = 'GIFT-1234-5678'): GiftCardCode {
        return GiftCardCode.create(code);
    }

    static createOrderItem(
        productId?: string,
        quantity: number = 1,
        unitPrice: number = 10.00,
        currency: string = 'USD'
    ) {
        return {
            productId: productId || uuidv4(),
            quantity,
            unitPrice: {
                amount: unitPrice,
                currency,
            },
        };
    }

    static createShippingAddress(
        street: string = '123 Main St',
        city: string = 'New York',
        state: string = 'NY',
        zipCode: string = '10001',
        country: string = 'USA'
    ) {
        return {
            street,
            city,
            state,
            zipCode,
            country,
        };
    }
}

import {CheckoutId, CartId} from '../ValueObjects/Ids';
import {PaymentMethod} from '../ValueObjects/PaymentMethod';
import {CouponCode, GiftCardCode} from '../ValueObjects/PaymentMethod';
import {Money} from '../ValueObjects/Money';

export type CheckoutCommand =
    | InitiateCheckout
    | SetPaymentMethod
    | ApplyCoupon
    | ApplyGiftCard
    | CompleteCheckout
    | CancelCheckout;

export interface InitiateCheckout {
    type: 'InitiateCheckout';
    data: {
        checkoutId: CheckoutId;
        cartId: CartId;
        customerId: string;
        totalAmount: Money;
    };
}

export interface SetPaymentMethod {
    type: 'SetPaymentMethod';
    data: {
        checkoutId: CheckoutId;
        paymentMethod: PaymentMethod;
    };
}

export interface ApplyCoupon {
    type: 'ApplyCoupon';
    data: {
        checkoutId: CheckoutId;
        couponCode: CouponCode;
        discountAmount: Money;
    };
}

export interface ApplyGiftCard {
    type: 'ApplyGiftCard';
    data: {
        checkoutId: CheckoutId;
        giftCardCode: GiftCardCode;
        appliedAmount: Money;
    };
}

export interface CompleteCheckout {
    type: 'CompleteCheckout';
    data: {
        checkoutId: CheckoutId;
    };
}

export interface CancelCheckout {
    type: 'CancelCheckout';
    data: {
        checkoutId: CheckoutId;
        reason: string;
    };
}

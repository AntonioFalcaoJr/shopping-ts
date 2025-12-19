import {CheckoutId, CartId} from '../ValueObjects/Ids';
import {PaymentMethodType} from '../ValueObjects/PaymentMethod';

export type CheckoutEvent =
    | CheckoutInitiated
    | PaymentMethodSet
    | CouponApplied
    | GiftCardApplied
    | CheckoutCompleted
    | CheckoutCancelled;

export interface CheckoutInitiated {
    type: 'CheckoutInitiated';
    data: {
        checkoutId: string;
        cartId: string;
        customerId: string;
        totalAmount: {
            amount: number;
            currency: string;
        };
        initiatedAt: Date;
        status: 'Initiated';
    };
}

export interface PaymentMethodSet {
    type: 'PaymentMethodSet';
    data: {
        checkoutId: string;
        paymentMethodType: PaymentMethodType;
        paymentMethodDetails: string;
        setAt: Date;
    };
}

export interface CouponApplied {
    type: 'CouponApplied';
    data: {
        checkoutId: string;
        couponCode: string;
        discountAmount: {
            amount: number;
            currency: string;
        };
        appliedAt: Date;
    };
}

export interface GiftCardApplied {
    type: 'GiftCardApplied';
    data: {
        checkoutId: string;
        giftCardCode: string;
        appliedAmount: {
            amount: number;
            currency: string;
        };
        appliedAt: Date;
    };
}

export interface CheckoutCompleted {
    type: 'CheckoutCompleted';
    data: {
        checkoutId: string;
        finalAmount: {
            amount: number;
            currency: string;
        };
        completedAt: Date;
        status: 'Completed';
    };
}

export interface CheckoutCancelled {
    type: 'CheckoutCancelled';
    data: {
        checkoutId: string;
        reason: string;
        cancelledAt: Date;
        status: 'Cancelled';
    };
}

export const CheckoutEvents = {
    CheckoutInitiated: (
        checkoutId: CheckoutId,
        cartId: CartId,
        customerId: string,
        totalAmount: { amount: number; currency: string },
        initiatedAt: Date
    ): CheckoutInitiated => ({
        type: 'CheckoutInitiated',
        data: {
            checkoutId: checkoutId.getValue(),
            cartId: cartId.getValue(),
            customerId,
            totalAmount,
            initiatedAt,
            status: 'Initiated',
        },
    }),

    PaymentMethodSet: (
        checkoutId: CheckoutId,
        paymentMethodType: PaymentMethodType,
        paymentMethodDetails: string,
        setAt: Date
    ): PaymentMethodSet => ({
        type: 'PaymentMethodSet',
        data: {
            checkoutId: checkoutId.getValue(),
            paymentMethodType,
            paymentMethodDetails,
            setAt,
        },
    }),

    CouponApplied: (
        checkoutId: CheckoutId,
        couponCode: string,
        discountAmount: { amount: number; currency: string },
        appliedAt: Date
    ): CouponApplied => ({
        type: 'CouponApplied',
        data: {
            checkoutId: checkoutId.getValue(),
            couponCode,
            discountAmount,
            appliedAt,
        },
    }),

    GiftCardApplied: (
        checkoutId: CheckoutId,
        giftCardCode: string,
        appliedAmount: { amount: number; currency: string },
        appliedAt: Date
    ): GiftCardApplied => ({
        type: 'GiftCardApplied',
        data: {
            checkoutId: checkoutId.getValue(),
            giftCardCode,
            appliedAmount,
            appliedAt,
        },
    }),

    CheckoutCompleted: (
        checkoutId: CheckoutId,
        finalAmount: { amount: number; currency: string },
        completedAt: Date
    ): CheckoutCompleted => ({
        type: 'CheckoutCompleted',
        data: {
            checkoutId: checkoutId.getValue(),
            finalAmount,
            completedAt,
            status: 'Completed',
        },
    }),

    CheckoutCancelled: (
        checkoutId: CheckoutId,
        reason: string,
        cancelledAt: Date
    ): CheckoutCancelled => ({
        type: 'CheckoutCancelled',
        data: {
            checkoutId: checkoutId.getValue(),
            reason,
            cancelledAt,
            status: 'Cancelled',
        },
    }),
};

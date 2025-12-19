import {
    CheckoutEvent,
    CheckoutEvents,
    CheckoutInitiated,
    PaymentMethodSet,
    CouponApplied,
    GiftCardApplied,
    CheckoutCompleted,
    CheckoutCancelled,
} from './CheckoutEvents';
import {CheckoutCommand} from './CheckoutCommands';
import {PaymentMethodType} from '../ValueObjects/PaymentMethod';

export interface CheckoutState {
    status: 'NotStarted' | 'Initiated' | 'Completed' | 'Cancelled';
    checkoutId?: string;
    cartId?: string;
    customerId?: string;
    totalAmount?: {
        amount: number;
        currency: string;
    };
    paymentMethod?: {
        type: PaymentMethodType;
        details: string;
    };
    appliedCoupons: string[];
    appliedGiftCards: string[];
    totalDiscount: number;
    totalGiftCardAmount: number;
}

export const initialState: CheckoutState = {
    status: 'NotStarted',
    appliedCoupons: [],
    appliedGiftCards: [],
    totalDiscount: 0,
    totalGiftCardAmount: 0,
};

export function evolve(
    state: CheckoutState,
    event: CheckoutEvent
): CheckoutState {
    switch (event.type) {
        case 'CheckoutInitiated': {
            const evt = event as CheckoutInitiated;
            return {
                status: evt.data.status,
                checkoutId: evt.data.checkoutId,
                cartId: evt.data.cartId,
                customerId: evt.data.customerId,
                totalAmount: evt.data.totalAmount,
                appliedCoupons: [],
                appliedGiftCards: [],
                totalDiscount: 0,
                totalGiftCardAmount: 0,
            };
        }

        case 'PaymentMethodSet': {
            const evt = event as PaymentMethodSet;
            return {
                ...state,
                paymentMethod: {
                    type: evt.data.paymentMethodType,
                    details: evt.data.paymentMethodDetails,
                },
            };
        }

        case 'CouponApplied': {
            const evt = event as CouponApplied;
            return {
                ...state,
                appliedCoupons: [...state.appliedCoupons, evt.data.couponCode],
                totalDiscount: state.totalDiscount + evt.data.discountAmount.amount,
            };
        }

        case 'GiftCardApplied': {
            const evt = event as GiftCardApplied;
            return {
                ...state,
                appliedGiftCards: [...state.appliedGiftCards, evt.data.giftCardCode],
                totalGiftCardAmount: state.totalGiftCardAmount + evt.data.appliedAmount.amount,
            };
        }

        case 'CheckoutCompleted': {
            const evt = event as CheckoutCompleted;
            return {
                ...state,
                status: evt.data.status,
            };
        }

        case 'CheckoutCancelled': {
            const evt = event as CheckoutCancelled;
            return {
                ...state,
                status: evt.data.status,
            };
        }

        default:
            return state;
    }
}

export function decide(
    command: CheckoutCommand,
    state: CheckoutState
): CheckoutEvent[] {
    switch (command.type) {
        case 'InitiateCheckout': {
            if (state.status !== 'NotStarted') {
                throw new Error('Checkout already initiated');
            }
            return [
                CheckoutEvents.CheckoutInitiated(
                    command.data.checkoutId,
                    command.data.cartId,
                    command.data.customerId,
                    {
                        amount: command.data.totalAmount.getAmount(),
                        currency: command.data.totalAmount.getCurrency(),
                    },
                    new Date()
                ),
            ];
        }

        case 'SetPaymentMethod': {
            if (state.status !== 'Initiated') {
                throw new Error('Checkout is not in initiated state');
            }
            return [
                CheckoutEvents.PaymentMethodSet(
                    command.data.checkoutId,
                    command.data.paymentMethod.getType(),
                    command.data.paymentMethod.getDetails(),
                    new Date()
                ),
            ];
        }

        case 'ApplyCoupon': {
            if (state.status !== 'Initiated') {
                throw new Error('Checkout is not in initiated state');
            }
            if (state.appliedCoupons.includes(command.data.couponCode.getValue())) {
                throw new Error('Coupon already applied');
            }
            return [
                CheckoutEvents.CouponApplied(
                    command.data.checkoutId,
                    command.data.couponCode.getValue(),
                    {
                        amount: command.data.discountAmount.getAmount(),
                        currency: command.data.discountAmount.getCurrency(),
                    },
                    new Date()
                ),
            ];
        }

        case 'ApplyGiftCard': {
            if (state.status !== 'Initiated') {
                throw new Error('Checkout is not in initiated state');
            }
            if (
                state.appliedGiftCards.includes(command.data.giftCardCode.getValue())
            ) {
                throw new Error('Gift card already applied');
            }
            return [
                CheckoutEvents.GiftCardApplied(
                    command.data.checkoutId,
                    command.data.giftCardCode.getValue(),
                    {
                        amount: command.data.appliedAmount.getAmount(),
                        currency: command.data.appliedAmount.getCurrency(),
                    },
                    new Date()
                ),
            ];
        }

        case 'CompleteCheckout': {
            if (state.status !== 'Initiated') {
                throw new Error('Checkout is not in initiated state');
            }
            if (!state.paymentMethod) {
                throw new Error('Payment method not set');
            }
            if (!state.totalAmount) {
                throw new Error('Total amount not set');
            }

            const finalAmount =
                state.totalAmount.amount -
                state.totalDiscount -
                state.totalGiftCardAmount;

            return [
                CheckoutEvents.CheckoutCompleted(
                    command.data.checkoutId,
                    {
                        amount: Math.max(0, finalAmount),
                        currency: state.totalAmount.currency,
                    },
                    new Date()
                ),
            ];
        }

        case 'CancelCheckout': {
            if (state.status !== 'Initiated') {
                throw new Error('Checkout is not in initiated state');
            }
            return [
                CheckoutEvents.CheckoutCancelled(
                    command.data.checkoutId,
                    command.data.reason,
                    new Date()
                ),
            ];
        }

        default:
            return [];
    }
}

export const CheckoutDecider = {
    initialState,
    evolve,
    decide,
};

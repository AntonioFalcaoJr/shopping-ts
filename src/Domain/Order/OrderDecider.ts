import {
    OrderEvent,
    OrderEvents,
    OrderCreated,
    OrderConfirmed,
    OrderShipped,
    OrderDelivered,
    OrderCancelled,
    OrderItem,
} from './OrderEvents';
import {OrderCommand} from './OrderCommands';

export interface OrderState {
    status: 'NotCreated' | 'Created' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
    orderId?: string;
    cartId?: string;
    checkoutId?: string;
    customerId?: string;
    items: OrderItem[];
    totalAmount?: {
        amount: number;
        currency: string;
    };
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    trackingNumber?: string;
}

export const initialState: OrderState = {
    status: 'NotCreated',
    items: [],
};

export function evolve(state: OrderState, event: OrderEvent): OrderState {
    switch (event.type) {
        case 'OrderCreated': {
            const evt = event as OrderCreated;
            return {
                status: 'Created',
                orderId: evt.data.orderId,
                cartId: evt.data.cartId,
                checkoutId: evt.data.checkoutId,
                customerId: evt.data.customerId,
                items: evt.data.items,
                totalAmount: evt.data.totalAmount,
                shippingAddress: evt.data.shippingAddress,
            };
        }

        case 'OrderConfirmed': {
            const evt = event as OrderConfirmed;
            return {
                ...state,
                status: evt.data.status,
            };
        }

        case 'OrderShipped': {
            const evt = event as OrderShipped;
            return {
                ...state,
                status: evt.data.status,
                trackingNumber: evt.data.trackingNumber,
            };
        }

        case 'OrderDelivered': {
            const evt = event as OrderDelivered;
            return {
                ...state,
                status: evt.data.status,
            };
        }

        case 'OrderCancelled': {
            const evt = event as OrderCancelled;
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
    command: OrderCommand,
    state: OrderState
): OrderEvent[] {
    switch (command.type) {
        case 'CreateOrder': {
            if (state.status !== 'NotCreated') {
                throw new Error('Order already created');
            }
            if (command.data.items.length === 0) {
                throw new Error('Order must have at least one item');
            }
            return [
                OrderEvents.OrderCreated(
                    command.data.orderId,
                    command.data.cartId,
                    command.data.checkoutId,
                    command.data.customerId,
                    command.data.items,
                    {
                        amount: command.data.totalAmount.getAmount(),
                        currency: command.data.totalAmount.getCurrency(),
                    },
                    command.data.shippingAddress,
                    new Date()
                ),
            ];
        }

        case 'ConfirmOrder': {
            if (state.status !== 'Created') {
                throw new Error('Order must be in Created state to confirm');
            }
            return [OrderEvents.OrderConfirmed(command.data.orderId, new Date())];
        }

        case 'ShipOrder': {
            if (state.status !== 'Confirmed') {
                throw new Error('Order must be confirmed before shipping');
            }
            return [
                OrderEvents.OrderShipped(
                    command.data.orderId,
                    command.data.trackingNumber,
                    new Date()
                ),
            ];
        }

        case 'DeliverOrder': {
            if (state.status !== 'Shipped') {
                throw new Error('Order must be shipped before delivery');
            }
            return [OrderEvents.OrderDelivered(command.data.orderId, new Date())];
        }

        case 'CancelOrder': {
            if (state.status === 'Delivered') {
                throw new Error('Cannot cancel a delivered order');
            }
            if (state.status === 'Cancelled') {
                throw new Error('Order is already cancelled');
            }
            if (state.status === 'NotCreated') {
                throw new Error('Cannot cancel an order that does not exist');
            }
            return [
                OrderEvents.OrderCancelled(
                    command.data.orderId,
                    command.data.reason,
                    new Date()
                ),
            ];
        }

        default:
            return [];
    }
}

export const OrderDecider = {
    initialState,
    evolve,
    decide,
};

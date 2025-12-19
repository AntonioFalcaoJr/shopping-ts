import {OrderId, CartId, CheckoutId} from '../ValueObjects/Ids';

export type OrderEvent =
    | OrderCreated
    | OrderConfirmed
    | OrderShipped
    | OrderDelivered
    | OrderCancelled;

export interface OrderItem {
    productId: string;
    quantity: number;
    unitPrice: {
        amount: number;
        currency: string;
    };
}

export interface OrderCreated {
    type: 'OrderCreated';
    data: {
        orderId: string;
        cartId: string;
        checkoutId: string;
        customerId: string;
        items: OrderItem[];
        totalAmount: {
            amount: number;
            currency: string;
        };
        shippingAddress: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        };
        createdAt: Date;
    };
}

export interface OrderConfirmed {
    type: 'OrderConfirmed';
    data: {
        orderId: string;
        confirmedAt: Date;
    };
    status: 'Confirmed';
}

export interface OrderShipped {
    type: 'OrderShipped';
    data: {
        orderId: string;
        trackingNumber: string;
        shippedAt: Date;
    };
    status: 'Shipped';
}

export interface OrderDelivered {
    type: 'OrderDelivered';
    data: {
        orderId: string;
        deliveredAt: Date;
    };
    status: 'Delivered';
}

export interface OrderCancelled {
    type: 'OrderCancelled';
    data: {
        orderId: string;
        reason: string;
        cancelledAt: Date;
    };
    status: 'Cancelled';
}

export const OrderEvents = {
    OrderCreated: (
        orderId: OrderId,
        cartId: CartId,
        checkoutId: CheckoutId,
        customerId: string,
        items: OrderItem[],
        totalAmount: { amount: number; currency: string },
        shippingAddress: {
            street: string;
            city: string;
            state: string;
            zipCode: string;
            country: string;
        },
        createdAt: Date
    ): OrderCreated => ({
        type: 'OrderCreated',
        data: {
            orderId: orderId.getValue(),
            cartId: cartId.getValue(),
            checkoutId: checkoutId.getValue(),
            customerId,
            items,
            totalAmount,
            shippingAddress,
            createdAt,
        },
    }),

    OrderConfirmed: (orderId: OrderId, confirmedAt: Date): OrderConfirmed => ({
        type: 'OrderConfirmed',
        data: {
            orderId: orderId.getValue(),
            confirmedAt,
        },
        status: 'Confirmed',
    }),

    OrderShipped: (orderId: OrderId, trackingNumber: string, shippedAt: Date): OrderShipped => ({
        type: 'OrderShipped',
        data: {
            orderId: orderId.getValue(),
            trackingNumber,
            shippedAt,
        },
        status: 'Shipped',
    }),

    OrderDelivered: (orderId: OrderId, deliveredAt: Date): OrderDelivered => ({
        type: 'OrderDelivered',
        data: {
            orderId: orderId.getValue(),
            deliveredAt,
        },
        status: 'Delivered',
    }),

    OrderCancelled: (orderId: OrderId, reason: string, cancelledAt: Date): OrderCancelled =>
        ({
            type: 'OrderCancelled',
            data: {
                orderId: orderId.getValue(),
                reason,
                cancelledAt,
            },
            status: 'Cancelled',
        }),
};

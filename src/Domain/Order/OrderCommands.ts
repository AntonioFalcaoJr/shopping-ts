import {OrderId, CartId, CheckoutId} from '../ValueObjects/Ids';
import {OrderItem} from './OrderEvents';
import {Money} from '../ValueObjects/Money';

export type OrderCommand =
    | CreateOrder
    | ConfirmOrder
    | ShipOrder
    | DeliverOrder
    | CancelOrder;

export interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface CreateOrder {
    type: 'CreateOrder';
    data: {
        orderId: OrderId;
        cartId: CartId;
        checkoutId: CheckoutId;
        customerId: string;
        items: OrderItem[];
        totalAmount: Money;
        shippingAddress: ShippingAddress;
    };
}

export interface ConfirmOrder {
    type: 'ConfirmOrder';
    data: {
        orderId: OrderId;
    };
}

export interface ShipOrder {
    type: 'ShipOrder';
    data: {
        orderId: OrderId;
        trackingNumber: string;
    };
}

export interface DeliverOrder {
    type: 'DeliverOrder';
    data: {
        orderId: OrderId;
    };
}

export interface CancelOrder {
    type: 'CancelOrder';
    data: {
        orderId: OrderId;
        reason: string;
    };
}

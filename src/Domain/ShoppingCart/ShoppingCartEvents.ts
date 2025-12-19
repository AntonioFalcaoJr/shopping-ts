import {ProductId} from '../ValueObjects/ProductId';
import {Money} from '../ValueObjects/Money';
import {Quantity} from '../ValueObjects/Quantity';
import {CustomerId, CartId} from '../ValueObjects/Ids';

export type ShoppingCartEvent =
    | ShoppingStarted
    | ItemAddedToCart
    | ItemRemovedFromCart
    | ItemQuantityIncreased
    | ItemQuantityDecreased
    | ShoppingCartCleared;

export interface ShoppingStarted {
    type: 'ShoppingStarted';
    data: {
        cartId: string;
        customerId: string;
        startedAt: Date;
    };
    status: 'Open';
}

export interface ItemAddedToCart {
    type: 'ItemAddedToCart';
    data: {
        cartId: string;
        productId: string;
        quantity: number;
        unitPrice: {
            amount: number;
            currency: string;
        };
        addedAt: Date;
    };
}

export interface ItemRemovedFromCart {
    type: 'ItemRemovedFromCart';
    data: {
        cartId: string;
        productId: string;
        removedAt: Date;
    };
}

export interface ItemQuantityIncreased {
    type: 'ItemQuantityIncreased';
    data: {
        cartId: string;
        productId: string;
        quantity: number;
        increasedAt: Date;
    };
}

export interface ItemQuantityDecreased {
    type: 'ItemQuantityDecreased';
    data: {
        cartId: string;
        productId: string;
        quantity: number;
        decreasedAt: Date;
    };
}

export interface ShoppingCartCleared {
    type: 'ShoppingCartCleared';
    data: {
        cartId: string;
        clearedAt: Date;
    };
    status: 'Empty';
}

export const ShoppingCartEvents = {
    ShoppingStarted: (cartId: CartId, customerId: CustomerId, startedAt: Date): ShoppingStarted => ({
        type: 'ShoppingStarted',
        data: {
            cartId: cartId.getValue(),
            customerId: customerId.getValue(),
            startedAt,
        },
        status: 'Open',
    }),

    ItemAddedToCart: (cartId: CartId, productId: ProductId, quantity: Quantity, unitPrice: Money, addedAt: Date): ItemAddedToCart => ({
        type: 'ItemAddedToCart',
        data: {
            cartId: cartId.getValue(),
            productId: productId.getValue(),
            quantity: quantity.getValue(),
            unitPrice: {
                amount: unitPrice.getAmount(),
                currency: unitPrice.getCurrency(),
            },
            addedAt,
        },
    }),

    ItemRemovedFromCart: (cartId: CartId, productId: ProductId, removedAt: Date): ItemRemovedFromCart => ({
        type: 'ItemRemovedFromCart',
        data: {
            cartId: cartId.getValue(),
            productId: productId.getValue(),
            removedAt,
        },
    }),

    ItemQuantityIncreased: (cartId: CartId, productId: ProductId, quantity: Quantity, increasedAt: Date): ItemQuantityIncreased => ({
        type: 'ItemQuantityIncreased',
        data: {
            cartId: cartId.getValue(),
            productId: productId.getValue(),
            quantity: quantity.getValue(),
            increasedAt,
        },
    }),

    ItemQuantityDecreased: (cartId: CartId, productId: ProductId, quantity: Quantity, decreasedAt: Date): ItemQuantityDecreased => ({
        type: 'ItemQuantityDecreased',
        data: {
            cartId: cartId.getValue(),
            productId: productId.getValue(),
            quantity: quantity.getValue(),
            decreasedAt,
        },
    }),

    ShoppingCartCleared: (cartId: CartId, clearedAt: Date): ShoppingCartCleared => ({
        type: 'ShoppingCartCleared',
        data: {
            cartId: cartId.getValue(),
            clearedAt,
        },
        status: 'Empty',
    }),
};

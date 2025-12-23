import {ProductId} from '../ValueObjects/ProductId';
import {Money} from '../ValueObjects/Money';
import {Quantity} from '../ValueObjects/Quantity';
import {CustomerId, CartId} from '../ValueObjects/Ids';

export type ShoppingCartEvent =
    | ShoppingStarted
    | ItemAddedToCart
    | ItemRemovedFromCart
    | ItemQuantityChanged
    | ShoppingCartCleared;

export interface ShoppingStarted {
    type: 'ShoppingStarted';
    data: {
        cartId: string;
        customerId: string;
        startedAt: Date;
        status: 'Open';
    };
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

export interface ItemQuantityChanged {
    type: 'ItemQuantityChanged';
    data: {
        cartId: string;
        productId: string;
        newQuantity: number;
        changedAt: Date;
    };
}

export interface ShoppingCartCleared {
    type: 'ShoppingCartCleared';
    data: {
        cartId: string;
        clearedAt: Date;
        status: 'Empty';
    };
}

export const ShoppingCartEvents = {
    ShoppingStarted: (cartId: CartId, customerId: CustomerId, startedAt: Date): ShoppingStarted => ({
        type: 'ShoppingStarted',
        data: {
            cartId: cartId.getValue(),
            customerId: customerId.getValue(),
            startedAt,
            status: 'Open',
        },
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

    ItemQuantityChanged: (cartId: CartId, productId: ProductId, newQuantity: Quantity, changedAt: Date): ItemQuantityChanged => ({
        type: 'ItemQuantityChanged',
        data: {
            cartId: cartId.getValue(),
            productId: productId.getValue(),
            newQuantity: newQuantity.getValue(),
            changedAt,
        },
    }),

    ShoppingCartCleared: (cartId: CartId, clearedAt: Date): ShoppingCartCleared => ({
        type: 'ShoppingCartCleared',
        data: {
            cartId: cartId.getValue(),
            clearedAt,
            status: 'Empty',
        },
    }),
};

import {ProductId} from '../ValueObjects/ProductId';
import {Money} from '../ValueObjects/Money';
import {Quantity} from '../ValueObjects/Quantity';
import {CustomerId, CartId} from '../ValueObjects/Ids';

export type ShoppingCartCommand =
    | StartShopping
    | AddItemToCart
    | RemoveItemFromCart
    | ChangeItemQuantity
    | ClearShoppingCart;

export interface StartShopping {
    type: 'StartShopping';
    data: {
        cartId: CartId;
        customerId: CustomerId;
    };
}

export interface AddItemToCart {
    type: 'AddItemToCart';
    data: {
        cartId: CartId;
        productId: ProductId;
        quantity: Quantity;
        unitPrice: Money;
    };
}

export interface RemoveItemFromCart {
    type: 'RemoveItemFromCart';
    data: {
        cartId: CartId;
        productId: ProductId;
    };
}

export interface ChangeItemQuantity {
    type: 'ChangeItemQuantity';
    data: {
        cartId: CartId;
        productId: ProductId;
        newQuantity: Quantity;
    };
}

export interface ClearShoppingCart {
    type: 'ClearShoppingCart';
    data: {
        cartId: CartId;
    };
}

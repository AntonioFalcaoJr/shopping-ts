import {ProductId} from '../ValueObjects/ProductId';
import {Money} from '../ValueObjects/Money';
import {Quantity} from '../ValueObjects/Quantity';
import {CustomerId, CartId} from '../ValueObjects/Ids';

export type ShoppingCartCommand =
    | StartShopping
    | AddItemToCart
    | RemoveItemFromCart
    | IncreaseItemQuantity
    | DecreaseItemQuantity
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

export interface IncreaseItemQuantity {
    type: 'IncreaseItemQuantity';
    data: {
        cartId: CartId;
        productId: ProductId;
        quantity: Quantity;
    };
}

export interface DecreaseItemQuantity {
    type: 'DecreaseItemQuantity';
    data: {
        cartId: CartId;
        productId: ProductId;
        quantity: Quantity;
    };
}

export interface ClearShoppingCart {
    type: 'ClearShoppingCart';
    data: {
        cartId: CartId;
    };
}

import {
    ShoppingCartEvent,
    ShoppingCartEvents,
    ShoppingStarted,
    ItemAddedToCart,
    ItemRemovedFromCart,
    ItemQuantityChanged,
    ShoppingCartCleared,
} from './ShoppingCartEvents';
import {ShoppingCartCommand} from './ShoppingCartCommands';

export interface CartItem {
    productId: string;
    quantity: number;
    unitPrice: {
        amount: number;
        currency: string;
    };
}

export interface ShoppingCartState {
    status: 'Open' | 'Active' | 'Empty';
    cartId?: string;
    customerId?: string;
    items: Map<string, CartItem>;
}

export const initialState: ShoppingCartState = {
    status: 'Open',
    items: new Map(),
};

export function evolve(
    state: ShoppingCartState,
    event: ShoppingCartEvent
): ShoppingCartState {
    switch (event.type) {
        case 'ShoppingStarted': {
            const evt = event as ShoppingStarted;
            return {
                status: evt.data.status,
                cartId: evt.data.cartId,
                customerId: evt.data.customerId,
                items: new Map(),
            };
        }

        case 'ItemAddedToCart': {
            const evt = event as ItemAddedToCart;
            const newItems = new Map(state.items);
            const existingItem = newItems.get(evt.data.productId);

            if (existingItem) {
                newItems.set(evt.data.productId, {
                    ...existingItem,
                    quantity: existingItem.quantity + evt.data.quantity,
                });
            } else {
                newItems.set(evt.data.productId, {
                    productId: evt.data.productId,
                    quantity: evt.data.quantity,
                    unitPrice: evt.data.unitPrice,
                });
            }

            return {
                ...state,
                items: newItems,
            };
        }

        case 'ItemRemovedFromCart': {
            const evt = event as ItemRemovedFromCart;
            const newItems = new Map(state.items);
            newItems.delete(evt.data.productId);

            return {
                ...state,
                items: newItems,
            };
        }

        case 'ItemQuantityChanged': {
            const evt = event as ItemQuantityChanged;
            const newItems = new Map(state.items);
            const existingItem = newItems.get(evt.data.productId);

            if (existingItem) {
                if (evt.data.newQuantity <= 0) {
                    newItems.delete(evt.data.productId);
                } else {
                    newItems.set(evt.data.productId, {
                        ...existingItem,
                        quantity: evt.data.newQuantity,
                    });
                }
            }

            return {
                ...state,
                items: newItems,
            };
        }

        case 'ShoppingCartCleared': {
            const evt = event as ShoppingCartCleared;
            return {
                ...state,
                status: evt.data.status,
                items: new Map(),
            };
        }

        default:
            return state;
    }
}

export function decide(
    command: ShoppingCartCommand,
    state: ShoppingCartState
): ShoppingCartEvent[] {
    switch (command.type) {
        case 'StartShopping': {
            if (state.status !== 'Open') {
                throw new Error('Shopping cart already started');
            }
            return [
                ShoppingCartEvents.ShoppingStarted(
                    command.data.cartId,
                    command.data.customerId,
                    new Date()
                ),
            ];
        }

        case 'AddItemToCart': {
            if (state.status !== 'Open') {
                console.log(`[DEBUG_LOG] state.status is: ${state.status}`);
                throw new Error('Shopping cart is not open');
            }
            return [
                ShoppingCartEvents.ItemAddedToCart(
                    command.data.cartId,
                    command.data.productId,
                    command.data.quantity,
                    command.data.unitPrice,
                    new Date()
                ),
            ];
        }

        case 'RemoveItemFromCart': {
            if (state.status !== 'Open') {
                throw new Error('Shopping cart is not open');
            }
            if (!state.items.has(command.data.productId.getValue())) {
                throw new Error('Item not found in cart');
            }
            return [
                ShoppingCartEvents.ItemRemovedFromCart(
                    command.data.cartId,
                    command.data.productId,
                    new Date()
                ),
            ];
        }

        case 'ChangeItemQuantity': {
            if (state.status !== 'Open') {
                throw new Error('Shopping cart is not open');
            }
            if (!state.items.has(command.data.productId.getValue())) {
                throw new Error('Item not found in cart');
            }
            if (command.data.newQuantity.getValue() < 0) {
                throw new Error('Quantity cannot be negative');
            }
            return [
                ShoppingCartEvents.ItemQuantityChanged(
                    command.data.cartId,
                    command.data.productId,
                    command.data.newQuantity,
                    new Date()
                ),
            ];
        }

        case 'ClearShoppingCart': {
            if (state.status !== 'Open') {
                throw new Error('Shopping cart is not active');
            }
            return [ShoppingCartEvents.ShoppingCartCleared(command.data.cartId, new Date())];
        }

        default:
            return [];
    }
}

export const ShoppingCartDecider = {
    initialState,
    evolve,
    decide,
};

import {ShoppingCartCommand} from '../../Domain/ShoppingCart/ShoppingCartCommands';
import {ShoppingCartDecider} from '../../Domain/ShoppingCart/ShoppingCartDecider';
import {ShoppingCartEvent} from '../../Domain/ShoppingCart/ShoppingCartEvents';

export interface IEventStoreGateway {
    loadEvents<T>(streamId: string): Promise<T[]>;

    appendEvents<T>(streamId: string, events: T[]): Promise<void>;
}

export interface IEventBusGateway {
    publish<T>(events: T[]): Promise<void>;
}

export class ShoppingCartCommandHandler {
    constructor(
        private readonly eventStore: IEventStoreGateway,
        private readonly eventBus: IEventBusGateway
    ) {
    }

    async handle(command: ShoppingCartCommand): Promise<void> {
        const streamId = this.getStreamId(command);

        const events = await this.eventStore.loadEvents<ShoppingCartEvent>(streamId);

        let state = ShoppingCartDecider.initialState;
        for (const event of events) {
            state = ShoppingCartDecider.evolve(state, event);
        }

        const newEvents = ShoppingCartDecider.decide(command, state);

        await this.eventStore.appendEvents(streamId, newEvents);

        await this.eventBus.publish(newEvents);
    }

    private getStreamId(command: ShoppingCartCommand): string {
        switch (command.type) {
            case 'StartShopping':
                return `ShoppingCart-${command.data.cartId.getValue()}`;
            case 'AddItemToCart':
            case 'RemoveItemFromCart':
            case 'IncreaseItemQuantity':
            case 'DecreaseItemQuantity':
            case 'ClearShoppingCart':
                return `ShoppingCart-${command.data.cartId.getValue()}`;
            default:
                throw new Error('Unknown command type');
        }
    }
}

export const startShoppingHandler = async (
    command: ShoppingCartCommand,
    handler: ShoppingCartCommandHandler
): Promise<void> => {
    if (command.type !== 'StartShopping') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const addItemToCartHandler = async (
    command: ShoppingCartCommand,
    handler: ShoppingCartCommandHandler
): Promise<void> => {
    if (command.type !== 'AddItemToCart') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const removeItemFromCartHandler = async (
    command: ShoppingCartCommand,
    handler: ShoppingCartCommandHandler
): Promise<void> => {
    if (command.type !== 'RemoveItemFromCart') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const increaseItemQuantityHandler = async (
    command: ShoppingCartCommand,
    handler: ShoppingCartCommandHandler
): Promise<void> => {
    if (command.type !== 'IncreaseItemQuantity') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const decreaseItemQuantityHandler = async (
    command: ShoppingCartCommand,
    handler: ShoppingCartCommandHandler
): Promise<void> => {
    if (command.type !== 'DecreaseItemQuantity') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const clearShoppingCartHandler = async (
    command: ShoppingCartCommand,
    handler: ShoppingCartCommandHandler
): Promise<void> => {
    if (command.type !== 'ClearShoppingCart') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

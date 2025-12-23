import { ShoppingCartCommand } from '../../Domain/ShoppingCart/ShoppingCartCommands';
import { ShoppingCartDecider } from '../../Domain/ShoppingCart/ShoppingCartDecider';
import { ShoppingCartEvent } from '../../Domain/ShoppingCart/ShoppingCartEvents';
import { IEventStore } from '../Gateways/IEventStore';

export class ShoppingCartCommandHandler {
    constructor(
        private readonly eventStore: IEventStore
    ) {
    }

    async handle(command: ShoppingCartCommand): Promise<void> {
        const streamId = this.getStreamId(command);

        const result = await this.eventStore.aggregateStream<
            typeof ShoppingCartDecider.initialState,
            ShoppingCartEvent
        >(streamId, {
            evolve: ShoppingCartDecider.evolve,
            initialState: () => ShoppingCartDecider.initialState,
        });

        const newEvents = ShoppingCartDecider.decide(command, result.state);

        await this.eventStore.appendToStream(streamId, newEvents);
    }

    private getStreamId(command: ShoppingCartCommand): string {
        switch (command.type) {
            case 'StartShopping':
                return `ShoppingCart-${command.data.cartId.getValue()}`;
            case 'AddItemToCart':
            case 'RemoveItemFromCart':
            case 'ChangeItemQuantity':
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

export const changeItemQuantityHandler = async (
    command: ShoppingCartCommand,
    handler: ShoppingCartCommandHandler
): Promise<void> => {
    if (command.type !== 'ChangeItemQuantity') {
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

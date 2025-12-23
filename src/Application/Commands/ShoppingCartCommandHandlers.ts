import { ShoppingCartCommand } from '../../Domain/ShoppingCart/ShoppingCartCommands';
import { ShoppingCartDecider } from '../../Domain/ShoppingCart/ShoppingCartDecider';
import { ShoppingCartEvent } from '../../Domain/ShoppingCart/ShoppingCartEvents';
import {
    AggregateStreamOptions,
    AggregateStreamResultWithGlobalPosition,
    AppendToStreamOptions,
    AppendToStreamResultWithGlobalPosition,
    Event,
    ReadEventMetadataWithGlobalPosition,
} from '@event-driven-io/emmett';

export interface IEventStore {
    aggregateStream<State, EventType extends Event, Metadata extends ReadEventMetadataWithGlobalPosition = ReadEventMetadataWithGlobalPosition>(
        streamName: string,
        options: AggregateStreamOptions<State, EventType, Metadata>
    ): Promise<AggregateStreamResultWithGlobalPosition<State>>;
    
    appendToStream<EventType extends Event>(
        streamName: string,
        events: EventType[],
        options?: AppendToStreamOptions
    ): Promise<AppendToStreamResultWithGlobalPosition>;
}

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
        
        // Events are automatically picked up by KurrentDB subscriptions
        // No need for explicit event bus publishing
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

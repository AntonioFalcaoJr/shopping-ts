import {OrderCommand} from '../../Domain/Order/OrderCommands';
import {OrderDecider} from '../../Domain/Order/OrderDecider';
import {OrderEvent} from '../../Domain/Order/OrderEvents';
import {IEventStoreGateway, IEventBusGateway} from './ShoppingCartCommandHandlers';

export class OrderCommandHandler {
    constructor(
        private readonly eventStore: IEventStoreGateway,
        private readonly eventBus: IEventBusGateway
    ) {
    }

    async handle(command: OrderCommand): Promise<void> {
        const streamId = this.getStreamId(command);

        const events = await this.eventStore.loadEvents<OrderEvent>(streamId);

        let state = OrderDecider.initialState;
        for (const event of events) {
            state = OrderDecider.evolve(state, event);
        }

        const newEvents = OrderDecider.decide(command, state);

        await this.eventStore.appendEvents(streamId, newEvents);

        await this.eventBus.publish(newEvents);
    }

    private getStreamId(command: OrderCommand): string {
        switch (command.type) {
            case 'CreateOrder':
                return `Order-${command.data.orderId.getValue()}`;
            case 'ConfirmOrder':
            case 'ShipOrder':
            case 'DeliverOrder':
            case 'CancelOrder':
                return `Order-${command.data.orderId.getValue()}`;
            default:
                throw new Error('Unknown command type');
        }
    }
}

export const createOrderHandler = async (
    command: OrderCommand,
    handler: OrderCommandHandler
): Promise<void> => {
    if (command.type !== 'CreateOrder') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const confirmOrderHandler = async (
    command: OrderCommand,
    handler: OrderCommandHandler
): Promise<void> => {
    if (command.type !== 'ConfirmOrder') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const shipOrderHandler = async (
    command: OrderCommand,
    handler: OrderCommandHandler
): Promise<void> => {
    if (command.type !== 'ShipOrder') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const deliverOrderHandler = async (
    command: OrderCommand,
    handler: OrderCommandHandler
): Promise<void> => {
    if (command.type !== 'DeliverOrder') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const cancelOrderHandler = async (
    command: OrderCommand,
    handler: OrderCommandHandler
): Promise<void> => {
    if (command.type !== 'CancelOrder') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

import { OrderCommand } from '../../Domain/Order/OrderCommands';
import { OrderDecider } from '../../Domain/Order/OrderDecider';
import { OrderEvent } from '../../Domain/Order/OrderEvents';
import { IEventStore } from '../Gateways/IEventStore';

export class OrderCommandHandler {
    constructor(
        private readonly eventStore: IEventStore
    ) {
    }

    async handle(command: OrderCommand): Promise<void> {
        const streamId = this.getStreamId(command);

        const result = await this.eventStore.aggregateStream<
            typeof OrderDecider.initialState,
            OrderEvent
        >(streamId, {
            evolve: OrderDecider.evolve,
            initialState: () => OrderDecider.initialState,
        });

        const newEvents = OrderDecider.decide(command, result.state);

        await this.eventStore.appendToStream(streamId, newEvents);
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

import { CheckoutCommand } from '../../Domain/Checkout/CheckoutCommands';
import { CheckoutDecider } from '../../Domain/Checkout/CheckoutDecider';
import { CheckoutEvent } from '../../Domain/Checkout/CheckoutEvents';
import { IEventStore } from './ShoppingCartCommandHandlers';

export class CheckoutCommandHandler {
    constructor(
        private readonly eventStore: IEventStore
    ) {
    }

    async handle(command: CheckoutCommand): Promise<void> {
        const streamId = this.getStreamId(command);

        const result = await this.eventStore.aggregateStream<
            typeof CheckoutDecider.initialState,
            CheckoutEvent
        >(streamId, {
            evolve: CheckoutDecider.evolve,
            initialState: () => CheckoutDecider.initialState,
        });

        const newEvents = CheckoutDecider.decide(command, result.state);

        await this.eventStore.appendToStream(streamId, newEvents);
        
        // Events are automatically picked up by KurrentDB subscriptions
    }

    private getStreamId(command: CheckoutCommand): string {
        switch (command.type) {
            case 'InitiateCheckout':
                return `Checkout-${command.data.checkoutId.getValue()}`;
            case 'SetPaymentMethod':
            case 'ApplyCoupon':
            case 'ApplyGiftCard':
            case 'CompleteCheckout':
            case 'CancelCheckout':
                return `Checkout-${command.data.checkoutId.getValue()}`;
            default:
                throw new Error('Unknown command type');
        }
    }
}

export const initiateCheckoutHandler = async (
    command: CheckoutCommand,
    handler: CheckoutCommandHandler
): Promise<void> => {
    if (command.type !== 'InitiateCheckout') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const setPaymentMethodHandler = async (
    command: CheckoutCommand,
    handler: CheckoutCommandHandler
): Promise<void> => {
    if (command.type !== 'SetPaymentMethod') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const applyCouponHandler = async (
    command: CheckoutCommand,
    handler: CheckoutCommandHandler
): Promise<void> => {
    if (command.type !== 'ApplyCoupon') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const applyGiftCardHandler = async (
    command: CheckoutCommand,
    handler: CheckoutCommandHandler
): Promise<void> => {
    if (command.type !== 'ApplyGiftCard') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const completeCheckoutHandler = async (
    command: CheckoutCommand,
    handler: CheckoutCommandHandler
): Promise<void> => {
    if (command.type !== 'CompleteCheckout') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

export const cancelCheckoutHandler = async (
    command: CheckoutCommand,
    handler: CheckoutCommandHandler
): Promise<void> => {
    if (command.type !== 'CancelCheckout') {
        throw new Error('Invalid command type');
    }
    await handler.handle(command);
};

import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import { kurrentDBSubscription, KurrentDBSubscription } from '@event-driven-io/emmett-kurrentdb';
import { SendOrderConfirmationEmailUseCase } from '../../Application/UseCases/SendOrderConfirmationEmailUseCase';
import { OrderConfirmed } from '../../Domain/Order/OrderEvents';

export class OrderConfirmedSubscription {
    private subscription: KurrentDBSubscription;

    constructor(
        private readonly client: KurrentDBClient,
        private readonly sendOrderConfirmationEmailUseCase: SendOrderConfirmationEmailUseCase
    ) {
        this.subscription = kurrentDBSubscription({
            client: this.client,
            from: {
                stream: '$all',
                options: {}
            },
            batchSize: 10,
            eachBatch: async (events) => {
                for (const event of events) {
                    if (event.type === 'OrderConfirmed') {
                        await this.handleOrderConfirmed(event.data as OrderConfirmed);
                    }
                }
            }
        });
    }

    private async handleOrderConfirmed(event: OrderConfirmed): Promise<void> {
        await this.sendOrderConfirmationEmailUseCase.execute(event);
    }

    async start(): Promise<void> {
        console.log('[OrderConfirmedSubscription] Starting subscription...');
        await this.subscription.start({ startFrom: 'BEGINNING' });
        console.log('[OrderConfirmedSubscription] Subscription started');
    }

    async stop(): Promise<void> {
        console.log('[OrderConfirmedSubscription] Stopping subscription...');
        await this.subscription.stop();
        console.log('[OrderConfirmedSubscription] Subscription stopped');
    }
}

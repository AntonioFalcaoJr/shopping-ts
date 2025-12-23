import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import { kurrentDBSubscription, KurrentDBSubscription } from '../EmmettKurrentDB';
import { SendOrderConfirmation } from '../../Application/Events/SendOrderConfirmation';
import { OrderConfirmed } from '../../Domain/Order/OrderEvents';

export class OrderConfirmedSubscription {
    private subscription: KurrentDBSubscription;

    constructor(
        private readonly client: KurrentDBClient,
        private readonly sendOrderConfirmation: SendOrderConfirmation
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
                        await this.handleOrderConfirmed(event as unknown as OrderConfirmed);
                    }
                }
            }
        });
    }

    private async handleOrderConfirmed(event: OrderConfirmed): Promise<void> {
        await this.sendOrderConfirmation.execute(event);
    }

    async start(): Promise<void> {
        console.log('[OrderConfirmedSubscription] Starting subscription...');
        this.subscription.start({ startFrom: 'BEGINNING' });
        console.log('[OrderConfirmedSubscription] Subscription started');
    }

    async stop(): Promise<void> {
        console.log('[OrderConfirmedSubscription] Stopping subscription...');
        await this.subscription.stop();
        console.log('[OrderConfirmedSubscription] Subscription stopped');
    }
}

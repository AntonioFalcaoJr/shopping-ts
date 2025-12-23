import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import { kurrentDBSubscription, KurrentDBSubscription } from '../EmmettKurrentDB';
import { OrderReadModel } from '../../Application/Queries/OrderQueryHandlers';

export class OrderProjectionSubscription {
    private subscription: KurrentDBSubscription;
    private readModels: Map<string, OrderReadModel> = new Map();

    constructor(private readonly client: KurrentDBClient) {
        this.subscription = kurrentDBSubscription({
            client: this.client,
            from: {
                stream: '$all',
                options: {}
            },
            batchSize: 10,
            eachBatch: async (events) => {
                for (const event of events) {
                    await this.handleEvent(event.type, event.data);
                }
            }
        });
    }

    private async handleEvent(eventType: string, eventData: any): Promise<void> {
        switch (eventType) {
            case 'OrderCreated':
                await this.handleOrderCreated(eventData);
                break;
            case 'OrderConfirmed':
                await this.handleOrderConfirmed(eventData);
                break;
            case 'OrderShipped':
                await this.handleOrderShipped(eventData);
                break;
            case 'OrderDelivered':
                await this.handleOrderDelivered(eventData);
                break;
            case 'OrderCancelled':
                await this.handleOrderCancelled(eventData);
                break;
        }
    }

    private async handleOrderCreated(event: any): Promise<void> {
        const readModel: OrderReadModel = {
            orderId: event.orderId,
            cartId: event.cartId,
            checkoutId: event.checkoutId,
            customerId: event.customerId,
            status: 'Created',
            items: event.items,
            totalAmount: event.totalAmount,
            shippingAddress: event.shippingAddress,
            createdAt: event.createdAt,
            lastUpdated: event.createdAt,
        };
        this.readModels.set(event.orderId, readModel);
        console.log(`[OrderProjection] Order created: ${event.orderId}`);
    }

    private async handleOrderConfirmed(event: any): Promise<void> {
        const order = this.readModels.get(event.orderId);
        if (!order) return;

        order.status = 'Confirmed';
        order.lastUpdated = event.confirmedAt;
        console.log(`[OrderProjection] Order confirmed: ${event.orderId}`);
    }

    private async handleOrderShipped(event: any): Promise<void> {
        const order = this.readModels.get(event.orderId);
        if (!order) return;

        order.status = 'Shipped';
        order.trackingNumber = event.trackingNumber;
        order.lastUpdated = event.shippedAt;
        console.log(`[OrderProjection] Order shipped: ${event.orderId}`);
    }

    private async handleOrderDelivered(event: any): Promise<void> {
        const order = this.readModels.get(event.orderId);
        if (!order) return;

        order.status = 'Delivered';
        order.lastUpdated = event.deliveredAt;
        console.log(`[OrderProjection] Order delivered: ${event.orderId}`);
    }

    private async handleOrderCancelled(event: any): Promise<void> {
        const order = this.readModels.get(event.orderId);
        if (!order) return;

        order.status = 'Cancelled';
        order.cancellationReason = event.reason;
        order.lastUpdated = event.cancelledAt;
        console.log(`[OrderProjection] Order cancelled: ${event.orderId}`);
    }

    getReadModel(orderId: string): OrderReadModel | undefined {
        return this.readModels.get(orderId);
    }

    getAllReadModels(): OrderReadModel[] {
        return Array.from(this.readModels.values());
    }

    getReadModelsByCustomerId(customerId: string): OrderReadModel[] {
        return Array.from(this.readModels.values()).filter(order => order.customerId === customerId);
    }

    async start(): Promise<void> {
        console.log('[OrderProjection] Starting projection subscription...');
        this.subscription.start({ startFrom: 'BEGINNING' });
        console.log('[OrderProjection] Projection subscription started');
    }

    async stop(): Promise<void> {
        console.log('[OrderProjection] Stopping projection subscription...');
        await this.subscription.stop();
        console.log('[OrderProjection] Projection subscription stopped');
    }
}

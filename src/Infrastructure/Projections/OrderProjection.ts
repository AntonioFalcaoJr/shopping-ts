import {OrderEvent} from '../../Domain/Order/OrderEvents';
import {OrderReadModel} from '../../Application/Queries/OrderQueryHandlers';
import {PostgresProjectionGateway} from './PostgresProjectionGateway';

export class OrderProjection {
    constructor(private readonly projectionGateway: PostgresProjectionGateway) {
    }

    async handleEvent(event: OrderEvent): Promise<void> {
        switch (event.type) {
            case 'OrderCreated':
                await this.handleOrderCreated(event);
                break;
            case 'OrderConfirmed':
                await this.handleOrderConfirmed(event);
                break;
            case 'OrderShipped':
                await this.handleOrderShipped(event);
                break;
            case 'OrderDelivered':
                await this.handleOrderDelivered(event);
                break;
            case 'OrderCancelled':
                await this.handleOrderCancelled(event);
                break;
        }
    }

    private async handleOrderCreated(event: any): Promise<void> {
        const readModel: OrderReadModel = {
            orderId: event.data.orderId,
            cartId: event.data.cartId,
            checkoutId: event.data.checkoutId,
            customerId: event.data.customerId,
            status: 'Created',
            items: event.data.items,
            totalAmount: event.data.totalAmount,
            shippingAddress: event.data.shippingAddress,
            createdAt: event.data.createdAt,
            lastUpdated: event.data.createdAt,
        };

        await this.projectionGateway.upsert('orders', event.data.orderId, readModel);
    }

    private async handleOrderConfirmed(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<OrderReadModel>(
            'orders',
            event.data.orderId
        );

        if (!existing) return;

        existing.status = 'Confirmed';
        existing.lastUpdated = event.data.confirmedAt;

        await this.projectionGateway.upsert('orders', event.data.orderId, existing);
    }

    private async handleOrderShipped(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<OrderReadModel>(
            'orders',
            event.data.orderId
        );

        if (!existing) return;

        existing.status = 'Shipped';
        existing.trackingNumber = event.data.trackingNumber;
        existing.lastUpdated = event.data.shippedAt;

        await this.projectionGateway.upsert('orders', event.data.orderId, existing);
    }

    private async handleOrderDelivered(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<OrderReadModel>(
            'orders',
            event.data.orderId
        );

        if (!existing) return;

        existing.status = 'Delivered';
        existing.lastUpdated = event.data.deliveredAt;

        await this.projectionGateway.upsert('orders', event.data.orderId, existing);
    }

    private async handleOrderCancelled(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<OrderReadModel>(
            'orders',
            event.data.orderId
        );

        if (!existing) return;

        existing.status = 'Cancelled';
        existing.lastUpdated = event.data.cancelledAt;

        await this.projectionGateway.upsert('orders', event.data.orderId, existing);
    }
}

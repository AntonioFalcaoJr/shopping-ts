import {ShoppingCartEvent} from '../../Domain/ShoppingCart/ShoppingCartEvents';
import {ShoppingCartReadModel} from '../../Application/Queries/ShoppingCartQueryHandlers';
import {PostgresProjectionGateway} from './PostgresProjectionGateway';

export class ShoppingCartProjection {
    constructor(private readonly projectionGateway: PostgresProjectionGateway) {
    }

    async handleEvent(event: ShoppingCartEvent): Promise<void> {
        switch (event.type) {
            case 'ShoppingStarted':
                await this.handleShoppingStarted(event);
                break;
            case 'ItemAddedToCart':
                await this.handleItemAddedToCart(event);
                break;
            case 'ItemRemovedFromCart':
                await this.handleItemRemovedFromCart(event);
                break;
            case 'ItemQuantityIncreased':
                await this.handleItemQuantityIncreased(event);
                break;
            case 'ItemQuantityDecreased':
                await this.handleItemQuantityDecreased(event);
                break;
            case 'ShoppingCartCleared':
                await this.handleShoppingCartCleared(event);
                break;
        }
    }

    private async handleShoppingStarted(event: any): Promise<void> {
        const readModel: ShoppingCartReadModel = {
            cartId: event.data.cartId,
            customerId: event.data.customerId,
            status: 'Active',
            items: [],
            totalAmount: {amount: 0, currency: 'USD'},
            lastUpdated: event.data.startedAt,
        };

        await this.projectionGateway.upsert('shopping_carts', event.data.cartId, readModel);
    }

    private async handleItemAddedToCart(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<ShoppingCartReadModel>(
            'shopping_carts',
            event.data.cartId
        );

        if (!existing) return;

        const existingItemIndex = existing.items.findIndex(
            (item) => item.productId === event.data.productId
        );

        if (existingItemIndex >= 0) {
            existing.items[existingItemIndex].quantity += event.data.quantity;
        } else {
            existing.items.push({
                productId: event.data.productId,
                quantity: event.data.quantity,
                unitPrice: event.data.unitPrice,
            });
        }

        existing.totalAmount = this.calculateTotal(existing.items);
        existing.lastUpdated = event.data.addedAt;

        await this.projectionGateway.upsert('shopping_carts', event.data.cartId, existing);
    }

    private async handleItemRemovedFromCart(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<ShoppingCartReadModel>(
            'shopping_carts',
            event.data.cartId
        );

        if (!existing) return;

        existing.items = existing.items.filter(
            (item) => item.productId !== event.data.productId
        );

        existing.totalAmount = this.calculateTotal(existing.items);
        existing.lastUpdated = event.data.removedAt;

        await this.projectionGateway.upsert('shopping_carts', event.data.cartId, existing);
    }

    private async handleItemQuantityIncreased(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<ShoppingCartReadModel>(
            'shopping_carts',
            event.data.cartId
        );

        if (!existing) return;

        const item = existing.items.find((i) => i.productId === event.data.productId);
        if (item) {
            item.quantity += event.data.quantity;
        }

        existing.totalAmount = this.calculateTotal(existing.items);
        existing.lastUpdated = event.data.increasedAt;

        await this.projectionGateway.upsert('shopping_carts', event.data.cartId, existing);
    }

    private async handleItemQuantityDecreased(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<ShoppingCartReadModel>(
            'shopping_carts',
            event.data.cartId
        );

        if (!existing) return;

        const item = existing.items.find((i) => i.productId === event.data.productId);
        if (item) {
            item.quantity -= event.data.quantity;
            if (item.quantity <= 0) {
                existing.items = existing.items.filter(
                    (i) => i.productId !== event.data.productId
                );
            }
        }

        existing.totalAmount = this.calculateTotal(existing.items);
        existing.lastUpdated = event.data.decreasedAt;

        await this.projectionGateway.upsert('shopping_carts', event.data.cartId, existing);
    }

    private async handleShoppingCartCleared(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<ShoppingCartReadModel>(
            'shopping_carts',
            event.data.cartId
        );

        if (!existing) return;

        existing.status = 'Cleared';
        existing.items = [];
        existing.totalAmount = {amount: 0, currency: 'USD'};
        existing.lastUpdated = event.data.clearedAt;

        await this.projectionGateway.upsert('shopping_carts', event.data.cartId, existing);
    }

    private calculateTotal(
        items: Array<{ quantity: number; unitPrice: { amount: number; currency: string } }>
    ): { amount: number; currency: string } {
        const total = items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice.amount,
            0
        );
        return {amount: total, currency: items[0]?.unitPrice.currency || 'USD'};
    }
}

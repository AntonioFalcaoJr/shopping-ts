import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import { kurrentDBSubscription, KurrentDBSubscription } from '@event-driven-io/emmett-kurrentdb';
import { ShoppingCartReadModel } from '../../Application/Queries/ShoppingCartQueryHandlers';

export class ShoppingCartProjectionSubscription {
    private subscription: KurrentDBSubscription;
    private readModels: Map<string, ShoppingCartReadModel> = new Map();

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
            case 'ShoppingStarted':
                await this.handleShoppingStarted(eventData);
                break;
            case 'ItemAddedToCart':
                await this.handleItemAddedToCart(eventData);
                break;
            case 'ItemRemovedFromCart':
                await this.handleItemRemovedFromCart(eventData);
                break;
            case 'ItemQuantityChanged':
                await this.handleItemQuantityChanged(eventData);
                break;
            case 'ShoppingCartCleared':
                await this.handleShoppingCartCleared(eventData);
                break;
        }
    }

    private async handleShoppingStarted(event: any): Promise<void> {
        const readModel: ShoppingCartReadModel = {
            cartId: event.cartId,
            customerId: event.customerId,
            status: 'Active',
            items: [],
            totalAmount: { amount: 0, currency: 'USD' },
            lastUpdated: event.startedAt,
        };
        this.readModels.set(event.cartId, readModel);
        console.log(`[ShoppingCartProjection] Cart created: ${event.cartId}`);
    }

    private async handleItemAddedToCart(event: any): Promise<void> {
        const cart = this.readModels.get(event.cartId);
        if (!cart) return;

        const existingItemIndex = cart.items.findIndex(item => item.productId === event.productId);
        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity += event.quantity;
        } else {
            cart.items.push({
                productId: event.productId,
                quantity: event.quantity,
                unitPrice: event.unitPrice,
            });
        }

        cart.totalAmount = this.calculateTotal(cart.items);
        cart.lastUpdated = event.addedAt;
        console.log(`[ShoppingCartProjection] Item added to cart: ${event.cartId}`);
    }

    private async handleItemRemovedFromCart(event: any): Promise<void> {
        const cart = this.readModels.get(event.cartId);
        if (!cart) return;

        cart.items = cart.items.filter(item => item.productId !== event.productId);
        cart.totalAmount = this.calculateTotal(cart.items);
        cart.lastUpdated = event.removedAt;
        console.log(`[ShoppingCartProjection] Item removed from cart: ${event.cartId}`);
    }

    private async handleItemQuantityChanged(event: any): Promise<void> {
        const cart = this.readModels.get(event.cartId);
        if (!cart) return;

        const item = cart.items.find(i => i.productId === event.productId);
        if (item) {
            if (event.newQuantity <= 0) {
                cart.items = cart.items.filter(i => i.productId !== event.productId);
            } else {
                item.quantity = event.newQuantity;
            }
        }

        cart.totalAmount = this.calculateTotal(cart.items);
        cart.lastUpdated = event.changedAt;
        console.log(`[ShoppingCartProjection] Item quantity changed in cart: ${event.cartId}`);
    }

    private async handleShoppingCartCleared(event: any): Promise<void> {
        const cart = this.readModels.get(event.cartId);
        if (!cart) return;

        cart.status = 'Cleared';
        cart.items = [];
        cart.totalAmount = { amount: 0, currency: 'USD' };
        cart.lastUpdated = event.clearedAt;
        console.log(`[ShoppingCartProjection] Cart cleared: ${event.cartId}`);
    }

    private calculateTotal(
        items: Array<{ quantity: number; unitPrice: { amount: number; currency: string } }>
    ): { amount: number; currency: string } {
        const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice.amount, 0);
        return { amount: total, currency: items[0]?.unitPrice.currency || 'USD' };
    }

    getReadModel(cartId: string): ShoppingCartReadModel | undefined {
        return this.readModels.get(cartId);
    }

    getAllReadModels(): ShoppingCartReadModel[] {
        return Array.from(this.readModels.values());
    }

    getReadModelsByCustomerId(customerId: string): ShoppingCartReadModel[] {
        return Array.from(this.readModels.values()).filter(cart => cart.customerId === customerId);
    }

    async start(): Promise<void> {
        console.log('[ShoppingCartProjection] Starting projection subscription...');
        await this.subscription.start({ startFrom: 'BEGINNING' });
        console.log('[ShoppingCartProjection] Projection subscription started');
    }

    async stop(): Promise<void> {
        console.log('[ShoppingCartProjection] Stopping projection subscription...');
        await this.subscription.stop();
        console.log('[ShoppingCartProjection] Projection subscription stopped');
    }
}

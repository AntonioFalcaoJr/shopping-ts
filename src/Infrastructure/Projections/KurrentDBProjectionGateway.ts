import { IProjectionGateway } from '../../Application/Gateways/IProjectionGateway';
import { ShoppingCartProjectionSubscription } from './ShoppingCartProjectionSubscription';
import { OrderProjectionSubscription } from './OrderProjectionSubscription';

export class KurrentDBProjectionGateway implements IProjectionGateway {
    constructor(
        private readonly shoppingCartProjection: ShoppingCartProjectionSubscription,
        private readonly orderProjection: OrderProjectionSubscription
    ) {}

    async findById<T>(collectionName: string, id: string): Promise<T | null> {
        switch (collectionName) {
            case 'shopping_carts':
                return (this.shoppingCartProjection.getReadModel(id) as T) || null;
            case 'orders':
                return (this.orderProjection.getReadModel(id) as T) || null;
            default:
                return null;
        }
    }

    async findAll<T>(collectionName: string): Promise<T[]> {
        switch (collectionName) {
            case 'shopping_carts':
                return this.shoppingCartProjection.getAllReadModels() as T[];
            case 'orders':
                return this.orderProjection.getAllReadModels() as T[];
            default:
                return [];
        }
    }

    async findByCustomerId<T>(collectionName: string, customerId: string): Promise<T[]> {
        switch (collectionName) {
            case 'shopping_carts':
                return this.shoppingCartProjection.getReadModelsByCustomerId(customerId) as T[];
            case 'orders':
                return this.orderProjection.getReadModelsByCustomerId(customerId) as T[];
            default:
                return [];
        }
    }
}

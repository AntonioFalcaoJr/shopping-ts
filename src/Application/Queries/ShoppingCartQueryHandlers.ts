import { IProjectionGateway } from '../Gateways/IProjectionGateway';

export interface ShoppingCartReadModel {
  cartId: string;
  customerId: string;
  status: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: {
      amount: number;
      currency: string;
    };
  }>;
  totalAmount: {
    amount: number;
    currency: string;
  };
  lastUpdated: Date;
}

export class ShoppingCartQueryHandler {
  constructor(private readonly projectionGateway: IProjectionGateway) {}

  async getShoppingCartById(cartId: string): Promise<ShoppingCartReadModel | null> {
    return await this.projectionGateway.findById<ShoppingCartReadModel>(
      'shopping_carts',
      cartId
    );
  }

  async getShoppingCartsByCustomerId(
    customerId: string
  ): Promise<ShoppingCartReadModel[]> {
    return await this.projectionGateway.findByCustomerId<ShoppingCartReadModel>(
      'shopping_carts',
      customerId
    );
  }

  async getAllShoppingCarts(): Promise<ShoppingCartReadModel[]> {
    return await this.projectionGateway.findAll<ShoppingCartReadModel>(
      'shopping_carts'
    );
  }
}

export const getShoppingCartByIdQuery = async (
  cartId: string,
  handler: ShoppingCartQueryHandler
): Promise<ShoppingCartReadModel | null> => {
  return await handler.getShoppingCartById(cartId);
};

export const getShoppingCartsByCustomerIdQuery = async (
  customerId: string,
  handler: ShoppingCartQueryHandler
): Promise<ShoppingCartReadModel[]> => {
  return await handler.getShoppingCartsByCustomerId(customerId);
};

export const getAllShoppingCartsQuery = async (
  handler: ShoppingCartQueryHandler
): Promise<ShoppingCartReadModel[]> => {
  return await handler.getAllShoppingCarts();
};

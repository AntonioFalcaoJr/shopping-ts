import { IProjectionGateway } from './ShoppingCartQueryHandlers';

export interface OrderReadModel {
  orderId: string;
  cartId: string;
  checkoutId: string;
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
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  createdAt: Date;
  lastUpdated: Date;
}

export class OrderQueryHandler {
  constructor(private readonly projectionGateway: IProjectionGateway) {}

  async getOrderById(orderId: string): Promise<OrderReadModel | null> {
    return await this.projectionGateway.findById<OrderReadModel>(
      'orders',
      orderId
    );
  }

  async getOrdersByCustomerId(customerId: string): Promise<OrderReadModel[]> {
    return await this.projectionGateway.findByCustomerId<OrderReadModel>(
      'orders',
      customerId
    );
  }

  async getAllOrders(): Promise<OrderReadModel[]> {
    return await this.projectionGateway.findAll<OrderReadModel>('orders');
  }
}

export const getOrderByIdQuery = async (
  orderId: string,
  handler: OrderQueryHandler
): Promise<OrderReadModel | null> => {
  return await handler.getOrderById(orderId);
};

export const getOrdersByCustomerIdQuery = async (
  customerId: string,
  handler: OrderQueryHandler
): Promise<OrderReadModel[]> => {
  return await handler.getOrdersByCustomerId(customerId);
};

export const getAllOrdersQuery = async (
  handler: OrderQueryHandler
): Promise<OrderReadModel[]> => {
  return await handler.getAllOrders();
};

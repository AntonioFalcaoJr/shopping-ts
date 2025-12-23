import { IProjectionGateway } from '../Gateways/IProjectionGateway';

export interface CheckoutReadModel {
  checkoutId: string;
  cartId: string;
  customerId: string;
  status: string;
  totalAmount: {
    amount: number;
    currency: string;
  };
  paymentMethod?: {
    type: string;
    details: string;
  };
  appliedCoupons: string[];
  appliedGiftCards: string[];
  totalDiscount: number;
  totalGiftCardAmount: number;
  finalAmount?: {
    amount: number;
    currency: string;
  };
  lastUpdated: Date;
}

export class CheckoutQueryHandler {
  constructor(private readonly projectionGateway: IProjectionGateway) {}

  async getCheckoutById(checkoutId: string): Promise<CheckoutReadModel | null> {
    return await this.projectionGateway.findById<CheckoutReadModel>(
      'checkouts',
      checkoutId
    );
  }

  async getCheckoutsByCustomerId(
    customerId: string
  ): Promise<CheckoutReadModel[]> {
    return await this.projectionGateway.findByCustomerId<CheckoutReadModel>(
      'checkouts',
      customerId
    );
  }

  async getAllCheckouts(): Promise<CheckoutReadModel[]> {
    return await this.projectionGateway.findAll<CheckoutReadModel>('checkouts');
  }
}

export const getCheckoutByIdQuery = async (
  checkoutId: string,
  handler: CheckoutQueryHandler
): Promise<CheckoutReadModel | null> => {
  return await handler.getCheckoutById(checkoutId);
};

export const getCheckoutsByCustomerIdQuery = async (
  customerId: string,
  handler: CheckoutQueryHandler
): Promise<CheckoutReadModel[]> => {
  return await handler.getCheckoutsByCustomerId(customerId);
};

export const getAllCheckoutsQuery = async (
  handler: CheckoutQueryHandler
): Promise<CheckoutReadModel[]> => {
  return await handler.getAllCheckouts();
};

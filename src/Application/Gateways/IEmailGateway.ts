export interface OrderConfirmationEmail {
    to: string;
    orderId: string;
    customerName?: string;
    orderTotal: {
        amount: number;
        currency: string;
    };
    items: Array<{
        productId: string;
        quantity: number;
        unitPrice: {
            amount: number;
            currency: string;
        };
    }>;
}

export interface IEmailGateway {
    sendOrderConfirmation(email: OrderConfirmationEmail): Promise<void>;
}

import { IEmailGateway } from '../Gateways/IEmailGateway';
import { OrderConfirmed } from '../../Domain/Order/OrderEvents';

export class SendOrderConfirmationEmailUseCase {
    constructor(private readonly emailGateway: IEmailGateway) {}

    async execute(event: OrderConfirmed): Promise<void> {
        try {
            console.log(`[SendOrderConfirmationEmailUseCase] Processing OrderConfirmed event for order: ${event.data.orderId}`);
            
            // In a real scenario, we would fetch customer email and order details from a read model
            // For this demo, we'll create a sample email
            await this.emailGateway.sendOrderConfirmation({
                to: 'customer@example.com',
                orderId: event.data.orderId,
                customerName: 'Valued Customer',
                orderTotal: {
                    amount: 0, // Would be fetched from order details
                    currency: 'USD'
                },
                items: [] // Would be fetched from order details
            });

            console.log(`[SendOrderConfirmationEmailUseCase] Email sent for order: ${event.data.orderId}`);
        } catch (error) {
            console.error(`[SendOrderConfirmationEmailUseCase] Error processing OrderConfirmed event:`, error);
            throw error;
        }
    }
}

import { IEmailGateway } from '../Gateways/IEmailGateway';
import { OrderConfirmed } from '../../Domain/Order/OrderEvents';

export class SendOrderConfirmation {
    constructor(private readonly emailGateway: IEmailGateway) {}

    async execute(event: OrderConfirmed): Promise<void> {
        try {
            console.log(`[SendOrderConfirmation] Processing OrderConfirmed event for order: ${event.data.orderId}`);
            
            const emailBody = this.buildEmailBody(event);
            
            await this.emailGateway.send({
                to: 'customer@example.com',
                subject: `Order Confirmation - ${event.data.orderId}`,
                body: emailBody,
                html: this.buildEmailHtml(event)
            });

            console.log(`[SendOrderConfirmation] Email sent for order: ${event.data.orderId}`);
        } catch (error) {
            console.error(`[SendOrderConfirmation] Error processing OrderConfirmed event:`, error);
            throw error;
        }
    }

    private buildEmailBody(event: OrderConfirmed): string {
        return `
Order Confirmation

Dear Valued Customer,

Your order has been confirmed!

Order ID: ${event.data.orderId}

Thank you for your purchase.

Best regards,
Shopping Team
        `.trim();
    }

    private buildEmailHtml(event: OrderConfirmed): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 10px; text-align: center; }
        .content { padding: 20px; }
        .order-id { font-weight: bold; color: #4CAF50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
        </div>
        <div class="content">
            <p>Dear Valued Customer,</p>
            <p>Your order has been confirmed!</p>
            <p>Order ID: <span class="order-id">${event.data.orderId}</span></p>
            <p>Thank you for your purchase.</p>
            <p>Best regards,<br>Shopping Team</p>
        </div>
    </div>
</body>
</html>
        `.trim();
    }
}

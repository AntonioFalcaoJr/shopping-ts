import { IEmailGateway, OrderConfirmationEmail } from '../../Application/Gateways/IEmailGateway';

export class EmailGateway implements IEmailGateway {
    async sendOrderConfirmation(email: OrderConfirmationEmail): Promise<void> {
        console.log('\n📧 ===== ORDER CONFIRMATION EMAIL =====');
        console.log(`To: ${email.to}`);
        console.log(`Order ID: ${email.orderId}`);
        if (email.customerName) {
            console.log(`Customer: ${email.customerName}`);
        }
        console.log(`\nOrder Total: ${email.orderTotal.amount} ${email.orderTotal.currency}`);
        console.log('\nItems:');
        email.items.forEach((item, index) => {
            console.log(`  ${index + 1}. Product: ${item.productId}`);
            console.log(`     Quantity: ${item.quantity}`);
            console.log(`     Unit Price: ${item.unitPrice.amount} ${item.unitPrice.currency}`);
            console.log(`     Subtotal: ${item.quantity * item.unitPrice.amount} ${item.unitPrice.currency}`);
        });
        console.log('=====================================\n');
    }
}

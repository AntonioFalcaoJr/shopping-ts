import { SendOrderConfirmation } from '../../../src/Application/Events/SendOrderConfirmation';
import { IEmailGateway } from '../../../src/Application/Gateways/IEmailGateway';
import { OrderConfirmed } from '../../../src/Domain/Order/OrderEvents';

describe('SendOrderConfirmation', () => {
    let emailGateway: jest.Mocked<IEmailGateway>;
    let sendOrderConfirmation: SendOrderConfirmation;

    beforeEach(() => {
        emailGateway = {
            send: jest.fn().mockResolvedValue(undefined),
        };
        sendOrderConfirmation = new SendOrderConfirmation(emailGateway);
    });

    it('should send an email when a valid OrderConfirmed event is received', async () => {
        const event: OrderConfirmed = {
            type: 'OrderConfirmed',
            data: {
                orderId: 'order-123',
                confirmedAt: new Date(),
                status: 'Confirmed',
            },
        };

        await sendOrderConfirmation.execute(event);

        expect(emailGateway.send).toHaveBeenCalledWith(expect.objectContaining({
            to: 'customer@example.com',
            subject: expect.stringContaining('order-123'),
        }));
    });

    it('should work when passed an event from the subscription (simulating the fix)', async () => {
        const eventFromSubscription = {
            type: 'OrderConfirmed',
            data: {
                orderId: 'order-123',
                confirmedAt: new Date(),
                status: 'Confirmed',
            },
            metadata: {
                eventId: 'event-123',
                streamName: 'orders-123',
            }
        } as any;

        await sendOrderConfirmation.execute(eventFromSubscription);

        expect(emailGateway.send).toHaveBeenCalledWith(expect.objectContaining({
            to: 'customer@example.com',
            subject: expect.stringContaining('order-123'),
        }));
    });
});

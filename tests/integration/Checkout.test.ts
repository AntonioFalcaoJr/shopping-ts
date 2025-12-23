import { CheckoutCommandHandler } from '../../src/Application/Commands/CheckoutCommandHandlers';
import { CheckoutCommand } from '../../src/Domain/Checkout/CheckoutCommands';
import { TestEventStore } from '../helpers/TestEventStore';
import { TestDataBuilders } from '../helpers/TestDataBuilders';
import { IEventStore } from '../../src/Application/Gateways/IEventStore';
import { PaymentMethodType } from '../../src/Domain/ValueObjects/PaymentMethod';

describe('Checkout Integration Tests', () => {
    let testEventStore: TestEventStore;
    let eventStore: IEventStore;
    let commandHandler: CheckoutCommandHandler;

    beforeAll(async () => {
        testEventStore = new TestEventStore();
        eventStore = await testEventStore.setup();
        commandHandler = new CheckoutCommandHandler(eventStore);
    });

    afterAll(async () => {
        await testEventStore.teardown();
    });

    describe('Initiate Checkout', () => {
        it('should successfully initiate a new checkout', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const totalAmount = TestDataBuilders.createMoney(100.00);

            const command: CheckoutCommand = {
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when initiating checkout with the same checkout ID twice', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const totalAmount = TestDataBuilders.createMoney(100.00);

            const command: CheckoutCommand = {
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount,
                },
            };

            // Act
            await commandHandler.handle(command);

            // Assert - attempting to initiate checkout again with same ID should fail
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Set Payment Method', () => {
        it('should successfully set payment method for checkout', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            // Initiate checkout first
            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(100.00),
                },
            });

            const paymentMethod = TestDataBuilders.createPaymentMethod(
                PaymentMethodType.CREDIT_CARD,
                '4111111111111111'
            );

            const command: CheckoutCommand = {
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should successfully change payment method', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(100.00),
                },
            });

            // Set initial payment method
            await commandHandler.handle({
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: TestDataBuilders.createPaymentMethod(
                        PaymentMethodType.CREDIT_CARD,
                        '4111111111111111'
                    ),
                },
            });

            // Change to PayPal
            const newPaymentMethod = TestDataBuilders.createPaymentMethod(
                PaymentMethodType.PAYPAL,
                'user@example.com'
            );

            const command: CheckoutCommand = {
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: newPaymentMethod,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when setting payment method for non-existent checkout', async () => {
            // Arrange
            const nonExistentCheckoutId = TestDataBuilders.createCheckoutId();
            const paymentMethod = TestDataBuilders.createPaymentMethod();

            const command: CheckoutCommand = {
                type: 'SetPaymentMethod',
                data: {
                    checkoutId: nonExistentCheckoutId,
                    paymentMethod,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Apply Coupon', () => {
        it('should successfully apply a coupon to checkout', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(100.00),
                },
            });

            const couponCode = TestDataBuilders.createCouponCode('SAVE10');
            const discountAmount = TestDataBuilders.createMoney(10.00);

            const command: CheckoutCommand = {
                type: 'ApplyCoupon',
                data: {
                    checkoutId,
                    couponCode,
                    discountAmount,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should successfully apply multiple coupons', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(200.00),
                },
            });

            // Apply first coupon
            await commandHandler.handle({
                type: 'ApplyCoupon',
                data: {
                    checkoutId,
                    couponCode: TestDataBuilders.createCouponCode('SAVE10'),
                    discountAmount: TestDataBuilders.createMoney(10.00),
                },
            });

            // Apply second coupon
            const command: CheckoutCommand = {
                type: 'ApplyCoupon',
                data: {
                    checkoutId,
                    couponCode: TestDataBuilders.createCouponCode('EXTRA5'),
                    discountAmount: TestDataBuilders.createMoney(5.00),
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when applying coupon to non-existent checkout', async () => {
            // Arrange
            const nonExistentCheckoutId = TestDataBuilders.createCheckoutId();
            const couponCode = TestDataBuilders.createCouponCode('SAVE10');
            const discountAmount = TestDataBuilders.createMoney(10.00);

            const command: CheckoutCommand = {
                type: 'ApplyCoupon',
                data: {
                    checkoutId: nonExistentCheckoutId,
                    couponCode,
                    discountAmount,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Apply Gift Card', () => {
        it('should successfully apply a gift card to checkout', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(100.00),
                },
            });

            const giftCardCode = TestDataBuilders.createGiftCardCode('GIFT-1234-5678');
            const appliedAmount = TestDataBuilders.createMoney(50.00);

            const command: CheckoutCommand = {
                type: 'ApplyGiftCard',
                data: {
                    checkoutId,
                    giftCardCode,
                    appliedAmount,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should successfully apply multiple gift cards', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(200.00),
                },
            });

            // Apply first gift card
            await commandHandler.handle({
                type: 'ApplyGiftCard',
                data: {
                    checkoutId,
                    giftCardCode: TestDataBuilders.createGiftCardCode('GIFT-1111-1111'),
                    appliedAmount: TestDataBuilders.createMoney(50.00),
                },
            });

            // Apply second gift card
            const command: CheckoutCommand = {
                type: 'ApplyGiftCard',
                data: {
                    checkoutId,
                    giftCardCode: TestDataBuilders.createGiftCardCode('GIFT-2222-2222'),
                    appliedAmount: TestDataBuilders.createMoney(30.00),
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when applying gift card to non-existent checkout', async () => {
            // Arrange
            const nonExistentCheckoutId = TestDataBuilders.createCheckoutId();
            const giftCardCode = TestDataBuilders.createGiftCardCode('GIFT-1234-5678');
            const appliedAmount = TestDataBuilders.createMoney(50.00);

            const command: CheckoutCommand = {
                type: 'ApplyGiftCard',
                data: {
                    checkoutId: nonExistentCheckoutId,
                    giftCardCode,
                    appliedAmount,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Complete Checkout', () => {
        it('should successfully complete a checkout', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(100.00),
                },
            });

            await commandHandler.handle({
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: TestDataBuilders.createPaymentMethod(),
                },
            });

            const command: CheckoutCommand = {
                type: 'CompleteCheckout',
                data: {
                    checkoutId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when completing non-existent checkout', async () => {
            // Arrange
            const nonExistentCheckoutId = TestDataBuilders.createCheckoutId();

            const command: CheckoutCommand = {
                type: 'CompleteCheckout',
                data: {
                    checkoutId: nonExistentCheckoutId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Cancel Checkout', () => {
        it('should successfully cancel a checkout', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(100.00),
                },
            });

            const command: CheckoutCommand = {
                type: 'CancelCheckout',
                data: {
                    checkoutId,
                    reason: 'Customer changed mind',
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when canceling non-existent checkout', async () => {
            // Arrange
            const nonExistentCheckoutId = TestDataBuilders.createCheckoutId();

            const command: CheckoutCommand = {
                type: 'CancelCheckout',
                data: {
                    checkoutId: nonExistentCheckoutId,
                    reason: 'Test cancellation',
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Complete Checkout Workflow', () => {
        it('should handle a complete checkout workflow with all features', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            // Act - Initiate checkout
            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(250.00),
                },
            });

            // Set payment method
            await commandHandler.handle({
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: TestDataBuilders.createPaymentMethod(
                        PaymentMethodType.CREDIT_CARD,
                        '4111111111111111'
                    ),
                },
            });

            // Apply coupon
            await commandHandler.handle({
                type: 'ApplyCoupon',
                data: {
                    checkoutId,
                    couponCode: TestDataBuilders.createCouponCode('SAVE20'),
                    discountAmount: TestDataBuilders.createMoney(20.00),
                },
            });

            // Apply gift card
            await commandHandler.handle({
                type: 'ApplyGiftCard',
                data: {
                    checkoutId,
                    giftCardCode: TestDataBuilders.createGiftCardCode('GIFT-9999-9999'),
                    appliedAmount: TestDataBuilders.createMoney(30.00),
                },
            });

            // Complete checkout
            await commandHandler.handle({
                type: 'CompleteCheckout',
                data: {
                    checkoutId,
                },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });

        it('should handle checkout workflow with cancellation', async () => {
            // Arrange
            const checkoutId = TestDataBuilders.createCheckoutId();
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            // Act - Initiate checkout
            await commandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(150.00),
                },
            });

            // Set payment method
            await commandHandler.handle({
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: TestDataBuilders.createPaymentMethod(),
                },
            });

            // Cancel checkout
            await commandHandler.handle({
                type: 'CancelCheckout',
                data: {
                    checkoutId,
                    reason: 'Payment method declined',
                },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });
    });
});

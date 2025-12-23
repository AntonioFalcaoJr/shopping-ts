import { OrderCommandHandler } from '../../src/Application/Commands/OrderCommandHandlers';
import { OrderCommand } from '../../src/Domain/Order/OrderCommands';
import { TestEventStore } from '../helpers/TestEventStore';
import { TestDataBuilders } from '../helpers/TestDataBuilders';
import { IEventStore } from '../../src/Application/Gateways/IEventStore';

describe('Order Integration Tests', () => {
    let testEventStore: TestEventStore;
    let eventStore: IEventStore;
    let commandHandler: OrderCommandHandler;

    beforeAll(async () => {
        testEventStore = new TestEventStore();
        eventStore = await testEventStore.setup();
        commandHandler = new OrderCommandHandler(eventStore);
    });

    afterAll(async () => {
        await testEventStore.teardown();
    });

    describe('Create Order', () => {
        it('should successfully create a new order', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();
            const items = [
                TestDataBuilders.createOrderItem('product-1', 2, 25.00),
                TestDataBuilders.createOrderItem('product-2', 1, 50.00),
            ];
            const totalAmount = TestDataBuilders.createMoney(100.00);
            const shippingAddress = TestDataBuilders.createShippingAddress();

            const command: OrderCommand = {
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items,
                    totalAmount,
                    shippingAddress,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should successfully create an order with single item', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();
            const items = [TestDataBuilders.createOrderItem('laptop', 1, 999.99)];
            const totalAmount = TestDataBuilders.createMoney(999.99);
            const shippingAddress = TestDataBuilders.createShippingAddress();

            const command: OrderCommand = {
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items,
                    totalAmount,
                    shippingAddress,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when creating order with the same order ID twice', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();
            const items = [TestDataBuilders.createOrderItem()];
            const totalAmount = TestDataBuilders.createMoney(10.00);
            const shippingAddress = TestDataBuilders.createShippingAddress();

            const command: OrderCommand = {
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items,
                    totalAmount,
                    shippingAddress,
                },
            };

            // Act
            await commandHandler.handle(command);

            // Assert - attempting to create order again with same ID should fail
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Confirm Order', () => {
        it('should successfully confirm an order', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();

            // Create order first
            await commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem()],
                    totalAmount: TestDataBuilders.createMoney(10.00),
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            const command: OrderCommand = {
                type: 'ConfirmOrder',
                data: {
                    orderId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when confirming non-existent order', async () => {
            // Arrange
            const nonExistentOrderId = TestDataBuilders.createOrderId();

            const command: OrderCommand = {
                type: 'ConfirmOrder',
                data: {
                    orderId: nonExistentOrderId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Ship Order', () => {
        it('should successfully ship an order', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();

            // Create and confirm order first
            await commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem()],
                    totalAmount: TestDataBuilders.createMoney(10.00),
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            await commandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            const command: OrderCommand = {
                type: 'ShipOrder',
                data: {
                    orderId,
                    trackingNumber: 'TRACK123456789',
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when shipping non-existent order', async () => {
            // Arrange
            const nonExistentOrderId = TestDataBuilders.createOrderId();

            const command: OrderCommand = {
                type: 'ShipOrder',
                data: {
                    orderId: nonExistentOrderId,
                    trackingNumber: 'TRACK123456789',
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Deliver Order', () => {
        it('should successfully deliver an order', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();

            // Create, confirm, and ship order first
            await commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem()],
                    totalAmount: TestDataBuilders.createMoney(10.00),
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            await commandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            await commandHandler.handle({
                type: 'ShipOrder',
                data: {
                    orderId,
                    trackingNumber: 'TRACK123456789',
                },
            });

            const command: OrderCommand = {
                type: 'DeliverOrder',
                data: {
                    orderId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when delivering non-existent order', async () => {
            // Arrange
            const nonExistentOrderId = TestDataBuilders.createOrderId();

            const command: OrderCommand = {
                type: 'DeliverOrder',
                data: {
                    orderId: nonExistentOrderId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Cancel Order', () => {
        it('should successfully cancel an order', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();

            // Create order first
            await commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem()],
                    totalAmount: TestDataBuilders.createMoney(10.00),
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            const command: OrderCommand = {
                type: 'CancelOrder',
                data: {
                    orderId,
                    reason: 'Customer requested cancellation',
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should successfully cancel a confirmed order', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();

            // Create and confirm order first
            await commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem()],
                    totalAmount: TestDataBuilders.createMoney(10.00),
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            await commandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            const command: OrderCommand = {
                type: 'CancelOrder',
                data: {
                    orderId,
                    reason: 'Out of stock',
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when canceling non-existent order', async () => {
            // Arrange
            const nonExistentOrderId = TestDataBuilders.createOrderId();

            const command: OrderCommand = {
                type: 'CancelOrder',
                data: {
                    orderId: nonExistentOrderId,
                    reason: 'Test cancellation',
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Complete Order Workflow', () => {
        it('should handle a complete order lifecycle from creation to delivery', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();
            const items = [
                TestDataBuilders.createOrderItem('laptop', 1, 999.99),
                TestDataBuilders.createOrderItem('mouse', 1, 25.00),
                TestDataBuilders.createOrderItem('keyboard', 1, 75.00),
            ];
            const totalAmount = TestDataBuilders.createMoney(1099.99);
            const shippingAddress = TestDataBuilders.createShippingAddress(
                '456 Oak Avenue',
                'Los Angeles',
                'CA',
                '90001',
                'USA'
            );

            // Act - Create order
            await commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items,
                    totalAmount,
                    shippingAddress,
                },
            });

            // Confirm order
            await commandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            // Ship order
            await commandHandler.handle({
                type: 'ShipOrder',
                data: {
                    orderId,
                    trackingNumber: 'UPS-TRACK-987654321',
                },
            });

            // Deliver order
            await commandHandler.handle({
                type: 'DeliverOrder',
                data: { orderId },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });

        it('should handle order workflow with cancellation after confirmation', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();

            // Act - Create order
            await commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem('product-1', 5, 20.00)],
                    totalAmount: TestDataBuilders.createMoney(100.00),
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            // Confirm order
            await commandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            // Cancel order
            await commandHandler.handle({
                type: 'CancelOrder',
                data: {
                    orderId,
                    reason: 'Payment verification failed',
                },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });

        it('should handle order workflow with immediate cancellation', async () => {
            // Arrange
            const orderId = TestDataBuilders.createOrderId();
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();

            // Act - Create order
            await commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem()],
                    totalAmount: TestDataBuilders.createMoney(50.00),
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            // Cancel order immediately
            await commandHandler.handle({
                type: 'CancelOrder',
                data: {
                    orderId,
                    reason: 'Customer changed mind immediately',
                },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });
    });
});

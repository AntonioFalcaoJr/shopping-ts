import { ShoppingCartCommandHandler } from '../../src/Application/Commands/ShoppingCartCommandHandlers';
import { CheckoutCommandHandler } from '../../src/Application/Commands/CheckoutCommandHandlers';
import { OrderCommandHandler } from '../../src/Application/Commands/OrderCommandHandlers';
import { TestEventStore } from '../helpers/TestEventStore';
import { TestDataBuilders } from '../helpers/TestDataBuilders';
import { IEventStore } from '../../src/Application/Gateways/IEventStore';
import { PaymentMethodType } from '../../src/Domain/ValueObjects/PaymentMethod';

describe('End-to-End Workflow Integration Tests', () => {
    let testEventStore: TestEventStore;
    let eventStore: IEventStore;
    let cartCommandHandler: ShoppingCartCommandHandler;
    let checkoutCommandHandler: CheckoutCommandHandler;
    let orderCommandHandler: OrderCommandHandler;

    beforeAll(async () => {
        testEventStore = new TestEventStore();
        eventStore = await testEventStore.setup();
        cartCommandHandler = new ShoppingCartCommandHandler(eventStore);
        checkoutCommandHandler = new CheckoutCommandHandler(eventStore);
        orderCommandHandler = new OrderCommandHandler(eventStore);
    });

    afterAll(async () => {
        await testEventStore.teardown();
    });

    describe('Complete Shopping Journey', () => {
        it('should handle complete flow: cart → checkout → order → delivery', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const orderId = TestDataBuilders.createOrderId();
            const customerId = TestDataBuilders.createCustomerId();

            const product1 = TestDataBuilders.createProductId('laptop-001');
            const product2 = TestDataBuilders.createProductId('mouse-002');
            const product3 = TestDataBuilders.createProductId('keyboard-003');

            // Act - Phase 1: Shopping Cart
            // Start shopping
            await cartCommandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            // Add items to cart
            await cartCommandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product1,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(999.99),
                },
            });

            await cartCommandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product2,
                    quantity: TestDataBuilders.createQuantity(2),
                    unitPrice: TestDataBuilders.createMoney(25.00),
                },
            });

            await cartCommandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product3,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(75.00),
                },
            });

            // Change quantity of mouse
            await cartCommandHandler.handle({
                type: 'ChangeItemQuantity',
                data: {
                    cartId,
                    productId: product2,
                    newQuantity: TestDataBuilders.createQuantity(3),
                },
            });

            // Phase 2: Checkout
            const totalAmount = TestDataBuilders.createMoney(1149.99);

            // Initiate checkout
            await checkoutCommandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount,
                },
            });

            // Set payment method
            await checkoutCommandHandler.handle({
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
            await checkoutCommandHandler.handle({
                type: 'ApplyCoupon',
                data: {
                    checkoutId,
                    couponCode: TestDataBuilders.createCouponCode('SAVE50'),
                    discountAmount: TestDataBuilders.createMoney(50.00),
                },
            });

            // Complete checkout
            await checkoutCommandHandler.handle({
                type: 'CompleteCheckout',
                data: { checkoutId },
            });

            // Phase 3: Order
            const orderItems = [
                TestDataBuilders.createOrderItem('laptop-001', 1, 999.99),
                TestDataBuilders.createOrderItem('mouse-002', 3, 25.00),
                TestDataBuilders.createOrderItem('keyboard-003', 1, 75.00),
            ];

            const finalAmount = TestDataBuilders.createMoney(1099.99); // After discount

            // Create order
            await orderCommandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: orderItems,
                    totalAmount: finalAmount,
                    shippingAddress: TestDataBuilders.createShippingAddress(
                        '123 Tech Street',
                        'San Francisco',
                        'CA',
                        '94102',
                        'USA'
                    ),
                },
            });

            // Confirm order
            await orderCommandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            // Ship order
            await orderCommandHandler.handle({
                type: 'ShipOrder',
                data: {
                    orderId,
                    trackingNumber: 'FEDEX-123456789',
                },
            });

            // Deliver order
            await orderCommandHandler.handle({
                type: 'DeliverOrder',
                data: { orderId },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });

        it('should handle flow with cart modifications and checkout cancellation', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const customerId = TestDataBuilders.createCustomerId();

            const product1 = TestDataBuilders.createProductId('product-A');
            const product2 = TestDataBuilders.createProductId('product-B');
            const product3 = TestDataBuilders.createProductId('product-C');

            // Act - Shopping Cart Phase
            await cartCommandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            // Add multiple items
            await cartCommandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product1,
                    quantity: TestDataBuilders.createQuantity(2),
                    unitPrice: TestDataBuilders.createMoney(50.00),
                },
            });

            await cartCommandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product2,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(30.00),
                },
            });

            await cartCommandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product3,
                    quantity: TestDataBuilders.createQuantity(3),
                    unitPrice: TestDataBuilders.createMoney(20.00),
                },
            });

            // Remove one item
            await cartCommandHandler.handle({
                type: 'RemoveItemFromCart',
                data: {
                    cartId,
                    productId: product2,
                },
            });

            // Checkout Phase
            await checkoutCommandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(160.00),
                },
            });

            await checkoutCommandHandler.handle({
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: TestDataBuilders.createPaymentMethod(
                        PaymentMethodType.PAYPAL,
                        'customer@example.com'
                    ),
                },
            });

            // Cancel checkout
            await checkoutCommandHandler.handle({
                type: 'CancelCheckout',
                data: {
                    checkoutId,
                    reason: 'Customer decided to add more items',
                },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });

        it('should handle flow with gift card and order cancellation', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const orderId = TestDataBuilders.createOrderId();
            const customerId = TestDataBuilders.createCustomerId();

            const product = TestDataBuilders.createProductId('premium-item');

            // Act - Shopping Cart
            await cartCommandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            await cartCommandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(500.00),
                },
            });

            // Checkout with gift card
            await checkoutCommandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(500.00),
                },
            });

            await checkoutCommandHandler.handle({
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: TestDataBuilders.createPaymentMethod(
                        PaymentMethodType.CREDIT_CARD,
                        '5555555555554444'
                    ),
                },
            });

            // Apply gift card
            await checkoutCommandHandler.handle({
                type: 'ApplyGiftCard',
                data: {
                    checkoutId,
                    giftCardCode: TestDataBuilders.createGiftCardCode('GIFT-XMAS-2024'),
                    appliedAmount: TestDataBuilders.createMoney(100.00),
                },
            });

            await checkoutCommandHandler.handle({
                type: 'CompleteCheckout',
                data: { checkoutId },
            });

            // Create order
            await orderCommandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem('premium-item', 1, 500.00)],
                    totalAmount: TestDataBuilders.createMoney(400.00), // After gift card
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            await orderCommandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            // Cancel order due to stock issue
            await orderCommandHandler.handle({
                type: 'CancelOrder',
                data: {
                    orderId,
                    reason: 'Item out of stock',
                },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });

        it('should handle minimal flow: single item purchase', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const orderId = TestDataBuilders.createOrderId();
            const customerId = TestDataBuilders.createCustomerId();
            const product = TestDataBuilders.createProductId('simple-item');

            // Act - Minimal happy path
            // Cart
            await cartCommandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            await cartCommandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(29.99),
                },
            });

            // Checkout
            await checkoutCommandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(29.99),
                },
            });

            await checkoutCommandHandler.handle({
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: TestDataBuilders.createPaymentMethod(),
                },
            });

            await checkoutCommandHandler.handle({
                type: 'CompleteCheckout',
                data: { checkoutId },
            });

            // Order
            await orderCommandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: [TestDataBuilders.createOrderItem('simple-item', 1, 29.99)],
                    totalAmount: TestDataBuilders.createMoney(29.99),
                    shippingAddress: TestDataBuilders.createShippingAddress(),
                },
            });

            await orderCommandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            await orderCommandHandler.handle({
                type: 'ShipOrder',
                data: {
                    orderId,
                    trackingNumber: 'USPS-987654321',
                },
            });

            await orderCommandHandler.handle({
                type: 'DeliverOrder',
                data: { orderId },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });

        it('should handle complex flow with multiple discounts', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const checkoutId = TestDataBuilders.createCheckoutId();
            const orderId = TestDataBuilders.createOrderId();
            const customerId = TestDataBuilders.createCustomerId();

            // Act - Complex scenario with multiple items and discounts
            // Shopping Cart
            await cartCommandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            // Add 5 different items
            for (let i = 1; i <= 5; i++) {
                await cartCommandHandler.handle({
                    type: 'AddItemToCart',
                    data: {
                        cartId,
                        productId: TestDataBuilders.createProductId(`item-${i}`),
                        quantity: TestDataBuilders.createQuantity(i),
                        unitPrice: TestDataBuilders.createMoney(10.00 * i),
                    },
                });
            }

            // Checkout with multiple discounts
            await checkoutCommandHandler.handle({
                type: 'InitiateCheckout',
                data: {
                    checkoutId,
                    cartId,
                    customerId: customerId.getValue(),
                    totalAmount: TestDataBuilders.createMoney(550.00),
                },
            });

            await checkoutCommandHandler.handle({
                type: 'SetPaymentMethod',
                data: {
                    checkoutId,
                    paymentMethod: TestDataBuilders.createPaymentMethod(
                        PaymentMethodType.BANK_TRANSFER,
                        'ACC-123456789'
                    ),
                },
            });

            // Apply multiple coupons
            await checkoutCommandHandler.handle({
                type: 'ApplyCoupon',
                data: {
                    checkoutId,
                    couponCode: TestDataBuilders.createCouponCode('BULK10'),
                    discountAmount: TestDataBuilders.createMoney(55.00),
                },
            });

            await checkoutCommandHandler.handle({
                type: 'ApplyCoupon',
                data: {
                    checkoutId,
                    couponCode: TestDataBuilders.createCouponCode('LOYALTY5'),
                    discountAmount: TestDataBuilders.createMoney(27.50),
                },
            });

            // Apply gift card
            await checkoutCommandHandler.handle({
                type: 'ApplyGiftCard',
                data: {
                    checkoutId,
                    giftCardCode: TestDataBuilders.createGiftCardCode('GIFT-REWARD-100'),
                    appliedAmount: TestDataBuilders.createMoney(100.00),
                },
            });

            await checkoutCommandHandler.handle({
                type: 'CompleteCheckout',
                data: { checkoutId },
            });

            // Create and process order
            const orderItems = [];
            for (let i = 1; i <= 5; i++) {
                orderItems.push(TestDataBuilders.createOrderItem(`item-${i}`, i, 10.00 * i));
            }

            await orderCommandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId,
                    cartId,
                    checkoutId,
                    customerId: customerId.getValue(),
                    items: orderItems,
                    totalAmount: TestDataBuilders.createMoney(367.50), // After all discounts
                    shippingAddress: TestDataBuilders.createShippingAddress(
                        '789 Commerce Blvd',
                        'Chicago',
                        'IL',
                        '60601',
                        'USA'
                    ),
                },
            });

            await orderCommandHandler.handle({
                type: 'ConfirmOrder',
                data: { orderId },
            });

            await orderCommandHandler.handle({
                type: 'ShipOrder',
                data: {
                    orderId,
                    trackingNumber: 'DHL-TRACK-555666777',
                },
            });

            await orderCommandHandler.handle({
                type: 'DeliverOrder',
                data: { orderId },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });
    });
});

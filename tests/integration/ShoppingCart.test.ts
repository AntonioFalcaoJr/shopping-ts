import { ShoppingCartCommandHandler } from '../../src/Application/Commands/ShoppingCartCommandHandlers';
import { ShoppingCartCommand } from '../../src/Domain/ShoppingCart/ShoppingCartCommands';
import { TestEventStore } from '../helpers/TestEventStore';
import { TestDataBuilders } from '../helpers/TestDataBuilders';
import { IEventStore } from '../../src/Application/Gateways/IEventStore';

describe('ShoppingCart Integration Tests', () => {
    let testEventStore: TestEventStore;
    let eventStore: IEventStore;
    let commandHandler: ShoppingCartCommandHandler;

    beforeAll(async () => {
        testEventStore = new TestEventStore();
        eventStore = await testEventStore.setup();
        commandHandler = new ShoppingCartCommandHandler(eventStore);
    });

    afterAll(async () => {
        await testEventStore.teardown();
    });

    describe('Start Shopping', () => {
        it('should successfully start a new shopping cart', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            const command: ShoppingCartCommand = {
                type: 'StartShopping',
                data: {
                    cartId,
                    customerId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).resolves.not.toThrow();
        });

        it('should fail when starting shopping with the same cart ID twice', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            const command: ShoppingCartCommand = {
                type: 'StartShopping',
                data: {
                    cartId,
                    customerId,
                },
            };

            // Act
            await commandHandler.handle(command);

            // Assert - attempting to start shopping again with same cart ID should fail
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Add Item to Cart', () => {
        it('should successfully add an item to the cart', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const productId = TestDataBuilders.createProductId();
            const quantity = TestDataBuilders.createQuantity(2);
            const unitPrice = TestDataBuilders.createMoney(25.99);

            // Start shopping first
            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            const addItemCommand: ShoppingCartCommand = {
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId,
                    quantity,
                    unitPrice,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(addItemCommand)).resolves.not.toThrow();
        });

        it('should successfully add multiple different items to the cart', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            const product1 = TestDataBuilders.createProductId('product-1');
            const product2 = TestDataBuilders.createProductId('product-2');

            // Act
            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product1,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(10.00),
                },
            });

            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product2,
                    quantity: TestDataBuilders.createQuantity(3),
                    unitPrice: TestDataBuilders.createMoney(15.00),
                },
            });

            // Assert - should not throw
            expect(true).toBe(true);
        });

        it('should fail when adding item to non-existent cart', async () => {
            // Arrange
            const nonExistentCartId = TestDataBuilders.createCartId();
            const productId = TestDataBuilders.createProductId();

            const command: ShoppingCartCommand = {
                type: 'AddItemToCart',
                data: {
                    cartId: nonExistentCartId,
                    productId,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(10.00),
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(command)).rejects.toThrow();
        });
    });

    describe('Remove Item from Cart', () => {
        it('should successfully remove an item from the cart', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const productId = TestDataBuilders.createProductId();

            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId,
                    quantity: TestDataBuilders.createQuantity(2),
                    unitPrice: TestDataBuilders.createMoney(20.00),
                },
            });

            const removeCommand: ShoppingCartCommand = {
                type: 'RemoveItemFromCart',
                data: {
                    cartId,
                    productId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(removeCommand)).resolves.not.toThrow();
        });

        it('should fail when removing non-existent item from cart', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const nonExistentProductId = TestDataBuilders.createProductId();

            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            const removeCommand: ShoppingCartCommand = {
                type: 'RemoveItemFromCart',
                data: {
                    cartId,
                    productId: nonExistentProductId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(removeCommand)).rejects.toThrow();
        });
    });

    describe('Change Item Quantity', () => {
        it('should successfully increase item quantity', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const productId = TestDataBuilders.createProductId();

            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(10.00),
                },
            });

            const changeQuantityCommand: ShoppingCartCommand = {
                type: 'ChangeItemQuantity',
                data: {
                    cartId,
                    productId,
                    newQuantity: TestDataBuilders.createQuantity(5),
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(changeQuantityCommand)).resolves.not.toThrow();
        });

        it('should successfully decrease item quantity', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const productId = TestDataBuilders.createProductId();

            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId,
                    quantity: TestDataBuilders.createQuantity(5),
                    unitPrice: TestDataBuilders.createMoney(10.00),
                },
            });

            const changeQuantityCommand: ShoppingCartCommand = {
                type: 'ChangeItemQuantity',
                data: {
                    cartId,
                    productId,
                    newQuantity: TestDataBuilders.createQuantity(2),
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(changeQuantityCommand)).resolves.not.toThrow();
        });

        it('should fail when changing quantity of non-existent item', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const nonExistentProductId = TestDataBuilders.createProductId();

            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            const changeQuantityCommand: ShoppingCartCommand = {
                type: 'ChangeItemQuantity',
                data: {
                    cartId,
                    productId: nonExistentProductId,
                    newQuantity: TestDataBuilders.createQuantity(3),
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(changeQuantityCommand)).rejects.toThrow();
        });
    });

    describe('Clear Shopping Cart', () => {
        it('should successfully clear all items from the cart', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: TestDataBuilders.createProductId('product-1'),
                    quantity: TestDataBuilders.createQuantity(2),
                    unitPrice: TestDataBuilders.createMoney(10.00),
                },
            });

            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: TestDataBuilders.createProductId('product-2'),
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(20.00),
                },
            });

            const clearCommand: ShoppingCartCommand = {
                type: 'ClearShoppingCart',
                data: {
                    cartId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(clearCommand)).resolves.not.toThrow();
        });

        it('should successfully clear an empty cart', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();

            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            const clearCommand: ShoppingCartCommand = {
                type: 'ClearShoppingCart',
                data: {
                    cartId,
                },
            };

            // Act & Assert
            await expect(commandHandler.handle(clearCommand)).resolves.not.toThrow();
        });
    });

    describe('Complete Shopping Cart Workflow', () => {
        it('should handle a complete shopping cart workflow', async () => {
            // Arrange
            const cartId = TestDataBuilders.createCartId();
            const customerId = TestDataBuilders.createCustomerId();
            const product1 = TestDataBuilders.createProductId('laptop');
            const product2 = TestDataBuilders.createProductId('mouse');
            const product3 = TestDataBuilders.createProductId('keyboard');

            // Act - Start shopping
            await commandHandler.handle({
                type: 'StartShopping',
                data: { cartId, customerId },
            });

            // Add items
            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product1,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(999.99),
                },
            });

            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product2,
                    quantity: TestDataBuilders.createQuantity(2),
                    unitPrice: TestDataBuilders.createMoney(25.00),
                },
            });

            await commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId,
                    productId: product3,
                    quantity: TestDataBuilders.createQuantity(1),
                    unitPrice: TestDataBuilders.createMoney(75.00),
                },
            });

            // Change quantity
            await commandHandler.handle({
                type: 'ChangeItemQuantity',
                data: {
                    cartId,
                    productId: product2,
                    newQuantity: TestDataBuilders.createQuantity(3),
                },
            });

            // Remove an item
            await commandHandler.handle({
                type: 'RemoveItemFromCart',
                data: {
                    cartId,
                    productId: product3,
                },
            });

            // Assert - all operations should succeed
            expect(true).toBe(true);
        });
    });
});

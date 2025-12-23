import {Request, Response, Router} from 'express';
import {ShoppingCartCommandHandler} from '../../Application/Commands/ShoppingCartCommandHandlers';
import {ShoppingCartQueryHandler} from '../../Application/Queries/ShoppingCartQueryHandlers';
import {CartId, CustomerId} from '../../Domain/ValueObjects/Ids';
import {ProductId} from '../../Domain/ValueObjects/ProductId';
import {Quantity} from '../../Domain/ValueObjects/Quantity';
import {Money} from '../../Domain/ValueObjects/Money';

export class ShoppingCartController {
    private readonly router: Router;

    constructor(
        private readonly commandHandler: ShoppingCartCommandHandler,
        private readonly queryHandler: ShoppingCartQueryHandler
    ) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.post('/carts', this.startShopping.bind(this));
        this.router.post('/carts/:cartId/items', this.addItemToCart.bind(this));
        this.router.delete('/carts/:cartId/items/:productId', this.removeItemFromCart.bind(this));
        this.router.patch('/carts/:cartId/items/:productId/quantity', this.changeItemQuantity.bind(this));
        this.router.delete('/carts/:cartId', this.clearShoppingCart.bind(this));

        this.router.get('/carts/:cartId', this.getShoppingCartById.bind(this));
        this.router.get('/carts', this.getShoppingCarts.bind(this));
        this.router.get('/customers/:customerId/carts', this.getShoppingCartsByCustomerId.bind(this));
    }

    private async startShopping(req: Request, res: Response): Promise<void> {
        try {
            const {cartId, customerId} = req.body;

            await this.commandHandler.handle({
                type: 'StartShopping',
                data: {
                    cartId: CartId.create(cartId),
                    customerId: CustomerId.create(customerId),
                },
            });

            res.status(201).json({message: 'Shopping started', cartId});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async addItemToCart(req: Request, res: Response): Promise<void> {
        try {
            const {cartId} = req.params;
            const {productId, quantity, unitPrice} = req.body;

            await this.commandHandler.handle({
                type: 'AddItemToCart',
                data: {
                    cartId: CartId.create(cartId),
                    productId: ProductId.create(productId),
                    quantity: Quantity.create(quantity),
                    unitPrice: Money.create(unitPrice.amount, unitPrice.currency),
                },
            });

            res.status(200).json({message: 'Item added to cart'});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async removeItemFromCart(req: Request, res: Response): Promise<void> {
        try {
            const {cartId, productId} = req.params;

            await this.commandHandler.handle({
                type: 'RemoveItemFromCart',
                data: {
                    cartId: CartId.create(cartId),
                    productId: ProductId.create(productId),
                },
            });

            res.status(200).json({message: 'Item removed from cart'});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async changeItemQuantity(req: Request, res: Response): Promise<void> {
        try {
            const {cartId, productId} = req.params;
            const {newQuantity} = req.body;

            await this.commandHandler.handle({
                type: 'ChangeItemQuantity',
                data: {
                    cartId: CartId.create(cartId),
                    productId: ProductId.create(productId),
                    newQuantity: Quantity.create(newQuantity),
                },
            });

            res.status(200).json({message: 'Item quantity changed'});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async clearShoppingCart(req: Request, res: Response): Promise<void> {
        try {
            const {cartId} = req.params;

            await this.commandHandler.handle({
                type: 'ClearShoppingCart',
                data: {
                    cartId: CartId.create(cartId),
                },
            });

            res.status(200).json({message: 'Shopping cart cleared'});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async getShoppingCartById(req: Request, res: Response): Promise<void> {
        try {
            const {cartId} = req.params;
            const cart = await this.queryHandler.getShoppingCartById(cartId);

            if (!cart) {
                res.status(404).json({error: 'Shopping cart not found'});
                return;
            }

            res.status(200).json(cart);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async getShoppingCarts(res: Response): Promise<void> {
        try {
            const carts = await this.queryHandler.getAllShoppingCarts();
            res.status(200).json(carts);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async getShoppingCartsByCustomerId(req: Request, res: Response): Promise<void> {
        try {
            const {customerId} = req.params;
            const carts = await this.queryHandler.getShoppingCartsByCustomerId(customerId);
            res.status(200).json(carts);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    getRouter(): Router {
        return this.router;
    }
}

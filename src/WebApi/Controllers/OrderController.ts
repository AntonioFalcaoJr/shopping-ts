import {Request, Response, Router} from 'express';
import {OrderCommandHandler} from '../../Application/Commands/OrderCommandHandlers';
import {OrderQueryHandler} from '../../Application/Queries/OrderQueryHandlers';
import {OrderId, CartId, CheckoutId} from '../../Domain/ValueObjects/Ids';
import {Money} from '../../Domain/ValueObjects/Money';

export class OrderController {
    private readonly router: Router;

    constructor(
        private readonly commandHandler: OrderCommandHandler,
        private readonly queryHandler: OrderQueryHandler
    ) {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        this.router.post('/orders', this.createOrder.bind(this));
        this.router.post('/orders/:orderId/confirm', this.confirmOrder.bind(this));
        this.router.post('/orders/:orderId/ship', this.shipOrder.bind(this));
        this.router.post('/orders/:orderId/deliver', this.deliverOrder.bind(this));
        this.router.post('/orders/:orderId/cancel', this.cancelOrder.bind(this));

        this.router.get('/orders/:orderId', this.getOrderById.bind(this));
        this.router.get('/orders', this.getOrders.bind(this));
        this.router.get('/customers/:customerId/orders', this.getOrdersByCustomerId.bind(this));
    }

    private async createOrder(req: Request, res: Response): Promise<void> {
        try {
            const {orderId, cartId, checkoutId, customerId, items, totalAmount, shippingAddress} = req.body;

            await this.commandHandler.handle({
                type: 'CreateOrder',
                data: {
                    orderId: OrderId.create(orderId),
                    cartId: CartId.create(cartId),
                    checkoutId: CheckoutId.create(checkoutId),
                    customerId,
                    items,
                    totalAmount: Money.create(totalAmount.amount, totalAmount.currency),
                    shippingAddress,
                },
            });

            res.status(201).json({message: 'Order created', orderId});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async confirmOrder(req: Request, res: Response): Promise<void> {
        try {
            const {orderId} = req.params;

            await this.commandHandler.handle({
                type: 'ConfirmOrder',
                data: {
                    orderId: OrderId.create(orderId),
                },
            });

            res.status(200).json({message: 'Order confirmed'});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async shipOrder(req: Request, res: Response): Promise<void> {
        try {
            const {orderId} = req.params;
            const {trackingNumber} = req.body;

            await this.commandHandler.handle({
                type: 'ShipOrder',
                data: {
                    orderId: OrderId.create(orderId),
                    trackingNumber,
                },
            });

            res.status(200).json({message: 'Order shipped'});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async deliverOrder(req: Request, res: Response): Promise<void> {
        try {
            const {orderId} = req.params;

            await this.commandHandler.handle({
                type: 'DeliverOrder',
                data: {
                    orderId: OrderId.create(orderId),
                },
            });

            res.status(200).json({message: 'Order delivered'});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async cancelOrder(req: Request, res: Response): Promise<void> {
        try {
            const {orderId} = req.params;
            const {reason} = req.body;

            await this.commandHandler.handle({
                type: 'CancelOrder',
                data: {
                    orderId: OrderId.create(orderId),
                    reason,
                },
            });

            res.status(200).json({message: 'Order cancelled'});
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async getOrderById(req: Request, res: Response): Promise<void> {
        try {
            const {orderId} = req.params;
            const order = await this.queryHandler.getOrderById(orderId);

            if (!order) {
                res.status(404).json({error: 'Order not found'});
                return;
            }

            res.status(200).json(order);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async getOrders(_req: Request, res: Response): Promise<void> {
        try {
            const orders = await this.queryHandler.getAllOrders();
            res.status(200).json(orders);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    private async getOrdersByCustomerId(req: Request, res: Response): Promise<void> {
        try {
            const {customerId} = req.params;
            const orders = await this.queryHandler.getOrdersByCustomerId(customerId);
            res.status(200).json(orders);
        } catch (error: any) {
            res.status(400).json({error: error.message});
        }
    }

    getRouter(): Router {
        return this.router;
    }
}

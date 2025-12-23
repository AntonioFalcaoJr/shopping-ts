import express, {Application} from 'express';
import {KurrentDBEventStoreGateway} from './Infrastructure/EventStore/KurrentDBEventStoreGateway';
import {ShoppingCartCommandHandler} from './Application/Commands/ShoppingCartCommandHandlers';
import {CheckoutCommandHandler} from './Application/Commands/CheckoutCommandHandlers';
import {OrderCommandHandler} from './Application/Commands/OrderCommandHandlers';
import {ShoppingCartQueryHandler} from './Application/Queries/ShoppingCartQueryHandlers';
import {CheckoutQueryHandler} from './Application/Queries/CheckoutQueryHandlers';
import {OrderQueryHandler} from './Application/Queries/OrderQueryHandlers';
import {ShoppingCartController} from './WebApi/Controllers/ShoppingCartController';
import {CheckoutController} from './WebApi/Controllers/CheckoutController';
import {OrderController} from './WebApi/Controllers/OrderController';
import {ShoppingCartProjectionSubscription} from './Infrastructure/Projections/ShoppingCartProjectionSubscription';
import {OrderProjectionSubscription} from './Infrastructure/Projections/OrderProjectionSubscription';
import {OrderConfirmedSubscription} from './Infrastructure/Subscriptions/OrderConfirmedSubscription';
import {KurrentDBProjectionGateway} from './Infrastructure/Projections/KurrentDBProjectionGateway';
import {EmailGateway} from './Infrastructure/SMTP/EmailGateway';
import {SendOrderConfirmationEmailUseCase} from './Application/UseCases/SendOrderConfirmationEmailUseCase';

class ShoppingApplication {
    private app: Application;
    private eventStoreGateway: KurrentDBEventStoreGateway;
    private shoppingCartProjection: ShoppingCartProjectionSubscription;
    private orderProjection: OrderProjectionSubscription;
    private orderConfirmedSubscription: OrderConfirmedSubscription;
    private projectionGateway: KurrentDBProjectionGateway;
    private emailGateway: EmailGateway;

    constructor() {
        this.app = express();
        this.app.use(express.json());

        this.eventStoreGateway = new KurrentDBEventStoreGateway(
            process.env.EVENTSTORE_CONNECTION_STRING || 'kurrent://localhost:2113?tls=false'
        );

        this.emailGateway = new EmailGateway();

        this.shoppingCartProjection = new ShoppingCartProjectionSubscription(
            this.eventStoreGateway.client
        );
        this.orderProjection = new OrderProjectionSubscription(
            this.eventStoreGateway.client
        );

        this.orderConfirmedSubscription = new OrderConfirmedSubscription(
            this.eventStoreGateway.client,
            this.emailGateway
        );

        this.projectionGateway = new KurrentDBProjectionGateway(
            this.shoppingCartProjection,
            this.orderProjection
        );
    }

    async initialize(): Promise<void> {
        console.log('Initializing Shopping Application...');

        await this.shoppingCartProjection.start();
        console.log('ShoppingCart projection subscription started');

        await this.orderProjection.start();
        console.log('Order projection subscription started');

        await this.orderConfirmedSubscription.start();
        console.log('OrderConfirmed side-effect subscription started');

        this.setupControllers();
        console.log('Controllers configured');

        this.setupErrorHandling();
    }

    private setupControllers(): void {
        const shoppingCartCommandHandler = new ShoppingCartCommandHandler(
            this.eventStoreGateway.eventStore
        );

        const checkoutCommandHandler = new CheckoutCommandHandler(
            this.eventStoreGateway.eventStore
        );

        const orderCommandHandler = new OrderCommandHandler(
            this.eventStoreGateway.eventStore
        );

        const shoppingCartQueryHandler = new ShoppingCartQueryHandler(this.projectionGateway);
        const checkoutQueryHandler = new CheckoutQueryHandler(this.projectionGateway);
        const orderQueryHandler = new OrderQueryHandler(this.projectionGateway);

        const shoppingCartController = new ShoppingCartController(
            shoppingCartCommandHandler,
            shoppingCartQueryHandler
        );

        const checkoutController = new CheckoutController(
            checkoutCommandHandler,
            checkoutQueryHandler
        );

        const orderController = new OrderController(
            orderCommandHandler,
            orderQueryHandler
        );

        this.app.use('/api', shoppingCartController.getRouter());
        this.app.use('/api', checkoutController.getRouter());
        this.app.use('/api', orderController.getRouter());

        this.app.get('/health', (_, res) => {
            res.status(200).json({status: 'healthy', timestamp: new Date().toISOString()});
        });
    }

    private setupErrorHandling(): void {
        this.app.use((err: Error, _: express.Request, res: express.Response, __: express.NextFunction) => {
            console.error('Unhandled error:', err);
            res.status(500).json({error: 'Internal server error', message: err.message});
        });
    }

    async start(port: number = 3000): Promise<void> {
        await this.initialize();

        this.app.listen(port, () => {
            console.log(`\n Shopping Bounded Context API running on port ${port}`);
            console.log(`   Health check: http://localhost:${port}/health`);
            console.log(`   API endpoints: http://localhost:${port}/api`);
            console.log('\n Architecture:');
            console.log('    Clean Architecture + Vertical Slice');
            console.log('    CQRS + Event Sourcing (Emmett + Decider pattern)');
            console.log('    KurrentDB for event store');
            console.log('    KurrentDB Subscriptions for projections (read models)');
            console.log('    KurrentDB Subscriptions for side effects (email notifications)');
            console.log('    In-memory projections via subscriptions\n');
        });
    }

    async shutdown(): Promise<void> {
        console.log('\n Shutting down gracefully...');

        // Stop all subscriptions
        await this.shoppingCartProjection.stop();
        await this.orderProjection.stop();
        await this.orderConfirmedSubscription.stop();
        console.log(' All subscriptions stopped');

        // Close event store connection
        await this.eventStoreGateway.close();
        console.log(' Event store connection closed');

        process.exit(0);
    }
}

// Application entry point
const app = new ShoppingApplication();

app.start(parseInt(process.env.PORT || '3000')).catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => app.shutdown());
process.on('SIGTERM', () => app.shutdown());

import express, {Application} from 'express';
import {KurrentDBEventStoreGateway} from './Infrastructure/EventStore/KurrentDBEventStoreGateway';
import {RabbitMQEventBusGateway} from './Infrastructure/EventBus/RabbitMQEventBusGateway';
import {PostgresProjectionGateway} from './Infrastructure/Projections/PostgresProjectionGateway';
import {ShoppingCartCommandHandler} from './Application/Commands/ShoppingCartCommandHandlers';
import {CheckoutCommandHandler} from './Application/Commands/CheckoutCommandHandlers';
import {OrderCommandHandler} from './Application/Commands/OrderCommandHandlers';
import {ShoppingCartQueryHandler} from './Application/Queries/ShoppingCartQueryHandlers';
import {CheckoutQueryHandler} from './Application/Queries/CheckoutQueryHandlers';
import {OrderQueryHandler} from './Application/Queries/OrderQueryHandlers';
import {ShoppingCartController} from './Presentation/Controllers/ShoppingCartController';
import {CheckoutController} from './Presentation/Controllers/CheckoutController';
import {OrderController} from './Presentation/Controllers/OrderController';

class ShoppingApplication {
    private app: Application;
    private eventStoreGateway: KurrentDBEventStoreGateway;
    private eventBusGateway: RabbitMQEventBusGateway;
    private projectionGateway: PostgresProjectionGateway;

    constructor() {
        this.app = express();
        this.app.use(express.json());

        // Initialize infrastructure gateways
        this.eventStoreGateway = new KurrentDBEventStoreGateway(
            process.env.EVENTSTORE_CONNECTION_STRING || 'esdb://localhost:2113?tls=false'
        );

        this.eventBusGateway = new RabbitMQEventBusGateway(
            process.env.RABBITMQ_CONNECTION_STRING || 'amqp://localhost'
        );

        this.projectionGateway = new PostgresProjectionGateway({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            database: process.env.POSTGRES_DB || 'shopping',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
        });
    }

    async initialize(): Promise<void> {
        console.log('Initializing Shopping Application...');

        // Connect to RabbitMQ
        await this.eventBusGateway.connect();
        console.log('✓ Connected to RabbitMQ');

        // Initialize Postgres schema
        await this.projectionGateway.initializeSchema();
        console.log('✓ Initialized Postgres schema');

        // Setup dependency injection and controllers
        this.setupControllers();
        console.log('✓ Controllers configured');

        // Setup error handling
        this.setupErrorHandling();
    }

    private setupControllers(): void {
        // Command handlers
        const shoppingCartCommandHandler = new ShoppingCartCommandHandler(
            this.eventStoreGateway,
            this.eventBusGateway
        );

        const checkoutCommandHandler = new CheckoutCommandHandler(
            this.eventStoreGateway,
            this.eventBusGateway
        );

        const orderCommandHandler = new OrderCommandHandler(
            this.eventStoreGateway,
            this.eventBusGateway
        );

        // Query handlers
        const shoppingCartQueryHandler = new ShoppingCartQueryHandler(this.projectionGateway);
        const checkoutQueryHandler = new CheckoutQueryHandler(this.projectionGateway);
        const orderQueryHandler = new OrderQueryHandler(this.projectionGateway);

        // Controllers
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

        // Register routes
        this.app.use('/api', shoppingCartController.getRouter());
        this.app.use('/api', checkoutController.getRouter());
        this.app.use('/api', orderController.getRouter());

        // Health check endpoint
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
            console.log('\nArchitecture:');
            console.log('   ✓ Clean + Vertical Slice Architecture');
            console.log('   ✓ CQRS + Event Sourcing (Emmett patterns)');
            console.log('   ✓ KurrentDB for event store');
            console.log('   ✓ RabbitMQ for event bus');
            console.log('   ✓ Postgres for read model projections\n');
        });
    }

    async shutdown(): Promise<void> {
        console.log('\nShutting down gracefully...');
        await this.eventStoreGateway.close();
        await this.eventBusGateway.close();
        await this.projectionGateway.close();
        console.log('✓ All connections closed');
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

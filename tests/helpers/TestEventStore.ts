import { KurrentDBEventStoreGateway } from '../../src/Infrastructure/EventStore/KurrentDBEventStoreGateway';
import { IEventStore } from '../../src/Application/Gateways/IEventStore';

export class TestEventStore {
    private gateway: KurrentDBEventStoreGateway | null = null;

    async setup(): Promise<IEventStore> {
        // Use environment variable or default to localhost
        const connectionString = process.env.KURRENTDB_CONNECTION_STRING || 
            'kurrentdb://localhost:2113?tls=false';
        
        this.gateway = new KurrentDBEventStoreGateway(connectionString);
        return this.gateway.eventStore;
    }

    async teardown(): Promise<void> {
        if (this.gateway) {
            await this.gateway.close();
            this.gateway = null;
        }
    }

    getEventStore(): IEventStore {
        if (!this.gateway) {
            throw new Error('EventStore not initialized. Call setup() first.');
        }
        return this.gateway.eventStore;
    }
}

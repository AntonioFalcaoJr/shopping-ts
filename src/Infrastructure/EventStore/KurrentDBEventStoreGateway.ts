import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import { getKurrentDBEventStore, KurrentDBEventStore } from '@event-driven-io/emmett-kurrentdb';
import { IEventStore } from '../../Application/Commands/ShoppingCartCommandHandlers';
import {
    AggregateStreamOptions,
    AggregateStreamResultWithGlobalPosition,
    AppendToStreamOptions,
    AppendToStreamResultWithGlobalPosition,
    Event,
    ReadEventMetadataWithGlobalPosition,
} from '@event-driven-io/emmett';

class KurrentDBEventStoreProxy implements IEventStore {
    constructor(private readonly underlyingEventStore: KurrentDBEventStore) {}

    async aggregateStream<State, EventType extends Event, Metadata extends ReadEventMetadataWithGlobalPosition = ReadEventMetadataWithGlobalPosition>(
        streamName: string,
        options: AggregateStreamOptions<State, EventType, Metadata>
    ): Promise<AggregateStreamResultWithGlobalPosition<State>> {
        return this.underlyingEventStore.aggregateStream(streamName, options as any) as Promise<AggregateStreamResultWithGlobalPosition<State>>;
    }

    async appendToStream<EventType extends Event>(
        streamName: string,
        events: EventType[],
        options?: AppendToStreamOptions
    ): Promise<AppendToStreamResultWithGlobalPosition> {
        return this.underlyingEventStore.appendToStream(streamName, events, options);
    }
}

export class KurrentDBEventStoreGateway {
    public readonly client: KurrentDBClient;
    private internalEventStore: KurrentDBEventStore;
    public readonly eventStore: IEventStore;

    constructor(connectionString: string) {
        this.client = KurrentDBClient.connectionString(connectionString);
        this.internalEventStore = getKurrentDBEventStore(this.client);
        
        this.eventStore = new KurrentDBEventStoreProxy(this.internalEventStore);
    }

    async close(): Promise<void> {
        await this.client.dispose();
    }
}

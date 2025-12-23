import {
    AggregateStreamOptions,
    AggregateStreamResultWithGlobalPosition,
    AppendToStreamOptions,
    AppendToStreamResultWithGlobalPosition,
    Event,
    ReadEventMetadataWithGlobalPosition,
} from '@event-driven-io/emmett';

export interface IEventStore {
    aggregateStream<State, EventType extends Event, Metadata extends ReadEventMetadataWithGlobalPosition = ReadEventMetadataWithGlobalPosition>(
        streamName: string,
        options: AggregateStreamOptions<State, EventType, Metadata>
    ): Promise<AggregateStreamResultWithGlobalPosition<State>>;
    
    appendToStream<EventType extends Event>(
        streamName: string,
        events: EventType[],
        options?: AppendToStreamOptions
    ): Promise<AppendToStreamResultWithGlobalPosition>;
}

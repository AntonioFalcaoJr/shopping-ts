import {
  ExpectedVersionConflictError,
  NO_CONCURRENCY_CHECK,
  STREAM_DOES_NOT_EXIST,
  STREAM_EXISTS,
  assertExpectedVersionMatchesCurrent,
  type AggregateStreamOptions,
  type AggregateStreamResultWithGlobalPosition,
  type AnyMessage,
  type AppendToStreamOptions,
  type AppendToStreamResultWithGlobalPosition,
  type Event,
  type EventStore,
  type ExpectedStreamVersion,
  type ReadEvent,
  type ReadEventMetadataWithGlobalPosition,
  type ReadStreamOptions,
  type ReadStreamResult,
  type RecordedMessage,
} from '@event-driven-io/emmett';
import {
  ANY,
  STREAM_EXISTS as KURRENT_DB_STREAM_EXISTS,
  KurrentDBClient,
  NO_STREAM,
  StreamNotFoundError,
  WrongExpectedVersionError,
  jsonEvent,
  type AppendStreamState,
  type ReadStreamOptions as ESDBReadStreamOptions,
  type ResolvedEvent,
} from '@kurrent/kurrentdb-client';
import {
  $all,
  kurrentDBEventStoreConsumer,
  type KurrentDBEventStoreConsumer,
  type KurrentDBEventStoreConsumerConfig,
  type KurrentDBEventStoreConsumerType,
} from './consumers';

const toKurrentDBReadOptions = (
  options: ReadStreamOptions | undefined,
): ESDBReadStreamOptions | undefined => {
  return options
    ? {
        fromRevision: 'from' in options ? options.from : undefined,
        maxCount:
          'maxCount' in options
            ? options.maxCount
            : 'to' in options
              ? options.to
              : undefined,
      }
    : undefined;
};

export const KurrentDBEventStoreDefaultStreamVersion = -1n;

export type KurrentDBReadEventMetadata = ReadEventMetadataWithGlobalPosition;

export type KurrentDBReadEvent<EventType extends Event = Event> = ReadEvent<
  EventType,
  KurrentDBReadEventMetadata
>;

export interface KurrentDBEventStore extends EventStore<KurrentDBReadEventMetadata> {
  appendToStream<EventType extends Event>(
    streamName: string,
    events: EventType[],
    options?: AppendToStreamOptions,
  ): Promise<AppendToStreamResultWithGlobalPosition>;
  consumer<ConsumerEventType extends Event = Event>(
    options?: KurrentDBEventStoreConsumerConfig<ConsumerEventType>,
  ): KurrentDBEventStoreConsumer<ConsumerEventType>;
}

export const getKurrentDBEventStore = (
  eventStore: KurrentDBClient,
): KurrentDBEventStore => {
  return {
    async aggregateStream<State, EventType extends Event>(
      streamName: string,
      options: AggregateStreamOptions<
        State,
        EventType,
        KurrentDBReadEventMetadata
      >,
    ): Promise<AggregateStreamResultWithGlobalPosition<State>> {
      const { evolve, initialState, read } = options;

      const expectedStreamVersion = read?.expectedStreamVersion;

      let state = initialState();
      let currentStreamVersion: bigint =
        KurrentDBEventStoreDefaultStreamVersion;
      let lastEventGlobalPosition: bigint | undefined = undefined;

      try {
        for await (const resolvedEvent of eventStore.readStream<EventType>(
          streamName,
          toKurrentDBReadOptions(options.read),
        )) {
          const { event } = resolvedEvent;
          if (!event) continue;

          state = evolve(state, mapFromKurrentDBEvent<EventType>(resolvedEvent));
          currentStreamVersion = event.revision;
          lastEventGlobalPosition = event.position?.commit;
        }

        assertExpectedVersionMatchesCurrent(
          currentStreamVersion,
          expectedStreamVersion,
          KurrentDBEventStoreDefaultStreamVersion,
        );

        return lastEventGlobalPosition
          ? {
              currentStreamVersion,
              lastEventGlobalPosition,
              state,
              streamExists: true,
            }
          : {
              currentStreamVersion,
              state,
              streamExists: false,
            };
      } catch (error) {
        if (error instanceof StreamNotFoundError) {
          return {
            currentStreamVersion,
            state,
            streamExists: false,
          };
        }

        throw error;
      }
    },

    readStream: async <EventType extends Event>(
      streamName: string,
      options?: ReadStreamOptions,
    ): Promise<ReadStreamResult<EventType, KurrentDBReadEventMetadata>> => {
      const events: ReadEvent<EventType, KurrentDBReadEventMetadata>[] = [];

      let currentStreamVersion: bigint =
        KurrentDBEventStoreDefaultStreamVersion;

      try {
        for await (const resolvedEvent of eventStore.readStream<EventType>(
          streamName,
          toKurrentDBReadOptions(options),
        )) {
          const { event } = resolvedEvent;
          if (!event) continue;
          events.push(mapFromKurrentDBEvent(resolvedEvent));
          currentStreamVersion = event.revision;
        }
        return {
          currentStreamVersion,
          events,
          streamExists: true,
        };
      } catch (error) {
        if (error instanceof StreamNotFoundError) {
          return {
            currentStreamVersion,
            events: [],
            streamExists: false,
          };
        }

        throw error;
      }
    },

    appendToStream: async <EventType extends Event>(
      streamName: string,
      events: EventType[],
      options?: AppendToStreamOptions,
    ): Promise<AppendToStreamResultWithGlobalPosition> => {
      try {
        const serializedEvents = events.map(jsonEvent);

        const expectedRevision = toExpectedRevision(
          options?.expectedStreamVersion,
        );

        const appendResult = await eventStore.appendToStream(
          streamName,
          serializedEvents,
          {
            streamState: expectedRevision,
          },
        );

        return {
          nextExpectedStreamVersion: appendResult.nextExpectedRevision,
          lastEventGlobalPosition: appendResult.position!.commit,
          createdNewStream:
            appendResult.nextExpectedRevision >=
            BigInt(serializedEvents.length),
        };
      } catch (error) {
        if (error instanceof WrongExpectedVersionError) {
          throw new ExpectedVersionConflictError(
            error.actualState,
            toExpectedVersion(error.expectedState),
          );
        }

        throw error;
      }
    },

    consumer: <ConsumerEventType extends Event = Event>(
      options?: KurrentDBEventStoreConsumerConfig<ConsumerEventType>,
    ): KurrentDBEventStoreConsumer<ConsumerEventType> =>
      kurrentDBEventStoreConsumer<ConsumerEventType>({
        ...(options ?? {}),
        client: eventStore,
      }),

    //streamEvents: streamEvents(eventStore),
  };
};

const getCheckpoint = <MessageType extends AnyMessage = AnyMessage>(
  resolvedEvent: ResolvedEvent<MessageType>,
  from?: KurrentDBEventStoreConsumerType,
): bigint => {
  return !from || from?.stream === $all
    ? (resolvedEvent.link?.position?.commit ??
        resolvedEvent.event?.position?.commit)!
    : (resolvedEvent.link?.revision ?? resolvedEvent.event!.revision);
};

export const mapFromKurrentDBEvent = <MessageType extends AnyMessage = AnyMessage>(
  resolvedEvent: ResolvedEvent<MessageType>,
  from?: KurrentDBEventStoreConsumerType,
): RecordedMessage<MessageType, KurrentDBReadEventMetadata> => {
  const event = resolvedEvent.event!;
  return <RecordedMessage<MessageType, KurrentDBReadEventMetadata>>{
    type: event.type,
    data: event.data,
    metadata: {
      ...((event.metadata as KurrentDBReadEventMetadata) ??
        ({} as KurrentDBReadEventMetadata)),
      eventId: event.id,
      streamName: event.streamId,
      streamPosition: event.revision,
      globalPosition: event.position!.commit,
      checkpoint: getCheckpoint(resolvedEvent, from),
    },
  };
};

const toExpectedRevision = (
  expected: ExpectedStreamVersion | undefined,
): AppendStreamState => {
  if (expected === undefined) return ANY;

  if (expected === NO_CONCURRENCY_CHECK) return ANY;

  if (expected == STREAM_DOES_NOT_EXIST) return NO_STREAM;

  if (expected == STREAM_EXISTS) return KURRENT_DB_STREAM_EXISTS;

  return expected as bigint;
};

const toExpectedVersion = (
  expected: AppendStreamState | undefined,
): ExpectedStreamVersion => {
  if (expected === undefined) return NO_CONCURRENCY_CHECK;

  if (expected === ANY) return NO_CONCURRENCY_CHECK;

  if (expected == NO_STREAM) return STREAM_DOES_NOT_EXIST;

  if (expected == KURRENT_DB_STREAM_EXISTS) return STREAM_EXISTS;

  return expected;
};

// const { map } = streamTransformations;
//
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// const convertToWebReadableStream = (
//   allStreamSubscription: AllStreamSubscription,
// ): ReadableStream<AllStreamResolvedEvent | GlobalStreamCaughtUp> => {
//   // Validate the input type
//   if (!(allStreamSubscription instanceof Readable)) {
//     throw new Error('Provided stream is not a Node.js Readable stream.');
//   }

//   let globalPosition = 0n;

//   const stream = Readable.toWeb(
//     allStreamSubscription,
//   ) as ReadableStream<AllStreamResolvedEvent>;

//   const writable = new WritableStream<
//     AllStreamResolvedEvent | GlobalStreamCaughtUp
//   >();

//   allStreamSubscription.on('caughtUp', async () => {
//     console.log(globalPosition);
//     await writable.getWriter().write(globalStreamCaughtUp({ globalPosition }));
//   });

//   const transform = map<
//     AllStreamResolvedEvent,
//     AllStreamResolvedEvent | GlobalStreamCaughtUp
//   >((event) => {
//     if (event?.event?.position.commit)
//       globalPosition = event.event?.position.commit;

//     return event;
//   });

//   return stream.pipeThrough<AllStreamResolvedEvent | GlobalStreamCaughtUp>(
//     transform,
//   );
// };

// const streamEvents = (eventStore: KurrentDBClient) => () => {
//   return restream<
//     AllStreamResolvedEvent | GlobalSubscriptionEvent,
//     | ReadEvent<Event, KurrentDBReadEventMetadata>
//     | GlobalSubscriptionEvent
//   >(
//     (): ReadableStream<AllStreamResolvedEvent | GlobalSubscriptionEvent> =>
//       convertToWebReadableStream(
//         eventStore.subscribeToAll({
//           fromPosition: START,
//           filter: excludeSystemEvents(),
//         }),
//       ),
//     (
//       resolvedEvent: AllStreamResolvedEvent | GlobalSubscriptionEvent,
//     ): ReadEvent<Event, KurrentDBReadEventMetadata> =>
//       mapFromKurrentDBEvent(resolvedEvent.event as JSONRecordedEvent<Event>),
//   );
// };

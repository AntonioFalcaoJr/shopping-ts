import {
  EmmettError,
  inMemoryProjector,
  inMemoryReactor,
  MessageProcessor,
  type AnyEvent,
  type AnyMessage,
  type AnyRecordedMessageMetadata,
  type AsyncRetryOptions,
  type BatchRecordedMessageHandlerWithoutContext,
  type DefaultRecord,
  type InMemoryProcessor,
  type InMemoryProjectorOptions,
  type InMemoryReactorOptions,
  type Message,
  type MessageConsumer,
  type MessageConsumerOptions,
} from '@event-driven-io/emmett';
import {
  KurrentDBClient,
  type SubscribeToAllOptions,
  type SubscribeToStreamOptions,
} from '@kurrent/kurrentdb-client';
import { v7 as uuid } from 'uuid';
import type { KurrentDBReadEventMetadata } from '../kurrentDBEventStore';
import {
  DefaultKurrentDBEventStoreProcessorBatchSize,
  kurrentDBSubscription,
  zipKurrentDBEventStoreMessageBatchPullerStartFrom,
  type KurrentDBSubscription,
} from './subscriptions';

export type KurrentDBEventStoreConsumerConfig<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ConsumerMessageType extends Message = any,
> = MessageConsumerOptions<ConsumerMessageType> & {
  from?: KurrentDBEventStoreConsumerType;
  pulling?: {
    batchSize?: number;
  };
  resilience?: {
    resubscribeOptions?: AsyncRetryOptions;
  };
};

export type KurrentDBEventStoreConsumerOptions<
  ConsumerEventType extends Message = Message,
> = KurrentDBEventStoreConsumerConfig<ConsumerEventType> &
  (
    | {
        connectionString: string;
        client?: never;
      }
    | { client: KurrentDBClient; connectionString?: never }
  );

export type $all = '$all';
export const $all = '$all';

export type KurrentDBEventStoreConsumerType =
  | {
      stream: $all;
      options?: Exclude<SubscribeToAllOptions, 'fromPosition'>;
    }
  | {
      stream: string;
      options?: Exclude<SubscribeToStreamOptions, 'fromRevision'>;
    };

export type KurrentDBEventStoreConsumer<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ConsumerMessageType extends AnyMessage = any,
> = MessageConsumer<ConsumerMessageType> &
  Readonly<{
    reactor: <MessageType extends AnyMessage = ConsumerMessageType>(
      options: InMemoryReactorOptions<MessageType>,
    ) => InMemoryProcessor<MessageType>;
  }> &
  (AnyEvent extends ConsumerMessageType
    ? Readonly<{
        projector: <
          EventType extends AnyEvent = ConsumerMessageType & AnyEvent,
        >(
          options: InMemoryProjectorOptions<EventType>,
        ) => InMemoryProcessor<EventType>;
      }>
    : object);

export const kurrentDBEventStoreConsumer = <
  ConsumerMessageType extends Message = AnyMessage,
>(
  options: KurrentDBEventStoreConsumerOptions<ConsumerMessageType>,
): KurrentDBEventStoreConsumer<ConsumerMessageType> => {
  let isRunning = false;
  const { pulling } = options;
  const processors = options.processors ?? [];

  let start: Promise<void>;

  let currentSubscription: KurrentDBSubscription | undefined;

  const client =
    'client' in options && options.client
      ? options.client
      : KurrentDBClient.connectionString(options.connectionString);

  const eachBatch: BatchRecordedMessageHandlerWithoutContext<
    ConsumerMessageType,
    KurrentDBReadEventMetadata
  > = async (messagesBatch) => {
    const activeProcessors = processors.filter((s) => s.isActive);

    if (activeProcessors.length === 0)
      return {
        type: 'STOP',
        reason: 'No active processors',
      };

    const result = await Promise.allSettled(
      activeProcessors.map(async (s) => {
        // TODO: Add here filtering to only pass messages that can be handled by
        return await s.handle(messagesBatch, { client });
      }),
    );

    const error = result.find((r) => r.status === 'rejected')?.reason as
      | Error
      | undefined;

    return result.some(
      (r) => r.status === 'fulfilled' && r.value?.type !== 'STOP',
    )
      ? undefined
      : {
          type: 'STOP',
          error: error ? EmmettError.mapFrom(error) : undefined,
        };
  };

  const subscription = (currentSubscription = kurrentDBSubscription({
    client,
    from: options.from,
    eachBatch,
    batchSize:
      pulling?.batchSize ?? DefaultKurrentDBEventStoreProcessorBatchSize,
    resilience: options.resilience,
  }));

  const stop = async () => {
    if (!isRunning) return;
    isRunning = false;
    if (currentSubscription) {
      await currentSubscription.stop();
      currentSubscription = undefined;
    }
    await start;
  };

  return {
    consumerId: options.consumerId ?? uuid(),
    get isRunning() {
      return isRunning;
    },
    processors,
    reactor: <MessageType extends AnyMessage = ConsumerMessageType>(
      options: InMemoryReactorOptions<MessageType>,
    ): InMemoryProcessor<MessageType> => {
      const processor = inMemoryReactor(options);

      processors.push(
        // TODO: change that
        processor as unknown as MessageProcessor<
          ConsumerMessageType,
          AnyRecordedMessageMetadata,
          DefaultRecord
        >,
      );

      return processor;
    },
    projector: <EventType extends AnyEvent = ConsumerMessageType & AnyEvent>(
      options: InMemoryProjectorOptions<EventType>,
    ): InMemoryProcessor<EventType> => {
      const processor = inMemoryProjector(options);

      processors.push(
        // TODO: change that
        processor as unknown as MessageProcessor<
          ConsumerMessageType,
          AnyRecordedMessageMetadata,
          DefaultRecord
        >,
      );

      return processor;
    },
    start: () => {
      if (isRunning) return start;

      start = (async () => {
        if (processors.length === 0)
          return Promise.reject(
            new EmmettError(
              'Cannot start consumer without at least a single processor',
            ),
          );

        isRunning = true;

        const startFrom = zipKurrentDBEventStoreMessageBatchPullerStartFrom(
          await Promise.all(processors.map((o) => o.start(client))),
        );

        return subscription.start({ startFrom });
      })();

      return start;
    },
    stop,
    close: stop,
  };
};

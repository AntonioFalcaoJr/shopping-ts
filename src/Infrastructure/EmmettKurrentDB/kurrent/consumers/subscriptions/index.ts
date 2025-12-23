import {
  asyncRetry,
  getCheckpoint,
  isBigint,
  JSONParser,
  type AnyMessage,
  type AsyncRetryOptions,
  type BatchRecordedMessageHandlerWithoutContext,
  type EmmettError,
  type Message,
  type MessageHandlerResult,
} from '@event-driven-io/emmett';
import {
  END,
  KurrentDBClient,
  excludeSystemEvents,
  START,
  type ResolvedEvent,
  type StreamSubscription,
} from '@kurrent/kurrentdb-client';
import { pipeline, Transform, Writable, type WritableOptions } from 'stream';
import {
  mapFromKurrentDBEvent,
  type KurrentDBReadEventMetadata,
} from '../../kurrentDBEventStore';
import {
  $all,
  type KurrentDBEventStoreConsumerType,
} from '../kurrentDBEventStoreConsumer';

export const DefaultKurrentDBEventStoreProcessorBatchSize = 100;
export const DefaultKurrentDBEventStoreProcessorPullingFrequencyInMs = 50;

export type KurrentDBEventStoreMessagesBatchHandlerResult = void | {
  type: 'STOP';
  reason?: string;
  error?: EmmettError;
};

export type KurrentDBSubscriptionOptions<
  MessageType extends Message = Message,
> = {
  from?: KurrentDBEventStoreConsumerType;
  client: KurrentDBClient;
  batchSize: number;
  eachBatch: BatchRecordedMessageHandlerWithoutContext<
    MessageType,
    KurrentDBReadEventMetadata
  >;
  resilience?: {
    resubscribeOptions?: AsyncRetryOptions;
  };
};

export type KurrentDBSubscriptionStartFrom =
  | { lastCheckpoint: bigint }
  | 'BEGINNING'
  | 'END';

export type KurrentDBSubscriptionStartOptions = {
  startFrom: KurrentDBSubscriptionStartFrom;
};

export type KurrentDBSubscription = {
  isRunning: boolean;
  start(options: KurrentDBSubscriptionStartOptions): Promise<void>;
  stop(): Promise<void>;
};

const toGlobalPosition = (startFrom: KurrentDBSubscriptionStartFrom) =>
  startFrom === 'BEGINNING'
    ? START
    : startFrom === 'END'
      ? END
      : {
          prepare: startFrom.lastCheckpoint,
          commit: startFrom.lastCheckpoint,
        };

const toStreamPosition = (startFrom: KurrentDBSubscriptionStartFrom) =>
  startFrom === 'BEGINNING'
    ? START
    : startFrom === 'END'
      ? END
      : startFrom.lastCheckpoint;

const subscribe = (
  client: KurrentDBClient,
  from: KurrentDBEventStoreConsumerType | undefined,
  options: KurrentDBSubscriptionStartOptions,
) =>
  from == undefined || from.stream == $all
    ? client.subscribeToAll({
        ...(from?.options ?? {}),
        fromPosition: toGlobalPosition(options.startFrom),
        filter: excludeSystemEvents(),
      })
    : client.subscribeToStream(from.stream, {
        ...(from.options ?? {}),
        fromRevision: toStreamPosition(options.startFrom),
      });

export const isDatabaseUnavailableError = (error: unknown) =>
  error instanceof Error &&
  'type' in error &&
  error.type === 'unavailable' &&
  'code' in error &&
  error.code === 14;

export const KurrentDBResubscribeDefaultOptions: AsyncRetryOptions = {
  forever: true,
  minTimeout: 100,
  factor: 1.5,
  shouldRetryError: (error) => !isDatabaseUnavailableError(error),
};

type SubscriptionSequentialHandlerOptions<
  MessageType extends AnyMessage = AnyMessage,
> = KurrentDBSubscriptionOptions<MessageType> & WritableOptions;

class SubscriptionSequentialHandler<
  MessageType extends AnyMessage = AnyMessage,
> extends Transform {
  private options: SubscriptionSequentialHandlerOptions<MessageType>;
  private from: KurrentDBEventStoreConsumerType | undefined;
  public isRunning: boolean;

  constructor(options: SubscriptionSequentialHandlerOptions<MessageType>) {
    super({ objectMode: true, ...options });
    this.options = options;
    this.from = options.from;
    this.isRunning = true;
  }

  async _transform(
    resolvedEvent: ResolvedEvent<MessageType>,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): Promise<void> {
    try {
      if (!this.isRunning || !resolvedEvent.event) {
        callback();
        return;
      }

      const message = mapFromKurrentDBEvent(resolvedEvent, this.from);
      const messageCheckpoint = getCheckpoint(message);

      const result = await this.options.eachBatch([message]);

      if (result && result.type === 'STOP') {
        this.isRunning = false;
        if (!result.error) this.push(messageCheckpoint);

        this.push(result);
        this.push(null);
        callback();
        return;
      }

      this.push(messageCheckpoint);
      callback();
    } catch (error) {
      callback(error as Error);
    }
  }
}

export const kurrentDBSubscription = <
  MessageType extends AnyMessage = AnyMessage,
>({
  client,
  from,
  batchSize,
  eachBatch,
  resilience,
}: KurrentDBSubscriptionOptions<MessageType>): KurrentDBSubscription => {
  let isRunning = false;

  let start: Promise<void>;
  let processor: SubscriptionSequentialHandler<MessageType>;

  let subscription: StreamSubscription<MessageType>;

  const resubscribeOptions: AsyncRetryOptions =
    resilience?.resubscribeOptions ?? {
      ...KurrentDBResubscribeDefaultOptions,
      shouldRetryResult: () => isRunning,
      shouldRetryError: (error) =>
        isRunning &&
        KurrentDBResubscribeDefaultOptions.shouldRetryError!(error),
    };

  const stopSubscription = (callback?: () => void): Promise<void> => {
    isRunning = false;
    if (processor) processor.isRunning = false;
    return subscription
      .unsubscribe()
      .then(() => {
        subscription.destroy();
      })
      .catch((err) => console.error('Error during unsubscribe.%s', err))
      .finally(callback ?? (() => {}));
  };

  const pipeMessages = (options: KurrentDBSubscriptionStartOptions) => {
    let retry = 0;
    return asyncRetry(
      () =>
        new Promise<void>((resolve, reject) => {
          if (!isRunning) {
            resolve();
            return;
          }
          console.info(
            `Starting subscription. ${retry++} retries. From: ${JSONParser.stringify(from ?? '$all')}, Start from: ${JSONParser.stringify(
              options.startFrom,
            )}`,
          );
          subscription = subscribe(client, from, options);

          processor = new SubscriptionSequentialHandler({
            client,
            from,
            batchSize,
            eachBatch,
            resilience,
          });

          const handler = new (class extends Writable {
            async _write(
              result: bigint | MessageHandlerResult,
              _encoding: string,
              done: () => void,
            ) {
              if (!isRunning) return;

              if (isBigint(result)) {
                options.startFrom = {
                  lastCheckpoint: result,
                };
                done();
                return;
              }

              if (result && result.type === 'STOP' && result.error) {
                console.error(
                  `Subscription stopped with error code: ${result.error.errorCode}, message: ${
                    result.error.message
                  }.`,
                );
              }

              await stopSubscription();
              done();
            }
          })({ objectMode: true });

          pipeline(
            subscription,
            processor,
            handler,
            async (error: Error | null) => {
              console.info(`Stopping subscription.`);
              await stopSubscription(() => {
                if (!error) {
                  console.info('Subscription ended successfully.');
                  resolve();
                  return;
                }
                console.error(
                  `Received error: ${JSONParser.stringify(error)}.`,
                );
                reject(error);
              });
            },
          );
        }),
      resubscribeOptions,
    );
  };

  return {
    get isRunning() {
      return isRunning;
    },
    start: (options) => {
      if (isRunning) return start;

      start = (async () => {
        isRunning = true;

        return pipeMessages(options);
      })();

      return start;
    },
    stop: async () => {
      if (!isRunning) return start ? await start : Promise.resolve();
      await stopSubscription();
      await start;
    },
  };
};

export const zipKurrentDBEventStoreMessageBatchPullerStartFrom = (
  options: (KurrentDBSubscriptionStartFrom | undefined)[],
): KurrentDBSubscriptionStartFrom => {
  if (
    options.length === 0 ||
    options.some((o) => o === undefined || o === 'BEGINNING')
  )
    return 'BEGINNING';

  if (options.every((o) => o === 'END')) return 'END';

  return options
    .filter((o) => o !== undefined && o !== 'BEGINNING' && o !== 'END')
    .sort((a, b) => (a > b ? 1 : -1))[0]!;
};

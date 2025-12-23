import { InProcessLock } from '@event-driven-io/emmett';
import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import {
  AbstractStartedContainer,
  GenericContainer,
  Wait,
  type StartedTestContainer,
} from 'testcontainers';
import type { Environment } from 'testcontainers/build/types';

export const KURRENTDB_PORT = 2113;
export const KURRENTDB_IMAGE_NAME = 'kurrentplatform/kurrentdb';
export const KURRENTDB_IMAGE_TAG = 'latest';
export const KURRENTDB_ARM64_IMAGE_TAG = 'latest';

export const KURRENTDB_DEFAULT_IMAGE = `${KURRENTDB_IMAGE_NAME}:${process.arch !== 'arm64' ? KURRENTDB_IMAGE_TAG : KURRENTDB_ARM64_IMAGE_TAG}`;

export type KurrentDBContainerOptions = {
  disableProjections?: boolean;
  isSecure?: boolean;
  useFileStorage?: boolean;
  withReuse?: boolean;
};

export const defaultKurrentDBContainerOptions: KurrentDBContainerOptions = {
  disableProjections: false,
  isSecure: false,
  useFileStorage: false,
  withReuse: false,
};

export class KurrentDBContainer extends GenericContainer {
  constructor(
    image = KURRENTDB_DEFAULT_IMAGE,
    options: KurrentDBContainerOptions = defaultKurrentDBContainerOptions,
  ) {
    super(image);

    const environment: Environment = {
      ...(!options.disableProjections
        ? {
            EVENTSTORE_RUN_PROJECTIONS: 'ALL',
          }
        : {}),
      ...(!options.isSecure
        ? {
            EVENTSTORE_INSECURE: 'true',
          }
        : {}),
      ...(options.useFileStorage
        ? {
            EVENTSTORE_MEM_DB: 'false',
            EVENTSTORE_DB: '/data/integration-tests',
          }
        : {}),
      EVENTSTORE_CLUSTER_SIZE: '1',
      EVENTSTORE_START_STANDARD_PROJECTIONS: 'true',
      EVENTSTORE_NODE_PORT: `${KURRENTDB_PORT}`,
      EVENTSTORE_ENABLE_ATOM_PUB_OVER_HTTP: 'true',
    };

    this.withEnvironment(environment).withExposedPorts(KURRENTDB_PORT);

    if (options.withReuse) this.withReuse();

    this.withWaitStrategy(
      Wait.forAll([Wait.forHealthCheck(), Wait.forListeningPorts()]),
    );
  }

  async start(): Promise<StartedKurrentDBContainer> {
    return new StartedKurrentDBContainer(await super.start());
  }
}

export class StartedKurrentDBContainer extends AbstractStartedContainer {
  constructor(container: StartedTestContainer) {
    super(container);
  }

  getConnectionString(): string {
    return `kurrentdb://${this.getHost()}:${this.getMappedPort(2113)}?tls=false`;
  }

  getClient(): KurrentDBClient {
    return KurrentDBClient.connectionString(this.getConnectionString());
  }
}

let container: KurrentDBContainer | null = null;
let startedContainer: StartedKurrentDBContainer | null = null;
let startedCount = 0;
const lock = InProcessLock();

export const getSharedKurrentDBTestContainer = () =>
  lock.withAcquire(
    async () => {
      if (startedContainer) return startedContainer;

      if (!container)
        container = new KurrentDBContainer(KURRENTDB_DEFAULT_IMAGE);

      startedContainer = await container.start();
      startedCount++;

      container.withLogConsumer((stream) =>
        stream
          .on('data', (line) => console.log(line))
          .on('err', (line) => console.error(line))
          .on('end', () => console.log('Stream closed')),
      );

      return startedContainer;
    },
    { lockId: 'SharedKurrentDBTestContainer' },
  );

export const getSharedTestKurrentDBClient = async () => {
  return (await getSharedKurrentDBTestContainer()).getClient();
};

export const releaseSharedKurrentDBTestContainer = () =>
  lock.withAcquire(
    async () => {
      const containerToStop = startedContainer;
      if (containerToStop && --startedCount === 0) {
        try {
          startedContainer = null;
          container = null;
          await containerToStop.stop();
        } catch {
          /* do nothing */
        }
      }
    },
    { lockId: 'SharedKurrentDBTestContainer' },
  );

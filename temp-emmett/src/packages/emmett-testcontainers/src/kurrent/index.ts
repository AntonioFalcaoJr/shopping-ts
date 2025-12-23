import { KurrentDBClient } from '@kurrent/kurrentdb-client';
import {
  KurrentDBContainer,
  StartedKurrentDBContainer,
} from './kurrentDBContainer';

export * from './kurrentDBContainer';

let kurrentContainer: StartedKurrentDBContainer;

export const getKurrentDBTestClient = async (
  useTestContainers = false,
): Promise<KurrentDBClient> => {
  let connectionString;

  if (useTestContainers) {
    if (!kurrentContainer)
      kurrentContainer = await new KurrentDBContainer().start();

    connectionString = kurrentContainer.getConnectionString();
  } else {
    // await compose.upAll();
    connectionString = 'kurrentdb://localhost:2113?tls=false';
  }

  return KurrentDBClient.connectionString(connectionString);
};

import { assertOk } from '@event-driven-io/emmett';
import { jsonEvent } from '@kurrent/kurrentdb-client';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';
import {
  KurrentDBContainer,
  getSharedKurrentDBTestContainer,
  releaseSharedKurrentDBTestContainer,
} from './kurrentDBContainer';

void describe('KurrentDBContainer', () => {
  void it('should connect to KurrentDB and append new event', async () => {
    const container = await new KurrentDBContainer().start();

    try {
      const client = container.getClient();

      const result = await client.appendToStream(
        `test-${randomUUID()}`,
        jsonEvent({ type: 'test-event', data: { test: 'test' } }),
      );

      assertOk(result.success);
    } finally {
      await container.stop();
    }
  });

  void it('should connect to shared KurrentDB and append new event', async () => {
    const container = await getSharedKurrentDBTestContainer();

    try {
      const client = container.getClient();

      const result = await client.appendToStream(
        `test-${randomUUID()}`,
        jsonEvent({ type: 'test-event', data: { test: 'test' } }),
      );

      assertOk(result.success);
    } finally {
      await releaseSharedKurrentDBTestContainer();
    }
  });

  void it('should connect to multiple shared KurrentDB and append new event', async () => {
    const containers = [
      await getSharedKurrentDBTestContainer(),
      await getSharedKurrentDBTestContainer(),
      await getSharedKurrentDBTestContainer(),
    ];

    try {
      const container = containers[0]!;
      const client = container.getClient();

      const result = await client.appendToStream(
        `test-${randomUUID()}`,
        jsonEvent({ type: 'test-event', data: { test: 'test' } }),
      );

      assertOk(result.success);
    } finally {
      for (let i = 0; i < containers.length; i++) {
        await releaseSharedKurrentDBTestContainer();
      }
    }
  });
});

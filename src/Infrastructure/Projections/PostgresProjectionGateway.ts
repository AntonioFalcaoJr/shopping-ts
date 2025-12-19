import {Pool, PoolClient} from 'pg';
import {IProjectionGateway} from '../../Application/Queries/ShoppingCartQueryHandlers';

export class PostgresProjectionGateway implements IProjectionGateway {
    private pool: Pool;

    constructor(connectionConfig: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
    }) {
        this.pool = new Pool(connectionConfig);
    }

    async findById<T>(collectionName: string, id: string): Promise<T | null> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `SELECT data
                 FROM ${collectionName}
                 WHERE id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0].data as T;
        } finally {
            client.release();
        }
    }

    async findAll<T>(collectionName: string): Promise<T[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `SELECT data
                 FROM ${collectionName}
                 ORDER BY updated_at DESC`
            );

            return result.rows.map((row) => row.data as T);
        } finally {
            client.release();
        }
    }

    async findByCustomerId<T>(
        collectionName: string,
        customerId: string
    ): Promise<T[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                `SELECT data
                 FROM ${collectionName}
                 WHERE data ->>'customerId' = $1
                 ORDER BY updated_at DESC`,
                [customerId]
            );

            return result.rows.map((row) => row.data as T);
        } finally {
            client.release();
        }
    }

    async upsert<T>(
        collectionName: string,
        id: string,
        data: T
    ): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(
                `INSERT INTO ${collectionName} (id, data, updated_at)
                 VALUES ($1, $2, NOW()) ON CONFLICT (id)
         DO
                UPDATE SET data = $2, updated_at = NOW()`,
                [id, JSON.stringify(data)]
            );
        } finally {
            client.release();
        }
    }

    async delete(collectionName: string, id: string): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(`DELETE
                                FROM ${collectionName}
                                WHERE id = $1`, [id]);
        } finally {
            client.release();
        }
    }

    async initializeSchema(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS shopping_carts
                (
                    id
                    VARCHAR
                (
                    255
                ) PRIMARY KEY,
                    data JSONB NOT NULL,
                    updated_at TIMESTAMP NOT NULL DEFAULT NOW
                (
                )
                    );

                CREATE INDEX IF NOT EXISTS idx_shopping_carts_customer_id
                    ON shopping_carts ((data ->>'customerId'));

                CREATE TABLE IF NOT EXISTS checkouts
                (
                    id
                    VARCHAR
                (
                    255
                ) PRIMARY KEY,
                    data JSONB NOT NULL,
                    updated_at TIMESTAMP NOT NULL DEFAULT NOW
                (
                )
                    );

                CREATE INDEX IF NOT EXISTS idx_checkouts_customer_id
                    ON checkouts ((data ->>'customerId'));

                CREATE TABLE IF NOT EXISTS orders
                (
                    id
                    VARCHAR
                (
                    255
                ) PRIMARY KEY,
                    data JSONB NOT NULL,
                    updated_at TIMESTAMP NOT NULL DEFAULT NOW
                (
                )
                    );

                CREATE INDEX IF NOT EXISTS idx_orders_customer_id
                    ON orders ((data ->>'customerId'));
            `);
        } finally {
            client.release();
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

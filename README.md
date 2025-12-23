# Shopping Bounded Context

A pragmatic e-commerce Shopping backend demonstrating **Reactive DDD, CQRS, and Event Sourcing** using the [Emmett](https://github.com/event-driven-io/emmett) framework and [KurrentDB](https://www.kurrent.io/).

This project implements a complete shopping flow—from cart management to checkout and order fulfillment—using clean architecture and vertical slice patterns.

## Project Structure & Navigation

- **`src/Domain`**: The "Heart of the Software". Contains **Deciders** (the core business logic), Commands, and Events for `ShoppingCart`, `Checkout`, and `Order`.
- **`src/Application`**: Use cases and orchestration.
    - `Commands/`: Command handlers that coordinate between Domain and Event Store.
    - `Queries/`: Query handlers that fetch data from read models.
    - `Events/`: Side effects (e.g., sending emails) triggered by domain events.
- **`src/Infrastructure`**: Implementation details.
    - `EventStore/`: KurrentDB gateway.
    - `Projections/`: In-memory read models updated via KurrentDB subscriptions.
- **`src/WebApi`**: REST API controllers.

## Getting Started

### Prerequisites
- **Node.js 18+**
- **Docker**

### 1. Spin up Infrastructure
The project requires KurrentDB (EventStoreDB) to run:
```bash
docker-compose up -d
```
Access the dashboard at `http://localhost:2113` (Guest login: `admin`/`changeit`).

### 2. Run the App
```bash
npm install
npm run dev
```
The API will be available at `http://localhost:3000`.

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | API Port |
| `EVENTSTORE_CONNECTION_STRING` | `kurrent://localhost:2113?tls=false` | KurrentDB connection string |

## Testing

- **Unit Tests**: Focus on business logic and state transitions.
  ```bash
  npm test Application
  ```
- **Integration Tests**: Full flows using a real KurrentDB instance.
  ```bash
  npm test integration
  ```

## Developer Helpers

- **`requests.http`**: A comprehensive [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) file. It contains the full flow from starting a cart to order delivery.
- **`docker-compose.yml`**: Provisions the required KurrentDB instance.

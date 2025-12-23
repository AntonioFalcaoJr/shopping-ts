# Testing Strategy

This project uses [Jest](https://jestjs.io/) for testing, covering both isolated logic and full integration flows.

## Test Suites

### Unit Tests
- **Location**: `tests/Application`
- **Focus**: Business rules, side effects, and service logic in isolation.
- **Run**: `npm test Application`

### Integration Tests
- **Location**: `tests/integration`
- **Focus**: End-to-end aggregate lifecycles and cross-aggregate workflows using a real **KurrentDB** instance.
- **Suites**:
    - `ShoppingCart.test.ts`: Cart management lifecycle.
    - `Checkout.test.ts`: Payment methods and checkout completion.
    - `Order.test.ts`: Fulfillment lifecycle (Confirm → Ship → Deliver).
    - `EndToEndWorkflow.test.ts`: Complete flow from Cart to Delivery.
- **Run**: `npm test integration`

## Prerequisites
Integration tests require KurrentDB to be running:
```bash
docker-compose up -d
```

## Infrastructure Helper
- `tests/helpers/TestEventStore.ts`: Manages event store connection lifecycle for tests, ensuring clean state and proper teardown.
- `tests/helpers/TestDataBuilders.ts`: Fluent builders for creating test data (IDs, Money, Address, etc.).

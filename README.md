# Shopping Bounded Context

An e-commerce Shopping bounded context implementation using **Reactive DDD + CQRS + Event Sourcing** with **Clean Architecture** and **Vertical Slice Architecture** principles.

## Architecture Overview

This project combines:
- **Clean Architecture**: Enforcing dependency rules (Domain → Application → Infrastructure → Presentation)
- **Vertical Slice Architecture**: Feature-first organization within each layer
- **CQRS**: Clear separation between Commands (write) and Queries (read)
- **Event Sourcing**: Using Emmett patterns for event-sourced aggregates
- **Reactive DDD**: Event-driven communication via RabbitMQ

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Event Sourcing Framework**: Emmett (by Oskar Dudycz)
- **Event Store**: KurrentDB (formerly EventStoreDB)
- **Event Bus**: RabbitMQ
- **Read Model Store**: PostgreSQL (used as document store)
- **Web Framework**: Express.js

## Project Structure

```
src/
├── Domain/                          # Domain Layer (Core Business Logic)
│   ├── ValueObjects/                # Value Objects
│   │   ├── ProductId.ts
│   │   ├── Money.ts
│   │   ├── Quantity.ts
│   │   ├── Ids.ts                   # CartId, CheckoutId, OrderId, CustomerId
│   │   └── PaymentMethod.ts         # PaymentMethod, CouponCode, GiftCardCode
│   ├── ShoppingCart/                # ShoppingCart Aggregate
│   │   ├── ShoppingCartEvents.ts    # Domain Events
│   │   ├── ShoppingCartCommands.ts  # Commands
│   │   └── ShoppingCartDecider.ts   # Aggregate Logic (decide + evolve)
│   ├── Checkout/                    # Checkout Aggregate
│   │   ├── CheckoutEvents.ts
│   │   ├── CheckoutCommands.ts
│   │   └── CheckoutDecider.ts
│   └── Order/                       # Order Aggregate
│       ├── OrderEvents.ts
│       ├── OrderCommands.ts
│       └── OrderDecider.ts
│
├── Application/                     # Application Layer (Use Cases)
│   ├── Commands/                    # Command Handlers (Write Side)
│   │   ├── ShoppingCartCommandHandlers.ts
│   │   ├── CheckoutCommandHandlers.ts
│   │   └── OrderCommandHandlers.ts
│   └── Queries/                     # Query Handlers (Read Side)
│       ├── ShoppingCartQueryHandlers.ts
│       ├── CheckoutQueryHandlers.ts
│       └── OrderQueryHandlers.ts
│
├── Infrastructure/                  # Infrastructure Layer (Technical Concerns)
│   ├── EventStore/                  # Event Store Gateway
│   │   └── KurrentDBEventStoreGateway.ts
│   ├── EventBus/                    # Event Bus Gateway
│   │   └── RabbitMQEventBusGateway.ts
│   └── Projections/                 # Read Model Projections
│       ├── PostgresProjectionGateway.ts
│       ├── ShoppingCartProjection.ts
│       ├── CheckoutProjection.ts
│       └── OrderProjection.ts
│
├── Presentation/                    # Presentation Layer (API)
│   └── Controllers/                 # REST API Controllers
│       ├── ShoppingCartController.ts
│       ├── CheckoutController.ts
│       └── OrderController.ts
│
└── index.ts                         # Application Entry Point
```

## Domain Model

### Aggregate Roots

#### 1. ShoppingCart
**Purpose**: Manages the shopping cart lifecycle and item operations.

**Commands**:
- `StartShopping` - Initialize a new shopping cart
- `AddItemToCart` - Add a product to the cart
- `RemoveItemFromCart` - Remove a product from the cart
- `IncreaseItemQuantity` - Increase quantity of an item
- `DecreaseItemQuantity` - Decrease quantity of an item
- `ClearShoppingCart` - Clear all items from the cart

**Events**:
- `ShoppingStarted`
- `ItemAddedToCart`
- `ItemRemovedFromCart`
- `ItemQuantityIncreased`
- `ItemQuantityDecreased`
- `ShoppingCartCleared`

#### 2. Checkout
**Purpose**: Handles the checkout process including payment methods, coupons, and gift cards.

**Commands**:
- `InitiateCheckout` - Start the checkout process
- `SetPaymentMethod` - Set payment method (credit card, PayPal, etc.)
- `ApplyCoupon` - Apply a discount coupon
- `ApplyGiftCard` - Apply a gift card
- `CompleteCheckout` - Finalize the checkout
- `CancelCheckout` - Cancel the checkout

**Events**:
- `CheckoutInitiated`
- `PaymentMethodSet`
- `CouponApplied`
- `GiftCardApplied`
- `CheckoutCompleted`
- `CheckoutCancelled`

#### 3. Order
**Purpose**: Represents the materialization of a shopping cart into an order.

**Commands**:
- `CreateOrder` - Create an order from a completed checkout
- `ConfirmOrder` - Confirm the order
- `ShipOrder` - Mark order as shipped with tracking number
- `DeliverOrder` - Mark order as delivered
- `CancelOrder` - Cancel the order

**Events**:
- `OrderCreated`
- `OrderConfirmed`
- `OrderShipped`
- `OrderDelivered`
- `OrderCancelled`

### Value Objects

- **ProductId**: Product identifier
- **Money**: Monetary amount with currency
- **Quantity**: Non-negative integer quantity
- **CustomerId, CartId, CheckoutId, OrderId**: Aggregate identifiers
- **PaymentMethod**: Payment method type and details
- **CouponCode**: Discount coupon code
- **GiftCardCode**: Gift card code

## Naming Conventions

### Commands
- Named as imperative verbs: `StartShopping`, `AddItemToCart`, `CreateOrder`
- Located in `{Aggregate}Commands.ts`

### Events
- Named in past tense: `ShoppingStarted`, `ItemAddedToCart`, `OrderCreated`
- Located in `{Aggregate}Events.ts`

### Handlers
- Command handlers: `{Aggregate}CommandHandler`
- Query handlers: `{Aggregate}QueryHandler`

### Gateways (Infrastructure Interfaces)
- `IEventStoreGateway` - Event store operations
- `IEventBusGateway` - Event publishing
- `IProjectionGateway` - Read model persistence

### Projections
- `{Aggregate}Projection` - Event handlers that update read models
- `{Aggregate}ReadModel` - Read model DTOs

## API Endpoints

### ShoppingCart

**Commands (Write)**:
```
POST   /api/carts                                    # Start shopping
POST   /api/carts/:cartId/items                      # Add item
DELETE /api/carts/:cartId/items/:productId           # Remove item
PATCH  /api/carts/:cartId/items/:productId/increase  # Increase quantity
PATCH  /api/carts/:cartId/items/:productId/decrease  # Decrease quantity
DELETE /api/carts/:cartId                            # Clear cart
```

**Queries (Read)**:
```
GET    /api/carts/:cartId                            # Get cart by ID
GET    /api/carts                                    # Get all carts
GET    /api/customers/:customerId/carts              # Get customer's carts
```

### Checkout

**Commands (Write)**:
```
POST   /api/checkouts                                # Initiate checkout
POST   /api/checkouts/:checkoutId/payment-method     # Set payment method
POST   /api/checkouts/:checkoutId/coupons            # Apply coupon
POST   /api/checkouts/:checkoutId/gift-cards         # Apply gift card
POST   /api/checkouts/:checkoutId/complete           # Complete checkout
POST   /api/checkouts/:checkoutId/cancel             # Cancel checkout
```

**Queries (Read)**:
```
GET    /api/checkouts/:checkoutId                    # Get checkout by ID
GET    /api/checkouts                                # Get all checkouts
GET    /api/customers/:customerId/checkouts          # Get customer's checkouts
```

### Order

**Commands (Write)**:
```
POST   /api/orders                                   # Create order
POST   /api/orders/:orderId/confirm                  # Confirm order
POST   /api/orders/:orderId/ship                     # Ship order
POST   /api/orders/:orderId/deliver                  # Deliver order
POST   /api/orders/:orderId/cancel                   # Cancel order
```

**Queries (Read)**:
```
GET    /api/orders/:orderId                          # Get order by ID
GET    /api/orders                                   # Get all orders
GET    /api/customers/:customerId/orders             # Get customer's orders
```

## Setup and Installation

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for infrastructure)

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure Services

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  eventstore:
    image: eventstore/eventstore:latest
    environment:
      - EVENTSTORE_CLUSTER_SIZE=1
      - EVENTSTORE_RUN_PROJECTIONS=All
      - EVENTSTORE_START_STANDARD_PROJECTIONS=true
      - EVENTSTORE_INSECURE=true
    ports:
      - "2113:2113"
      - "1113:1113"

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: shopping
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
```

Start services:

```bash
docker-compose up -d
```

### 3. Configure Environment

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

### 4. Build and Run

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run in production mode
npm start
```

The API will be available at `http://localhost:3000`.

## Example Usage

### 1. Start Shopping

```bash
curl -X POST http://localhost:3000/api/carts \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "cart-123",
    "customerId": "customer-456"
  }'
```

### 2. Add Item to Cart

```bash
curl -X POST http://localhost:3000/api/carts/cart-123/items \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-789",
    "quantity": 2,
    "unitPrice": {
      "amount": 29.99,
      "currency": "USD"
    }
  }'
```

### 3. Get Shopping Cart

```bash
curl http://localhost:3000/api/carts/cart-123
```

### 4. Initiate Checkout

```bash
curl -X POST http://localhost:3000/api/checkouts \
  -H "Content-Type: application/json" \
  -d '{
    "checkoutId": "checkout-001",
    "cartId": "cart-123",
    "customerId": "customer-456",
    "totalAmount": {
      "amount": 59.98,
      "currency": "USD"
    }
  }'
```

### 5. Set Payment Method

```bash
curl -X POST http://localhost:3000/api/checkouts/checkout-001/payment-method \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CREDIT_CARD",
    "details": "****1234"
  }'
```

### 6. Complete Checkout

```bash
curl -X POST http://localhost:3000/api/checkouts/checkout-001/complete
```

### 7. Create Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-001",
    "cartId": "cart-123",
    "checkoutId": "checkout-001",
    "customerId": "customer-456",
    "items": [
      {
        "productId": "product-789",
        "quantity": 2,
        "unitPrice": {
          "amount": 29.99,
          "currency": "USD"
        }
      }
    ],
    "totalAmount": {
      "amount": 59.98,
      "currency": "USD"
    },
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }'
```

## Architecture Principles

### Clean Architecture Dependency Rules

```
Domain (innermost)
  ↑
Application
  ↑
Infrastructure
  ↑
Presentation (outermost)
```

- **Domain** has no dependencies
- **Application** depends only on Domain
- **Infrastructure** depends on Application and Domain
- **Presentation** depends on Application and Domain

### CQRS Segregation

- **Commands**: Modify state, return void or acknowledgment
- **Queries**: Read state, never modify, return DTOs

### Event Sourcing with Emmett

Each aggregate follows the Emmett pattern:
- **State**: Current aggregate state
- **Evolve**: Apply events to state (pure function)
- **Decide**: Business logic that produces events from commands

### Gateway Pattern

All external dependencies are abstracted behind interfaces:
- `IEventStoreGateway`: Event persistence
- `IEventBusGateway`: Event publishing
- `IProjectionGateway`: Read model persistence

## Testing

```bash
npm test
```

## License

MIT
# shopping-ts

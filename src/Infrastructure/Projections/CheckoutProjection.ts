import {CheckoutEvent} from '../../Domain/Checkout/CheckoutEvents';
import {CheckoutReadModel} from '../../Application/Queries/CheckoutQueryHandlers';
import {PostgresProjectionGateway} from './PostgresProjectionGateway';

export class CheckoutProjection {
    constructor(private readonly projectionGateway: PostgresProjectionGateway) {
    }

    async handleEvent(event: CheckoutEvent): Promise<void> {
        switch (event.type) {
            case 'CheckoutInitiated':
                await this.handleCheckoutInitiated(event);
                break;
            case 'PaymentMethodSet':
                await this.handlePaymentMethodSet(event);
                break;
            case 'CouponApplied':
                await this.handleCouponApplied(event);
                break;
            case 'GiftCardApplied':
                await this.handleGiftCardApplied(event);
                break;
            case 'CheckoutCompleted':
                await this.handleCheckoutCompleted(event);
                break;
            case 'CheckoutCancelled':
                await this.handleCheckoutCancelled(event);
                break;
        }
    }

    private async handleCheckoutInitiated(event: any): Promise<void> {
        const readModel: CheckoutReadModel = {
            checkoutId: event.data.checkoutId,
            cartId: event.data.cartId,
            customerId: event.data.customerId,
            status: 'Initiated',
            totalAmount: event.data.totalAmount,
            appliedCoupons: [],
            appliedGiftCards: [],
            totalDiscount: 0,
            totalGiftCardAmount: 0,
            lastUpdated: event.data.initiatedAt,
        };

        await this.projectionGateway.upsert('checkouts', event.data.checkoutId, readModel);
    }

    private async handlePaymentMethodSet(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<CheckoutReadModel>(
            'checkouts',
            event.data.checkoutId
        );

        if (!existing) return;

        existing.paymentMethod = {
            type: event.data.paymentMethodType,
            details: event.data.paymentMethodDetails,
        };
        existing.lastUpdated = event.data.setAt;

        await this.projectionGateway.upsert('checkouts', event.data.checkoutId, existing);
    }

    private async handleCouponApplied(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<CheckoutReadModel>(
            'checkouts',
            event.data.checkoutId
        );

        if (!existing) return;

        existing.appliedCoupons.push(event.data.couponCode);
        existing.totalDiscount += event.data.discountAmount.amount;
        existing.lastUpdated = event.data.appliedAt;

        await this.projectionGateway.upsert('checkouts', event.data.checkoutId, existing);
    }

    private async handleGiftCardApplied(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<CheckoutReadModel>(
            'checkouts',
            event.data.checkoutId
        );

        if (!existing) return;

        existing.appliedGiftCards.push(event.data.giftCardCode);
        existing.totalGiftCardAmount += event.data.appliedAmount.amount;
        existing.lastUpdated = event.data.appliedAt;

        await this.projectionGateway.upsert('checkouts', event.data.checkoutId, existing);
    }

    private async handleCheckoutCompleted(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<CheckoutReadModel>(
            'checkouts',
            event.data.checkoutId
        );

        if (!existing) return;

        existing.status = 'Completed';
        existing.finalAmount = event.data.finalAmount;
        existing.lastUpdated = event.data.completedAt;

        await this.projectionGateway.upsert('checkouts', event.data.checkoutId, existing);
    }

    private async handleCheckoutCancelled(event: any): Promise<void> {
        const existing = await this.projectionGateway.findById<CheckoutReadModel>(
            'checkouts',
            event.data.checkoutId
        );

        if (!existing) return;

        existing.status = 'Cancelled';
        existing.lastUpdated = event.data.cancelledAt;

        await this.projectionGateway.upsert('checkouts', event.data.checkoutId, existing);
    }
}

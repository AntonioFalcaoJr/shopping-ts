import { Request, Response, Router } from 'express';
import { CheckoutCommandHandler } from '../../Application/Commands/CheckoutCommandHandlers';
import { CheckoutQueryHandler } from '../../Application/Queries/CheckoutQueryHandlers';
import { CheckoutId, CartId } from '../../Domain/ValueObjects/Ids';
import { Money } from '../../Domain/ValueObjects/Money';
import { PaymentMethod, PaymentMethodType, CouponCode, GiftCardCode } from '../../Domain/ValueObjects/PaymentMethod';

export class CheckoutController {
  private readonly router: Router;

  constructor(
    private readonly commandHandler: CheckoutCommandHandler,
    private readonly queryHandler: CheckoutQueryHandler
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post('/checkouts', this.initiateCheckout.bind(this));
    this.router.post('/checkouts/:checkoutId/payment-method', this.setPaymentMethod.bind(this));
    this.router.post('/checkouts/:checkoutId/coupons', this.applyCoupon.bind(this));
    this.router.post('/checkouts/:checkoutId/gift-cards', this.applyGiftCard.bind(this));
    this.router.post('/checkouts/:checkoutId/complete', this.completeCheckout.bind(this));
    this.router.post('/checkouts/:checkoutId/cancel', this.cancelCheckout.bind(this));

    this.router.get('/checkouts/:checkoutId', this.getCheckoutById.bind(this));
    this.router.get('/checkouts', this.getCheckouts.bind(this));
    this.router.get('/customers/:customerId/checkouts', this.getCheckoutsByCustomerId.bind(this));
  }

  private async initiateCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { checkoutId, cartId, customerId, totalAmount } = req.body;

      await this.commandHandler.handle({
        type: 'InitiateCheckout',
        data: {
          checkoutId: CheckoutId.create(checkoutId),
          cartId: CartId.create(cartId),
          customerId,
          totalAmount: Money.create(totalAmount.amount, totalAmount.currency),
        },
      });

      res.status(201).json({ message: 'Checkout initiated', checkoutId });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async setPaymentMethod(req: Request, res: Response): Promise<void> {
    try {
      const { checkoutId } = req.params;
      const { type, details } = req.body;

      await this.commandHandler.handle({
        type: 'SetPaymentMethod',
        data: {
          checkoutId: CheckoutId.create(checkoutId),
          paymentMethod: PaymentMethod.create(type as PaymentMethodType, details),
        },
      });

      res.status(200).json({ message: 'Payment method set' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async applyCoupon(req: Request, res: Response): Promise<void> {
    try {
      const { checkoutId } = req.params;
      const { couponCode, discountAmount } = req.body;

      await this.commandHandler.handle({
        type: 'ApplyCoupon',
        data: {
          checkoutId: CheckoutId.create(checkoutId),
          couponCode: CouponCode.create(couponCode),
          discountAmount: Money.create(discountAmount.amount, discountAmount.currency),
        },
      });

      res.status(200).json({ message: 'Coupon applied' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async applyGiftCard(req: Request, res: Response): Promise<void> {
    try {
      const { checkoutId } = req.params;
      const { giftCardCode, appliedAmount } = req.body;

      await this.commandHandler.handle({
        type: 'ApplyGiftCard',
        data: {
          checkoutId: CheckoutId.create(checkoutId),
          giftCardCode: GiftCardCode.create(giftCardCode),
          appliedAmount: Money.create(appliedAmount.amount, appliedAmount.currency),
        },
      });

      res.status(200).json({ message: 'Gift card applied' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async completeCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { checkoutId } = req.params;

      await this.commandHandler.handle({
        type: 'CompleteCheckout',
        data: {
          checkoutId: CheckoutId.create(checkoutId),
        },
      });

      res.status(200).json({ message: 'Checkout completed' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async cancelCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { checkoutId } = req.params;
      const { reason } = req.body;

      await this.commandHandler.handle({
        type: 'CancelCheckout',
        data: {
          checkoutId: CheckoutId.create(checkoutId),
          reason,
        },
      });

      res.status(200).json({ message: 'Checkout cancelled' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getCheckoutById(req: Request, res: Response): Promise<void> {
    try {
      const { checkoutId } = req.params;
      const checkout = await this.queryHandler.getCheckoutById(checkoutId);

      if (!checkout) {
        res.status(404).json({ error: 'Checkout not found' });
        return;
      }

      res.status(200).json(checkout);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getCheckouts(res: Response): Promise<void> {
    try {
      const checkouts = await this.queryHandler.getAllCheckouts();
      res.status(200).json(checkouts);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getCheckoutsByCustomerId(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;
      const checkouts = await this.queryHandler.getCheckoutsByCustomerId(customerId);
      res.status(200).json(checkouts);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}

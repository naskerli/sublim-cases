// Ödəniş abstraksiyası.
// Stripe açarları (STRIPE_SECRET_KEY) təyin olunubsa və `stripe` paketi
// quraşdırılıbsa — kart ödənişi üçün Checkout sessiyası yaradılır.
// Əks halda qraslı şəkildə null qaytarır (sifariş "ödəniş gözləyir" kimi qalır).

type CheckoutInput = {
  orderNumber: string;
  amount: number; // AZN
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string | null;
};

export async function createCardCheckout(
  input: CheckoutInput,
): Promise<{ url: string } | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  try {
    // Dinamik import — paket yoxdursa build/əsas axını sındırmasın.
    const mod = await import("stripe").catch(() => null);
    if (!mod) return null;
    const Stripe = mod.default;
    const stripe = new Stripe(key);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.customerEmail ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "azn",
            product_data: { name: `Sublim Cases — ${input.orderNumber}` },
            unit_amount: Math.round(input.amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { orderNumber: input.orderNumber },
    });

    return session.url ? { url: session.url } : null;
  } catch (err) {
    console.error("Stripe checkout xətası:", err);
    return null;
  }
}

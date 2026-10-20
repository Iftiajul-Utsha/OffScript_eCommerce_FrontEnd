import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Package,
  Trash2,
  Truck,
  PenTool,
  ShoppingBag,
} from "lucide-react";
import { useStore } from "./store";
import { api, money } from "./api";
import {
  PageHeading,
  ButtonLink,
  Quantity,
  Empty,
  ErrorMessage,
  FormField,
  Accordion,
  SizeGuide,
} from "./components";
const subtotalOf = (cart) =>
  cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
function Summary({ cart, coupon = "", children }) {
  const subtotal = subtotalOf(cart),
    discount = coupon === "FIRST10" ? Math.round(subtotal * 0.1) : 0,
    shipping = subtotal - discount >= 2500 ? 0 : 80;
  return (
    <aside className="order-summary">
      <h2>The good stuff.</h2>
      <div className="summary-line">
        <span>Subtotal</span>
        <span>{money(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="summary-line">
          <span>FIRST10 discount</span>
          <span>−{money(discount)}</span>
        </div>
      )}
      <div className="summary-line">
        <span>Demo shipping</span>
        <span>{shipping === 0 ? "On us" : money(shipping)}</span>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <strong>{money(subtotal - discount + shipping)}</strong>
      </div>
      <p className="small-note">BDT · Demo pricing. No payment is collected.</p>
      {children}
    </aside>
  );
}
export function Cart() {
  const { cart, setCart } = useStore();
  if (!cart.length)
    return (
      <Empty
        title="Your next favourite is out there."
        text="Your bag is empty. Find a piece that feels like you."
      />
    );
  const subtotal = subtotalOf(cart);
  return (
    <div className="page section">
      <PageHeading title="Good choices.">
        Your bag has {cart.reduce((s, i) => s + i.quantity, 0)} piece(s) with
        your name on them.
      </PageHeading>
      <div className="checkout-layout">
        <div>
          <div className="shipping-note">
            <Truck size={20} />
            {subtotal >= 2500
              ? "Your demo order qualifies for free shipping."
              : `You’re ${money(2500 - subtotal)} away from free demo shipping.`}
          </div>
          {cart.map((item) => (
            <article className="cart-item" key={item.key}>
              <Link to={`/product/${item.productId}`}>
                <img src={`/images/${item.image}`} alt={item.name} />
              </Link>
              <div className="cart-item-info">
                <Link to={`/product/${item.productId}`}>
                  <h2>{item.name}</h2>
                </Link>
                <p>
                  {item.colour} / {item.size}
                </p>
                {item.customization && (
                  <p className="custom-tag">
                    <PenTool size={13} />
                    Custom {item.customization.placement.toLowerCase()} print
                    {item.customization.text
                      ? ` · “${item.customization.text}”`
                      : ""}
                  </p>
                )}
                <Quantity
                  value={item.quantity}
                  onChange={(q) =>
                    setCart((v) =>
                      v.map((i) =>
                        i.key === item.key ? { ...i, quantity: q } : i,
                      ),
                    )
                  }
                />
              </div>
              <div className="cart-item-right">
                <strong>{money(item.unitPrice * item.quantity)}</strong>
                <button
                  className="icon-button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() =>
                    setCart((p) => p.filter((i) => i.key !== item.key))
                  }
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
          <Link className="text-link" to="/shop">
            A little more browsing <ArrowUpRight size={18} />
          </Link>
        </div>
        <Summary cart={cart}>
          <ButtonLink to="/checkout" className="full-width">
            Continue to checkout
          </ButtonLink>
          <p className="small-note">
            Try FIRST10 at checkout for 10% off your demo order.
          </p>
        </Summary>
      </div>
    </div>
  );
}

export function Checkout() {
  const { cart, setCart } = useStore();
  const [couponInput, setCouponInput] = useState(""),
    [coupon, setCoupon] = useState(""),
    [couponError, setCouponError] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [order, setOrder] = useState(null);
  const requestId = useRef(crypto.randomUUID());
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const result = await api("/orders", {
        method: "POST",
        body: {
          customer: Object.fromEntries(
            ["name", "email", "phone", "address", "city"].map((k) => [
              k,
              form.get(k),
            ]),
          ),
          items: cart.map(
            ({ productId, size, colour, quantity, customization }) => ({
              productId,
              size,
              colour,
              quantity,
              customization,
            }),
          ),
          coupon,
          requestId: requestId.current,
        },
      });
      setOrder(result);
      setCart([]);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (order)
    return (
      <div className="confirmation">
        <span className="success-icon">
          <Check size={32} />
        </span>
        <h1>Consider it yours.</h1>
        <p>Your demo order is saved. No payment was collected.</p>
        <div className="confirmation-order">
          <span>Order number</span>
          <strong>{order.id}</strong>
          <span>
            {money(order.total)} · {order.status}
          </span>
        </div>
        <p>
          Use your order number and checkout email to follow its progress.
          <br />
          No confirmation email is sent in this demo.
        </p>
        <ButtonLink to={`/track?id=${order.id}`}>Track your order</ButtonLink>
        <Link className="text-link" to="/shop">
          Back to the collection
        </Link>
      </div>
    );
  if (!cart.length)
    return (
      <Empty
        title="First, find your favourite."
        text="Add a piece to your bag before checking out."
      />
    );
  return (
    <div className="page section">
      <PageHeading title="Make it official.">
        One last step between you and your new rotation.
      </PageHeading>
      <div className="checkout-layout">
        <form id="checkout-form" onSubmit={submit} className="checkout-form">
          <h2>Where should it go?</h2>
          <p className="demo-note">
            This is a demo checkout. Use test details; no order is dispatched
            and no payment is charged.
          </p>
          <FormField
            label="Full name"
            name="name"
            autoComplete="name"
            required
            maxLength={200}
            placeholder="Your name"
          />
          <div className="two-fields">
            <FormField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
            <FormField
              label="Phone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              minLength={7}
              maxLength={20}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <FormField
            label="Delivery address"
            name="address"
            autoComplete="street-address"
            required
            minLength={8}
            maxLength={500}
            placeholder="House, street, area"
          />
          <FormField
            label="City"
            name="city"
            autoComplete="address-level2"
            required
            placeholder="Dhaka"
          />
          <h2 className="payment-heading">Payment</h2>
          <div className="payment-option">
            <Check size={20} />
            <div>
              <strong>Demo checkout</strong>
              <p>
                Payment integration will be connected after the draft is
                approved.
              </p>
            </div>
          </div>
          <label className="check-field">
            <input type="checkbox" required />I understand this is a demo order
            and have read the <Link to="/help#policies">demo terms</Link>.
          </label>
          <ErrorMessage>{error}</ErrorMessage>
        </form>
        <Summary cart={cart} coupon={coupon}>
          <div className="coupon">
            <label htmlFor="coupon">Have a code?</label>
            <div>
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Try FIRST10"
              />
              <button
                onClick={() => {
                  if (couponInput.trim().toUpperCase() === "FIRST10") {
                    setCoupon("FIRST10");
                    setCouponError("");
                  } else {
                    setCoupon("");
                    setCouponError("Use FIRST10 for the demo discount.");
                  }
                }}
              >
                Apply
              </button>
            </div>
            {coupon && <p role="status">FIRST10 applied — 10% off</p>}
            <ErrorMessage>{couponError}</ErrorMessage>
          </div>
          <button
            className="button full-width"
            form="checkout-form"
            disabled={busy}
          >
            {busy ? "Saving your order…" : "Place demo order"}
            <ArrowRight size={18} />
          </button>
          <p className="small-note">
            Prices are checked again by the server when your order is placed.
          </p>
        </Summary>
      </div>
    </div>
  );
}

export function Track() {
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function track(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      setOrder(
        await api("/orders/track", {
          method: "POST",
          body: Object.fromEntries(new FormData(e.currentTarget)),
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const steps = [
    "Confirmed",
    "Artwork review",
    "In production",
    "Shipped",
    "Delivered",
  ];
  return (
    <div className="page section">
      <PageHeading title="Follow your favourite.">
        Check in on your order, from first idea to front door.
      </PageHeading>
      <div className="tracking-layout">
        <form onSubmit={track} className="tracking-form">
          <FormField
            label="Order number"
            name="id"
            required
            defaultValue={params.get("id") || ""}
            placeholder="OS-XXXXXXXX"
          />
          <FormField
            label="Checkout email"
            type="email"
            name="email"
            required
            placeholder="you@example.com"
          />
          <button className="button" disabled={busy}>
            {busy ? "Finding your order…" : "Find my order"}
            <ArrowRight size={18} />
          </button>
          <ErrorMessage>{error}</ErrorMessage>
        </form>
        <div className="tracking-result">
          {order ? (
            <>
              <div className="section-heading">
                <h2>{order.id}</h2>
                <span className="status-badge">{order.status}</span>
              </div>
              <p>
                Placed {new Date(order.createdAt).toLocaleDateString("en-GB")} ·{" "}
                {money(order.total)}
              </p>
              {order.status === "Cancelled" ? (
                <p>This demo order was cancelled by the studio.</p>
              ) : (
                <ol className="tracking-steps">
                  {steps.map((s, i) => (
                    <li
                      key={s}
                      className={i <= steps.indexOf(order.status) ? "done" : ""}
                    >
                      <span>
                        {i <= steps.indexOf(order.status) ? (
                          <Check size={15} />
                        ) : (
                          i + 1
                        )}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              )}
              <div>
                {order.items.map((item, i) => (
                  <div className="summary-line" key={i}>
                    <span>
                      {item.quantity} × {item.name} / {item.size}
                    </span>
                    <strong>{money(item.unitPrice * item.quantity)}</strong>
                  </div>
                ))}
              </div>
              <p className="small-note">
                Demo statuses are managed in the studio dashboard. No courier or
                email service is connected.
              </p>
            </>
          ) : (
            <div className="tracking-placeholder">
              <Package size={50} strokeWidth={1} />
              <h2>A little anticipation looks good on you.</h2>
              <p>
                Enter the details from your order confirmation to see where it’s
                at.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function About() {
  return (
    <>
      <section className="about-hero section">
        <div>
          <h1>
            For the ones
            <br />
            who go
            <br />
            off script.
          </h1>
          <p>
            The favourite tee you wear on repeat. The hoodie you lend and never
            get back. The print that says what you’re thinking.
          </p>
          <p>
            That’s the idea behind OFFSCRIPT: everyday pieces with room for a
            little more you.
          </p>
          <ButtonLink to="/studio">Make something personal</ButtonLink>
        </div>
        <img
          src="/images/studio.jpg"
          alt="Personal style through everyday apparel"
        />
      </section>
      <section className="section story-copy">
        <h2>
          A blank canvas.
          <br />A point of view.
        </h2>
        <div>
          <p>
            We’re building a space for people who see clothing as more than
            getting dressed. Start with a print from the collection, or bring
            your own idea to the custom studio.
          </p>
          <p>
            Pick a garment. Add a line, a sketch, or a design. See it take shape
            before it becomes part of your everyday.
          </p>
          <p className="demo-note">
            OFFSCRIPT is the working identity for this website demo. The final
            brand story, production details, and product range will be shaped
            with the business owner.
          </p>
        </div>
      </section>
    </>
  );
}

export function Help() {
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function contact(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    try {
      const result = await api("/contact", {
        method: "POST",
        body: Object.fromEntries(new FormData(form)),
      });
      setMessage(result.message);
      form.reset();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page section">
      <PageHeading title="A little help goes a long way.">
        The details, so you can get back to the good stuff.
      </PageHeading>
      <div className="help-layout">
        <nav aria-label="Help topics">
          <a href="#questions">Common questions</a>
          <a href="#size-guide">Find your size</a>
          <a href="#contact">Get in touch</a>
          <a href="#policies">Privacy & terms</a>
        </nav>
        <div>
          <section id="questions">
            <h2>Good to know.</h2>
            <Accordion title="How does custom printing work?" open>
              <p>
                Pick a garment in the custom studio, choose a size and colour,
                then add text or upload artwork. Your demo order is saved for
                artwork review. A real proof approval and production workflow
                will be confirmed before launch.
              </p>
            </Accordion>
            <Accordion title="How much is delivery?">
              <p>
                Demo delivery is ৳80. Orders of ৳2,500 or more after discounts
                qualify for free demo delivery. Courier coverage and delivery
                estimates are still to be confirmed.
              </p>
            </Accordion>
            <Accordion title="Can I return a custom print?">
              <p>
                The business’s actual return policy has not been set yet. Before
                launch, this page will explain cancellations, defects,
                exchanges, and the rules for personalised products. This demo
                does not accept real purchases.
              </p>
            </Accordion>
            <Accordion title="Can I order for a group or event?">
              <p>
                Yes, the draft is designed to support that conversation. Send
                the group size, garment type, and your print idea using the
                contact form. Messages are saved locally for now.
              </p>
            </Accordion>
            <Accordion title="What file can I upload?">
              <p>
                The demo accepts PNG, JPG, and WebP images up to 1 MB. Use a
                clean, high-resolution file you have permission to print. Final
                artwork specifications will depend on the chosen printing
                process.
              </p>
            </Accordion>
          </section>
          <section id="size-guide">
            <h2>Find your size.</h2>
            <SizeGuide />
          </section>
          <section id="contact">
            <h2>Let’s talk prints.</h2>
            <p>Have an idea, a question, or a whole team to dress?</p>
            <form onSubmit={contact}>
              <div className="two-fields">
                <FormField label="Your name" name="name" required />
                <FormField
                  label="Email address"
                  name="email"
                  type="email"
                  required
                />
              </div>
              <label className="field">
                <span>What’s on your mind?</span>
                <textarea
                  name="message"
                  rows={5}
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="Tell us a little about your idea…"
                />
              </label>
              <button className="button" disabled={busy}>
                {busy ? "Saving…" : "Send demo message"}
                <ArrowUpRight size={18} />
              </button>
              <p className="small-note">
                Saved in the demo dashboard. No email is sent.
              </p>
              <ErrorMessage>{error}</ErrorMessage>
              <p role="status">{message}</p>
            </form>
          </section>
          <section id="policies">
            <h2>Privacy & demo terms.</h2>
            <p>
              This local demonstration stores order details, uploaded artwork,
              contact messages, and newsletter signups in the developer’s local
              data store. Your bag and saved favourites are stored in this
              browser. Please use test information.
            </p>
            <p>
              No payment processing, marketing email, shipping, or analytics
              service is connected. Photos are styling references; product
              names, specifications, prices, discounts, and delivery rates are
              illustrative. An admin can view demo submissions.
            </p>
            <p>
              Final commercial terms, privacy notices, retention periods, and
              return policies must be agreed before accepting real customer
              orders.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
export function NotFound() {
  return (
    <Empty
      title="A little off the map."
      text="That page doesn’t exist. Your next favourite probably does."
    />
  );
}

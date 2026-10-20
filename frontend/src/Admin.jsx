import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  RefreshCw,
  Package,
  ShoppingBag,
  Mail,
  Check,
} from "lucide-react";
import { api, money } from "./api";
import { PageHeading, ErrorMessage, Empty } from "./components";
import { useStore } from "./store";
const statuses = [
  "Confirmed",
  "Artwork review",
  "In production",
  "Shipped",
  "Delivered",
  "Cancelled",
];
export default function Admin() {
  const { refresh } = useStore();
  const [token, setToken] = useState(
      () => sessionStorage.getItem("offscript-admin") || "",
    ),
    [input, setInput] = useState(""),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [tab, setTab] = useState("Orders"),
    [busy, setBusy] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api("/admin/overview", { token }));
    } catch (e) {
      setError(e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [token]);
  async function updateOrder(id, status) {
    setBusy(id);
    try {
      const order = await api(`/admin/orders/${id}`, {
        method: "PATCH",
        token,
        body: { status },
      });
      setData((d) => ({
        ...d,
        orders: d.orders.map((o) => (o.id === id ? order : o)),
      }));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function updateProduct(e, id) {
    e.preventDefault();
    setBusy(id);
    const values = new FormData(e.currentTarget);
    try {
      const p = await api(`/admin/products/${id}`, {
        method: "PATCH",
        token,
        body: { name: values.get("name"), price: Number(values.get("price")) },
      });
      setData((d) => ({
        ...d,
        products: d.products.map((v) => (v.id === id ? p : v)),
      }));
      await refresh();
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="page section admin">
      <div className="admin-heading">
        <PageHeading title="Behind the prints.">
          A little order behind the creative chaos.
        </PageHeading>
        <button className="button secondary" onClick={load} disabled={loading}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? (
        <div className="loading">Opening the dashboard…</div>
      ) : !data ? (
        <form
          className="admin-login"
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem("offscript-admin", input);
            if (input === token) load();
            else setToken(input);
          }}
        >
          <h2>Studio access</h2>
          <p>
            Enter the ADMIN_TOKEN configured on the backend. The credential-free
            local demo opens automatically.
          </p>
          <label className="field">
            <span>Admin token</span>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              required
            />
          </label>
          <button className="button">Open dashboard</button>
        </form>
      ) : (
        <>
          {data.demo && (
            <p className="demo-note">
              Local demo workspace. Orders, messages, and prices are saved on
              this computer. Admin authentication is required when connecting
              MongoDB or running in production.
            </p>
          )}
          <div className="admin-stats">
            <div>
              <span>Demo order value</span>
              <strong>
                {money(
                  data.orders
                    .filter((o) => o.status !== "Cancelled")
                    .reduce((s, o) => s + o.total, 0),
                )}
              </strong>
              <small>No payments collected</small>
            </div>
            <div>
              <span>Orders</span>
              <strong>{data.orders.length}</strong>
              <small>
                {
                  data.orders.filter(
                    (o) => !["Delivered", "Cancelled"].includes(o.status),
                  ).length
                }{" "}
                in progress
              </small>
            </div>
            <div>
              <span>Pieces in the collection</span>
              <strong>{data.products.length}</strong>
              <small>Editable demo catalogue</small>
            </div>
            <div>
              <span>Newsletter signups</span>
              <strong>{data.subscribers}</strong>
              <small>Demo list only</small>
            </div>
          </div>
          <div className="tabs admin-tabs">
            {["Orders", "Products", "Messages"].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "Messages" ? ` (${data.messages.length})` : ""}
              </button>
            ))}
          </div>
          {tab === "Orders" &&
            (data.orders.length ? (
              <div className="admin-orders">
                {data.orders.map((order) => (
                  <details key={order.id} className="admin-order">
                    <summary>
                      <div>
                        <strong>{order.id}</strong>
                        <small>
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-GB",
                          )}{" "}
                          · {order.customer.name}
                        </small>
                      </div>
                      <strong>{money(order.total)}</strong>
                      <span className="status-badge">{order.status}</span>
                      <span>View order</span>
                    </summary>
                    <div className="admin-order-body">
                      <div>
                        <h3>Delivery details</h3>
                        <p>
                          {order.customer.name}
                          <br />
                          {order.customer.email}
                          <br />
                          {order.customer.phone}
                          <br />
                          {order.customer.address}, {order.customer.city}
                        </p>
                        <label className="field">
                          <span>Order status</span>
                          <select
                            disabled={busy === order.id}
                            value={order.status}
                            onChange={(e) =>
                              updateOrder(order.id, e.target.value)
                            }
                          >
                            {statuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </label>
                        <p className="small-note">{order.paymentStatus}</p>
                      </div>
                      <div>
                        <h3>Order items</h3>
                        {order.items.map((item, i) => (
                          <div key={i} className="admin-line">
                            <strong>
                              {item.quantity} × {item.name}
                            </strong>
                            <p>
                              {item.size} / {item.colour} ·{" "}
                              {money(item.unitPrice)}
                            </p>
                            {item.customization && (
                              <>
                                <p>
                                  Custom{" "}
                                  {item.customization.placement.toLowerCase()}{" "}
                                  print:{" "}
                                  {item.customization.text ||
                                    "Uploaded artwork"}
                                  <br />
                                  Font: {item.customization.font} · Ink:{" "}
                                  {item.customization.ink}
                                </p>
                                {item.customization.artwork && (
                                  <img
                                    className="admin-artwork"
                                    src={item.customization.artwork}
                                    alt="Customer supplied print artwork"
                                  />
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <Empty
                title="A clean slate."
                text="Place a demo order in the storefront and it will appear here."
              />
            ))}
          {tab === "Products" && (
            <div className="admin-products">
              {data.products.map((p) => (
                <form key={p.id} onSubmit={(e) => updateProduct(e, p.id)}>
                  <img src={`/images/${p.image}`} alt={p.name} />
                  <label className="field">
                    <span>Product name</span>
                    <input
                      name="name"
                      defaultValue={p.name}
                      required
                      maxLength={200}
                    />
                  </label>
                  <label className="field">
                    <span>Price in BDT</span>
                    <input
                      name="price"
                      type="number"
                      min="1"
                      max="100000"
                      defaultValue={p.price}
                      required
                    />
                  </label>
                  <button className="button secondary" disabled={busy === p.id}>
                    {busy === p.id ? "Saving…" : "Save product"}
                  </button>
                </form>
              ))}
            </div>
          )}
          {tab === "Messages" &&
            (data.messages.length ? (
              <div>
                {data.messages.map((m) => (
                  <article key={m.id} className="message">
                    <h3>{m.name}</h3>
                    <span>
                      {m.email} ·{" "}
                      {new Date(m.createdAt).toLocaleDateString("en-GB")}
                    </span>
                    <p>{m.message}</p>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="All quiet in the inbox."
                text="Messages from the contact form will appear here."
                to="/help#contact"
                action="Try the contact form"
              />
            ))}
        </>
      )}
    </div>
  );
}

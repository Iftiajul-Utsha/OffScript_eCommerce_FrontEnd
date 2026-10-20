import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Heart, Plus, Minus, ArrowRight } from "lucide-react";
import { useStore } from "./store";
import { money } from "./api";
export function ButtonLink({
  to,
  children,
  secondary = false,
  className = "",
}) {
  return (
    <Link
      className={`button ${secondary ? "secondary" : ""} ${className}`}
      to={to}
    >
      {children}
      <ArrowUpRight size={19} />
    </Link>
  );
}
export function ErrorMessage({ children }) {
  return children ? (
    <p className="error" role="alert">
      {children}
    </p>
  ) : null;
}
export function CatalogState() {
  const { loading, error, refresh } = useStore();
  return loading ? (
    <div className="loading" role="status">
      <span className="spinner" />
      Getting the collection ready…
    </div>
  ) : error ? (
    <div className="empty">
      <h2>The collection couldn’t load.</h2>
      <p>{error}</p>
      <button className="button" onClick={refresh}>
        Try again
      </button>
    </div>
  ) : null;
}
export function ProductCard({ product }) {
  const { saved, toggleSaved } = useStore();
  return (
    <article className="product-card">
      <div className="product-photo">
        <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
          <img
            src={`/images/${product.image}`}
            alt={`${product.name} styling reference`}
            loading="lazy"
          />
          <span className="image-caption">{product.tag}</span>
        </Link>
        <button
          className={`save ${saved.includes(product.id) ? "selected" : ""}`}
          onClick={() => toggleSaved(product.id)}
          aria-label={`${saved.includes(product.id) ? "Unsave" : "Save"} ${product.name}`}
          aria-pressed={saved.includes(product.id)}
        >
          <Heart
            size={18}
            fill={saved.includes(product.id) ? "currentColor" : "none"}
          />
        </button>
        <Link className="quick-view" to={`/product/${product.id}`}>
          Choose your fit <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="product-meta">
        <div>
          <Link to={`/product/${product.id}`}>
            <h3>{product.name}</h3>
          </Link>
          <p>
            {product.fit} · {product.fabric}
          </p>
        </div>
        <span>{money(product.price)}</span>
      </div>
      <div
        className="swatches"
        aria-label={`Colours: ${product.colours.join(", ")}`}
      >
        {product.colours.map((c) => (
          <i key={c} style={{ background: colourHex(c) }} title={c} />
        ))}
        <small>{product.colours.length} colours</small>
      </div>
    </article>
  );
}
export const colourHex = (colour) =>
  ({
    "Washed black": "#333330",
    Ink: "#242828",
    Bone: "#eee8d8",
    "Heather grey": "#aaa9a4",
    Forest: "#586452",
  })[colour] || "#eee8d8";
export function Quantity({ value, onChange }) {
  return (
    <div className="quantity">
      <button
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
      >
        <Minus size={16} />
      </button>
      <span>{value}</span>
      <button
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(20, value + 1))}
        disabled={value >= 20}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
export function PageHeading({ title, children }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
export function Accordion({ title, children, open = false }) {
  return (
    <details open={open || undefined}>
      <summary>
        {title}
        <Plus size={18} />
      </summary>
      <div className="detail-body">{children}</div>
    </details>
  );
}
export function Empty({
  title,
  text,
  to = "/shop",
  action = "Explore the collection",
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{text}</p>
      <ButtonLink to={to}>{action}</ButtonLink>
    </div>
  );
}
export function SizeGuide() {
  return (
    <div className="table-scroll">
      <table>
        <caption>Demo garment measurements in inches</caption>
        <thead>
          <tr>
            <th>Size</th>
            <th>Chest</th>
            <th>Length</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["S", 38, 27],
            ["M", 40, 28],
            ["L", 42, 29],
            ["XL", 44, 30],
            ["XXL", 46, 31],
          ].map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => (
                <td key={i}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        Measure a favourite tee flat and compare. Final garment measurements
        will be confirmed before launch.
      </p>
    </div>
  );
}
export function FormField({ label, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

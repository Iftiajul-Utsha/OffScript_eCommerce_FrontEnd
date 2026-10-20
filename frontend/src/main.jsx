import React, { Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";
import {
  ArrowUpRight,
  Search,
  ShoppingBag,
  Menu,
  X,
  Heart,
  Check,
  ArrowRight,
} from "lucide-react";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/manrope";
import "./styles.css";
import { StoreProvider, useStore } from "./store";
import { Home, Shop, Product, Studio } from "./pages";
import { Cart, Checkout, Track, About, Help, NotFound } from "./flows";
import { api } from "./api";
const Admin = lazy(() => import("./Admin"));
function Header() {
  const { cart } = useStore();
  const [menu, setMenu] = useState(false);
  const { pathname, search } = useLocation();
  useEffect(() => setMenu(false), [pathname, search]);
  return (
    <>
      <div className="announcement">
        <span>Good prints. Better everyday wear.</span>
        <Link to="/studio">
          Your ideas, our canvas <ArrowUpRight size={13} />
        </Link>
      </div>
      <header className="header">
        <Link to="/" className="wordmark" aria-label="OFFSCRIPT home">
          OFFSCRIPT<span className="brand-mark">®</span>
        </Link>
        <nav
          className={menu ? "navigation open" : "navigation"}
          aria-label="Main navigation"
        >
          <NavLink to="/shop">Shop all</NavLink>
          <NavLink to="/shop?category=T-shirts">T-shirts</NavLink>
          <NavLink to="/shop?category=Hoodies">Hoodies</NavLink>
          <NavLink to="/studio" className="studio-nav">
            Custom studio <span className="tiny-dot" />
          </NavLink>
          <NavLink to="/about">Our story</NavLink>
        </nav>
        <div className="header-actions">
          <Link
            to="/shop?search="
            className="icon-button"
            aria-label="Search products"
          >
            <Search size={21} />
          </Link>
          <Link
            to="/shop?saved=true"
            className="icon-button saved-nav"
            aria-label="Saved products"
          >
            <Heart size={21} />
          </Link>
          <Link
            to="/cart"
            className="bag-link"
            aria-label={`Shopping bag, ${cart.reduce((s, i) => s + i.quantity, 0)} items`}
          >
            <ShoppingBag size={20} />
            <span className="bag-label">Bag</span>
            <span className="count">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          </Link>
          <button
            className="icon-button menu-toggle"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}
function Footer() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function subscribe(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api("/newsletter", {
        method: "POST",
        body: { email: new FormData(e.currentTarget).get("email") },
      });
      setMessage(r.message);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <footer>
      <div className="footer-main">
        <div className="newsletter">
          <h2>Stay in the loop.</h2>
          <p>Fresh prints, new drops, and a little inspiration.</p>
          <form onSubmit={subscribe}>
            <label className="sr-only" htmlFor="newsletter">
              Email address
            </label>
            <input
              id="newsletter"
              name="email"
              type="email"
              required
              placeholder="Your email address"
            />
            <button aria-label="Join the newsletter" disabled={busy}>
              <ArrowRight size={22} />
            </button>
          </form>
          <p role="status" className="newsletter-status">
            {message}
          </p>
        </div>
        <div>
          <h3>Find your fit</h3>
          <Link to="/shop">Shop all</Link>
          <Link to="/shop?category=T-shirts">T-shirts</Link>
          <Link to="/shop?category=Hoodies">Hoodies</Link>
          <Link to="/studio">Create your own</Link>
        </div>
        <div>
          <h3>Here to help</h3>
          <Link to="/track">Track your order</Link>
          <Link to="/help">Shipping & returns</Link>
          <Link to="/help#size-guide">Size guide</Link>
          <Link to="/help#contact">Get in touch</Link>
        </div>
        <div>
          <h3>The studio</h3>
          <Link to="/about">Our story</Link>
          <Link to="/admin">Demo dashboard</Link>
          <Link to="/help#policies">Privacy & terms</Link>
        </div>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        OFFSCRIPT<span>®</span>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} OFFSCRIPT. A little more you.</span>
        <span>
          Demo storefront · Sample products & prices · No real payments
        </span>
        <span>Dhaka, Bangladesh</span>
      </div>
    </footer>
  );
}
function App() {
  const { toast } = useStore();
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(location.hash.slice(1))?.scrollIntoView(),
      );
    } else window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Suspense fallback={<div className="loading">Opening the studio…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track" element={<Track />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      {toast && (
        <div role="status" className="toast">
          <Check size={18} />
          {toast}
          <Link to="/cart">View bag</Link>
        </div>
      )}
    </>
  );
}
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>Let’s try that again.</h1>
        <p>The page couldn’t load. Reload to return to the store.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload store
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <StoreProvider>
          <App />
        </StoreProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
const StoreContext = createContext(null);
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [cart, setCart] = useState(() => {
    const v = read("offscript-bag-v1", []);
    return Array.isArray(v)
      ? v.filter(
          (i) =>
            i &&
            typeof i.key === "string" &&
            typeof i.productId === "string" &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0,
        )
      : [];
  });
  const [saved, setSaved] = useState(() => {
    const v = read("offscript-saved-v1", []);
    return Array.isArray(v) ? v : [];
  });
  const [toast, setToast] = useState("");
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setProducts(await api("/products"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("offscript-bag-v1", JSON.stringify(cart));
    } catch {
      setToast(
        "Your bag is available this session, but browser storage is full.",
      );
    }
  }, [cart]);
  useEffect(() => {
    try {
      localStorage.setItem("offscript-saved-v1", JSON.stringify(saved));
    } catch {}
  }, [saved]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function addItem(product, options) {
    const key = options.customization
      ? crypto.randomUUID()
      : `${product.id}-${options.size}-${options.colour}`;
    setCart((previous) => {
      const found = previous.find((i) => i.key === key);
      if (found)
        return previous.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(20, i.quantity + options.quantity) }
            : i,
        );
      return [
        ...previous,
        {
          key,
          productId: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          ...options,
        },
      ];
    });
    setToast(`${product.name} added to your bag`);
  }
  function toggleSaved(id) {
    setSaved((p) => (p.includes(id) ? p.filter((v) => v !== id) : [...p, id]));
  }
  const lines = cart.map((i) => {
    const product = products.find((p) => p.id === i.productId);
    return {
      ...i,
      price: product?.price ?? i.price,
      unitPrice: (product?.price ?? i.price) + (i.customization ? 250 : 0),
    };
  });
  return (
    <StoreContext.Provider
      value={{
        products,
        loading,
        error,
        refresh,
        cart: lines,
        setCart,
        saved,
        toggleSaved,
        addItem,
        toast,
        setToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
export function useStore() {
  return useContext(StoreContext);
}

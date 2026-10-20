import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Check,
  Upload,
  Shirt,
  Truck,
  PenTool,
  SlidersHorizontal,
  Search,
  Heart,
  RotateCcw,
  Asterisk,
} from "lucide-react";
import { useStore } from "./store";
import { money } from "./api";
import {
  ButtonLink,
  ProductCard,
  CatalogState,
  PageHeading,
  Quantity,
  Accordion,
  SizeGuide,
  colourHex,
  ErrorMessage,
  Empty,
} from "./components";

export function Home() {
  const { products } = useStore();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Wear your
            <br />
            own story.
          </h1>
          <p>
            Everyday essentials. Not-so-everyday prints.
            <br />
            T-shirts and hoodies made for your kind of different.
          </p>
          <div className="hero-buttons">
            <ButtonLink to="/shop">Find your next favourite</ButtonLink>
            <ButtonLink to="/studio" secondary>
              Create your own
            </ButtonLink>
          </div>
          <div className="hero-bottom">
            <span className="line-drawing">
              <Shirt size={29} strokeWidth={1.3} />
            </span>
            <p>
              A good fit. A better canvas.
              <br />
              <strong>Make it unmistakably yours.</strong>
            </p>
          </div>
        </div>
        <div className="hero-photo">
          <img
            src="/images/hero.jpg"
            alt="Streetwear styling with a relaxed hoodie and cap"
            fetchPriority="high"
          />
          <div className="photo-label">
            <span>The everyday edit</span>
            <Link to="/shop" aria-label="Shop the everyday edit">
              <ArrowUpRight size={26} />
            </Link>
          </div>
          <div className="hero-sticker">
            <span>Your print.</span>
            <Shirt size={34} strokeWidth={1.4} />
            <span>Your rules.</span>
          </div>
        </div>
      </section>
      <div className="promise-strip">
        <span>
          <Shirt size={19} />
          Built around everyday comfort
        </span>
        <span>
          <PenTool size={19} />A canvas for your ideas
        </span>
        <span>
          <Truck size={19} />
          Demo shipping free over ৳2,500
        </span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Meet your new rotation.</h2>
            <p>The pieces you’ll reach for. Again and again.</p>
          </div>
          <Link className="text-link" to="/shop">
            Shop the collection <ArrowUpRight size={20} />
          </Link>
        </div>
        <CatalogState />
        <div className="product-grid">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <section className="studio-feature">
        <div className="studio-feature-art">
          <img
            src="/images/white-tee.jpg"
            alt="Blank cotton T-shirt as a canvas for a custom print"
            loading="lazy"
          />
          <span className="sample-print">
            MAKE
            <br />
            IT
            <br />
            YOURS.
          </span>
          <span className="art-note">
            One blank tee. Endless possibilities.
          </span>
        </div>
        <div className="studio-feature-copy">
          <h2>
            Got an idea?
            <br />
            Put it on a tee.
          </h2>
          <p>
            A favourite line. Your artwork. That inside joke.
            <br />
            Start with a blank canvas and make something
            <br className="desktop-break" /> that could only be yours.
          </p>
          <ul>
            <li>
              <Check size={17} />
              Pick your tee or hoodie
            </li>
            <li>
              <Check size={17} />
              Add your words or artwork
            </li>
            <li>
              <Check size={17} />
              Make room in your rotation
            </li>
          </ul>
          <ButtonLink to="/studio">Enter the custom studio</ButtonLink>
          <span className="small-note">
            Try the live preview. No design skills needed.
          </span>
        </div>
      </section>
      <section className="section category-section">
        <div className="section-heading">
          <h2>
            Good on you.
            <br />
            Whatever your mood.
          </h2>
          <p>
            Some days call for a tee.
            <br />
            Some call for the hood up.
          </p>
        </div>
        <div className="category-grid">
          <Link to="/shop?category=T-shirts" className="category-photo">
            <img
              src="/images/black-tee.jpg"
              alt="Graphic T-shirt styling"
              loading="lazy"
            />
            <div>
              <h3>The tee edit</h3>
              <span>Small details. Big personality.</span>
              <ArrowUpRight size={32} />
            </div>
          </Link>
          <Link to="/shop?category=Hoodies" className="category-photo">
            <img
              src="/images/hoodie.jpg"
              alt="Casual hoodie styling"
              loading="lazy"
            />
            <div>
              <h3>Hoodie season</h3>
              <span>Your comfort zone, upgraded.</span>
              <ArrowUpRight size={32} />
            </div>
          </Link>
        </div>
      </section>
      <section className="brand-statement">
        <Asterisk
          className="asterisk"
          aria-hidden="true"
          size={60}
          strokeWidth={1.5}
        />
        <h2>
          Less fitting in.
          <br />
          More being you.
        </h2>
        <p>
          Clothes are personal. We think your prints should be, too.
          <br />
          Meet the idea behind OFFSCRIPT.
        </p>
        <Link className="text-link" to="/about">
          A little about us <ArrowUpRight size={20} />
        </Link>
      </section>
    </>
  );
}

export function Shop() {
  const { products, saved, loading, error } = useStore();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "All pieces",
    query = params.get("search") || "",
    savedOnly = params.get("saved") === "true";
  const [sort, setSort] = useState("featured");
  const input = useRef();
  useEffect(() => {
    if (params.has("search")) input.current?.focus();
  }, []);
  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  let list = products.filter(
    (p) =>
      (category === "All pieces" || p.category === category) &&
      (!savedOnly || saved.includes(p.id)) &&
      `${p.name} ${p.description} ${p.colour}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
  return (
    <div className="page section">
      <PageHeading
        title={
          savedOnly ? "Your saved favourites." : "Find your everyday different."
        }
      >
        {savedOnly
          ? "Good taste. Keep these close."
          : "Graphic tees, easy hoodies, and room to make them your own."}
      </PageHeading>
      <div className="shop-toolbar">
        <div className="tabs">
          {["All pieces", "T-shirts", "Hoodies"].map((c) => (
            <button
              key={c}
              className={category === c ? "active" : ""}
              onClick={() => update("category", c === "All pieces" ? "" : c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="shop-tools">
          <label className="search-field">
            <Search size={18} />
            <input
              ref={input}
              aria-label="Search the collection"
              placeholder="Find your favourite"
              value={query}
              onChange={(e) => update("search", e.target.value)}
            />
          </label>
          <label className="sort-field">
            <SlidersHorizontal size={17} />
            <span className="sr-only">Sort products</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>
      <div className="results-row">
        <span>{list.length} pieces</span>
        {savedOnly && (
          <button className="text-button" onClick={() => update("saved", "")}>
            Show all products
          </button>
        )}
        <span>Sample collection</span>
      </div>
      <CatalogState />
      <div className="product-grid shop-grid">
        {list.map((p) => (
          <ProductCard product={p} key={p.id} />
        ))}
      </div>
      {!loading && !error && !list.length && (
        <Empty
          title="Nothing here just yet."
          text="Try another search or explore the full collection."
        />
      )}
      <div className="shop-custom">
        <div>
          <h2>Can’t find your kind of different?</h2>
          <p>That’s what the custom studio is for.</p>
        </div>
        <ButtonLink to="/studio" secondary>
          Make your own
        </ButtonLink>
      </div>
    </div>
  );
}

export function Product() {
  const { id } = useParams();
  const { products, loading, error, addItem, saved, toggleSaved } = useStore();
  const product = products.find((p) => p.id === id);
  const [size, setSize] = useState(""),
    [colour, setColour] = useState(""),
    [qty, setQty] = useState(1),
    [message, setMessage] = useState("");
  useEffect(() => {
    setSize("");
    setColour("");
    setQty(1);
    setMessage("");
  }, [id]);
  if (loading || error) return <CatalogState />;
  if (!product)
    return (
      <Empty
        title="That piece isn’t here."
        text="Let’s find you something else."
      />
    );
  const selectedColour = colour || product.colour;
  function add() {
    if (!size) {
      setMessage("Choose your size before adding to your bag.");
      return;
    }
    addItem(product, { size, colour: selectedColour, quantity: qty });
    setMessage("");
  }
  return (
    <div className="page section">
      <div className="breadcrumb">
        <Link to="/shop">The collection</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <div className="product-detail">
        <div className="detail-image">
          <img
            src={`/images/${product.image}`}
            alt={`${product.name} demo styling reference`}
          />
          <span className="image-caption">{product.tag}</span>
          <span className="photo-disclaimer">
            Styling reference · final prints and colours may vary
          </span>
        </div>
        <div className="product-info">
          <span className="muted">
            {product.category} / {product.fit}
          </span>
          <h1>{product.name}</h1>
          <span className="product-price">{money(product.price)}</span>
          <p className="description">{product.description}</p>
          <div className="option-label">
            Colour <strong>{selectedColour}</strong>
          </div>
          <div className="colour-options">
            {product.colours.map((c) => (
              <button
                key={c}
                aria-label={c}
                aria-pressed={selectedColour === c}
                className={selectedColour === c ? "chosen" : ""}
                style={{ "--swatch": colourHex(c) }}
                onClick={() => setColour(c)}
              >
                <span />
              </button>
            ))}
          </div>
          <div className="option-label">
            Choose your size <a href="#sizing">Size guide</a>
          </div>
          <div className="size-options">
            {product.sizes.map((s) => (
              <button
                key={s}
                className={size === s ? "chosen" : ""}
                aria-pressed={size === s}
                onClick={() => {
                  setSize(s);
                  setMessage("");
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <ErrorMessage>{message}</ErrorMessage>
          <div className="add-row">
            <Quantity value={qty} onChange={setQty} />
            <button className="button" onClick={add}>
              Add to bag <Plus size={20} />
            </button>
            <button
              className="icon-button wish-detail"
              aria-label="Save product"
              aria-pressed={saved.includes(id)}
              onClick={() => toggleSaved(id)}
            >
              <Heart fill={saved.includes(id) ? "currentColor" : "none"} />
            </button>
          </div>
          <Link className="custom-link" to={`/studio?product=${id}`}>
            Make this piece your own <PenTool size={17} />
          </Link>
          <div className="product-accordions">
            <Accordion title="The details" open>
              <p>
                {product.fabric}. {product.fit}. Sample garment specifications
                for this demo collection.
              </p>
            </Accordion>
            <Accordion title="Care for your print">
              <p>
                Suggested care: wash inside out on a cool cycle, avoid bleach,
                and do not iron directly on the print. Final care instructions
                will depend on the chosen fabric and print method.
              </p>
            </Accordion>
            <Accordion title="Delivery and returns">
              <p>
                Demo delivery is ৳80, or free on orders of ৳2,500 after
                discount. This preview does not dispatch products.{" "}
                <Link to="/help">Read the demo policies.</Link>
              </p>
            </Accordion>
            <div id="sizing">
              <Accordion title="Find your size">
                <SizeGuide />
              </Accordion>
            </div>
          </div>
        </div>
      </div>
      <section className="related">
        <div className="section-heading">
          <h2>Keep good company.</h2>
          <Link className="text-link" to="/shop">
            See everything <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.id !== id)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
    </div>
  );
}

export function Studio() {
  const { products, loading, error, addItem } = useStore();
  const [params] = useSearchParams();
  const [productId, setProductId] = useState(
      params.get("product") || "blank-canvas",
    ),
    [size, setSize] = useState("M"),
    [colour, setColour] = useState("Bone"),
    [text, setText] = useState("MAKE IT\nYOURS."),
    [ink, setInk] = useState("#fa552d"),
    [font, setFont] = useState("bold"),
    [placement, setPlacement] = useState("Front"),
    [artwork, setArtwork] = useState(null),
    [fileName, setFileName] = useState(""),
    [message, setMessage] = useState("");
  const fileInput = useRef();
  const product = products.find((p) => p.id === productId) || products[0];
  useEffect(() => {
    if (product && !product.colours.includes(colour)) setColour(product.colour);
  }, [productId, products]);
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 1000000
    ) {
      setMessage("Choose a PNG, JPEG, or WebP image smaller than 1 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setArtwork(reader.result);
      setFileName(file.name);
      setMessage("");
    };
    reader.onerror = () =>
      setMessage("The image could not be read. Please choose another file.");
    reader.readAsDataURL(file);
  }
  function add() {
    if (!text.trim() && !artwork) {
      setMessage("Add a few words or upload artwork first.");
      return;
    }
    addItem(product, {
      size,
      colour: product.colours.includes(colour) ? colour : product.colour,
      quantity: 1,
      customization: { text, ink, font, placement, artwork },
    });
    setMessage("");
  }
  if (loading || error) return <CatalogState />;
  if (!product)
    return (
      <Empty
        title="The studio needs a canvas."
        text="Add products to get started."
      />
    );
  return (
    <div className="page section">
      <PageHeading title="Your idea. Your canvas.">
        A little personal expression goes a long way. Let’s make something
        yours.
      </PageHeading>
      <div className="studio-layout">
        <div className="studio-preview">
          <div className="preview-toolbar">
            <span>
              <i className="live-dot" />
              Live layout preview
            </span>
            <span>{placement} print</span>
          </div>
          <div
            className={`preview-garment ${product.category === "Hoodies" ? "hoodie-preview" : ""}`}
          >
            <img
              src={`/images/${product.category === "Hoodies" ? "hoodie.jpg" : "white-tee.jpg"}`}
              alt="Garment reference with your custom artwork preview"
            />
            <div
              className={`print-overlay print-${font}`}
              style={{ color: ink }}
            >
              {artwork && <img src={artwork} alt="Your uploaded artwork" />}
              {text && <span>{text}</span>}
            </div>
          </div>
          <div className="preview-footer">
            <span>
              <i style={{ background: colourHex(colour) }} />
              {colour} / {size}
            </span>
            <span>Layout concept, not a final print proof</span>
          </div>
          <p className="small-note">
            Reference photo only. Your selected colour and print placement are
            recorded for review; the preview does not simulate the final
            garment.
          </p>
        </div>
        <div className="studio-controls">
          <div className="control-section">
            <h2>Start with a good canvas.</h2>
            <label className="field">
              <span>Your garment</span>
              <select
                value={product.id}
                onChange={(e) => setProductId(e.target.value)}
              >
                {products.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name} — {money(p.price)}
                  </option>
                ))}
              </select>
            </label>
            <div className="two-fields">
              <label className="field">
                <span>Colour</span>
                <select
                  value={
                    product.colours.includes(colour) ? colour : product.colour
                  }
                  onChange={(e) => setColour(e.target.value)}
                >
                  {product.colours.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Size</span>
                <select value={size} onChange={(e) => setSize(e.target.value)}>
                  {product.sizes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="control-section">
            <h2>Make a statement.</h2>
            <label className="field">
              <span>
                Your words <small>{text.length}/35</small>
              </span>
              <textarea
                rows={2}
                maxLength={35}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Something only you would say"
              />
            </label>
            <div className="font-options">
              {[
                ["bold", "Bold"],
                ["serif", "Editorial"],
                ["mono", "Typewriter"],
              ].map(([v, label]) => (
                <button
                  key={v}
                  className={`${font === v ? "chosen" : ""} print-${v}`}
                  onClick={() => setFont(v)}
                  aria-pressed={font === v}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="option-label">Print colour</div>
            <div className="ink-options">
              {[
                ["#fa552d", "Orange"],
                ["#20211e", "Ink"],
                ["#f6f0dd", "Cream"],
                ["#a9c576", "Sage"],
              ].map(([c, label]) => (
                <button
                  key={c}
                  aria-label={`${label} print`}
                  aria-pressed={ink === c}
                  onClick={() => setInk(c)}
                  style={{ background: c }}
                  className={ink === c ? "chosen" : ""}
                >
                  {ink === c && (
                    <Check
                      size={17}
                      color={c === "#20211e" ? "white" : "#20211e"}
                    />
                  )}
                </button>
              ))}
            </div>
            <input
              type="file"
              ref={fileInput}
              className="sr-only"
              accept="image/png,image/jpeg,image/webp"
              onChange={upload}
            />
            <button
              className="upload-button"
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={20} />
              <span>
                {fileName || "Or upload your own artwork"}
                <small>PNG, JPG or WebP · Up to 1 MB</small>
              </span>
              <Plus size={17} />
            </button>
            {artwork && (
              <button
                className="text-button"
                onClick={() => {
                  setArtwork(null);
                  setFileName("");
                  if (fileInput.current) fileInput.current.value = "";
                }}
              >
                Remove artwork
              </button>
            )}
          </div>
          <div className="control-section">
            <div className="option-label">Print placement</div>
            <div className="size-options">
              {["Front", "Back"].map((p) => (
                <button
                  key={p}
                  className={placement === p ? "chosen" : ""}
                  onClick={() => setPlacement(p)}
                  aria-pressed={placement === p}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="studio-total">
              <span>
                Your one-of-a-kind piece
                <small>Garment + {money(250)} custom print</small>
              </span>
              <strong>{money(product.price + 250)}</strong>
            </div>
            <ErrorMessage>{message}</ErrorMessage>
            <button className="button full-width" onClick={add}>
              Add your creation to bag <ArrowRight size={19} />
            </button>
            <p className="small-note">
              Custom orders enter artwork review. Upload only artwork you own or
              have permission to use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

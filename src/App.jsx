import { useState, useEffect, useCallback, useRef } from "react";

// Config
const ADMIN_PIN  = "1004";
const ORDERS_KEY = "sj-orders-v6";
const MENU_KEY   = "sj-menu-v6";
const CATS_KEY   = "sj-cats-v6";
const TABLE_KEY  = "sj-table-v6";
const MAIN_KEY   = "sj-main-v6";
const CALLS_KEY  = "sj-calls-v6";
const NUM_TABLES = 15;
const TABLES     = Array.from({ length: NUM_TABLES }, (_, i) => i + 1);

// Category styles
const CAT_STYLE = {
  "Set Meals":  { from: "#2d1a0e", to: "#1a0f06", accent: "#e8924a" },
  "Extras":     { from: "#0e1f12", to: "#091309", accent: "#5ec97a" },
  "Drinks":     { from: "#0d1520", to: "#070e17", accent: "#5a9ee8" },
  "Beverages":  { from: "#1a1020", to: "#110916", accent: "#b07de0" },
};
const DEF_CAT = { from: "#1a1a1a", to: "#111111", accent: "#d4952c" };

// Default data
const DEFAULT_CATS = ["Set Meals", "Extras", "Drinks", "Beverages"];
const DEFAULT_MENU = [
  { id: "b1", cat: "Set Meals",  name: "Bulgogi Set",           sub: "Korean Beef BBQ",     price: 33, emoji: "\uD83E\uDD69", desc: "Marinated beef, 7 sides, rice, soup",  img: "", soldOut: false },
  { id: "b2", cat: "Set Meals",  name: "Spicy Pork Set",        sub: "Jeyuk Bokkeum",       price: 33, emoji: "\uD83C\uDF36\uFE0F", desc: "Spicy pork, 7 sides, rice, soup",     img: "", soldOut: false },
  { id: "b3", cat: "Set Meals",  name: "Chicken Galbi Set",     sub: "Chuncheon Style",     price: 33, emoji: "\uD83C\uDF57", desc: "Spicy chicken, 7 sides, rice, soup",  img: "", soldOut: false },
  { id: "b4", cat: "Set Meals",  name: "Tofu Stir-fry Set",     sub: "Dubu Bokkeum",        price: 33, emoji: "\uD83C\uDF3F", desc: "Tofu kimchi, 7 sides, rice, soup",    img: "", soldOut: false },
  { id: "e1", cat: "Extras",     name: "Spring Onion Pancake",  sub: "Pa-jeon",             price: 16, emoji: "\uD83E\uDD5E", desc: "Crispy green onion pancake",          img: "", soldOut: false },
  { id: "e2", cat: "Extras",     name: "Kimchi Pancake",        sub: "Kimchi-jeon",         price: 16, emoji: "\uD83E\uDED3", desc: "Crispy aged kimchi pancake",          img: "", soldOut: false },
  { id: "e3", cat: "Extras",     name: "Extra Rice",            sub: "Gong-gi-bap",         price: 2,  emoji: "\uD83C\uDF5A", desc: "Steamed white rice",                  img: "", soldOut: false },
  { id: "d1", cat: "Drinks",     name: "Soju",                  sub: "Chamisul",            price: 12, emoji: "\uD83C\uDF76", desc: "Korean distilled spirit",             img: "", soldOut: false },
  { id: "d2", cat: "Drinks",     name: "Korean Beer",           sub: "Cass / Terra",        price: 10, emoji: "\uD83C\uDF7A", desc: "330ml chilled",                       img: "", soldOut: false },
  { id: "d3", cat: "Drinks",     name: "Makgeolli",             sub: "Rice Wine",           price: 12, emoji: "\uD83E\uDEA3", desc: "750ml traditional rice wine",         img: "", soldOut: false },
  { id: "v1", cat: "Beverages",  name: "Coke",                  sub: "355ml",               price: 4,  emoji: "\uD83E\uDD64", desc: "",                                    img: "", soldOut: false },
  { id: "v2", cat: "Beverages",  name: "Still Water",           sub: "Complimentary",       price: 0,  emoji: "\uD83D\uDCA7", desc: "Free",                                img: "", soldOut: false },
];

// Storage
const db = {
  get:    (k)    => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set:    (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (k)    => { try { localStorage.removeItem(k); } catch {} },
};

// Receipt printer (no template literals)
function makeReceipt(order) {
  const style = [
    "*{margin:0;padding:0;box-sizing:border-box}",
    "body{font-family:'Courier New',monospace;font-size:14px;width:80mm;padding:6mm}",
    ".c{text-align:center}",
    ".logo{font-size:20px;font-weight:900;letter-spacing:4px}",
    ".hr{border:none;border-top:1px dashed #aaa;margin:7px 0}",
    ".row{display:flex;justify-content:space-between;margin:4px 0}",
    ".b{font-weight:700}",
    ".note{background:#f5f5f5;padding:5px 8px;font-style:italic;font-size:11px;margin-top:5px;border-radius:3px}",
    "@media print{@page{margin:0;size:80mm auto}}",
  ].join("");

  const rows = order.items.map(function(i) {
    return "<div class=\"row\"><span style=\"flex:1\">" + i.name + "</span><span style=\"margin:0 8px;color:#999\">x" + i.qty + "</span><span>$" + (i.price * i.qty).toFixed(2) + "</span></div>";
  }).join("");

  const noteHtml = order.note ? "<div class=\"note\">Note: " + order.note + "</div>" : "";

  const scriptTag = "<scr" + "ipt>window.onload=function(){window.print();setTimeout(function(){window.close();},700);}</scr" + "ipt>";

  return "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>" + style + "</style></head><body>"
    + "<div class=\"c\"><div class=\"logo\">SEOUL JIB</div><div style=\"font-size:10px;color:#777;margin-top:2px\">270 St Asaph St, Christchurch</div></div>"
    + "<hr class=\"hr\">"
    + "<div class=\"row\"><span class=\"b\" style=\"font-size:15px\">Table " + order.table + "</span><span>" + order.time + "</span><span style=\"color:#bbb\">#" + order.id.slice(-5) + "</span></div>"
    + "<hr class=\"hr\">"
    + rows
    + noteHtml
    + "<hr class=\"hr\">"
    + "<div class=\"row b\" style=\"font-size:16px\"><span>TOTAL</span><span>$" + order.total.toFixed(2) + "</span></div>"
    + "<hr class=\"hr\">"
    + "<div class=\"c\" style=\"margin-top:10px;font-size:11px;color:#888\">Thank you for dining with us</div>"
    + scriptTag
    + "</body></html>";
}

// Sound
let audioCtx = null;
function playBeep(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var ctx = audioCtx;

    function tone(freq, startT, dur, vol, wave) {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      var dist = ctx.createWaveShaper();
      // Soft distortion for more punch
      var curve = new Float32Array(256);
      for (var i = 0; i < 256; i++) {
        var x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 300) * x / (Math.PI + 300 * Math.abs(x));
      }
      dist.curve = curve;
      o.type = wave || "square";
      o.frequency.value = freq;
      o.connect(dist);
      dist.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0, ctx.currentTime + startT);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + startT + 0.01);
      g.gain.setValueAtTime(vol, ctx.currentTime + startT + dur - 0.05);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + startT + dur);
      o.start(ctx.currentTime + startT);
      o.stop(ctx.currentTime + startT + dur + 0.01);
    }

    if (type === "call") {
      // CALL STAFF: urgent alarm — 4 rapid double-beeps
      var t = 0;
      for (var i = 0; i < 4; i++) {
        tone(1400, t,       0.08, 1.0, "square");
        tone(1400, t+0.10, 0.08, 1.0, "square");
        t += 0.28;
      }
    } else {
      // NEW ORDER: 3-note descending chime, loud and clear
      tone(1046, 0.00, 0.22, 1.0, "sine"); // C6
      tone(880,  0.20, 0.22, 1.0, "sine"); // A5
      tone(698,  0.40, 0.35, 1.0, "sine"); // F5
    }
  } catch (e) {}
}

// Design tokens
const C = {
  bg: "#0a0b0b", surf: "#111314", card: "#161819", bdr: "#22282a",
  gold: "#d4952c", gLt: "#f2bd52", gDk: "#a87220",
  red: "#c0392b", grn: "#27ae60", txt: "#ece7de", sub: "#8a8278", dim: "#2a3030",
};
const F = "'Outfit', system-ui, sans-serif";

function gBtn(full) {
  return {
    background: "linear-gradient(135deg," + C.gold + "," + C.gDk + ")",
    color: "#fff", fontWeight: 700, border: "none", borderRadius: 16,
    padding: "18px 28px", fontSize: 17, cursor: "pointer", fontFamily: F,
    boxShadow: "0 6px 24px rgba(212,149,44,.28)",
    width: full ? "100%" : undefined,
  };
}
function dBtn(full) {
  return {
    background: C.card, color: C.txt, fontWeight: 600,
    border: "1.5px solid " + C.bdr, borderRadius: 16,
    padding: "16px 22px", fontSize: 16, cursor: "pointer", fontFamily: F,
    width: full ? "100%" : undefined,
  };
}
function pill(on) {
  return {
    padding: "10px 20px", borderRadius: 24,
    border: "1.5px solid " + (on ? C.gold : C.bdr),
    background: on ? C.gold : "transparent",
    color: on ? "#fff" : C.sub,
    fontWeight: on ? 700 : 400, fontSize: 15,
    cursor: "pointer", transition: "all .15s",
    whiteSpace: "nowrap", fontFamily: F,
  };
}

const CSS = [
  "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');",
  "@keyframes spu { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }",
  "@keyframes pop { 0% { transform: scale(.5); opacity: 0; } 70% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }",
  "@keyframes bnc { 0% { transform: scale(1); } 35% { transform: scale(.92); } 70% { transform: scale(1.07); } 100% { transform: scale(1); } }",
  "@keyframes pls { 0%,100% { box-shadow: 0 0 0 0 rgba(231,76,60,.8); } 50% { box-shadow: 0 0 0 16px rgba(231,76,60,0); } }",
  "@keyframes cglow { 0%,100% { background: transparent; border-color: #22282a; color: #8a8278; } 50% { background: rgba(192,57,43,.22); border-color: #c0392b; color: #ff6b6b; box-shadow: 0 0 20px rgba(192,57,43,.5); } }",
  ".sj-c:active { transform: scale(.96); }",
  ".sj-q:active { transform: scale(.86); }",
  ".sj-t:active { transform: scale(.92); }",
  ".sj-bdg { animation: pop .25s cubic-bezier(.34,1.56,.64,1) both; }",
  ".sj-cst { animation: cglow .8s ease infinite !important; border-color: #c0392b !important; color: #ff6b6b !important; }",
].join("\n");

const LOGO_IMG = "data:image/png;base64,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";

const pg  = { minHeight: "100dvh", background: C.bg, color: C.txt, fontFamily: F, display: "flex", flexDirection: "column", userSelect: "none", WebkitUserSelect: "none" };
const hdr = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid " + C.bdr, background: C.bg, position: "sticky", top: 0, zIndex: 100 };
const inp = { width: "100%", background: C.card, border: "1.5px solid " + C.bdr, color: C.txt, padding: "13px 16px", borderRadius: 12, fontSize: 15, fontFamily: F, boxSizing: "border-box", outline: "none" };

// Blank item factory
function blankItem(cat) {
  return { id: "i" + Date.now(), cat: cat, name: "", sub: "", price: 0, emoji: "\uD83C\uDF7D\uFE0F", desc: "", img: "", soldOut: false };
}

// ─── MAIN APP ──────────────────────────────────────────────
export default function App() {
  // Inject CSS once
  useEffect(function() {
    if (document.getElementById("sj-css")) return;
    const s = document.createElement("style");
    s.id = "sj-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  const [mode,       setMode]       = useState("home");
  const [tableNum,   setTableNum]   = useState(function() { return db.get(TABLE_KEY); });
  const [isMain,     setIsMain]     = useState(function() { return !!db.get(MAIN_KEY); });
  const [menu,       setMenu]       = useState(function() { return db.get(MENU_KEY) || DEFAULT_MENU; });
  const [cats,       setCats]       = useState(function() { return db.get(CATS_KEY) || DEFAULT_CATS; });
  const [orders,     setOrders]     = useState(function() { return db.get(ORDERS_KEY) || []; });
  const [calls,      setCalls]      = useState(function() { return db.get(CALLS_KEY) || []; });
  const [cart,       setCart]       = useState([]);
  const [note,       setNote]       = useState("");
  const [cat,        setCat]        = useState(function() { return (db.get(CATS_KEY) || DEFAULT_CATS)[0]; });
  const [ktab,       setKtab]       = useState("pending");
  const [pin,        setPin]        = useState("");
  const [unlocked,   setUnlocked]   = useState(false);
  const [adminTab,   setAdminTab]   = useState("menu");
  const [editItem,   setEditItem]   = useState(null);
  const [isNewItem,  setIsNewItem]  = useState(false);
  const [justAdded,  setJustAdded]  = useState(null);
  const [toast,      setToast]      = useState("");
  const [setupMode,  setSetupMode]  = useState(false);
  const [setupNum,   setSetupNum]   = useState(1);
  const [battery,    setBattery]    = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const prevCount = useRef(0);
  const pollRef   = useRef(null);

  // Battery
  useEffect(function() {
    if (navigator.getBattery) {
      navigator.getBattery().then(function(b) {
        setBattery(Math.round(b.level * 100));
        b.addEventListener("levelchange", function() { setBattery(Math.round(b.level * 100)); });
      });
    }
  }, []);

  // Save helpers
  const saveOrders = useCallback(function(next) { setOrders(next); db.set(ORDERS_KEY, next); }, []);
  const saveMenu   = useCallback(function(next) { setMenu(next);   db.set(MENU_KEY,   next); }, []);
  const saveCats   = useCallback(function(next) { setCats(next);   db.set(CATS_KEY,   next); }, []);
  const saveCalls  = useCallback(function(next) { setCalls(next);  db.set(CALLS_KEY,  next); }, []);

  // Toast
  function showToast(msg) { setToast(msg); setTimeout(function() { setToast(""); }, 2200); }

  // Poll for kitchen
  const poll = useCallback(function() {
    const loaded = db.get(ORDERS_KEY);
    if (!loaded) return;
    const pend = loaded.filter(function(o) { return o.status === "pending"; });
    if (pend.length > prevCount.current) {
      playBeep("order");
    }
    prevCount.current = pend.length;
    setOrders(loaded);
    const loadedCalls = db.get(CALLS_KEY);
    if (loadedCalls) setCalls(loadedCalls);
  }, []);

  useEffect(function() {
    if (mode === "kitchen") {
      poll();
      pollRef.current = setInterval(poll, 3000);
    } else {
      clearInterval(pollRef.current);
    }
    return function() { clearInterval(pollRef.current); };
  }, [mode, poll]);

  // Cart helpers
  function addToCart(item) {
    if (item.soldOut) return;
    setCart(function(p) {
      const ex = p.find(function(c) { return c.id === item.id; });
      return ex
        ? p.map(function(c) { return c.id === item.id ? Object.assign({}, c, { qty: c.qty + 1 }) : c; })
        : p.concat([Object.assign({}, item, { qty: 1 })]);
    });
    setJustAdded(item.id);
    setTimeout(function() { setJustAdded(null); }, 300);
  }
  function setQty(id, delta) {
    setCart(function(p) {
      const ex = p.find(function(c) { return c.id === id; });
      if (!ex) return p;
      if (ex.qty + delta <= 0) return p.filter(function(c) { return c.id !== id; });
      return p.map(function(c) { return c.id === id ? Object.assign({}, c, { qty: c.qty + delta }) : c; });
    });
  }
  const cartCount = cart.reduce(function(s, c) { return s + c.qty; }, 0);
  const cartTotal = cart.reduce(function(s, c) { return s + c.price * c.qty; }, 0);

  function submitOrder() {
    if (!cart.length) return;
    const order = {
      id: Date.now().toString(),
      table: tableNum,
      items: cart.map(function(c) { return { id: c.id, name: c.name, price: c.price, qty: c.qty }; }),
      note: note,
      total: cartTotal,
      status: "pending",
      time: new Date().toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" }),
      ts: Date.now(),
    };
    saveOrders(orders.concat([order]));
    setCart([]); setNote(""); setMode("done");
  }

  function callStaff() {
    playBeep("call");
    const c = {
      id: Date.now().toString(), table: tableNum,
      time: new Date().toLocaleTimeString("en-NZ", { hour: "2-digit", minute: "2-digit" }),
      done: false,
    };
    saveCalls(calls.concat([c]));
    setCallActive(true);
    setTimeout(function() { setCallActive(false); }, 6000);
    showToast("Staff called");
  }

  function printOrder(order) {
    const w = window.open("", "_blank", "width=430,height=640");
    if (w) { w.document.write(makeReceipt(order)); w.document.close(); }
  }

  const pending    = orders.filter(function(o) { return o.status === "pending"; });
  const doneOrders = orders.filter(function(o) { return o.status === "done"; });
  const activeCalls = calls.filter(function(c) { return !c.done; });

  function confirmTableSetup(num) {
    db.set(TABLE_KEY, num);
    setTableNum(num);
    setSetupMode(false);
    setCat((db.get(CATS_KEY) || DEFAULT_CATS)[0]);
    setMode("order");
  }

  function saveEditItem() {
    if (!editItem.name.trim()) { showToast("Name is required"); return; }
    if (isNewItem) saveMenu(menu.concat([editItem]));
    else saveMenu(menu.map(function(m) { return m.id === editItem.id ? editItem : m; }));
    setEditItem(null); setIsNewItem(false);
    showToast(isNewItem ? "Item added" : "Item updated");
  }

  // ── Setup Modal
  function SetupModal() {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
        <div style={{ background: C.surf, border: "1.5px solid " + C.bdr, borderRadius: 24, padding: "36px 28px", width: "92%", maxWidth: 440, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Set Table Number</div>
          <div style={{ color: C.sub, fontSize: 15, marginBottom: 24 }}>One-time setup for this tablet</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 24 }}>
            {TABLES.map(function(t) {
              return (
                <button key={t} className="sj-t" onClick={function() { setSetupNum(t); }}
                  style={{ background: setupNum === t ? C.gold : C.card, border: "2px solid " + (setupNum === t ? C.gold : C.bdr), color: setupNum === t ? "#fff" : C.gLt, fontSize: 24, fontWeight: 800, padding: "18px 0", borderRadius: 14, cursor: "pointer", fontFamily: F, transition: "all .12s" }}>
                  {t}
                </button>
              );
            })}
          </div>
          <button style={gBtn(true)} onClick={function() { confirmTableSetup(setupNum); }}>
            Confirm — Table {setupNum}
          </button>
        </div>
      </div>
    );
  }

  // Toast component
  function Toast() {
    if (!toast) return null;
    return (
      <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.gold, color: "#fff", padding: "12px 24px", borderRadius: 24, fontWeight: 700, fontSize: 15, zIndex: 999, whiteSpace: "nowrap" }}>
        {toast}
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // HOME
  // ══════════════════════════════════════════════
  if (mode === "home") return (
    <div style={Object.assign({}, pg, { alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" })}>
      {setupMode && <SetupModal />}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 30% 40%,rgba(212,149,44,.09) 0%,transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />

      <div style={{ textAlign: "center", marginBottom: 52, position: "relative", animation: "spu .45s ease both" }}>
        <img src={LOGO_IMG} alt="Seoul Jib" style={{ width: "100%", maxWidth: 340, display: "block", margin: "0 auto" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
          <div style={{ height: 1, width: 52, background: "linear-gradient(90deg,transparent," + C.bdr + ")" }} />
          <div style={{ fontSize: 11, color: C.sub, letterSpacing: 4, fontWeight: 500 }}>THE SEOUL STANDARD</div>
          <div style={{ height: 1, width: 52, background: "linear-gradient(90deg," + C.bdr + ",transparent)" }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 380, padding: "0 24px", animation: "spu .45s .08s ease both" }}>
        <button style={gBtn(true)} onClick={function() {
          if (tableNum) { setCat((db.get(CATS_KEY) || DEFAULT_CATS)[0]); setCart([]); setNote(""); setMode("order"); }
          else setSetupMode(true);
        }}>
          {tableNum ? "Order Now \u00b7 Table " + tableNum : "Order Now"}
        </button>
        {isMain && (
          <button style={Object.assign({}, dBtn(true), { position: "relative" })} onClick={function() { setMode("kitchen"); }}>
            {"🍳 Kitchen Display"}
            {(pending.length + activeCalls.length) > 0 && (
              <span className="sj-bdg" style={{ position: "absolute", top: -8, right: -8, background: C.red, color: "#fff", borderRadius: "50%", minWidth: 26, height: 26, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
                {pending.length + activeCalls.length}
              </span>
            )}
          </button>
        )}
        {isMain && (
          <button style={dBtn(true)} onClick={function() { setMode("admin"); }}>
            {"⚙️ Menu Management"}
          </button>
        )}
        {!isMain && (
          <button style={Object.assign({}, dBtn(true), { opacity: .5, fontSize: 14 })} onClick={function() { setMode("admin"); }}>
            {"⚙️ Settings"}
          </button>
        )}
      </div>

      <div style={{ position: "absolute", bottom: 24, display: "flex", gap: 18, alignItems: "center" }}>
        {tableNum && (
          <div style={{ color: C.dim, fontSize: 12, letterSpacing: 2, fontWeight: 500 }}>
            {"TABLE " + tableNum + " "}
            <span style={{ cursor: "pointer", color: C.sub, textDecoration: "underline" }} onClick={function() { setSetupMode(true); }}>change</span>
          </div>
        )}
        {battery !== null && (
          <div style={{ fontSize: 12, fontWeight: 600, color: battery <= 20 ? "#e74c3c" : battery <= 40 ? "#e8924a" : C.dim }}>
            {"🔋 " + battery + "%"}
          </div>
        )}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════
  // ORDER
  // ══════════════════════════════════════════════
  if (mode === "order") {
    const displayMenu = menu.filter(function(m) { return m.cat === cat; });
    return (
      <div style={Object.assign({}, pg, { flexDirection: "row", height: "100dvh", overflow: "hidden" })}>

        {/* Sidebar */}
        <div style={{ width: 150, background: C.surf, borderRight: "1px solid " + C.bdr, display: "flex", flexDirection: "column", alignItems: "center", padding: "18px 0", gap: 4, flexShrink: 0, overflowY: "auto" }}>
          <div style={{ fontSize: 9, color: C.dim, letterSpacing: 3, marginBottom: 12, fontWeight: 700 }}>MENU</div>
          {cats.map(function(c) {
            const on = cat === c;
            return (
              <button key={c} onClick={function() { setCat(c); }}
                style={{ width: 132, padding: "16px 8px", border: "none", borderRadius: 12, background: on ? C.red : "transparent", color: on ? "#fff" : C.sub, fontWeight: on ? 800 : 500, fontSize: 16, cursor: "pointer", transition: "all .15s", fontFamily: F, textAlign: "center", lineHeight: 1.2 }}>
                {c}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <div style={{ color: C.dim, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{"T." + tableNum}</div>
        </div>

        {/* Menu grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14, alignContent: "start" }}>
          {displayMenu.map(function(item) {
            const inCart = cart.find(function(c) { return c.id === item.id; });
            const cs = CAT_STYLE[item.cat] || DEF_CAT;
            const wasAdded = justAdded === item.id;
            return (
              <div key={item.id} className="sj-c"
                style={{ background: C.card, border: "2px solid " + (inCart ? C.gold : C.bdr), borderRadius: 20, overflow: "hidden", cursor: item.soldOut ? "default" : "pointer", opacity: item.soldOut ? 0.4 : 1, position: "relative", animation: wasAdded ? "bnc .28s ease both" : "none", transition: "border-color .15s" }}>

                {/* Hero */}
                <div style={{ height: 300, background: "linear-gradient(145deg," + cs.from + "," + cs.to + ")", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", width: 110, height: 110, borderRadius: "50%", background: "radial-gradient(circle," + cs.accent + "28 0%,transparent 70%)" }} />
                  {item.img
                    ? <img src={item.img} alt={item.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 64, position: "relative" }}>{item.emoji}</span>
                  }
                </div>

                {inCart && (
                  <div className="sj-bdg" style={{ position: "absolute", top: 10, right: 10, background: C.gold, color: "#fff", borderRadius: "50%", width: 32, height: 32, fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 10px rgba(0,0,0,.5)" }}>
                    {inCart.qty}
                  </div>
                )}
                {item.soldOut && (
                  <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,.8)", color: C.sub, borderRadius: 6, padding: "4px 10px", fontSize: 13, fontWeight: 700 }}>SOLD OUT</div>
                )}

                <div style={{ padding: "16px 16px 18px" }}>
                  <div style={{ fontWeight: 800, fontSize: 19, lineHeight: 1.3 }}>{item.name}</div>
                  <div style={{ color: C.sub, fontSize: 14, marginTop: 3 }}>{item.sub}</div>
                  {item.desc && <div style={{ color: "#3e4545", fontSize: 13, marginTop: 5, lineHeight: 1.5 }}>{item.desc}</div>}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                    <div style={{ background: cs.accent + "22", border: "1.5px solid " + cs.accent + "55", borderRadius: 10, padding: "6px 14px", color: C.gLt, fontWeight: 900, fontSize: 22 }}>
                      {item.price === 0 ? "Free" : "$" + item.price}
                    </div>
                    {!item.soldOut && (inCart ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="sj-q" onClick={function(e) { e.stopPropagation(); setQty(item.id, -1); }}
                          style={{ background: C.dim, border: "1.5px solid " + C.bdr, color: C.txt, width: 44, height: 44, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
                          {"\u2212"}
                        </button>
                        <span style={{ fontWeight: 900, fontSize: 20, minWidth: 24, textAlign: "center" }}>{inCart.qty}</span>
                        <button className="sj-q" onClick={function(e) { e.stopPropagation(); addToCart(item); }}
                          style={{ background: C.gold, border: "none", color: "#fff", width: 44, height: 44, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
                          {"+"}
                        </button>
                      </div>
                    ) : (
                      <button onClick={function() { addToCart(item); }}
                        style={{ background: C.gold, border: "none", color: "#fff", width: 48, height: 48, borderRadius: "50%", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(212,149,44,.4)", transition: "transform .1s" }}>
                        {"+"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart */}
        <div style={{ width: 320, background: C.surf, borderLeft: "1px solid " + C.bdr, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid " + C.bdr, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Your Order</div>
              {cartCount > 0 && <div style={{ color: C.sub, fontSize: 13 }}>{cartCount + " item" + (cartCount > 1 ? "s" : "")}</div>}
            </div>
            <button style={{ background: "none", border: "none", color: C.gLt, fontSize: 22, cursor: "pointer", padding: "4px" }} onClick={function() { setCart([]); setNote(""); setMode("home"); }}>
              {"\\u2190"}
            </button>
          </div>
          {(function() {
            var tp = orders.filter(function(o) { return o.table === tableNum && o.status === "pending"; });
            if (!tp.length) return null;
            var tot = tp.reduce(function(s,o){return s+o.total;},0);
            var allItems = [];
            tp.forEach(function(o){o.items.forEach(function(i){allItems.push(i);});});
            return (
              <div style={{background:"#0d1a0d",borderBottom:"1px solid #1a3a1a",padding:"10px 16px 12px"}}>
                <div style={{marginBottom:6}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#4dca4d",letterSpacing:1}}>ORDER SENT</span>
                </div>
                {allItems.map(function(item,i){return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#5a9a5a",padding:"2px 0"}}>
                    <span>{item.name}</span><span>{"x"+item.qty}</span>
                  </div>
                );})}
              </div>
            );
          })()}
          <div style={{ flex: 1, overflowY: "auto" }}>>
            {cart.length === 0 && (
              <div style={{ textAlign: "center", color: C.dim, padding: "48px 20px 0", fontSize: 14, lineHeight: 2 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
                Select items from the menu
              </div>
            )}
            {cart.map(function(item) {
              return (
                <div key={item.id} style={{ padding: "14px 16px", borderBottom: "1px solid " + C.bdr }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 16, flex: 1, lineHeight: 1.3 }}>{item.name}</span>
                    <span style={{ color: C.gLt, fontWeight: 700, fontSize: 16, marginLeft: 8 }}>{"$" + (item.price * item.qty).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button className="sj-q" onClick={function() { setQty(item.id, -1); }}
                      style={{ background: C.dim, border: "1.5px solid " + C.bdr, color: C.txt, width: 44, height: 44, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
                      {"\u2212"}
                    </button>
                    <span style={{ fontWeight: 800, fontSize: 20, minWidth: 28, textAlign: "center" }}>{item.qty}</span>
                    <button className="sj-q" onClick={function() { setQty(item.id, +1); }}
                      style={{ background: C.dim, border: "1.5px solid " + C.bdr, color: C.txt, width: 44, height: 44, borderRadius: "50%", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
                      {"+"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid " + C.bdr }}>
            <textarea placeholder="Special requests or allergies..." value={note} onChange={function(e) { setNote(e.target.value); }}
              style={{ width: "100%", background: C.card, border: "1px solid " + C.bdr, color: C.txt, padding: "11px 13px", borderRadius: 12, fontSize: 14, minHeight: 52, resize: "none", fontFamily: F, boxSizing: "border-box" }} />
          </div>
          <div style={{ padding: "12px 14px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
              <span>Total</span>
              <span style={{ color: C.gLt }}>{(function() {
                var placed = orders.filter(function(o){return o.table===tableNum&&o.status==="pending";}).reduce(function(s,o){return s+o.total;},0);
                return "$" + (cartTotal + placed).toFixed(2);
              })()}</span>
            </div>
            <button style={Object.assign({}, gBtn(true), { padding: "20px", fontSize: 19, opacity: cart.length ? 1 : 0.35, cursor: cart.length ? "pointer" : "default" })}
              onClick={submitOrder} disabled={!cart.length}>
              Place Order
            </button>
            <button
              className={callActive ? "sj-cst" : ""}
              onClick={callStaff}
              style={{ width: "100%", marginTop: 12, padding: "16px", background: "transparent", border: "1.5px solid " + C.bdr, borderRadius: 16, color: C.sub, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: F, transition: "all .15s" }}>
              {"🔔  Call Staff"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // DONE
  // ══════════════════════════════════════════════
  if (mode === "done") return (
    <div style={Object.assign({}, pg, { alignItems: "center", justifyContent: "center", gap: 16 })}>
      <div style={{ fontSize: 86, animation: "pop .4s cubic-bezier(.34,1.56,.64,1) both" }}>✅</div>
      <div style={{ fontSize: 30, fontWeight: 900, animation: "spu .35s .08s ease both" }}>Order Placed!</div>
      <div style={{ color: C.sub, fontSize: 16 }}>{"Table " + tableNum + " \u00b7 We\u2019ll be right with you"}</div>
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <button style={Object.assign({}, gBtn(), { fontSize: 16 })} onClick={function() { setCat(cats[0]); setMode("order"); }}>Add More</button>
        <button style={Object.assign({}, dBtn(), { fontSize: 16 })} onClick={function() { setMode("order"); }}>Done</button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════
  // KITCHEN
  // ══════════════════════════════════════════════
  if (mode === "kitchen") {
    const now = Date.now();
    const showOrders = ktab === "pending" ? pending.slice() : doneOrders.slice();
    return (
      <div style={Object.assign({}, pg, { background: "#08090a" })}>
        <div style={Object.assign({}, hdr, { background: "#08090a" })}>
          <button style={{ background: "none", border: "none", color: C.gLt, fontSize: 22, cursor: "pointer", padding: "4px 8px" }} onClick={function() { setMode("home"); }}>
            {"\u2190"}
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={pill(ktab === "pending")} onClick={function() { setKtab("pending"); }}>
              {"🔥 Pending" + (pending.length > 0 ? " (" + pending.length + ")" : "")}
            </button>
            <button style={pill(ktab === "done")} onClick={function() { setKtab("done"); }}>
              {"✅ Done" + (doneOrders.length > 0 ? " (" + doneOrders.length + ")" : "")}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeCalls.length > 0 && (
              <div style={{ background: C.red, color: "#fff", borderRadius: 24, padding: "6px 14px", fontSize: 14, fontWeight: 700, animation: "pls 1s ease infinite" }}>
                {"🔔 " + activeCalls.length + (activeCalls.length > 1 ? " Calls" : " Call")}
              </div>
            )}
            <span style={{ color: "#1a2222", fontSize: 11 }}>live</span>
          </div>
        </div>

        {activeCalls.length > 0 && (
          <div style={{ padding: "12px 14px", borderBottom: "1px solid " + C.bdr, display: "flex", gap: 10, flexWrap: "wrap", background: "#1a0808" }}>
            {activeCalls.map(function(c) {
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#2a0f0f", border: "2px solid #c0392b", borderRadius: 12, padding: "10px 16px" }}>
                  <span style={{ fontSize: 18 }}>🔔</span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>{"Table " + c.table}</span>
                  <span style={{ color: "#888", fontSize: 13 }}>{c.time}</span>
                  <button onClick={function() { saveCalls(calls.map(function(x) { return x.id === c.id ? Object.assign({}, x, { done: true }) : x; })); }}
                    style={{ background: "#27ae60", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
                    Done
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12, alignContent: "start" }}>
          {showOrders.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#1a2222", marginTop: 80, fontSize: 15 }}>
              {ktab === "pending" ? "No pending orders" : "No completed orders yet"}
            </div>
          )}
          {showOrders.map(function(order) {
            const isNew = order.ts && (now - order.ts) < 8000;
            const mins  = order.ts ? Math.floor((now - order.ts) / 60000) : null;
            const hot   = mins !== null && mins >= 10 && ktab === "pending";
            return (
              <div key={order.id}
                style={{ background: C.card, border: "2.5px solid " + (isNew ? "#e74c3c" : hot ? "#e8924a" : ktab === "pending" ? C.gold : C.bdr), borderRadius: 18, overflow: "hidden", animation: isNew ? "pls 1s ease 3" : "none" }}>
                <div style={{ background: ktab === "pending" ? "linear-gradient(135deg," + C.gDk + ",#4a2c08)" : "#121616", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>{"Table " + order.table}</span>
                    {isNew && <span style={{ background: "#e74c3c", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>NEW</span>}
                    {hot && !isNew && <span style={{ background: "#e8924a33", color: "#e8924a", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, border: "1px solid #e8924a66" }}>{mins + "m"}</span>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "rgba(255,255,255,.6)", fontSize: 13 }}>{order.time}</div>
                    <div style={{ color: "rgba(255,255,255,.3)", fontSize: 11 }}>{"#" + order.id.slice(-4)}</div>
                  </div>
                </div>
                <div style={{ padding: "12px 16px" }}>
                  {order.items.map(function(item, i) {
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 16, fontWeight: 500, borderBottom: i < order.items.length - 1 ? "1px solid " + C.bdr : "none" }}>
                        <span>{item.name}</span>
                        <span style={{ color: C.gLt, fontWeight: 800, marginLeft: 12 }}>{"\u00d7 " + item.qty}</span>
                      </div>
                    );
                  })}
                  {order.note && (
                    <div style={{ marginTop: 10, padding: "8px 10px", background: "#1f1b10", borderRadius: 8, color: "#e8c470", fontSize: 13, borderLeft: "3px solid " + C.gold }}>
                      {"📝 " + order.note}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid " + C.bdr, color: C.sub, fontSize: 14 }}>
                    <span>Total</span>
                    <span style={{ color: C.txt, fontWeight: 700 }}>{"$" + order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quick Sold Out */}
                {ktab === "pending" && (
                  <div style={{ padding: "0 12px 10px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {order.items.map(function(item, i) {
                      const mi = menu.find(function(m) { return m.id === item.id; });
                      if (!mi || mi.soldOut) return null;
                      return (
                        <button key={i} onClick={function() {
                          saveMenu(menu.map(function(m) { return m.id === item.id ? Object.assign({}, m, { soldOut: true }) : m; }));
                          showToast(item.name + " sold out");
                        }} style={{ background: "#1a0f0f", border: "1px solid #3a2020", borderRadius: 7, color: "#cc6666", fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: "pointer", fontFamily: F }}>
                          {"🚫 " + item.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={{ padding: "0 12px 14px", display: "flex", gap: 8 }}>
                  {ktab === "pending" ? (
                    <button onClick={function() { saveOrders(orders.map(function(o) { return o.id === order.id ? Object.assign({}, o, { status: "done" }) : o; })); }}
                      style={{ flex: 2, background: "#0a2a0a", color: "#4dca4d", border: "1.5px solid #174a17", borderRadius: 10, padding: "13px", fontWeight: 700, cursor: "pointer", fontSize: 15, fontFamily: F }}>
                      {"✅ Mark Done"}
                    </button>
                  ) : (
                    <button onClick={function() { saveOrders(orders.map(function(o) { return o.id === order.id ? Object.assign({}, o, { status: "pending" }) : o; })); }}
                      style={{ flex: 2, background: "#1e1e0a", color: "#c8c84d", border: "1.5px solid #383815", borderRadius: 10, padding: "13px", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: F }}>
                      {"\u21A9 Reopen"}
                    </button>
                  )}
                  <button onClick={function() { printOrder(order); }}
                    style={{ flex: 1, background: "#0a1525", color: "#5a8acc", border: "1.5px solid #172040", borderRadius: 10, padding: "13px", fontWeight: 700, cursor: "pointer", fontSize: 15, fontFamily: F }}>
                    {"🖨️"}
                  </button>
                  {ktab === "done" && (
                    <button onClick={function() { saveOrders(orders.filter(function(o) { return o.id !== order.id; })); }}
                      style={{ flex: 1, background: "#200c0c", color: "#cc4444", border: "1.5px solid #3a1515", borderRadius: 10, padding: "13px", fontWeight: 700, cursor: "pointer", fontSize: 15, fontFamily: F }}>
                      {"🗑️"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <Toast />
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // ADMIN PIN
  // ══════════════════════════════════════════════
  if (mode === "admin" && !unlocked) return (
    <div style={Object.assign({}, pg, { alignItems: "center", justifyContent: "center", gap: 20 })}>
      <div style={{ fontSize: 52 }}>🔐</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>Admin Login</div>
      <input type="password" value={pin} onChange={function(e) { setPin(e.target.value); }} placeholder="PIN" maxLength={4}
        style={{ background: C.card, border: "1.5px solid " + C.bdr, color: C.txt, padding: "16px 24px", borderRadius: 14, fontSize: 32, textAlign: "center", width: 170, fontFamily: F, letterSpacing: 14, outline: "none" }}
        onKeyDown={function(e) {
          if (e.key === "Enter") {
            if (pin === ADMIN_PIN) { setUnlocked(true); setPin(""); }
            else { showToast("Incorrect PIN"); setPin(""); }
          }
        }}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <button style={gBtn()} onClick={function() {
          if (pin === ADMIN_PIN) { setUnlocked(true); setPin(""); }
          else { showToast("Incorrect PIN"); setPin(""); }
        }}>Enter</button>
        <button style={dBtn()} onClick={function() { setMode("home"); setPin(""); }}>Cancel</button>
      </div>
      {toast && <div style={{ color: C.red, fontWeight: 600, fontSize: 14 }}>{toast}</div>}
    </div>
  );

  // ══════════════════════════════════════════════
  // ADMIN EDIT ITEM
  // ══════════════════════════════════════════════
  if (mode === "admin" && unlocked && editItem) return (
    <div style={pg}>
      <div style={hdr}>
        <button style={{ background: "none", border: "none", color: C.gLt, fontSize: 22, cursor: "pointer", padding: "4px 8px" }} onClick={function() { setEditItem(null); setIsNewItem(false); }}>
          {"\u2190"}
        </button>
        <span style={{ fontSize: 18, fontWeight: 700 }}>{isNewItem ? "Add Item" : "Edit Item"}</span>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        <div style={{ maxWidth: 540, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Category */}
          <div>
            <div style={{ color: C.sub, fontSize: 13, marginBottom: 6 }}>Category</div>
            <select value={editItem.cat} onChange={function(e) { setEditItem(Object.assign({}, editItem, { cat: e.target.value })); }}
              style={Object.assign({}, inp, { appearance: "none" })}>
              {cats.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>

          {/* Name */}
          <div>
            <div style={{ color: C.sub, fontSize: 13, marginBottom: 6 }}>Item Name</div>
            <input value={editItem.name} onChange={function(e) { setEditItem(Object.assign({}, editItem, { name: e.target.value })); }} style={inp} />
          </div>

          {/* Subtitle */}
          <div>
            <div style={{ color: C.sub, fontSize: 13, marginBottom: 6 }}>Subtitle</div>
            <input value={editItem.sub} onChange={function(e) { setEditItem(Object.assign({}, editItem, { sub: e.target.value })); }} style={inp} />
          </div>

          {/* Description */}
          <div>
            <div style={{ color: C.sub, fontSize: 13, marginBottom: 6 }}>Description</div>
            <input value={editItem.desc} onChange={function(e) { setEditItem(Object.assign({}, editItem, { desc: e.target.value })); }} style={inp} />
          </div>

          {/* Price + Emoji */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: C.sub, fontSize: 13, marginBottom: 6 }}>Price ($NZD)</div>
              <input type="number" min="0" step="0.5" value={editItem.price}
                onChange={function(e) { setEditItem(Object.assign({}, editItem, { price: parseFloat(e.target.value) || 0 })); }}
                style={inp} />
            </div>
            <div>
              <div style={{ color: C.sub, fontSize: 13, marginBottom: 6 }}>Emoji (fallback)</div>
              <input value={editItem.emoji} onChange={function(e) { setEditItem(Object.assign({}, editItem, { emoji: e.target.value })); }}
                style={Object.assign({}, inp, { fontSize: 24, textAlign: "center" })} />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <div style={{ color: C.sub, fontSize: 13, marginBottom: 6 }}>Menu Photo</div>
            <label style={{ display: "block", cursor: "pointer" }}>
              <input type="file" accept="image/*" style={{ display: "none" }}
                onChange={function(e) {
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = function(ev) { setEditItem(Object.assign({}, editItem, { img: ev.target.result })); };
                  reader.readAsDataURL(file);
                }}
              />
              <div style={{ background: C.card, border: "1.5px dashed " + (editItem.img ? C.gold : C.bdr), borderRadius: 12, padding: "18px", textAlign: "center", color: editItem.img ? C.gLt : C.sub, fontSize: 15, fontWeight: 600, transition: "all .15s" }}>
                {editItem.img ? "📷  Change Photo" : "📷  Choose Photo from Device"}
              </div>
            </label>
            {editItem.img && (
              <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", height: 200, position: "relative" }}>
                <img src={editItem.img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={function() { setEditItem(Object.assign({}, editItem, { img: "" })); }}
                  style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.75)", border: "none", color: "#fff", borderRadius: "50%", width: 34, height: 34, fontSize: 18, cursor: "pointer", fontFamily: F }}>
                  {"x"}
                </button>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
            <button style={gBtn(true)} onClick={saveEditItem}>{isNewItem ? "Add to Menu" : "Save Changes"}</button>
            <button style={dBtn(true)} onClick={function() { setEditItem(null); setIsNewItem(false); }}>Cancel</button>
          </div>
          {!isNewItem && (
            <button style={{ width: "100%", background: "#200c0c", color: "#e05555", border: "1.5px solid #3a1515", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: F }}
              onClick={function() { saveMenu(menu.filter(function(m) { return m.id !== editItem.id; })); setEditItem(null); showToast("Deleted"); }}>
              {"🗑️ Delete Item"}
            </button>
          )}
        </div>
      </div>
      <Toast />
    </div>
  );

  // ══════════════════════════════════════════════
  // ADMIN MAIN
  // ══════════════════════════════════════════════
  if (mode === "admin" && unlocked) return (
    <div style={pg}>
      <div style={hdr}>
        <button style={{ background: "none", border: "none", color: C.gLt, fontSize: 22, cursor: "pointer", padding: "4px 8px" }}
          onClick={function() { setMode("home"); setUnlocked(false); }}>
          {"\u2190"}
        </button>
        <span style={{ fontSize: 18, fontWeight: 700 }}>Menu Management</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ display: "flex", gap: 10, padding: "14px 20px", borderBottom: "1px solid " + C.bdr, overflowX: "auto" }}>
        <button style={pill(adminTab === "menu")} onClick={function() { setAdminTab("menu"); }}>Menu Items</button>
        <button style={pill(adminTab === "cats")} onClick={function() { setAdminTab("cats"); }}>Categories</button>
        <button style={pill(adminTab === "device")} onClick={function() { setAdminTab("device"); }}>This Device</button>
      </div>

      {/* ── Menu Items ── */}
      {adminTab === "menu" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <button style={Object.assign({}, gBtn(true), { marginBottom: 20, padding: "15px" })}
              onClick={function() { setEditItem(blankItem(cats[0] || "Set Meals")); setIsNewItem(true); }}>
              {"+ Add New Item"}
            </button>
            {cats.map(function(c) {
              const catItems = menu.filter(function(m) { return m.cat === c; });
              return (
                <div key={c} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 3, marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid " + C.bdr, display: "flex", justifyContent: "space-between" }}>
                    <span>{c.toUpperCase()}</span>
                    <span style={{ color: C.dim, fontSize: 11, letterSpacing: 0 }}>{catItems.length + " items"}</span>
                  </div>
                  {catItems.map(function(item) {
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: "1px solid " + C.bdr }}>
                        {item.img
                          ? <img src={item.img} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ width: 52, height: 52, borderRadius: 10, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{item.emoji}</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 16, color: item.soldOut ? C.sub : C.txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                          <div style={{ color: C.sub, fontSize: 13 }}>{item.sub}</div>
                        </div>
                        <div style={{ color: C.gLt, fontWeight: 700, fontSize: 16, minWidth: 50, flexShrink: 0 }}>
                          {item.price === 0 ? "Free" : "$" + item.price}
                        </div>
                        <button onClick={function() { saveMenu(menu.map(function(m) { return m.id === item.id ? Object.assign({}, m, { soldOut: !m.soldOut }) : m; })); }}
                          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid " + (item.soldOut ? C.grn : C.red), background: "transparent", color: item.soldOut ? C.grn : C.red, fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: F, whiteSpace: "nowrap", flexShrink: 0 }}>
                          {item.soldOut ? "Resume" : "Sold Out"}
                        </button>
                        <button onClick={function() { setEditItem(Object.assign({}, item)); setIsNewItem(false); }}
                          style={Object.assign({}, dBtn(), { padding: "8px 14px", fontSize: 13, flexShrink: 0 })}>Edit</button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Categories ── */}
      {adminTab === "cats" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{ maxWidth: 500, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <input value={newCatName} onChange={function(e) { setNewCatName(e.target.value); }} placeholder="New category name..."
                style={Object.assign({}, inp, { flex: 1 })}
                onKeyDown={function(e) {
                  if (e.key === "Enter") {
                    const n = newCatName.trim();
                    if (!n || cats.includes(n)) return;
                    saveCats(cats.concat([n])); setNewCatName(""); showToast(n + " added");
                  }
                }}
              />
              <button style={Object.assign({}, gBtn(), { padding: "13px 20px", fontSize: 15 })} onClick={function() {
                const n = newCatName.trim();
                if (!n || cats.includes(n)) return;
                saveCats(cats.concat([n])); setNewCatName(""); showToast(n + " added");
              }}>{"+ Add"}</button>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 3, marginBottom: 14, paddingBottom: 6, borderBottom: "1px solid " + C.bdr }}>CURRENT CATEGORIES</div>
            {cats.map(function(c, i) {
              const count = menu.filter(function(m) { return m.cat === c; }).length;
              return (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid " + C.bdr }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{c}</div>
                    <div style={{ color: C.sub, fontSize: 13 }}>{count + " item" + (count !== 1 ? "s" : "")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={function() { if (i === 0) return; const n = cats.slice(); n[i-1] = n[i]; n[i] = cats[i-1]; saveCats(n); }}
                      style={Object.assign({}, dBtn(), { padding: "8px 12px", fontSize: 14, opacity: i === 0 ? 0.3 : 1 })}>{"↑"}</button>
                    <button onClick={function() { if (i === cats.length-1) return; const n = cats.slice(); n[i+1] = n[i]; n[i] = cats[i+1]; saveCats(n); }}
                      style={Object.assign({}, dBtn(), { padding: "8px 12px", fontSize: 14, opacity: i === cats.length-1 ? 0.3 : 1 })}>{"↓"}</button>
                  </div>
                  <button onClick={function() {
                    if (count > 0) { showToast("Remove items first"); return; }
                    saveCats(cats.filter(function(x) { return x !== c; }));
                  }} style={{ background: "#200c0c", color: "#e05555", border: "1.5px solid #3a1515", borderRadius: 10, padding: "8px 12px", fontSize: 14, cursor: count > 0 ? "not-allowed" : "pointer", opacity: count > 0 ? 0.4 : 1, fontFamily: F }}>
                    {"🗑️"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── This Device ── */}
      {adminTab === "device" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{ maxWidth: 500, margin: "0 auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 3, marginBottom: 18, paddingBottom: 6, borderBottom: "1px solid " + C.bdr }}>THIS TABLET</div>
            <div style={{ padding: "18px", background: C.card, borderRadius: 14, border: "1.5px solid " + C.bdr, marginBottom: 14 }}>
              <div style={{ color: C.sub, fontSize: 13, marginBottom: 4 }}>Current table</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: C.gLt }}>{tableNum ? "Table " + tableNum : "Not set"}</div>
            </div>
            <button style={gBtn(true)} onClick={function() { setSetupMode(true); }}>
              {tableNum ? "Change Table Number" : "Set Table Number"}
            </button>
            {tableNum && (
              <button style={{ width: "100%", marginTop: 10, background: "#200c0c", color: "#e05555", border: "1.5px solid #3a1515", borderRadius: 16, padding: "16px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: F }}
                onClick={function() { db.remove(TABLE_KEY); setTableNum(null); showToast("Table number cleared"); }}>
                Reset Table Assignment
              </button>
            )}
            <div style={{ height: 1, background: C.bdr, margin: "24px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: 3, marginBottom: 14 }}>MAIN TABLET</div>
            <div style={{ padding: "18px", background: C.card, borderRadius: 14, border: "1.5px solid " + (isMain ? C.gold : C.bdr), marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Kitchen &amp; Menu Access</div>
                <div style={{ color: C.sub, fontSize: 13, marginTop: 3 }}>Enable on counter tablet only</div>
              </div>
              <div onClick={function() { const next = !isMain; db.set(MAIN_KEY, next); setIsMain(next); }}
                style={{ width: 52, height: 30, borderRadius: 15, background: isMain ? C.gold : C.dim, position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: isMain ? 24 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
              </div>
            </div>
            <div style={{ padding: "14px 16px", background: "#111a14", borderRadius: 12, borderLeft: "3px solid " + C.grn, color: C.sub, fontSize: 13, lineHeight: 1.7 }}>
              Enable on the counter/kitchen tablet only. Table tablets show the order screen only.
            </div>
          </div>
        </div>
      )}

      {setupMode && <SetupModal />}
      <Toast />
    </div>
  );

  return null;
}

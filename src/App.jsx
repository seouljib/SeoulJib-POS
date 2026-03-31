import { useState, useEffect, useCallback, useRef } from "react";

// ─── Config ──────────────────────────────────────────────────
const ADMIN_PIN   = "1004";
const ORDERS_KEY  = "sj-orders-v5";
const MENU_KEY    = "sj-menu-v5";
const CATS_KEY    = "sj-cats-v5";
const TABLE_KEY   = "sj-table-num";
const MAIN_KEY    = "sj-is-main";   // marks this device as the main (kitchen) tablet
const CALLS_KEY   = "sj-calls-v5";    // call staff requests
const NUM_TABLES  = 15;
const TABLES      = Array.from({ length: NUM_TABLES }, (_, i) => i + 1);

// Logo rendered as SVG — no image file needed
const LOGO_SVG = (
  <svg viewBox="0 0 460 140" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",maxWidth:340}}>
    <text x="230" y="78" textAnchor="middle"
      fontFamily="Outfit,serif" fontWeight="900" fontSize="82" letterSpacing="3" fill="#ffffff">
      SEOUL JIB
    </text>
    <text x="356" y="122" textAnchor="middle"
      fontFamily="Noto Serif KR,serif" fontWeight="700" fontSize="38" fill="#c0392b">
      서울집
    </text>
  </svg>
);

const DEFAULT_CATS = ["Set Meals", "Extras", "Drinks", "Beverages"];
const CAT_STYLE = {
  "Set Meals": { from:"#2d1a0e", to:"#1a0f06", accent:"#e8924a", icon:"🍱" },
  "Extras":    { from:"#0e1f12", to:"#091309", accent:"#5ec97a", icon:"🥞" },
  "Drinks":    { from:"#0d1520", to:"#070e17", accent:"#5a9ee8", icon:"🍶" },
  "Beverages": { from:"#1a1020", to:"#110916", accent:"#b07de0", icon:"🥤" },
};
const DEFAULT_CAT_STYLE = { from:"#1a1a1a", to:"#111111", accent:"#d4952c", icon:"🍽️" };

const DEFAULT_MENU = [
  { id:"bulgogi",    cat:"Set Meals", name:"Bulgogi Set",          sub:"Korean Beef BBQ",        price:33, emoji:"🥩", desc:"Marinated beef · 7 side dishes · rice · soup",  img:"", soldOut:false },
  { id:"jeyuk",     cat:"Set Meals", name:"Spicy Pork Set",       sub:"Jeyuk Bokkeum",          price:33, emoji:"🌶️", desc:"Spicy stir-fried pork · 7 sides · rice · soup",  img:"", soldOut:false },
  { id:"dakgalbi",  cat:"Set Meals", name:"Chicken Galbi Set",    sub:"Chuncheon Style",        price:33, emoji:"🍗", desc:"Spicy chicken galbi · 7 sides · rice · soup",    img:"", soldOut:false },
  { id:"tofu",      cat:"Set Meals", name:"Tofu Stir-fry Set",    sub:"Dubu Bokkeum",           price:33, emoji:"🌿", desc:"Tofu & kimchi stir-fry · 7 sides · rice · soup", img:"", soldOut:false },
  { id:"pajeon",    cat:"Extras",    name:"Spring Onion Pancake", sub:"Pa-jeon",                price:16, emoji:"🥞", desc:"Crispy Korean green onion pancake",              img:"", soldOut:false },
  { id:"kimchijeon",cat:"Extras",    name:"Kimchi Pancake",       sub:"Kimchi-jeon",            price:16, emoji:"🫓", desc:"Crispy aged kimchi pancake",                     img:"", soldOut:false },
  { id:"rice",      cat:"Extras",    name:"Extra Rice",           sub:"Gong-gi-bap",            price:2,  emoji:"🍚", desc:"Steamed white rice",                             img:"", soldOut:false },
  { id:"soju",      cat:"Drinks",    name:"Soju",                 sub:"Chamisul / Chum-churum", price:12, emoji:"🍶", desc:"Korean distilled spirit",                        img:"", soldOut:false },
  { id:"beer",      cat:"Drinks",    name:"Korean Beer",          sub:"Cass / Terra",           price:10, emoji:"🍺", desc:"330ml chilled",                                  img:"", soldOut:false },
  { id:"makgeolli", cat:"Drinks",    name:"Makgeolli",            sub:"Rice Wine",              price:12, emoji:"🪣", desc:"750ml traditional rice wine",                    img:"", soldOut:false },
  { id:"coke",      cat:"Beverages", name:"Coke",                 sub:"355ml",                  price:4,  emoji:"🥤", desc:"",                                               img:"", soldOut:false },
  { id:"water",     cat:"Beverages", name:"Still Water",          sub:"Complimentary",          price:0,  emoji:"💧", desc:"",                                               img:"", soldOut:false },
];

const db = {
  get:  (k)    => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):null; } catch{return null;} },
  set:  (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch{} },
  remove:(k)   => { try { localStorage.removeItem(k); } catch{} },
};

const receipt = (o) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:14px;width:80mm;padding:6mm}.c{text-align:center}.logo{font-size:20px;font-weight:900;letter-spacing:4px}.hr{border:none;border-top:1px dashed #aaa;margin:7px 0}.row{display:flex;justify-content:space-between;margin:4px 0}.b{font-weight:700}.note{background:#f5f5f5;padding:5px 8px;font-style:italic;font-size:11px;margin-top:5px;border-radius:3px}@media print{@page{margin:0;size:80mm auto}}</style></head><body><div class="c"><div class="logo">SEOUL JIB</div><div style="font-size:10px;color:#777;margin-top:2px">270 St Asaph St, Christchurch</div></div><hr class="hr"><div class="row"><span class="b" style="font-size:15px">Table ${o.table}</span><span>${o.time}</span><span style="color:#bbb">#${o.id.slice(-5)}</span></div><hr class="hr">${o.items.map(i=>`<div class="row"><span style="flex:1">${i.name}</span><span style="margin:0 8px;color:#999">×${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join("")}${o.note?`<div class="note">Note: ${o.note}</div>`:""}<hr class="hr"><div class="row b" style="font-size:16px"><span>TOTAL</span><span>$${o.total.toFixed(2)}</span></div><hr class="hr"><div class="c" style="margin-top:10px;font-size:11px;color:#888">Thank you for dining with us 🙏</div><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),700)}<\/script></body></html>`;

const C = {
  bg:"#0a0b0b", surface:"#111314", card:"#161819", border:"#22282a",
  gold:"#d4952c", goldLt:"#f2bd52", goldDk:"#a87220", accent:"#c0392b", accentLt:"#e74c3c",
  red:"#c0392b", green:"#27ae60", text:"#ece7de", sub:"#8a8278", dim:"#2a3030",
};
const F = "'Outfit', 'DM Sans', system-ui, sans-serif";

const goldBtn = (full) => ({
  background:`linear-gradient(135deg,${C.gold},${C.goldDk})`, color:"#fff",
  fontWeight:700, border:"none", borderRadius:14, padding:"15px 24px",
  fontSize:15, cursor:"pointer", fontFamily:F,
  boxShadow:`0 6px 24px rgba(212,149,44,0.28)`,
  ...(full?{width:"100%"}:{}), transition:"transform .1s",
});
const darkBtn = (full) => ({
  background:C.card, color:C.text, fontWeight:600,
  border:`1.5px solid ${C.border}`, borderRadius:14,
  padding:"13px 20px", fontSize:14, cursor:"pointer", fontFamily:F,
  ...(full?{width:"100%"}:{}),
});
const dangerBtn = (full) => ({
  background:"#200c0c", color:"#e05555", fontWeight:600,
  border:`1.5px solid #3a1515`, borderRadius:14,
  padding:"13px 20px", fontSize:14, cursor:"pointer", fontFamily:F,
  ...(full?{width:"100%"}:{}),
});
const pill = (on) => ({
  padding:"8px 16px", borderRadius:22,
  border:`1.5px solid ${on?C.gold:C.border}`,
  background:on?C.gold:"transparent", color:on?"#fff":C.sub,
  fontWeight:on?700:400, fontSize:13, cursor:"pointer",
  transition:"all .15s", whiteSpace:"nowrap", fontFamily:F,
});
const inp = {
  width:"100%", background:C.card, border:`1.5px solid ${C.border}`,
  color:C.text, padding:"11px 14px", borderRadius:10,
  fontSize:14, fontFamily:F, boxSizing:"border-box", outline:"none",
};
const pg  = { minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:F, display:"flex", flexDirection:"column", userSelect:"none", WebkitUserSelect:"none" };
const hdr = { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:`1px solid ${C.border}`, background:C.bg, position:"sticky", top:0, zIndex:100 };

const GLOBAL_CSS = `
  :root { --border: #22282a; }
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
  @keyframes popIn  { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  @keyframes slideUp{ from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes bounceIn{0%{transform:scale(1)} 40%{transform:scale(.93)} 70%{transform:scale(1.06)} 100%{transform:scale(1)} }
  @keyframes pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(231,76,60,.8)} 50%{box-shadow:0 0 0 12px rgba(231,76,60,0)} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .sj-card:active   { transform:scale(.97) }
  .sj-addbtn:active { transform:scale(.88) }
  .sj-qtybtn:active { transform:scale(.88) }
  .sj-badge         { animation:popIn .25s cubic-bezier(.34,1.56,.64,1) both }
  @keyframes callGlow{0%,100%{background:transparent;border-color:#22282a;color:#8a8278}50%{background:rgba(192,57,43,.2);border-color:#c0392b;color:#ff6b6b;box-shadow:0 0 18px rgba(192,57,43,.45)}}
  .sj-call-active{animation:callGlow .8s ease infinite !important;border-color:#c0392b !important;color:#ff6b6b !important}
  .sj-row           { animation:fadeIn .2s ease both }
  select option     { background:#161819; color:#ece7de; }
`;

const blankItem = (cat) => ({ id:"item_"+Date.now(), cat, name:"", sub:"", price:0, emoji:"🍽️", desc:"", img:"", soldOut:false });

export default function App() {
  useEffect(() => {
    if (document.getElementById("sj-css")) return;
    const s=document.createElement("style"); s.id="sj-css"; s.textContent=GLOBAL_CSS;
    document.head.appendChild(s);
  }, []);

  const [mode, setMode]             = useState("home");
  const [fixedTable, setFixedTable] = useState(() => db.get(TABLE_KEY));
  const [isMainTablet, setIsMainTablet] = useState(() => !!db.get(MAIN_KEY));
  const [calls, setCalls]               = useState(() => db.get(CALLS_KEY) || []);
  const [battery, setBattery]           = useState(null);
  const [menu, setMenu]             = useState(() => db.get(MENU_KEY) || DEFAULT_MENU);
  const [cats, setCats]             = useState(() => db.get(CATS_KEY) || DEFAULT_CATS);
  const [orders, setOrders]         = useState(() => db.get(ORDERS_KEY) || []);
  const [cart, setCart]             = useState([]);
  const [note, setNote]             = useState("");
  const [cat, setCat]               = useState(() => (db.get(CATS_KEY)||DEFAULT_CATS)[0]);
  const [newIds, setNewIds]         = useState(new Set());
  const [ktab, setKtab]             = useState("pending");
  const [pin, setPin]               = useState("");
  const [unlocked, setUnlocked]     = useState(false);
  const [adminTab, setAdminTab]     = useState("menu");
  const [editItem, setEditItem]     = useState(null);
  const [isNewItem, setIsNewItem]   = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [justAdded, setJustAdded]   = useState(null);
  const [toast, setToast]           = useState("");
  const [tableSetup, setTableSetup] = useState(false); // show table setup modal
  const [setupNum, setSetupNum]     = useState(1);
  const pollRef = useRef(null);
  const prevCount = useRef(0);
  const _ctx = useRef(null);

  const saveOrders = useCallback((n)=>{setOrders(n);db.set(ORDERS_KEY,n);},[]);
  const saveMenu   = useCallback((n)=>{setMenu(n);db.set(MENU_KEY,n);},[]);
  const saveCats   = useCallback((n)=>{setCats(n);db.set(CATS_KEY,n);},[]);

  const beep = (type="order") => {
    try {
      if(!_ctx.current) _ctx.current=new(window.AudioContext||window.webkitAudioContext)();
      const ctx=_ctx.current;
      if(type==="call"){
        // Call staff — urgent rising tone × 4
        [0,.15,.30,.45].forEach((d,i)=>{
          const o=ctx.createOscillator(),g=ctx.createGain();
          o.connect(g);g.connect(ctx.destination);
          o.frequency.value=600+(i*120);
          g.gain.setValueAtTime(.7,ctx.currentTime+d);
          g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.22);
          o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.22);
        });
      } else {
        // New order — triple chime
        [[0,880],[.18,1100],[.36,880]].forEach(([d,freq])=>{
          const o=ctx.createOscillator(),g=ctx.createGain();
          o.connect(g);g.connect(ctx.destination);
          o.type="sine";o.frequency.value=freq;
          g.gain.setValueAtTime(.6,ctx.currentTime+d);
          g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+d+.25);
          o.start(ctx.currentTime+d);o.stop(ctx.currentTime+d+.25);
        });
      }
    } catch{}
  };

  const poll = useCallback(()=>{
    const loaded=db.get(ORDERS_KEY); if(!loaded)return;
    const pend=loaded.filter(o=>o.status==="pending");
    if(pend.length>prevCount.current){const ids=pend.slice(prevCount.current).map(o=>o.id);setNewIds(new Set(ids));beep();setTimeout(()=>setNewIds(new Set()),5000);}
    prevCount.current=pend.length; setOrders(loaded);
    // Also reload calls
    const loadedCalls=db.get(CALLS_KEY);
    if(loadedCalls) setCalls(loadedCalls);
  },[]);

  useEffect(()=>{
    if(mode==="kitchen"){poll();pollRef.current=setInterval(poll,3000);}
    else clearInterval(pollRef.current);
    return()=>clearInterval(pollRef.current);
  },[mode,poll]);

  // Battery detection
  useEffect(()=>{
    const nav = navigator;
    if(nav.getBattery){
      nav.getBattery().then(b=>{
        setBattery(Math.round(b.level*100));
        b.addEventListener('levelchange',()=>setBattery(Math.round(b.level*100)));
      });
    }
  },[]);

  const saveCalls = useCallback((n)=>{setCalls(n);db.set(CALLS_KEY,n);},[]);

  const callStaff = ()=>{
    beep("call");
    const c={id:Date.now().toString(),table:fixedTable,time:new Date().toLocaleTimeString("en-NZ",{hour:"2-digit",minute:"2-digit"}),ts:Date.now(),done:false};
    const next=[...(db.get(CALLS_KEY)||[]),c];
    db.set(CALLS_KEY,next);setCalls(next);
  };

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(""),2200);};

  const addItem=(item)=>{
    if(item.soldOut)return;
    setCart(p=>{const ex=p.find(c=>c.id===item.id);return ex?p.map(c=>c.id===item.id?{...c,qty:c.qty+1}:c):[...p,{...item,qty:1}];});
    setJustAdded(item.id);setTimeout(()=>setJustAdded(null),300);
  };
  const setQty=(id,d)=>setCart(p=>{const ex=p.find(c=>c.id===id);if(!ex)return p;return ex.qty+d<=0?p.filter(c=>c.id!==id):p.map(c=>c.id===id?{...c,qty:c.qty+d}:c);});
  const cartCount=cart.reduce((s,c)=>s+c.qty,0);
  const cartTotal=cart.reduce((s,c)=>s+c.price*c.qty,0);

  const submitOrder=()=>{
    if(!cart.length)return;
    const order={id:Date.now().toString(),table:fixedTable,items:cart.map(({id,name,price,qty})=>({id,name,price,qty})),note,total:cartTotal,status:"pending",time:new Date().toLocaleTimeString("en-NZ",{hour:"2-digit",minute:"2-digit"}),ts:Date.now()};
    saveOrders([...orders,order]);setCart([]);setNote("");setMode("done");
  };

  const confirmTableSetup=(num)=>{
    db.set(TABLE_KEY, num);
    setFixedTable(num);
    setTableSetup(false);
    setCat((db.get(CATS_KEY)||DEFAULT_CATS)[0]);
    setMode("order");
  };

  const pending=orders.filter(o=>o.status==="pending");
  const done   =orders.filter(o=>o.status==="done");

  const saveItem=()=>{
    if(!editItem.name.trim()){showToast("Item name is required");return;}
    if(isNewItem) saveMenu([...menu,editItem]);
    else saveMenu(menu.map(m=>m.id===editItem.id?editItem:m));
    setEditItem(null);setIsNewItem(false);
    showToast(isNewItem?"Item added ✓":"Item updated ✓");
  };

  // ── TABLE SETUP MODAL (shown over home screen)
  const TableSetupModal = () => (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:20,padding:"28px 24px",width:"90%",maxWidth:400,textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:8}}>📍</div>
        <div style={{fontSize:19,fontWeight:800,marginBottom:6}}>Set Table Number</div>
        <div style={{color:C.sub,fontSize:13,marginBottom:20}}>This is a one-time setup for this tablet</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:20}}>
          {TABLES.map(t=>(
            <button key={t} onClick={()=>setSetupNum(t)}
              style={{background:setupNum===t?C.gold:C.card,border:`1.5px solid ${setupNum===t?C.gold:C.border}`,color:setupNum===t?"#fff":C.goldLt,fontSize:20,fontWeight:800,padding:"14px 0",borderRadius:12,cursor:"pointer",fontFamily:F,transition:"all .12s"}}>
              {t}
            </button>
          ))}
        </div>
        <button style={goldBtn(true)} onClick={()=>confirmTableSetup(setupNum)}>
          Confirm — Table {setupNum}
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════════════════════
  if (mode==="home") return (
    <div style={{...pg,alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
      {tableSetup && <TableSetupModal/>}
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 60% 50% at 30% 40%,rgba(212,149,44,.08) 0%,transparent 70%),radial-gradient(ellipse 40% 60% at 75% 65%,rgba(212,149,44,.05) 0%,transparent 60%)`}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px)`,backgroundSize:"48px 48px"}}/>

      <div style={{textAlign:"center",marginBottom:44,position:"relative",animation:"slideUp .45s ease both"}}>
        {/* LOGO */}
        <div style={{marginBottom:4,padding:"0 20px"}}>{LOGO_SVG}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:6}}>
          <div style={{height:1,width:44,background:`linear-gradient(90deg,transparent,${C.border})`}}/>
          <div style={{fontSize:10,color:C.sub,letterSpacing:3,fontWeight:500}}>THE SEOUL STANDARD</div>
          <div style={{height:1,width:44,background:`linear-gradient(90deg,${C.border},transparent)`}}/>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:320,padding:"0 20px",animation:"slideUp .45s .08s ease both"}}>
        {/* If table is set → go straight to menu. If not → show setup */}
        <button style={goldBtn(true)} onClick={()=>{
          if(fixedTable){setCat((db.get(CATS_KEY)||DEFAULT_CATS)[0]);setCart([]);setNote("");setMode("order");}
          else setTableSetup(true);
        }}>
          {fixedTable ? `Order Now · Table ${fixedTable}` : "Order Now"}
        </button>
        {isMainTablet && (
          <button style={{...darkBtn(true),position:"relative"}} onClick={()=>setMode("kitchen")}>
            🍳 Kitchen Display
            {pending.length>0&&<span className="sj-badge" style={{position:"absolute",top:-7,right:-7,background:C.red,color:"#fff",borderRadius:"50%",minWidth:22,height:22,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 4px"}}>{pending.length}</span>}
          </button>
        )}
        {isMainTablet && (
          <button style={darkBtn(true)} onClick={()=>setMode("admin")}>⚙️ Menu Management</button>
        )}
        {!isMainTablet && (
          <button style={{...darkBtn(true),opacity:.5,fontSize:12}} onClick={()=>setMode("admin")}>⚙️ Settings</button>
        )}
      </div>

      {/* Table number indicator + battery */}
      <div style={{position:"absolute",bottom:20,display:"flex",alignItems:"center",gap:16}}>
        {fixedTable && (
          <div style={{color:C.dim,fontSize:11,letterSpacing:2,fontWeight:500}}>
            TABLE {fixedTable} · <span style={{cursor:"pointer",color:C.sub,textDecoration:"underline"}} onClick={()=>setTableSetup(true)}>change</span>
          </div>
        )}
        {battery!==null&&(
          <div style={{fontSize:11,fontWeight:600,color:battery<=20?"#e74c3c":battery<=40?"#e8924a":C.dim,letterSpacing:1}}>
            {battery<=20?"🪫":battery<=40?"🔋":"🔋"} {battery}%
          </div>
        )}
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // ORDER
  // ════════════════════════════════════════════════════════
  if (mode==="order") {
    const allCats=[...cats];
    const displayMenu=cat==="All"?menu:menu.filter(m=>m.cat===cat);
    return (
      <div style={{...pg,flexDirection:"row",height:"100dvh",overflow:"hidden"}}>
        <div style={{width:130,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 0",gap:2,flexShrink:0,overflowY:"auto"}}>
          <div style={{fontSize:8,color:C.dim,letterSpacing:3,marginBottom:10,fontWeight:600}}>MENU</div>
          {allCats.map(c=>{
            const on=cat===c;
            return (
              <button key={c} onClick={()=>setCat(c)} style={{width:114,padding:"12px 4px 11px",border:"none",borderRadius:10,background:on?C.accent:"transparent",color:on?"#fff":C.sub,fontWeight:on?700:400,fontSize:14,cursor:"pointer",transition:"all .15s",fontFamily:F,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <span style={{lineHeight:1.2,fontSize:11}}>{c}</span>
              </button>
            );
          })}
          <div style={{flex:1}}/>
          <div style={{color:C.dim,fontSize:10,fontWeight:700,marginBottom:6,textAlign:"center",lineHeight:1.4}}>T.{fixedTable}</div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"12px 10px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10,alignContent:"start"}}>
          {displayMenu.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",color:C.dim,marginTop:60,fontSize:13}}>No items in this category</div>}
          {displayMenu.map(item=>{
            const inCart=cart.find(c=>c.id===item.id);
            const cs=CAT_STYLE[item.cat]||DEFAULT_CAT_STYLE;
            const wasAdded=justAdded===item.id;
            return (
              <div key={item.id} className="sj-card" style={{background:C.card,border:`1.5px solid ${inCart?C.gold:C.border}`,borderRadius:16,overflow:"hidden",cursor:item.soldOut?"default":"pointer",opacity:item.soldOut?.4:1,position:"relative",animation:wasAdded?"bounceIn .28s ease both":"none",transition:"border-color .15s"}}>
                {item.img
                  ?<div style={{height:130,overflow:"hidden"}}><img src={item.img} alt={item.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>
                  :<div style={{height:120,background:`linear-gradient(145deg,${cs.from},${cs.to})`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",width:80,height:80,borderRadius:"50%",background:`radial-gradient(circle,${cs.accent}22 0%,transparent 70%)`}}/>
                    <span style={{fontSize:52,position:"relative"}}>{item.emoji}</span>
                  </div>
                }
                {inCart&&<div className="sj-badge" style={{position:"absolute",top:7,right:7,background:C.gold,color:"#fff",borderRadius:"50%",width:24,height:24,fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{inCart.qty}</div>}
                {item.soldOut&&<div style={{position:"absolute",top:7,left:7,background:"rgba(0,0,0,.78)",color:C.sub,borderRadius:5,padding:"2px 7px",fontSize:10,fontWeight:600}}>SOLD OUT</div>}
                <div style={{padding:"10px 12px 12px"}}>
                  <div style={{fontWeight:700,fontSize:17,lineHeight:1.3}}>{item.name}</div>
                  <div style={{color:C.sub,fontSize:13,marginTop:2}}>{item.sub}</div>
                  {item.desc&&<div style={{color:"#3e4545",fontSize:12,marginTop:4,lineHeight:1.4}}>{item.desc}</div>}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10}}>
                    <div style={{background:`${cs.accent}22`,border:`1px solid ${cs.accent}44`,borderRadius:7,padding:"3px 9px",color:C.goldLt,fontWeight:800,fontSize:18}}>
                      {item.price===0?"Free":`$${item.price}`}
                    </div>
                    {!item.soldOut&&(inCart
                      ?<div style={{display:"flex",alignItems:"center",gap:5}}>
                        <button className="sj-qtybtn" onClick={e=>{e.stopPropagation();setQty(item.id,-1);}} style={{background:C.dim,border:`1px solid ${C.border}`,color:C.text,width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F}}>−</button>
                        <span style={{fontWeight:800,fontSize:14,minWidth:18,textAlign:"center"}}>{inCart.qty}</span>
                        <button className="sj-qtybtn" onClick={e=>{e.stopPropagation();addItem(item);}} style={{background:C.gold,border:"none",color:"#fff",width:28,height:28,borderRadius:"50%",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F}}>+</button>
                      </div>
                      :<button className="sj-addbtn" onClick={()=>addItem(item)} style={{background:C.gold,border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 12px rgba(212,149,44,.35)`,transition:"transform .1s"}}>+</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{width:300,background:C.surface,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{padding:"13px 14px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:800,fontSize:15}}>Your Order</div>
              {cartCount>0&&<div style={{color:C.sub,fontSize:11}}>{cartCount} item{cartCount>1?"s":""}</div>}
            </div>
            <button style={{background:"none",border:"none",color:C.goldLt,fontSize:20,cursor:"pointer",padding:"4px"}} onClick={()=>{setCart([]);setNote("");setMode("home");}}>←</button>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {cart.length===0&&<div style={{textAlign:"center",color:C.dim,padding:"40px 16px 0",fontSize:12,lineHeight:2}}><div style={{fontSize:28,marginBottom:6}}>🛒</div>Select items from the menu</div>}
            {cart.map(item=>(
              <div key={item.id} style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontWeight:600,fontSize:15,flex:1,lineHeight:1.3}}>{item.name}</span>
                  <span style={{color:C.goldLt,fontWeight:700,fontSize:13,marginLeft:6}}>${(item.price*item.qty).toFixed(2)}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:9}}>
                  <button className="sj-qtybtn" onClick={()=>setQty(item.id,-1)} style={{background:C.dim,border:`1px solid ${C.border}`,color:C.text,width:32,height:32,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F}}>−</button>
                  <span style={{fontWeight:800,fontSize:16,minWidth:22,textAlign:"center"}}>{item.qty}</span>
                  <button className="sj-qtybtn" onClick={()=>setQty(item.id,+1)} style={{background:C.dim,border:`1px solid ${C.border}`,color:C.text,width:32,height:32,borderRadius:"50%",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F}}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`}}>
            <textarea placeholder="Special requests or allergies..." value={note} onChange={e=>setNote(e.target.value)}
              style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,color:C.text,padding:"9px 11px",borderRadius:10,fontSize:12,minHeight:46,resize:"none",fontFamily:F,boxSizing:"border-box"}}/>
          </div>
          <div style={{padding:"10px 12px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:800,marginBottom:12}}>
              <span>Total</span><span style={{color:C.goldLt}}>${cartTotal.toFixed(2)}</span>
            </div>
            <button style={{...goldBtn(true),padding:"16px",fontSize:16,opacity:cart.length?1:.35,cursor:cart.length?"pointer":"default"}} onClick={submitOrder} disabled={!cart.length}>Place Order</button>
            <button onClick={(e)=>{callStaff();showToast("Staff has been called ✓");const btn=e.currentTarget;btn.classList.add("sj-call-active");btn.disabled=true;setTimeout(()=>{btn.classList.remove("sj-call-active");btn.disabled=false;},5000);}}
              style={{width:"100%",marginTop:8,padding:"13px",background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:14,color:C.sub,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:F,transition:"all .15s"}}>
              🔔  Call Staff
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════
  if (mode==="done") return (
    <div style={{...pg,alignItems:"center",justifyContent:"center",gap:14}}>
      <div style={{fontSize:78,animation:"popIn .4s cubic-bezier(.34,1.56,.64,1) both"}}>✅</div>
      <div style={{fontSize:26,fontWeight:900,animation:"slideUp .35s .08s ease both"}}>Order Placed!</div>
      <div style={{color:C.sub,fontSize:14,animation:"slideUp .35s .14s ease both"}}>Table {fixedTable} · We'll be right with you</div>
      <div style={{display:"flex",gap:10,marginTop:20,animation:"slideUp .35s .2s ease both"}}>
        <button style={{...goldBtn(),fontSize:14}} onClick={()=>{setCat((db.get(CATS_KEY)||DEFAULT_CATS)[0]);setMode("order");}}>Add More</button>
        <button style={{...darkBtn(),fontSize:14}} onClick={()=>setMode("home")}>Done</button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // KITCHEN
  // ════════════════════════════════════════════════════════
  if (mode==="kitchen") {
    const now=Date.now();
    const showOrders=(ktab==="pending"?[...pending]:[...done]); // oldest first = natural order
    return (
      <div style={{...pg,background:"#08090a"}}>
        <div style={{...hdr,background:"#08090a",padding:"10px 14px"}}>
          <button style={{background:"none",border:"none",color:C.goldLt,fontSize:20,cursor:"pointer",padding:"4px 6px"}} onClick={()=>setMode("home")}>←</button>
          <div style={{display:"flex",gap:7}}>
            <button style={pill(ktab==="pending")} onClick={()=>setKtab("pending")}>🔥 Pending {pending.length>0?`(${pending.length})`:""}</button>
            <button style={pill(ktab==="done")} onClick={()=>setKtab("done")}>✅ Done {done.length>0?`(${done.length})`:""}</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {calls.filter(c=>!c.done).length>0&&(
              <div style={{background:"#c0392b",color:"#fff",borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:700,animation:"pulse 1s ease infinite"}}>
                🔔 {calls.filter(c=>!c.done).length} Call{calls.filter(c=>!c.done).length>1?"s":""}
              </div>
            )}
            <span style={{color:"#1a2222",fontSize:10}}>live · 3s</span>
            <button onClick={poll} style={{...darkBtn(),padding:"6px 11px",fontSize:12}}>↻</button>
          </div>
        </div>
        {/* Call Staff alerts */}
        {calls.filter(c=>!c.done).length>0&&(
          <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:8,flexWrap:"wrap",background:"#1a0808"}}>
            {calls.filter(c=>!c.done).map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:8,background:"#2a0f0f",border:"1.5px solid #c0392b",borderRadius:10,padding:"8px 14px"}}>
                <span style={{fontSize:16}}>🔔</span>
                <span style={{fontWeight:700,fontSize:14,color:"#fff"}}>Table {c.table}</span>
                <span style={{color:"#888",fontSize:12}}>{c.time}</span>
                <button onClick={()=>saveCalls(calls.map(x=>x.id===c.id?{...x,done:true}:x))}
                  style={{background:"#27ae60",border:"none",color:"#fff",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F}}>Done</button>
              </div>
            ))}
          </div>
        )}
        <div style={{flex:1,overflowY:"auto",padding:"12px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(285px,1fr))",gap:10,alignContent:"start"}}>
          {showOrders.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",color:"#1a2222",marginTop:60,fontSize:13}}>{ktab==="pending"?"No pending orders 🎉":"No completed orders yet"}</div>}
          {showOrders.map(order=>{
            const isNewOrd=newIds.has(order.id);
            const mins=order.ts?Math.floor((now-order.ts)/60000):null;
            const hot=mins!==null&&mins>=10&&ktab==="pending";
            return (
              <div key={order.id} style={{background:C.card,border:`2px solid ${isNewOrd?"#e74c3c":hot?"#e8924a":ktab==="pending"?C.gold:C.border}`,borderRadius:16,overflow:"hidden",animation:isNewOrd?"pulse 1s ease 3":"none"}}>
                <div style={{background:ktab==="pending"?`linear-gradient(135deg,${C.goldDk},#4a2c08)`:"#121616",padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:22,fontWeight:900,color:"#fff"}}>Table {order.table}</span>
                    {isNewOrd&&<span style={{background:"#e74c3c",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,letterSpacing:1}}>NEW</span>}
                    {hot&&!isNewOrd&&<span style={{background:"#e8924a33",color:"#e8924a",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:4,border:"1px solid #e8924a66"}}>{mins}m</span>}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>{order.time}</div>
                    <div style={{color:"rgba(255,255,255,.3)",fontSize:10}}>#{order.id.slice(-4)}</div>
                  </div>
                </div>
                <div style={{padding:"10px 14px"}}>
                  {order.items.map((item,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:14,fontWeight:500,borderBottom:i<order.items.length-1?`1px solid ${C.border}`:"none"}}>
                      <span>{item.name}</span><span style={{color:C.goldLt,fontWeight:800}}>× {item.qty}</span>
                    </div>
                  ))}
                  {order.note&&<div style={{marginTop:8,padding:"6px 9px",background:"#1f1b10",borderRadius:7,color:"#e8c470",fontSize:11,borderLeft:`3px solid ${C.gold}`}}>📝 {order.note}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:9,paddingTop:9,borderTop:`1px solid ${C.border}`,color:C.sub,fontSize:12}}>
                    <span>Total</span><span style={{color:C.text,fontWeight:700}}>${order.total.toFixed(2)}</span>
                  </div>
                </div>
                <div style={{padding:"8px 10px 12px",display:"flex",gap:7}}>
                  {ktab==="pending"
                    ?<button onClick={()=>saveOrders(orders.map(o=>o.id===order.id?{...o,status:"done"}:o))} style={{flex:2,background:"#0a2a0a",color:"#4dca4d",border:"1.5px solid #174a17",borderRadius:9,padding:"11px",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:F}}>✅ Mark Done</button>
                    :<button onClick={()=>saveOrders(orders.map(o=>o.id===order.id?{...o,status:"pending"}:o))} style={{flex:2,background:"#1e1e0a",color:"#c8c84d",border:"1.5px solid #383815",borderRadius:9,padding:"11px",fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:F}}>↩ Reopen</button>
                  }
                  <button onClick={()=>{const w=window.open("","_blank","width=430,height=640");if(w){w.document.write(receipt(order));w.document.close();}}} style={{flex:1,background:"#0a1525",color:"#5a8acc",border:"1.5px solid #172040",borderRadius:9,padding:"11px",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:F}}>🖨️</button>
                  {ktab==="done"&&<button onClick={()=>saveOrders(orders.filter(o=>o.id!==order.id))} style={{flex:1,background:"#200c0c",color:"#cc4444",border:"1.5px solid #3a1515",borderRadius:9,padding:"11px",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:F}}>🗑️</button>}
                </div>
                {/* Quick sold out — only for pending */}
                {ktab==="pending"&&(
                  <div style={{padding:"0 10px 10px",display:"flex",gap:6,flexWrap:"wrap"}}>
                    {order.items.map((item,i)=>{
                      const menuItem=menu.find(m=>m.id===item.id);
                      if(!menuItem||menuItem.soldOut) return null;
                      return(
                        <button key={i} onClick={()=>{saveMenu(menu.map(m=>m.id===item.id?{...m,soldOut:true}:m));showToast(item.name+" marked sold out");}}
                          style={{background:"#1a0f0f",border:"1px solid #3a2020",borderRadius:6,color:"#cc6666",fontSize:10,fontWeight:600,padding:"4px 9px",cursor:"pointer",fontFamily:F}}>
                          🚫 {item.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ADMIN PIN
  // ════════════════════════════════════════════════════════
  if (mode==="admin" && !unlocked) return (
    <div style={{...pg,alignItems:"center",justifyContent:"center",gap:18}}>
      <div style={{fontSize:44}}>🔐</div>
      <div style={{fontSize:18,fontWeight:800}}>Admin Login</div>
      <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="PIN" maxLength={4}
        style={{...inp,fontSize:26,textAlign:"center",width:150,letterSpacing:10}}
        onKeyDown={e=>{if(e.key==="Enter"){if(pin===ADMIN_PIN){setUnlocked(true);setPin("");}else{showToast("Incorrect PIN");setPin("");}}}}
      />
      <div style={{display:"flex",gap:10}}>
        <button style={goldBtn()} onClick={()=>{if(pin===ADMIN_PIN){setUnlocked(true);setPin("");}else{showToast("Incorrect PIN");setPin("");}}}>Enter</button>
        <button style={darkBtn()} onClick={()=>{setMode("home");setPin("");}}>Cancel</button>
      </div>
      {toast&&<div style={{color:C.red,fontWeight:600,fontSize:13}}>{toast}</div>}
    </div>
  );

  // ════════════════════════════════════════════════════════
  // ADMIN EDIT ITEM
  // ════════════════════════════════════════════════════════
  if (mode==="admin" && unlocked && editItem) return (
    <div style={pg}>
      <div style={hdr}>
        <button style={{background:"none",border:"none",color:C.goldLt,fontSize:20,cursor:"pointer",padding:"4px 6px"}} onClick={()=>{setEditItem(null);setIsNewItem(false);}}>←</button>
        <span style={{fontSize:16,fontWeight:700}}>{isNewItem?"Add New Item":"Edit Item"}</span>
        <div style={{width:34}}/>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 20px"}}>
        <div style={{maxWidth:520,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <div style={{color:C.sub,fontSize:12,marginBottom:5,fontWeight:500}}>Category</div>
            <select value={editItem.cat} onChange={e=>setEditItem({...editItem,cat:e.target.value})} style={{...inp,appearance:"none",WebkitAppearance:"none",cursor:"pointer"}}>
              {cats.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{color:C.sub,fontSize:12,marginBottom:5,fontWeight:500}}>Item Name <span style={{color:C.red}}>*</span></div>
            <input value={editItem.name} onChange={e=>setEditItem({...editItem,name:e.target.value})} placeholder="e.g. Bulgogi Set" style={inp}/>
          </div>
          <div>
            <div style={{color:C.sub,fontSize:12,marginBottom:5,fontWeight:500}}>Subtitle / Korean Name</div>
            <input value={editItem.sub} onChange={e=>setEditItem({...editItem,sub:e.target.value})} placeholder="e.g. Korean Beef BBQ" style={inp}/>
          </div>
          <div>
            <div style={{color:C.sub,fontSize:12,marginBottom:5,fontWeight:500}}>Description</div>
            <input value={editItem.desc} onChange={e=>setEditItem({...editItem,desc:e.target.value})} placeholder="e.g. Marinated beef · 7 side dishes · rice · soup" style={inp}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <div style={{color:C.sub,fontSize:12,marginBottom:5,fontWeight:500}}>Price ($NZD)</div>
              <input type="number" min="0" step="0.5" value={editItem.price} onChange={e=>setEditItem({...editItem,price:parseFloat(e.target.value)||0})} style={inp}/>
            </div>
            <div>
              <div style={{color:C.sub,fontSize:12,marginBottom:5,fontWeight:500}}>Emoji (no image fallback)</div>
              <input value={editItem.emoji} onChange={e=>setEditItem({...editItem,emoji:e.target.value})} placeholder="🍽️" style={{...inp,fontSize:22,textAlign:"center"}}/>
            </div>
          </div>
          <div>
            <div style={{color:C.sub,fontSize:12,marginBottom:5,fontWeight:500}}>Menu Photo</div>
            <label style={{display:"block",cursor:"pointer"}}>
              <input type="file" accept="image/*" style={{display:"none"}}
                onChange={e=>{
                  const file=e.target.files[0];
                  if(!file)return;
                  const r=new FileReader();
                  r.onload=ev=>setEditItem({...editItem,img:ev.target.result});
                  r.readAsDataURL(file);
                }}
              />
              <div style={{background:C.card,border:`1.5px dashed ${editItem.img?C.gold:C.border}`,borderRadius:10,padding:"16px",textAlign:"center",color:editItem.img?C.goldLt:C.sub,fontSize:13,fontWeight:600,transition:"all .15s"}}>
                {editItem.img?"📷  Change Photo":"📷  Choose Photo from Device"}
              </div>
            </label>
            {editItem.img&&(
              <div style={{marginTop:8,borderRadius:10,overflow:"hidden",height:180,position:"relative"}}>
                <img src={editItem.img} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                <button onClick={()=>setEditItem({...editItem,img:""})}
                  style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.75)",border:"none",color:"#fff",borderRadius:"50%",width:32,height:32,fontSize:18,cursor:"pointer",fontFamily:F}}>x</button>
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <button style={goldBtn(true)} onClick={saveItem}>{isNewItem?"Add to Menu":"Save Changes"}</button>
            <button style={darkBtn(true)} onClick={()=>{setEditItem(null);setIsNewItem(false);}}>Cancel</button>
          </div>
          {!isNewItem&&(
            <div style={{marginTop:8}}>
              {delConfirm===editItem.id
                ?<div style={{display:"flex",gap:10,alignItems:"center",padding:"12px 14px",background:"#1f0a0a",borderRadius:12,border:`1px solid #3a1515`}}>
                  <span style={{flex:1,color:"#e05555",fontSize:13}}>Delete this item?</span>
                  <button style={{...dangerBtn(),padding:"9px 16px",fontSize:13}} onClick={()=>{saveMenu(menu.filter(m=>m.id!==editItem.id));setDelConfirm(null);setEditItem(null);showToast("Deleted");}}>Delete</button>
                  <button style={{...darkBtn(),padding:"9px 16px",fontSize:13}} onClick={()=>setDelConfirm(null)}>Cancel</button>
                </div>
                :<button style={{...dangerBtn(true),padding:"13px"}} onClick={()=>setDelConfirm(editItem.id)}>🗑️ Delete This Item</button>
              }
            </div>
          )}
        </div>
      </div>
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.gold,color:"#fff",padding:"10px 20px",borderRadius:20,fontWeight:700,fontSize:13,zIndex:999}}>{toast}</div>}
    </div>
  );

  // ════════════════════════════════════════════════════════
  // ADMIN MAIN
  // ════════════════════════════════════════════════════════
  if (mode==="admin" && unlocked) return (
    <div style={pg}>
      <div style={hdr}>
        <button style={{background:"none",border:"none",color:C.goldLt,fontSize:20,cursor:"pointer",padding:"4px 6px"}} onClick={()=>{setMode("home");setUnlocked(false);}}>←</button>
        <span style={{fontSize:16,fontWeight:700}}>Menu Management</span>
        <div style={{width:34}}/>
      </div>
      <div style={{display:"flex",gap:8,padding:"12px 18px",borderBottom:`1px solid ${C.border}`}}>
        <button style={pill(adminTab==="menu")} onClick={()=>setAdminTab("menu")}>Menu Items</button>
        <button style={pill(adminTab==="cats")} onClick={()=>setAdminTab("cats")}>Categories</button>
        <button style={pill(adminTab==="device")} onClick={()=>setAdminTab("device")}>This Device</button>
      </div>

      {adminTab==="menu"&&(
        <div style={{flex:1,overflowY:"auto",padding:"14px 18px"}}>
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <button style={{...goldBtn(true),marginBottom:18,padding:"13px"}} onClick={()=>{setEditItem(blankItem(cats[0]||"Set Meals"));setIsNewItem(true);}}>+ Add New Menu Item</button>
            {cats.map(c=>(
              <div key={c} style={{marginBottom:26}}>
                <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:3,marginBottom:9,paddingBottom:5,borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>
                  <span>{c.toUpperCase()}</span>
                  <span style={{color:C.dim,fontSize:10,letterSpacing:0}}>{menu.filter(m=>m.cat===c).length} items</span>
                </div>
                {menu.filter(m=>m.cat===c).length===0&&<div style={{color:C.dim,fontSize:12,padding:"8px 0"}}>No items yet</div>}
                {menu.filter(m=>m.cat===c).map(item=>(
                  <div key={item.id} className="sj-row" style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                    {item.img?<img src={item.img} alt="" style={{width:46,height:46,borderRadius:9,objectFit:"cover",flexShrink:0}}/>:<div style={{width:46,height:46,borderRadius:9,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{item.emoji}</div>}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:item.soldOut?C.sub:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                      <div style={{color:C.sub,fontSize:11}}>{item.sub}</div>
                    </div>
                    <div style={{color:C.goldLt,fontWeight:700,fontSize:14,minWidth:44,flexShrink:0}}>{item.price===0?"Free":`$${item.price}`}</div>
                    <button onClick={()=>saveMenu(menu.map(m=>m.id===item.id?{...m,soldOut:!m.soldOut}:m))} style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${item.soldOut?C.green:C.red}`,background:"transparent",color:item.soldOut?C.green:C.red,fontWeight:600,cursor:"pointer",fontSize:11,fontFamily:F,whiteSpace:"nowrap",flexShrink:0}}>{item.soldOut?"Resume":"Sold Out"}</button>
                    <button onClick={()=>{setEditItem({...item});setIsNewItem(false);}} style={{...darkBtn(),padding:"7px 13px",fontSize:12,flexShrink:0}}>Edit</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {adminTab==="cats"&&(
        <div style={{flex:1,overflowY:"auto",padding:"18px"}}>
          <div style={{maxWidth:480,margin:"0 auto"}}>
            <div style={{display:"flex",gap:8,marginBottom:24}}>
              <input value={newCatName} onChange={e=>setNewCatName(e.target.value)} placeholder="New category name..." style={{...inp,flex:1}} onKeyDown={e=>e.key==="Enter"&&(()=>{const n=newCatName.trim();if(!n)return;if(cats.includes(n)){showToast("Already exists");return;}saveCats([...cats,n]);setNewCatName("");showToast(n+" added ✓");})()}/>
              <button style={{...goldBtn(),padding:"11px 18px",fontSize:14}} onClick={()=>{const n=newCatName.trim();if(!n)return;if(cats.includes(n)){showToast("Already exists");return;}saveCats([...cats,n]);setNewCatName("");showToast(n+" added ✓");}}>+ Add</button>
            </div>
            <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:3,marginBottom:12,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>CURRENT CATEGORIES</div>
            {cats.map((c,i)=>{
              const count=menu.filter(m=>m.cat===c).length;
              const cs=CAT_STYLE[c]||DEFAULT_CAT_STYLE;
              return (
                <div key={c} className="sj-row" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${cs.from},${cs.to})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,border:`1px solid ${cs.accent}33`}}>{cs.icon}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{c}</div><div style={{color:C.sub,fontSize:11}}>{count} item{count!==1?"s":""}</div></div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>{if(i===0)return;const n=[...cats];[n[i-1],n[i]]=[n[i],n[i-1]];saveCats(n);}} style={{...darkBtn(),padding:"7px 10px",fontSize:13,opacity:i===0?.3:1}}>↑</button>
                    <button onClick={()=>{if(i===cats.length-1)return;const n=[...cats];[n[i],n[i+1]]=[n[i+1],n[i]];saveCats(n);}} style={{...darkBtn(),padding:"7px 10px",fontSize:13,opacity:i===cats.length-1?.3:1}}>↓</button>
                  </div>
                  <button onClick={()=>{if(count>0){showToast("Remove items first");return;}saveCats(cats.filter(x=>x!==c));}} style={{...dangerBtn(),padding:"7px 12px",fontSize:12,opacity:count>0?.4:1,cursor:count>0?"not-allowed":"pointer"}}>🗑️</button>
                </div>
              );
            })}
            <div style={{marginTop:16,padding:"12px 14px",background:"#111a14",borderRadius:10,borderLeft:`3px solid ${C.green}`,color:C.sub,fontSize:12,lineHeight:1.6}}>
              💡 To delete a category, first move or delete all its menu items.
            </div>
          </div>
        </div>
      )}

      {adminTab==="device"&&(
        <div style={{flex:1,overflowY:"auto",padding:"18px"}}>
          <div style={{maxWidth:480,margin:"0 auto"}}>
            <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:3,marginBottom:16,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>THIS TABLET</div>
            <div style={{padding:"16px",background:C.card,borderRadius:12,border:`1px solid ${C.border}`,marginBottom:12}}>
              <div style={{color:C.sub,fontSize:12,marginBottom:4}}>Current table assignment</div>
              <div style={{fontSize:26,fontWeight:900,color:C.goldLt}}>{fixedTable ? `Table ${fixedTable}` : "Not set"}</div>
            </div>
            <button style={goldBtn(true)} onClick={()=>setTableSetup(true)}>
              {fixedTable ? "Change Table Number" : "Set Table Number"}
            </button>
            {fixedTable&&(
              <button style={{...dangerBtn(true),marginTop:10,padding:"13px"}} onClick={()=>{db.remove(TABLE_KEY);setFixedTable(null);showToast("Table number cleared");}}>
                Reset Table Assignment
              </button>
            )}
            <div style={{height:1,background:C.border,margin:"20px 0"}}/>
            <div style={{fontSize:10,fontWeight:700,color:C.gold,letterSpacing:3,marginBottom:12}}>MAIN TABLET</div>
            <div style={{padding:"16px",background:C.card,borderRadius:12,border:`1.5px solid ${isMainTablet?C.gold:C.border}`,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>Kitchen Display & Menu Management</div>
                <div style={{color:C.sub,fontSize:12,marginTop:2}}>Only visible on the main tablet</div>
              </div>
              <div onClick={()=>{const n=!isMainTablet;db.set(MAIN_KEY,n);setIsMainTablet(n);showToast(n?"Main tablet enabled ✓":"Disabled");}}
                style={{width:48,height:28,borderRadius:14,background:isMainTablet?C.gold:C.dim,position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
                <div style={{position:"absolute",top:3,left:isMainTablet?22:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 4px rgba(0,0,0,.3)"}}/>
              </div>
            </div>
            <div style={{padding:"12px 14px",background:"#111a14",borderRadius:10,borderLeft:`3px solid ${C.green}`,color:C.sub,fontSize:12,lineHeight:1.6}}>
              💡 Enable on the counter/kitchen tablet only. Table tablets will show the order screen only.
            </div>
          </div>
        </div>
      )}

      {tableSetup && <TableSetupModal/>}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.gold,color:"#fff",padding:"10px 20px",borderRadius:20,fontWeight:700,fontSize:13,zIndex:999,whiteSpace:"nowrap"}}>{toast}</div>}
    </div>
  );

  return null;
}

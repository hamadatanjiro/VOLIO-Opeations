/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { createRecord, deleteRecord, subscribe } from "../lib/db";

type Tab =
  | "dashboard" | "orders" | "inventory" | "expenses" | "cash"
  | "receivables" | "payables" | "reports" | "marketing"
  | "customers" | "suppliers" | "tasks" | "health" | "activity" | "settings";

const nav: { group: string; items: { id: Tab; label: string; icon: string }[] }[] = [
  { group: "Overview", items: [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "orders", label: "Orders", icon: "▤" },
    { id: "inventory", label: "Inventory", icon: "◈" }
  ]},
  { group: "Finance", items: [
    { id: "expenses", label: "Expenses", icon: "↘" },
    { id: "cash", label: "Cash Flow", icon: "◫" },
    { id: "receivables", label: "Receivables", icon: "◌" },
    { id: "payables", label: "Payables", icon: "◍" },
    { id: "reports", label: "Reports", icon: "▥" }
  ]},
  { group: "Growth", items: [
    { id: "marketing", label: "Marketing", icon: "✦" },
    { id: "customers", label: "Customers", icon: "♙" },
    { id: "suppliers", label: "Suppliers", icon: "⌁" }
  ]},
  { group: "System", items: [
    { id: "tasks", label: "Tasks", icon: "✓" },
    { id: "health", label: "Business Health", icon: "♥" },
    { id: "activity", label: "Activity Log", icon: "◷" },
    { id: "settings", label: "Settings", icon: "⚙" }
  ]}
];

const categories = ["Delivery", "Bank Transfer", "Box", "Ads", "Supplier", "Packaging", "Software", "Other"];
const payments = ["Cash", "Bank Transfer", "Card", "Online", "Other"];

function money(n: number) {
  return `£${(Number(n) || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function values(map: any) {
  return Object.entries(map || {}).map(([id, value]) => ({ id, ...(value as any) }));
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<Record<string, any[]>>({
    expenses: [], orders: [], products: [], customers: [], suppliers: [], tasks: [], activityLogs: []
  });

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setLoading(false); }), []);

  useEffect(() => {
    if (!user) return;
    const unsubs = Object.keys(data).map(key => subscribe(key, v => setData(d => ({ ...d, [key]: values(v) }))));
    return () => unsubs.forEach(fn => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading) return <div className="splash"><div className="brand-mark">V</div><b>VOLIO</b><span>Loading workspace…</span></div>;
  if (!user) return <Login />;

  return <App user={user} tab={tab} setTab={setTab} data={data} />;
}

function Login() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err?.message?.replace("Firebase: ", "") || "Unable to sign in.");
    } finally { setBusy(false); }
  }

  return <main className="login-shell">
    <div className="login-orb orb-a"/><div className="login-orb orb-b"/>
    <section className="login-card">
      <div className="brand"><div className="brand-mark">V</div><div><strong>VOLIO</strong><small>OPERATIONS</small></div></div>
      <div className="eyebrow">PRIVATE BUSINESS WORKSPACE</div>
      <h1>{mode === "login" ? "Welcome back." : "Create workspace access."}</h1>
      <p className="muted">Manage orders, expenses, inventory and profit from one clean control centre.</p>
      <form onSubmit={submit} className="form">
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@volio.com"/></label>
        <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} placeholder="••••••••"/></label>
        {error && <div className="error">{error}</div>}
        <button className="primary wide" disabled={busy}>{busy ? "Connecting…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <button className="text-button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
        {mode === "login" ? "Need another account? Create one" : "Already have an account? Sign in"}
      </button>
    </section>
  </main>;
}

function App({ user, tab, setTab, data }: { user: User; tab: Tab; setTab: (t: Tab) => void; data: Record<string, any[]> }) {
  const expenses = data.expenses || [], orders = data.orders || [], products = data.products || [];
  const customers = data.customers || [], suppliers = data.suppliers || [], tasks = data.tasks || [];
  const revenue = orders.reduce((s, x) => s + Number(x.sale || 0), 0);
  const cogs = orders.reduce((s, x) => s + Number(x.cogs || 0), 0);
  const gross = revenue - cogs;
  const expenseTotal = expenses.reduce((s, x) => s + Number(x.amount || 0), 0);
  const net = gross - expenseTotal;

  const title = nav.flatMap(g => g.items).find(x => x.id === tab)?.label || "Dashboard";
  const subtitle = {
    dashboard: "Your business at a glance.", expenses: "Every outgoing, tracked cleanly.",
    orders: "Sales and order profitability.", inventory: "Stock, cost and margin control.",
    reports: "A simple view of the numbers that matter."
  }[tab] || "Manage your VOLIO workspace.";

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="side-brand"><div className="brand-mark">V</div><div><b>VOLIO</b><small>OPS & FINANCE</small></div></div>
      <div className="side-scroll">{nav.map(g => <div className="nav-group" key={g.group}><span>{g.group}</span>{g.items.map(item =>
        <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
          <i>{item.icon}</i>{item.label}{item.id === "expenses" && expenseTotal > 0 ? <em>{expenses.length}</em> : null}
        </button>
      )}</div>)}</div>
      <div className="side-user"><div className="avatar">{(user.email?.[0] || "V").toUpperCase()}</div><div><b>{user.email?.split("@")[0]}</b><small>Owner</small></div><button title="Sign out" onClick={() => signOut(auth)}>↪</button></div>
    </aside>

    <main className="main">
      <header className="topbar"><div><div className="crumb">VOLIO / {title.toUpperCase()}</div><h2>{title}</h2><p>{subtitle}</p></div><div className="top-actions"><span className="live"><i/> Live database</span><button className="icon-btn">⌕</button><button className="profile" onClick={() => setTab("settings")}>{(user.email?.[0] || "V").toUpperCase()}</button></div></header>
      <div className="content">
        {tab === "dashboard" && <Dashboard revenue={revenue} gross={gross} expenses={expenseTotal} net={net} orders={orders} expensesList={expenses} products={products} tasks={tasks} setTab={setTab}/>}
        {tab === "expenses" && <Expenses expenses={expenses} orders={orders} user={user}/>}
        {tab === "orders" && <Orders orders={orders} user={user}/>}
        {tab === "inventory" && <Inventory products={products} user={user}/>}
        {tab === "customers" && <Customers items={customers} user={user}/>}
        {tab === "suppliers" && <SimpleCrud title="Suppliers" path="suppliers" items={suppliers} user={user} fields={["name","contact","phone","notes"]} /> }
        {tab === "tasks" && <Tasks items={tasks} user={user}/>}
        {tab === "reports" && <Reports revenue={revenue} cogs={cogs} gross={gross} expenses={expenseTotal} net={net}/>}
        {tab === "cash" && <InfoPage title="Cash Flow" text="Track cash movement by account as payments and expenses are connected." cards={[["Inflow", money(revenue)],["Outflow",money(expenseTotal)],["Net movement",money(revenue-expenseTotal)]]}/>}
        {tab === "receivables" && <InfoPage title="Accounts Receivable" text="Keep outstanding customer balances visible and tied to orders." cards={[["Open orders",String(orders.length)],["Potential receivable",money(orders.filter(o=>o.status!=="Paid").reduce((s,o)=>s+Number(o.sale||0),0))]]}/>}
        {tab === "payables" && <InfoPage title="Accounts Payable" text="Supplier and operating bills can be connected here as the workflow grows." cards={[["Suppliers",String(suppliers.length)],["Expenses recorded",money(expenseTotal)]]}/>}
        {tab === "marketing" && <InfoPage title="Marketing" text="Connect campaigns to DMs, confirmed orders, spend and profit." cards={[["Ad spend",money(expenses.filter(e=>e.category==="Ads").reduce((s,e)=>s+Number(e.amount||0),0))],["Orders",String(orders.length)]]}/>}
        {tab === "health" && <Health revenue={revenue} gross={gross} expenses={expenseTotal} net={net} products={products} tasks={tasks}/>}
        {tab === "activity" && <InfoPage title="Activity Log" text="The production version will record who changed what and when." cards={[["Current user",user.email || ""],["Database", "Realtime Database"]]}/>}
        {tab === "settings" && <Settings user={user}/>}
      </div>
    </main>
  </div>;
}

function Dashboard({ revenue,gross,expenses,net,orders,expensesList,products,tasks,setTab }: any) {
  const recent = [...orders].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,5);
  return <div className="stack">
    <div className="health-banner"><div><span className="pill green">● Healthy</span><h3>VOLIO is under control.</h3><p>Keep expenses tight and turn every confirmed order into measurable profit.</p></div><button className="secondary" onClick={()=>setTab("expenses")}>Review expenses →</button></div>
    <div className="metric-grid">
      <Metric label="Revenue" value={money(revenue)} sub={`${orders.length} orders`} icon="↗" tone="purple"/>
      <Metric label="Gross profit" value={money(gross)} sub="Before operating expenses" icon="◆" tone="blue"/>
      <Metric label="Expenses" value={money(expenses)} sub={`${expensesList.length} entries`} icon="↘" tone="orange"/>
      <Metric label="Net profit" value={money(net)} sub={net >= 0 ? "Positive operating result" : "Needs attention"} icon="✦" tone={net >= 0 ? "green" : "red"}/>
    </div>
    <div className="two-col">
      <section className="panel"><PanelHead title="Performance" action="Last 30 days"/><div className="fake-chart"><div className="chart-line"/>{[18,35,28,48,42,63,57,72,66,84,78,92].map((h,i)=><div className="bar" style={{height:`${h}%`}} key={i}/>)}</div><div className="chart-foot"><span>Revenue</span><b>{money(revenue)}</b><span>Net</span><b>{money(net)}</b></div></section>
      <section className="panel"><PanelHead title="Expense mix" action="This period"/><div className="donut"><div className="donut-hole"><b>{money(expenses)}</b><small>Total</small></div></div><div className="legend">{categories.slice(0,5).map((c,i)=><div key={c}><i className={`dot d${i}`}/>{c}<b>{money(expensesList.filter((e:any)=>e.category===c).reduce((s:number,e:any)=>s+Number(e.amount||0),0))}</b></div>)}</div></section>
    </div>
    <div className="two-col">
      <section className="panel"><PanelHead title="Recent orders" action="View all" onClick={()=>setTab("orders")}/><Table headers={["Customer","Model","Sale","Profit"]} rows={recent.map((o:any)=>[o.customer||"—",o.model||"—",money(o.sale),money(Number(o.sale||0)-Number(o.cogs||0)-Number(o.expenses||0))])}/>{!recent.length&&<Empty text="No orders yet. Add your first sale."/ >}</section>
      <section className="panel"><PanelHead title="Today’s focus" action="Tasks" onClick={()=>setTab("tasks")}/><div className="focus-list">{tasks.slice(0,4).map((t:any)=><div key={t.id}><span className={t.done?"check done":"check"}>{t.done?"✓":""}</span><div><b>{t.title}</b><small>{t.priority || "Normal"} priority</small></div></div>)}{!tasks.length&&<Empty text="No tasks yet."/ >}</div></section>
    </div>
  </div>;
}

function Metric({label,value,sub,icon,tone}:{label:string,value:string,sub:string,icon:string,tone:string}) {
  return <div className={`metric ${tone}`}><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>;
}
function PanelHead({title,action,onClick}:{title:string,action?:string,onClick?:()=>void}) { return <div className="panel-head"><h3>{title}</h3>{action&&<button onClick={onClick}>{action} {onClick?"→":""}</button>}</div>; }
function Empty({text}:{text:string}) { return <div className="empty">{text}</div>; }

function Expenses({ expenses, orders, user }: any) {
  const [open,setOpen]=useState(false), [search,setSearch]=useState(""), [filter,setFilter]=useState("All");
  const filtered=expenses.filter((e:any)=>(filter==="All"||e.category===filter)&&`${e.description} ${e.category} ${e.payment}`.toLowerCase().includes(search.toLowerCase())).sort((a:any,b:any)=>String(b.expenseDate||"").localeCompare(String(a.expenseDate||"")));
  const total=expenses.reduce((s:number,e:any)=>s+Number(e.amount||0),0), avg=expenses.length?total/expenses.length:0, largest=expenses.reduce((m:number,e:any)=>Math.max(m,Number(e.amount||0)),0);
  return <div className="stack">
    <div className="expense-hero"><div><span className="eyebrow">FINANCE CONTROL CENTRE</span><h3>Every pound accounted for.</h3><p>Add expenses as they happen. The dashboard and reports update from the same live data.</p></div><button className="primary" onClick={()=>setOpen(true)}>＋ Add expense</button></div>
    <div className="metric-grid three"><Metric label="Total expenses" value={money(total)} sub="All recorded time" icon="↘" tone="orange"/><Metric label="Entries" value={String(expenses.length)} sub="Recorded expenses" icon="▤" tone="purple"/><Metric label="Average" value={money(avg)} sub={`Largest ${money(largest)}`} icon="⌁" tone="blue"/></div>
    <section className="panel"><div className="toolbar"><div className="search"><span>⌕</span><input placeholder="Search expenses…" value={search} onChange={e=>setSearch(e.target.value)}/></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{categories.map(c=><option key={c}>{c}</option>)}</select><button className="secondary" onClick={()=>setOpen(true)}>＋ New</button></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Date added</th><th>Category</th><th>Description</th><th>Payment</th><th>Amount</th><th></th></tr></thead><tbody>{filtered.map((e:any)=><tr key={e.id}><td>{e.expenseDate||"—"}</td><td>{e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}</td><td><span className="tag">{e.category}</span></td><td><b>{e.description||"—"}</b><small>{e.notes||""}</small></td><td>{e.payment||"—"}</td><td className="amount">{money(e.amount)}</td><td><button className="danger-link" onClick={async()=>{if(confirm("Delete this expense?")) await deleteRecord("expenses",e.id)}}>Delete</button></td></tr>)}</tbody></table></div>{!filtered.length&&<Empty text="No expenses match your filters."/ >}</section>
    {open&&<ExpenseModal user={user} orders={orders} onClose={()=>setOpen(false)}/>}
  </div>;
}

function ExpenseModal({user,orders,onClose}:{user:User,orders:any[],onClose:()=>void}) {
  const [form,setForm]=useState({amount:"",category:"Delivery",description:"",expenseDate:today(),payment:"Cash",orderId:"",notes:""});
  const [busy,setBusy]=useState(false);
  async function save(e:FormEvent){e.preventDefault();setBusy(true);try{await createRecord("expenses",{...form,amount:Number(form.amount),createdBy:user.uid});await createRecord("activityLogs",{action:"Created expense",description:form.description,createdBy:user.uid});onClose()}finally{setBusy(false)}}
  return <Modal title="Add expense" onClose={onClose}><form onSubmit={save} className="form two-form">
    <label>Amount (£)<input type="number" min="0" step="0.01" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></label>
    <label>Expense date<input type="date" required value={form.expenseDate} onChange={e=>setForm({...form,expenseDate:e.target.value})}/></label>
    <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
    <label>Payment method<select value={form.payment} onChange={e=>setForm({...form,payment:e.target.value})}>{payments.map(c=><option key={c}>{c}</option>)}</select></label>
    <label className="full">Description<input required value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="e.g. DHL delivery for order #104"/></label>
    <label>Related order<select value={form.orderId} onChange={e=>setForm({...form,orderId:e.target.value})}><option value="">None</option>{orders.map(o=><option key={o.id} value={o.id}>{o.customer||"Order"} — {o.model||""}</option>)}</select></label>
    <label>Notes<input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional"/></label>
    <div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving…":"Save expense"}</button></div>
  </form></Modal>;
}

function Orders({orders,user}:{orders:any[],user:User}) {
  const [open,setOpen]=useState(false), [search,setSearch]=useState("");
  const filtered=orders.filter(o=>`${o.customer} ${o.model} ${o.status}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="stack"><div className="page-hero"><div><span className="eyebrow">SALES</span><h3>Orders that explain the profit.</h3><p>Capture sale price, COGS and direct expenses for a true order margin.</p></div><button className="primary" onClick={()=>setOpen(true)}>＋ New order</button></div>
  <section className="panel"><div className="toolbar"><div className="search"><span>⌕</span><input placeholder="Search orders…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div><div className="table-wrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Model</th><th>Sale</th><th>COGS</th><th>Direct expenses</th><th>Profit</th><th>Status</th></tr></thead><tbody>{filtered.map(o=>{const p=Number(o.sale||0)-Number(o.cogs||0)-Number(o.expenses||0);return <tr key={o.id}><td>{o.date||"—"}</td><td><b>{o.customer||"—"}</b></td><td>{o.model||"—"}</td><td>{money(o.sale)}</td><td>{money(o.cogs)}</td><td>{money(o.expenses)}</td><td className={p>=0?"profit":"loss"}>{money(p)}</td><td><span className="status">{o.status||"Confirmed"}</span></td></tr>})}</tbody></table></div>{!filtered.length&&<Empty text="No orders yet."/ >}</section>{open&&<OrderModal user={user} onClose={()=>setOpen(false)}/>}</div>;
}

function OrderModal({user,onClose}:{user:User,onClose:()=>void}) {
  const [f,setF]=useState({date:today(),customer:"",model:"",sale:"",cogs:"",expenses:"",status:"Confirmed"}), [busy,setBusy]=useState(false);
  async function save(e:FormEvent){e.preventDefault();setBusy(true);try{await createRecord("orders",{...f,sale:Number(f.sale),cogs:Number(f.cogs),expenses:Number(f.expenses),createdBy:user.uid});onClose()}finally{setBusy(false)}}
  return <Modal title="New order" onClose={onClose}><form onSubmit={save} className="form two-form"><label>Date<input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></label><label>Status<select value={f.status} onChange={e=>setF({...f,status:e.target.value})}><option>Confirmed</option><option>Paid</option><option>Pending</option><option>Cancelled</option></select></label><label>Customer<input required value={f.customer} onChange={e=>setF({...f,customer:e.target.value})}/></label><label>Watch model<input required value={f.model} onChange={e=>setF({...f,model:e.target.value})}/></label><label>Sale price (£)<input required type="number" step="0.01" value={f.sale} onChange={e=>setF({...f,sale:e.target.value})}/></label><label>COGS (£)<input required type="number" step="0.01" value={f.cogs} onChange={e=>setF({...f,cogs:e.target.value})}/></label><label>Direct expenses (£)<input type="number" step="0.01" value={f.expenses} onChange={e=>setF({...f,expenses:e.target.value})}/></label><div className="preview-profit">Estimated profit <b>{money(Number(f.sale||0)-Number(f.cogs||0)-Number(f.expenses||0))}</b></div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving…":"Create order"}</button></div></form></Modal>;
}

function Inventory({products,user}:{products:any[],user:User}) {
  const [open,setOpen]=useState(false);
  return <div className="stack"><div className="page-hero"><div><span className="eyebrow">INVENTORY</span><h3>Know what you own.</h3><p>Track purchase cost, sell price, stock and expected margin.</p></div><button className="primary" onClick={()=>setOpen(true)}>＋ Add product</button></div><section className="panel"><div className="table-wrap"><table><thead><tr><th>Model</th><th>Purchase cost</th><th>Sell price</th><th>Unit margin</th><th>Stock</th><th>Margin %</th></tr></thead><tbody>{products.map(p=>{const m=Number(p.sell||0)-Number(p.cost||0);return <tr key={p.id}><td><b>{p.model}</b><small>{p.brand||"VOLIO"}</small></td><td>{money(p.cost)}</td><td>{money(p.sell)}</td><td className="profit">{money(m)}</td><td><span className={Number(p.stock)<2?"low-stock":"stock"}>{p.stock}</span></td><td>{Number(p.sell)?`${((m/Number(p.sell))*100).toFixed(1)}%`:"0%"}</td></tr>})}</tbody></table></div>{!products.length&&<Empty text="No products yet. Add your watch models."/ >}</section>{open&&<ProductModal user={user} onClose={()=>setOpen(false)}/>}</div>;
}
function ProductModal({user,onClose}:{user:User,onClose:()=>void}){const [f,setF]=useState({model:"",brand:"",cost:"",sell:"",stock:"1"});const [busy,setBusy]=useState(false);async function save(e:FormEvent){e.preventDefault();setBusy(true);try{await createRecord("products",{...f,cost:Number(f.cost),sell:Number(f.sell),stock:Number(f.stock),createdBy:user.uid});onClose()}finally{setBusy(false)}}return <Modal title="Add product" onClose={onClose}><form onSubmit={save} className="form two-form"><label>Model<input required value={f.model} onChange={e=>setF({...f,model:e.target.value})}/></label><label>Brand<input value={f.brand} onChange={e=>setF({...f,brand:e.target.value})}/></label><label>Purchase cost (£)<input required type="number" step="0.01" value={f.cost} onChange={e=>setF({...f,cost:e.target.value})}/></label><label>Sell price (£)<input required type="number" step="0.01" value={f.sell} onChange={e=>setF({...f,sell:e.target.value})}/></label><label>Opening stock<input required type="number" min="0" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})}/></label><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving…":"Save product"}</button></div></form></Modal>}

function Customers({items,user}:{items:any[],user:User}){return <SimpleCrud title="Customers" path="customers" items={items} user={user} fields={["name","phone","email","notes"]}/>}

function SimpleCrud({title,path,items,user,fields}:{title:string,path:string,items:any[],user:User,fields:string[]}) {
  const [open,setOpen]=useState(false);
  return <div className="stack"><div className="page-hero"><div><span className="eyebrow">RELATIONSHIPS</span><h3>{title}.</h3><p>Keep important contacts in one place and connect them to the financial workflow.</p></div><button className="primary" onClick={()=>setOpen(true)}>＋ Add {title.slice(0,-1).toLowerCase()}</button></div><section className="panel"><div className="table-wrap"><table><thead><tr>{fields.map(f=><th key={f}>{f.replace(/^\w/,m=>m.toUpperCase())}</th>)}</tr></thead><tbody>{items.map(x=><tr key={x.id}>{fields.map(f=><td key={f}>{x[f]||"—"}</td>)}</tr>)}</tbody></table></div>{!items.length&&<Empty text={`No ${title.toLowerCase()} yet.`}/>}</section>{open&&<CrudModal title={title.slice(0,-1)} path={path} fields={fields} user={user} onClose={()=>setOpen(false)}/>}</div>;
}
function CrudModal({title,path,fields,user,onClose}:{title:string,path:string,fields:string[],user:User,onClose:()=>void}){const initial=Object.fromEntries(fields.map(k=>[k,""]));const [form,setForm]=useState<any>(initial);const [busy,setBusy]=useState(false);async function save(e:FormEvent){e.preventDefault();setBusy(true);try{await createRecord(path,{...form,createdBy:user.uid});onClose()}finally{setBusy(false)}}return <Modal title={`Add ${title}`} onClose={onClose}><form onSubmit={save} className="form">{fields.map(field=><label key={field}>{field.replace(/^\w/,m=>m.toUpperCase())}<input required={field==="name"} value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})}/></label>)}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving…":"Save"}</button></div></form></Modal>}

function Tasks({items,user}:{items:any[],user:User}){const [title,setTitle]=useState(""),[priority,setPriority]=useState("Normal");async function add(e:FormEvent){e.preventDefault();if(!title.trim())return;await createRecord("tasks",{title:title.trim(),priority,done:false,createdBy:user.uid});setTitle("")}return <div className="stack"><div className="page-hero"><div><span className="eyebrow">OPERATIONS</span><h3>What needs doing?</h3><p>Simple daily actions for keeping VOLIO moving.</p></div></div><section className="panel"><form className="quick-add" onSubmit={add}><input placeholder="Add a task…" value={title} onChange={e=>setTitle(e.target.value)}/><select value={priority} onChange={e=>setPriority(e.target.value)}><option>Low</option><option>Normal</option><option>High</option></select><button className="primary">Add</button></form><div className="task-list">{items.map(t=><div className="task-row" key={t.id}><span className="check">{t.done?"✓":""}</span><div><b>{t.title}</b><small>{t.priority} priority</small></div><button className="danger-link" onClick={()=>deleteRecord("tasks",t.id)}>Delete</button></div>)}</div></section></div>}

function Reports({revenue,cogs,gross,expenses,net}:{revenue:number,cogs:number,gross:number,expenses:number,net:number}){return <div className="stack"><div className="page-hero"><div><span className="eyebrow">FINANCIAL REPORTING</span><h3>Profit & Loss.</h3><p>A clean operating view built directly from your live orders and expenses.</p></div></div><section className="pnl panel"><div className="pnl-row"><span>Revenue</span><b>{money(revenue)}</b></div><div className="pnl-row negative"><span>Cost of sales</span><b>− {money(cogs)}</b></div><div className="pnl-row total"><span>Gross profit</span><b>{money(gross)}</b></div><div className="pnl-row negative"><span>Operating expenses</span><b>− {money(expenses)}</b></div><div className="pnl-row final"><span>Net profit</span><b>{money(net)}</b></div></section></div>}

function InfoPage({title,text,cards}:{title:string,text:string,cards:[string,string][]}){return <div className="stack"><div className="page-hero"><div><span className="eyebrow">WORKSPACE</span><h3>{title}.</h3><p>{text}</p></div></div><div className="metric-grid three">{cards.map(([l,v],i)=><Metric key={l} label={l} value={v} sub="Live workspace" icon={["◫","↗","✦"][i%3]} tone={["blue","purple","green"][i%3]}/>)}</div><section className="panel feature-empty"><div className="big-icon">◈</div><h3>Connected workflow ready.</h3><p>This module is scaffolded and already lives on the same Firebase data layer. The next pass can add the detailed ledger and role-specific controls without changing the architecture.</p></section></div>}

function Health({revenue,gross,expenses,net,products,tasks}:{revenue:number,gross:number,expenses:number,net:number,products:any[],tasks:any[]}){const checks=[["Profit positive",net>=0,net>=0?`Net profit is ${money(net)}`:"Net profit is negative"],["Expense control",gross===0?true:expenses/gross<0.5,`${gross?((expenses/gross)*100).toFixed(0):0}% of gross profit is currently in expenses`],["Stock watch",products.filter(p=>Number(p.stock)<2).length===0,`${products.filter(p=>Number(p.stock)<2).length} low-stock product(s)`],["Task queue",tasks.filter(t=>!t.done).length<8,true?`${tasks.filter(t=>!t.done).length} open task(s)`:""]];return <div className="stack"><div className="page-hero"><div><span className="eyebrow">BUSINESS HEALTH</span><h3>Know what needs attention.</h3><p>Simple signals from the numbers already in your workspace.</p></div></div><div className="health-grid">{checks.map(([name,ok,detail]:any)=><div className={`health-card ${ok?"ok":"warn"}`} key={name}><span>{ok?"✓":"!"}</span><div><b>{name}</b><p>{detail}</p></div></div>)}</div></div>}

function Settings({user}:{user:User}){return <div className="stack"><div className="page-hero"><div><span className="eyebrow">SYSTEM</span><h3>Settings.</h3><p>Firebase-connected workspace configuration.</p></div></div><section className="panel settings"><div><span>Signed-in account</span><b>{user.email}</b><small>UID: {user.uid}</small></div><div><span>Database</span><b>Firebase Realtime Database</b><small>Live synchronization enabled</small></div><div><span>Hosting target</span><b>Vercel</b><small>Deploy the Next.js project from GitHub.</small></div><button className="danger-button" onClick={()=>signOut(auth)}>Sign out</button></section></div>}

function Modal({title,onClose,children}:{title:string,onClose:()=>void,children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal"><div className="modal-head"><div><span className="eyebrow">VOLIO</span><h3>{title}</h3></div><button className="close" onClick={onClose}>×</button></div>{children}</div></div>}

function Table({headers,rows}:{headers:string[],rows:string[][]}){return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}

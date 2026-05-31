import { useState, useEffect, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════ */
const API_URL = "https://script.google.com/macros/s/AKfycbzHP7ESq6gQ25eJSLRge3NTwM75Fg73wWRUk1eKuYjknMHbqdktMuj81bBaZZF2QPcmBA/exec";
async function apiGet(a = "getAll") { try { const r = await fetch(`${API_URL}?action=${a}`); return await r.json(); } catch (e) { return { success: false, error: e.message }; } }
async function apiPost(b) { try { const r = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(b) }); return await r.json(); } catch (e) { return { success: false, error: e.message }; } }

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
const fCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
const fDate = (d) => { if (!d) return ""; return new Date(d + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); };
const todayStr = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const num = (v) => parseFloat(v) || 0;
const I = ({ d, s = 18, c = "currentColor" }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;

const TABS = [
  { id: "ingresos", label: "Ingresos", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { id: "insumos", label: "Insumos", icon: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" },
  { id: "gastos", label: "Gastos", icon: "M2 17l10-10M9 7l3-3M13 21l9-9M16 4l4 4M3 22l4-4" },
  { id: "liquidar", label: "Liquidar", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { id: "resumen", label: "Resumen", icon: "M18 20V10M12 20V4M6 20v-6" },
];

function Spinner({ text }) { return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: 12 }}><div style={{ width: 36, height: 36, border: "4px solid #dde6cc", borderTopColor: "#4a7c28", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><span style={{ fontSize: 14, color: "#6a7d55", fontWeight: 600 }}>{text}</span><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>; }
function Toast({ message }) { if (!message) return null; return <div style={{ textAlign: "center", padding: "10px 14px", background: "#2d5a10", borderRadius: 10, marginTop: 10, fontSize: 14, fontWeight: 600, color: "#fff", animation: "fadeIn 0.3s" }}>{message}</div>; }

/* ═══════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState("ingresos");
  const [ingresos, setIngresos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [config, setConfig] = useState({ descuento: 10000, umbral: 100000 });
  const [catServ, setCatServ] = useState([]);
  const [catIns, setCatIns] = useState([]);
  const [catGas, setCatGas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [subTab, setSubTab] = useState("dashboard");
  const [lastSync, setLastSync] = useState(null);

  const loadData = useCallback(async (spin = true) => {
    if (spin) setLoading(true); else setSyncing(true);
    const res = await apiGet("getAll");
    if (res.success && res.data) {
      const d = res.data;
      setIngresos((d.ingresos || []).map(r => ({ ...r, precioCobrado: num(r.precioCobrado), precioBase: num(r.precioBase), descuento: num(r.descuento), ingresoNeto: num(r.ingresoNeto), liquidado: r.liquidado === true || r.liquidado === "true" || r.liquidado === "TRUE", id: String(r.id) })));
      setInsumos((d.insumos || []).map(r => ({ ...r, cantidad: num(r.cantidad), costoUnitario: num(r.costoUnitario), costoTotal: num(r.costoTotal), liquidado: r.liquidado === true || r.liquidado === "true" || r.liquidado === "TRUE", id: String(r.id) })));
      setGastos((d.gastos || []).map(r => ({ ...r, valor: num(r.valor), id: String(r.id) })));
      setLiquidaciones((d.liquidaciones || []).map(r => ({ ...r, consecutivo: num(r.consecutivo), numServicios: num(r.numServicios), numInsumos: num(r.numInsumos), totalIngresos: num(r.totalIngresos), totalDescuentos: num(r.totalDescuentos), ingresoNeto: num(r.ingresoNeto), totalInsumos: num(r.totalInsumos), utilidadBruta: num(r.utilidadBruta), parteTrabajadores: num(r.parteTrabajadores), partePropietario: num(r.partePropietario), ingresosIds: r.ingresosIds ? String(r.ingresosIds) : "", insumosIds: r.insumosIds ? String(r.insumosIds) : "", id: String(r.id) })));
      const cfg = { descuento: 10000, umbral: 100000 };
      (d.config || []).forEach(r => {
        if (r.clave === "descuento") cfg.descuento = num(r.valor);
        if (r.clave === "umbral") cfg.umbral = num(r.valor);
        if (r.clave === "catServ") { try { setCatServ(JSON.parse(r.valor)); } catch {} }
        if (r.clave === "catIns") { try { setCatIns(JSON.parse(r.valor)); } catch {} }
        if (r.clave === "catGas") { try { setCatGas(JSON.parse(r.valor)); } catch {} }
      });
      setConfig(cfg);
      setLastSync(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    }
    setLoading(false); setSyncing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveCatalogs = async (cs, ci, cg) => { await apiPost({ action: "updateConfig", data: { catServ: JSON.stringify(cs), catIns: JSON.stringify(ci), catGas: JSON.stringify(cg) } }); };
  const updateCatServ = async (c) => { setCatServ(c); await saveCatalogs(c, catIns, catGas); };
  const updateCatIns = async (c) => { setCatIns(c); await saveCatalogs(catServ, c, catGas); };
  const updateCatGas = async (c) => { setCatGas(c); await saveCatalogs(catServ, catIns, c); };
  const updateConfig = async (c) => { setConfig(c); await apiPost({ action: "updateConfig", data: { descuento: c.descuento, umbral: c.umbral } }); };

  const addIngreso = async (data) => { const row = { ...data, id: uid(), liquidado: "false", liquidacionId: "" }; setIngresos(p => [...p, { ...row, precioCobrado: num(row.precioCobrado), precioBase: num(row.precioBase), descuento: num(row.descuento), ingresoNeto: num(row.ingresoNeto), liquidado: false }]); await apiPost({ action: "addRow", sheet: "Ingresos", data: row }); };
  const editIngreso = async (id, u) => { const r = { ...u }; r.precioCobrado = num(r.precioCobrado); r.descuento = num(r.descuento); r.ingresoNeto = r.precioCobrado - r.descuento; setIngresos(p => p.map(i => i.id === id ? { ...i, ...r } : i)); await apiPost({ action: "updateByIds", sheet: "Ingresos", ids: [id], updates: r }); };
  const delIngreso = async (id) => { setIngresos(p => p.filter(i => i.id !== id)); await apiPost({ action: "deleteById", sheet: "Ingresos", id }); };

  const addInsumo = async (data) => { const row = { ...data, id: uid(), liquidado: "false", liquidacionId: "" }; setInsumos(p => [...p, { ...row, cantidad: num(row.cantidad), costoUnitario: num(row.costoUnitario), costoTotal: num(row.costoTotal), liquidado: false }]); await apiPost({ action: "addRow", sheet: "Insumos", data: row }); };
  const editInsumo = async (id, u) => { const r = { ...u }; r.cantidad = num(r.cantidad); r.costoUnitario = num(r.costoUnitario); r.costoTotal = r.cantidad * r.costoUnitario; setInsumos(p => p.map(i => i.id === id ? { ...i, ...r } : i)); await apiPost({ action: "updateByIds", sheet: "Insumos", ids: [id], updates: r }); };
  const delInsumo = async (id) => { setInsumos(p => p.filter(i => i.id !== id)); await apiPost({ action: "deleteById", sheet: "Insumos", id }); };

  const addGasto = async (data) => { const row = { ...data, id: uid() }; setGastos(p => [...p, { ...row, valor: num(row.valor) }]); await apiPost({ action: "addRow", sheet: "Gastos", data: row }); };
  const editGasto = async (id, u) => { const r = { ...u, valor: num(u.valor) }; setGastos(p => p.map(i => i.id === id ? { ...i, ...r } : i)); await apiPost({ action: "updateByIds", sheet: "Gastos", ids: [id], updates: r }); };
  const delGasto = async (id) => { setGastos(p => p.filter(i => i.id !== id)); await apiPost({ action: "deleteById", sheet: "Gastos", id }); };

  const doLiquidar = async (selIng, selIns) => {
    const li = ingresos.filter(i => selIng.includes(i.id)); const ls = insumos.filter(i => selIns.includes(i.id));
    const tI = li.reduce((s, i) => s + (i.precioCobrado || 0), 0); const tD = li.reduce((s, i) => s + (i.descuento || 0), 0);
    const tS = ls.reduce((s, i) => s + (i.costoTotal || 0), 0); const nv = tI - tD; const ut = nv - tS;
    const liq = { id: uid(), fecha: todayStr(), consecutivo: liquidaciones.length + 1, numServicios: selIng.length, numInsumos: selIns.length, totalIngresos: tI, totalDescuentos: tD, ingresoNeto: nv, totalInsumos: tS, utilidadBruta: ut, parteTrabajadores: ut / 2, partePropietario: ut / 2, ingresosIds: selIng.join(","), insumosIds: selIns.join(",") };
    setLiquidaciones(p => [...p, liq]); setIngresos(p => p.map(i => selIng.includes(i.id) ? { ...i, liquidado: true } : i)); setInsumos(p => p.map(i => selIns.includes(i.id) ? { ...i, liquidado: true } : i));
    await apiPost({ action: "addRow", sheet: "Liquidaciones", data: liq });
    if (selIng.length) await apiPost({ action: "updateByIds", sheet: "Ingresos", ids: selIng, updates: { liquidado: "TRUE", liquidacionId: liq.id } });
    if (selIns.length) await apiPost({ action: "updateByIds", sheet: "Insumos", ids: selIns, updates: { liquidado: "TRUE", liquidacionId: liq.id } });
  };

  const ingPend = ingresos.filter(i => !i.liquidado); const insPend = insumos.filter(i => !i.liquidado);

  if (loading) return (<div style={S.app}><style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@500;700&display=swap');`}</style><header style={S.header}><div style={S.headerTop}><div><h1 style={S.logo}>LAVADERO</h1><p style={S.logoSub}>Control Semanal</p></div></div></header><Spinner text="Conectando con Google Sheets..." /></div>);

  return (
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@500;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}input,select,textarea,button{font-family:'DM Sans',sans-serif}input:focus,select:focus,textarea:focus{border-color:#4a7c28!important;outline:none;box-shadow:0 0 0 3px rgba(74,124,40,.12)}@keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <header style={S.header}>
        <div style={S.headerTop}>
          <div><h1 style={S.logo}>LAVADERO</h1><p style={S.logoSub}>Control Semanal</p></div>
          <div style={S.headerStats}>
            <div style={S.headerStat}><span style={S.hNum}>{ingPend.length}</span><span style={S.hLbl}>pendientes</span></div>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.2)" }} />
            <div style={S.headerStat}><span style={S.hNum}>{liquidaciones.length}</span><span style={S.hLbl}>liquidaciones</span></div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{lastSync ? "Sync: " + lastSync : ""}</span>
          <button onClick={() => loadData(false)} disabled={syncing} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#78d42d", fontSize: 11, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>{syncing ? "Sincronizando..." : "Actualizar"}</button>
        </div>
      </header>
      <nav style={S.nav}>{TABS.map(t => (
        <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.navBtn, ...(tab === t.id ? S.navAct : {}) }}>
          <I d={t.icon} s={16} c={tab === t.id ? "#2d5a10" : "#9aab88"} />
          <span style={{ fontSize: 9, marginTop: 1, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#2d5a10" : "#9aab88" }}>{t.label}</span>
        </button>
      ))}</nav>
      <main>
        {tab === "ingresos" && <IngresosTab ingresos={ingresos} addIngreso={addIngreso} editIngreso={editIngreso} delIngreso={delIngreso} catServ={catServ} config={config} />}
        {tab === "insumos" && <InsumosTab insumos={insumos} addInsumo={addInsumo} editInsumo={editInsumo} delInsumo={delInsumo} catIns={catIns} />}
        {tab === "gastos" && <GastosTab gastos={gastos} addGasto={addGasto} editGasto={editGasto} delGasto={delGasto} catGas={catGas} />}
        {tab === "liquidar" && <LiquidarTab ingPend={ingPend} insPend={insPend} onLiquidar={doLiquidar} />}
        {tab === "resumen" && <ResumenTab liquidaciones={liquidaciones} ingresos={ingresos} gastos={gastos} catServ={catServ} setCatServ={updateCatServ} catIns={catIns} setCatIns={updateCatIns} catGas={catGas} setCatGas={updateCatGas} config={config} setConfig={updateConfig} subTab={subTab} setSubTab={setSubTab} />}
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   INGRESOS TAB
   ═══════════════════════════════════════════════ */
function IngresosTab({ ingresos, addIngreso, editIngreso, delIngreso, catServ, config }) {
  const empty = { fecha: todayStr(), placa: "", cliente: "", servicioNombre: "", precioCobrado: "", medioPago: "efectivo", facturado: "no", numFactura: "", observaciones: "", descuento: "" };
  const [f, setF] = useState(empty); const [toast, setToast] = useState(""); const [saving, setSaving] = useState(false); const [showList, setShowList] = useState(false);
  const [editId, setEditId] = useState(null); const [ef, setEf] = useState(null);
  const precio = num(f.precioCobrado);
  useEffect(() => { if (precio > 0) setF(p => ({ ...p, descuento: String(precio >= config.umbral ? config.descuento : 0) })); }, [precio, config]);
  const descuento = num(f.descuento); const neto = precio - descuento;
  const save = async () => { if (!f.fecha || !f.placa || !f.servicioNombre || !precio) return; setSaving(true); const sel = catServ.find(s => s.nombre === f.servicioNombre); await addIngreso({ fecha: f.fecha, placa: f.placa, cliente: f.cliente, servicioNombre: f.servicioNombre, precioBase: sel?.precioBase || 0, precioCobrado: precio, descuento, ingresoNeto: neto, medioPago: f.medioPago, facturado: f.facturado, numFactura: f.numFactura, observaciones: f.observaciones }); setF(empty); setSaving(false); setToast("Ingreso guardado"); setTimeout(() => setToast(""), 2500); };
  const startEdit = (r) => { setEditId(r.id); setEf({ fecha: r.fecha || "", placa: r.placa || "", cliente: r.cliente || "", servicioNombre: r.servicioNombre || "", precioCobrado: String(r.precioCobrado || ""), descuento: String(r.descuento || ""), medioPago: r.medioPago || "efectivo", facturado: r.facturado || "no", numFactura: r.numFactura || "", observaciones: r.observaciones || "" }); };
  const saveEdit = async () => { if (!ef) return; setSaving(true); const sel = catServ.find(s => s.nombre === ef.servicioNombre); await editIngreso(editId, { fecha: ef.fecha, placa: ef.placa, cliente: ef.cliente, servicioNombre: ef.servicioNombre, precioBase: sel?.precioBase || 0, precioCobrado: ef.precioCobrado, descuento: ef.descuento, ingresoNeto: num(ef.precioCobrado) - num(ef.descuento), medioPago: ef.medioPago, facturado: ef.facturado, numFactura: ef.numFactura, observaciones: ef.observaciones }); setEditId(null); setEf(null); setSaving(false); setToast("Ingreso actualizado"); setTimeout(() => setToast(""), 2500); };
  const pendientes = ingresos.filter(i => !i.liquidado).reverse();
  return (
    <div style={S.sec}>
      <SH title="Registrar Ingreso" subtitle="Cada servicio prestado" />
      {catServ.length === 0 && <div style={S.warn}>No hay servicios en el catalogo. Ve a Resumen - Catalogos.</div>}
      <div style={S.formGrid}>
        <FI label="Fecha" span={2}><input type="date" value={f.fecha} onChange={e => setF({ ...f, fecha: e.target.value })} style={S.inp} /></FI>
        <FI label="Placa"><input placeholder="ABC123" value={f.placa} onChange={e => setF({ ...f, placa: e.target.value.toUpperCase() })} style={S.inp} maxLength={7} /></FI>
        <FI label="Cliente"><input placeholder="Nombre" value={f.cliente} onChange={e => setF({ ...f, cliente: e.target.value })} style={S.inp} /></FI>
        <FI label="Servicio" span={2}><div style={S.selW}><select value={f.servicioNombre} onChange={e => setF({ ...f, servicioNombre: e.target.value })} style={S.sel}><option value="">-- Seleccionar --</option>{catServ.map((s, i) => <option key={i} value={s.nombre}>{s.nombre} ({fCOP(s.precioBase)})</option>)}</select><span style={S.selArr}>&#9662;</span></div></FI>
        <FI label="Precio cobrado ($)"><input type="number" placeholder="0" value={f.precioCobrado} onChange={e => setF({ ...f, precioCobrado: e.target.value })} style={S.inp} /></FI>
        <FI label="Descuento admin ($)"><input type="number" value={f.descuento} onChange={e => setF({ ...f, descuento: e.target.value })} style={S.inp} /></FI>
        {precio > 0 && <div style={{ ...S.netoBadge, gridColumn: "1/-1" }}>Ingreso neto: <strong style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fCOP(neto)}</strong></div>}
        <FI label="Medio de pago" span={2}><div style={S.togRow}>{["efectivo", "transferencia"].map(m => (<button key={m} onClick={() => setF({ ...f, medioPago: m })} style={{ ...S.togBtn, ...(f.medioPago === m ? S.togAct : {}) }}>{m === "efectivo" ? "Efectivo" : "Transferencia"}</button>))}</div></FI>
        <FI label="Facturado?"><div style={S.togRow}>{["si", "no"].map(v => (<button key={v} onClick={() => setF({ ...f, facturado: v, numFactura: v === "no" ? "" : f.numFactura })} style={{ ...S.togBtn, ...(f.facturado === v ? S.togAct : {}) }}>{v === "si" ? "Si" : "No"}</button>))}</div></FI>
        {f.facturado === "si" && <FI label="N Factura"><input placeholder="FV-001" value={f.numFactura} onChange={e => setF({ ...f, numFactura: e.target.value })} style={S.inp} /></FI>}
        <FI label="Observaciones" span={2}><textarea placeholder="Vehiculo muy sucio..." value={f.observaciones} onChange={e => setF({ ...f, observaciones: e.target.value })} style={{ ...S.inp, minHeight: 50, resize: "vertical" }} /></FI>
      </div>
      <button onClick={save} disabled={!f.fecha || !f.placa || !f.servicioNombre || !precio || saving} style={{ ...S.primBtn, opacity: (!f.fecha || !f.placa || !f.servicioNombre || !precio || saving) ? 0.5 : 1 }}>{saving ? "Guardando..." : "Guardar Ingreso"}</button>
      <Toast message={toast} />
      {pendientes.length > 0 && (<div style={{ marginTop: 24 }}><button onClick={() => setShowList(!showList)} style={S.expandBtn}>{showList ? "v" : ">"} Pendientes ({pendientes.length})</button>
        {showList && <div style={S.miniList}>{pendientes.map(r => (<div key={r.id} style={{ ...S.miniCard, borderColor: editId === r.id ? "#4a7c28" : undefined }}>
          {editId === r.id && ef ? (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}><div style={{ fontSize: 12, fontWeight: 700, color: "#4a7c28" }}>Editando ingreso</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><input type="date" value={ef.fecha} onChange={e => setEf({ ...ef, fecha: e.target.value })} style={{ ...S.inp, flex: 1, minWidth: 130, fontSize: 13, padding: "7px 8px" }} /><input value={ef.placa} onChange={e => setEf({ ...ef, placa: e.target.value.toUpperCase() })} placeholder="Placa" maxLength={7} style={{ ...S.inp, width: 80, fontSize: 13, padding: "7px 8px" }} /></div>
            <input value={ef.cliente} onChange={e => setEf({ ...ef, cliente: e.target.value })} placeholder="Cliente" style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} />
            <div style={S.selW}><select value={ef.servicioNombre} onChange={e => setEf({ ...ef, servicioNombre: e.target.value })} style={{ ...S.sel, fontSize: 13, padding: "7px 8px" }}><option value="">-- Servicio --</option>{catServ.map((s, i) => <option key={i} value={s.nombre}>{s.nombre}</option>)}</select><span style={S.selArr}>&#9662;</span></div>
            <div style={{ display: "flex", gap: 6 }}><div style={{ flex: 1 }}><label style={S.miniLabel}>Precio ($)</label><input type="number" value={ef.precioCobrado} onChange={e => setEf({ ...ef, precioCobrado: e.target.value })} style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} /></div><div style={{ flex: 1 }}><label style={S.miniLabel}>Descuento ($)</label><input type="number" value={ef.descuento} onChange={e => setEf({ ...ef, descuento: e.target.value })} style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} /></div></div>
            <div style={{ display: "flex", gap: 6 }}><select value={ef.medioPago} onChange={e => setEf({ ...ef, medioPago: e.target.value })} style={{ ...S.inp, flex: 1, fontSize: 13, padding: "7px 8px" }}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select><select value={ef.facturado} onChange={e => setEf({ ...ef, facturado: e.target.value, numFactura: e.target.value === "no" ? "" : ef.numFactura })} style={{ ...S.inp, flex: 1, fontSize: 13, padding: "7px 8px" }}><option value="no">No facturado</option><option value="si">Facturado</option></select></div>
            {ef.facturado === "si" && <input value={ef.numFactura} onChange={e => setEf({ ...ef, numFactura: e.target.value })} placeholder="N Factura" style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} />}
            <textarea value={ef.observaciones} onChange={e => setEf({ ...ef, observaciones: e.target.value })} placeholder="Observaciones" style={{ ...S.inp, fontSize: 13, padding: "7px 8px", minHeight: 40, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><button onClick={() => { setEditId(null); setEf(null); }} style={S.smBtn}>Cancelar</button><button onClick={saveEdit} disabled={saving} style={{ ...S.smBtn, background: "#2d5a10", color: "#fff", borderColor: "#2d5a10" }}>{saving ? "..." : "Guardar"}</button></div>
          </div>) : (<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><span style={S.miniPlaca}>{r.placa}</span><span style={{ fontSize: 12, color: "#777", marginLeft: 8 }}>{fDate(r.fecha)}</span></div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#2d5a10", fontSize: 14 }}>{fCOP(r.precioCobrado)}</span></div>
            <div style={{ fontSize: 12, color: "#6a7d55", marginTop: 2 }}>{r.servicioNombre} - {r.medioPago}{r.facturado === "si" ? " - Fact:" + (r.numFactura || "s/n") : ""}</div>
            {r.observaciones && <div style={{ fontSize: 11, color: "#999", marginTop: 2, fontStyle: "italic" }}>{r.observaciones}</div>}
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}><button onClick={() => startEdit(r)} style={{ ...S.smBtn, color: "#4a7c28" }}>Editar</button><button onClick={() => delIngreso(r.id)} style={{ ...S.smBtn, color: "#c0392b" }}>Eliminar</button></div>
          </>)}
        </div>))}</div>}
      </div>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   INSUMOS TAB
   ═══════════════════════════════════════════════ */
function InsumosTab({ insumos, addInsumo, editInsumo, delInsumo, catIns }) {
  const empty = { fecha: todayStr(), insumoNombre: "", cantidad: "", costoUnitario: "", proveedor: "", observaciones: "" };
  const [f, setF] = useState(empty); const [toast, setToast] = useState(""); const [saving, setSaving] = useState(false); const [showList, setShowList] = useState(false);
  const [editId, setEditId] = useState(null); const [ef, setEf] = useState(null);
  const handleIns = (n) => { const fo = catIns.find(c => c.nombre === n); setF({ ...f, insumoNombre: n, costoUnitario: fo ? String(fo.costoUnitario) : f.costoUnitario, proveedor: fo?.proveedor || f.proveedor }); };
  const cant = num(f.cantidad); const costoU = num(f.costoUnitario); const costoTotal = cant * costoU;
  const catItem = catIns.find(c => c.nombre === f.insumoNombre); const costDiff = catItem && costoU > 0 && costoU !== catItem.costoUnitario;
  const save = async () => { if (!f.fecha || !f.insumoNombre || !cant || !costoU) return; setSaving(true); const fo = catIns.find(c => c.nombre === f.insumoNombre); await addInsumo({ fecha: f.fecha, insumoNombre: f.insumoNombre, cantidad: cant, costoUnitario: costoU, costoTotal, unidad: fo?.unidad || "und", proveedor: f.proveedor, observaciones: f.observaciones }); setF(empty); setSaving(false); setToast("Insumo guardado"); setTimeout(() => setToast(""), 2500); };
  const startEdit = (r) => { setEditId(r.id); setEf({ fecha: r.fecha || "", insumoNombre: r.insumoNombre || "", cantidad: String(r.cantidad || ""), costoUnitario: String(r.costoUnitario || ""), proveedor: r.proveedor || "", observaciones: r.observaciones || "" }); };
  const saveEdit = async () => { if (!ef) return; setSaving(true); const fo = catIns.find(c => c.nombre === ef.insumoNombre); await editInsumo(editId, { fecha: ef.fecha, insumoNombre: ef.insumoNombre, cantidad: ef.cantidad, costoUnitario: ef.costoUnitario, costoTotal: num(ef.cantidad) * num(ef.costoUnitario), unidad: fo?.unidad || "und", proveedor: ef.proveedor, observaciones: ef.observaciones }); setEditId(null); setEf(null); setSaving(false); setToast("Insumo actualizado"); setTimeout(() => setToast(""), 2500); };
  const pendientes = insumos.filter(i => !i.liquidado).reverse();
  return (
    <div style={S.sec}>
      <SH title="Registrar Insumo" subtitle="Entregas y consumos" />
      {catIns.length === 0 && <div style={S.warn}>No hay insumos en el catalogo. Ve a Resumen - Catalogos.</div>}
      <div style={S.formGrid}>
        <FI label="Fecha" span={2}><input type="date" value={f.fecha} onChange={e => setF({ ...f, fecha: e.target.value })} style={S.inp} /></FI>
        <FI label="Insumo" span={2}><div style={S.selW}><select value={f.insumoNombre} onChange={e => handleIns(e.target.value)} style={S.sel}><option value="">-- Seleccionar --</option>{catIns.map((s, i) => <option key={i} value={s.nombre}>{s.nombre} ({s.unidad} - {fCOP(s.costoUnitario)})</option>)}</select><span style={S.selArr}>&#9662;</span></div></FI>
        <FI label="Cantidad"><input type="number" placeholder="0" value={f.cantidad} onChange={e => setF({ ...f, cantidad: e.target.value })} style={S.inp} /></FI>
        <FI label="Costo unitario ($)"><input type="number" placeholder="0" value={f.costoUnitario} onChange={e => setF({ ...f, costoUnitario: e.target.value })} style={{ ...S.inp, borderColor: costDiff ? "#e67e22" : undefined }} />{costDiff && <div style={{ fontSize: 11, color: "#e67e22", marginTop: 3, fontWeight: 600 }}>Diferente al catalogo ({fCOP(catItem.costoUnitario)})</div>}</FI>
        {costoTotal > 0 && <div style={{ ...S.netoBadge, gridColumn: "1/-1", background: "#fef5e7", color: "#7d5a08" }}>Costo total: <strong style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fCOP(costoTotal)}</strong></div>}
        <FI label="Proveedor"><input placeholder="Opcional" value={f.proveedor} onChange={e => setF({ ...f, proveedor: e.target.value })} style={S.inp} /></FI>
        <FI label="Observaciones"><textarea placeholder="Nota..." value={f.observaciones} onChange={e => setF({ ...f, observaciones: e.target.value })} style={{ ...S.inp, minHeight: 40, resize: "vertical" }} /></FI>
      </div>
      <button onClick={save} disabled={!f.fecha || !f.insumoNombre || !cant || !costoU || saving} style={{ ...S.primBtn, opacity: (!f.fecha || !f.insumoNombre || !cant || !costoU || saving) ? 0.5 : 1 }}>{saving ? "Guardando..." : "Guardar Insumo"}</button>
      <Toast message={toast} />
      {pendientes.length > 0 && (<div style={{ marginTop: 24 }}><button onClick={() => setShowList(!showList)} style={S.expandBtn}>{showList ? "v" : ">"} Pendientes ({pendientes.length})</button>
        {showList && <div style={S.miniList}>{pendientes.map(r => (<div key={r.id} style={{ ...S.miniCard, borderColor: editId === r.id ? "#4a7c28" : undefined }}>
          {editId === r.id && ef ? (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}><div style={{ fontSize: 12, fontWeight: 700, color: "#4a7c28" }}>Editando insumo</div>
            <input type="date" value={ef.fecha} onChange={e => setEf({ ...ef, fecha: e.target.value })} style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} />
            <div style={S.selW}><select value={ef.insumoNombre} onChange={e => { const fo = catIns.find(c => c.nombre === e.target.value); setEf({ ...ef, insumoNombre: e.target.value, costoUnitario: fo ? String(fo.costoUnitario) : ef.costoUnitario }); }} style={{ ...S.sel, fontSize: 13, padding: "7px 8px" }}><option value="">-- Insumo --</option>{catIns.map((s, i) => <option key={i} value={s.nombre}>{s.nombre}</option>)}</select><span style={S.selArr}>&#9662;</span></div>
            <div style={{ display: "flex", gap: 6 }}><div style={{ flex: 1 }}><label style={S.miniLabel}>Cantidad</label><input type="number" value={ef.cantidad} onChange={e => setEf({ ...ef, cantidad: e.target.value })} style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} /></div><div style={{ flex: 1 }}><label style={S.miniLabel}>Costo unit. ($)</label><input type="number" value={ef.costoUnitario} onChange={e => setEf({ ...ef, costoUnitario: e.target.value })} style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} /></div></div>
            <input value={ef.proveedor} onChange={e => setEf({ ...ef, proveedor: e.target.value })} placeholder="Proveedor" style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} />
            <textarea value={ef.observaciones} onChange={e => setEf({ ...ef, observaciones: e.target.value })} placeholder="Observaciones" style={{ ...S.inp, fontSize: 13, padding: "7px 8px", minHeight: 36, resize: "vertical" }} />
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><button onClick={() => { setEditId(null); setEf(null); }} style={S.smBtn}>Cancelar</button><button onClick={saveEdit} disabled={saving} style={{ ...S.smBtn, background: "#2d5a10", color: "#fff", borderColor: "#2d5a10" }}>{saving ? "..." : "Guardar"}</button></div>
          </div>) : (<>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><span style={{ fontWeight: 700 }}>{r.insumoNombre}</span><span style={{ fontSize: 12, color: "#777", marginLeft: 8 }}>{fDate(r.fecha)}</span></div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#c0392b", fontSize: 14 }}>{fCOP(r.costoTotal)}</span></div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{r.cantidad} x {fCOP(r.costoUnitario)}{r.proveedor ? " - " + r.proveedor : ""}</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}><button onClick={() => startEdit(r)} style={{ ...S.smBtn, color: "#4a7c28" }}>Editar</button><button onClick={() => delInsumo(r.id)} style={{ ...S.smBtn, color: "#c0392b" }}>Eliminar</button></div>
          </>)}
        </div>))}</div>}
      </div>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   GASTOS TAB (NEW)
   ═══════════════════════════════════════════════ */
function GastosTab({ gastos, addGasto, editGasto, delGasto, catGas }) {
  const empty = { fecha: todayStr(), concepto: "", valor: "", observaciones: "" };
  const [f, setF] = useState(empty); const [toast, setToast] = useState(""); const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null); const [ef, setEf] = useState(null);
  const [mesFilter, setMesFilter] = useState(todayStr().slice(0, 7));

  const handleConcepto = (c) => { const fo = catGas.find(g => g.nombre === c); setF({ ...f, concepto: c, valor: fo ? String(fo.valorRef) : f.valor }); };
  const valor = num(f.valor);

  const save = async () => { if (!f.fecha || !f.concepto || !valor) return; setSaving(true); await addGasto({ fecha: f.fecha, concepto: f.concepto, valor, observaciones: f.observaciones }); setF(empty); setSaving(false); setToast("Gasto registrado"); setTimeout(() => setToast(""), 2500); };
  const startEdit = (r) => { setEditId(r.id); setEf({ fecha: r.fecha || "", concepto: r.concepto || "", valor: String(r.valor || ""), observaciones: r.observaciones || "" }); };
  const saveEdit = async () => { if (!ef) return; setSaving(true); await editGasto(editId, { fecha: ef.fecha, concepto: ef.concepto, valor: ef.valor, observaciones: ef.observaciones }); setEditId(null); setEf(null); setSaving(false); setToast("Gasto actualizado"); setTimeout(() => setToast(""), 2500); };

  const filtered = gastos.filter(g => g.fecha?.startsWith(mesFilter)).reverse();
  const totalMes = filtered.reduce((s, g) => s + (g.valor || 0), 0);

  return (
    <div style={S.sec}>
      <SH title="Gastos del Propietario" subtitle="Costos fijos y variables (no se dividen)" />
      {catGas.length === 0 && <div style={S.warn}>No hay conceptos de gasto. Ve a Resumen - Catalogos para crearlos.</div>}
      <div style={S.formGrid}>
        <FI label="Fecha" span={2}><input type="date" value={f.fecha} onChange={e => setF({ ...f, fecha: e.target.value })} style={S.inp} /></FI>
        <FI label="Concepto" span={2}><div style={S.selW}><select value={f.concepto} onChange={e => handleConcepto(e.target.value)} style={S.sel}><option value="">-- Seleccionar --</option>{catGas.map((g, i) => <option key={i} value={g.nombre}>{g.nombre} ({fCOP(g.valorRef)})</option>)}</select><span style={S.selArr}>&#9662;</span></div></FI>
        <FI label="Valor ($)" span={2}><input type="number" placeholder="0" value={f.valor} onChange={e => setF({ ...f, valor: e.target.value })} style={S.inp} /></FI>
        <FI label="Observaciones" span={2}><textarea placeholder="Detalle..." value={f.observaciones} onChange={e => setF({ ...f, observaciones: e.target.value })} style={{ ...S.inp, minHeight: 40, resize: "vertical" }} /></FI>
      </div>
      <button onClick={save} disabled={!f.fecha || !f.concepto || !valor || saving} style={{ ...S.primBtn, opacity: (!f.fecha || !f.concepto || !valor || saving) ? 0.5 : 1 }}>{saving ? "Guardando..." : "Guardar Gasto"}</button>
      <Toast message={toast} />

      {/* Monthly list */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a2e05" }}>Gastos del mes</h3>
          <input type="month" value={mesFilter} onChange={e => setMesFilter(e.target.value)} style={{ ...S.inp, width: 150, fontSize: 13, padding: "6px 8px" }} />
        </div>
        {totalMes > 0 && <div style={{ ...S.netoBadge, background: "#fde8e8", color: "#922", marginBottom: 10 }}>Total gastos del mes: <strong style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fCOP(totalMes)}</strong></div>}
        {filtered.length === 0 ? <div style={S.empty}>Sin gastos en este mes.</div> : (
          <div style={S.miniList}>{filtered.map(r => (
            <div key={r.id} style={{ ...S.miniCard, borderColor: editId === r.id ? "#4a7c28" : undefined }}>
              {editId === r.id && ef ? (<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4a7c28" }}>Editando gasto</div>
                <input type="date" value={ef.fecha} onChange={e => setEf({ ...ef, fecha: e.target.value })} style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} />
                <div style={S.selW}><select value={ef.concepto} onChange={e => setEf({ ...ef, concepto: e.target.value })} style={{ ...S.sel, fontSize: 13, padding: "7px 8px" }}><option value="">-- Concepto --</option>{catGas.map((g, i) => <option key={i} value={g.nombre}>{g.nombre}</option>)}</select><span style={S.selArr}>&#9662;</span></div>
                <div><label style={S.miniLabel}>Valor ($)</label><input type="number" value={ef.valor} onChange={e => setEf({ ...ef, valor: e.target.value })} style={{ ...S.inp, fontSize: 13, padding: "7px 8px" }} /></div>
                <textarea value={ef.observaciones} onChange={e => setEf({ ...ef, observaciones: e.target.value })} placeholder="Observaciones" style={{ ...S.inp, fontSize: 13, padding: "7px 8px", minHeight: 36, resize: "vertical" }} />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}><button onClick={() => { setEditId(null); setEf(null); }} style={S.smBtn}>Cancelar</button><button onClick={saveEdit} disabled={saving} style={{ ...S.smBtn, background: "#2d5a10", color: "#fff", borderColor: "#2d5a10" }}>{saving ? "..." : "Guardar"}</button></div>
              </div>) : (<>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><span style={{ fontWeight: 700 }}>{r.concepto}</span><span style={{ fontSize: 12, color: "#777", marginLeft: 8 }}>{fDate(r.fecha)}</span></div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#922", fontSize: 14 }}>{fCOP(r.valor)}</span></div>
                {r.observaciones && <div style={{ fontSize: 11, color: "#999", marginTop: 2, fontStyle: "italic" }}>{r.observaciones}</div>}
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}><button onClick={() => startEdit(r)} style={{ ...S.smBtn, color: "#4a7c28" }}>Editar</button><button onClick={() => delGasto(r.id)} style={{ ...S.smBtn, color: "#c0392b" }}>Eliminar</button></div>
              </>)}
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LIQUIDAR TAB
   ═══════════════════════════════════════════════ */
function LiquidarTab({ ingPend, insPend, onLiquidar }) {
  const [selIng, setSelIng] = useState([]); const [selIns, setSelIns] = useState([]); const [done, setDone] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => { setSelIng(ingPend.map(i => i.id)); }, [ingPend.length]);
  useEffect(() => { setSelIns(insPend.map(i => i.id)); }, [insPend.length]);
  const togIng = (id) => setSelIng(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const togIns = (id) => setSelIns(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const allIng = () => setSelIng(selIng.length === ingPend.length ? [] : ingPend.map(i => i.id));
  const allIns = () => setSelIns(selIns.length === insPend.length ? [] : insPend.map(i => i.id));
  const sI = ingPend.filter(i => selIng.includes(i.id)); const sS = insPend.filter(i => selIns.includes(i.id));
  const tIng = sI.reduce((s, i) => s + (i.precioCobrado || 0), 0); const tDesc = sI.reduce((s, i) => s + (i.descuento || 0), 0);
  const tIns = sS.reduce((s, i) => s + (i.costoTotal || 0), 0); const neto = tIng - tDesc; const utilidad = neto - tIns; const mitad = utilidad / 2;
  const confirmar = async () => { if (!selIng.length || saving) return; setSaving(true); await onLiquidar(selIng, selIns); setSaving(false); setDone(true); setTimeout(() => setDone(false), 3000); };
  if (!ingPend.length && !insPend.length) return (<div style={S.sec}><SH title="Liquidacion" /><div style={S.empty}>No hay pendientes. Semana limpia!</div></div>);
  return (
    <div style={S.sec}>
      <SH title="Liquidacion" subtitle="Selecciona que entra" />
      {done && <Toast message="Liquidacion guardada" />}
      <div style={S.liqSection}><div style={S.liqHead}><h3 style={S.liqTitle}>Ingresos ({ingPend.length})</h3><button onClick={allIng} style={S.selAllBtn}>{selIng.length === ingPend.length ? "Deseleccionar" : "Seleccionar"} todos</button></div>
        <div style={S.checkList}>{ingPend.map(r => (<label key={r.id} style={{ ...S.checkItem, ...(selIng.includes(r.id) ? S.checkItemSel : {}) }}><input type="checkbox" checked={selIng.includes(r.id)} onChange={() => togIng(r.id)} style={S.chk} /><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span><strong>{r.placa}</strong> <span style={{ color: "#777", fontSize: 12 }}>{r.servicioNombre}</span></span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#2d5a10" }}>{fCOP(r.precioCobrado)}</span></div><div style={{ fontSize: 11, color: "#999" }}>{fDate(r.fecha)} - {r.medioPago}{r.descuento > 0 ? " - desc:" + fCOP(r.descuento) : ""}</div></div></label>))}</div></div>
      <div style={S.liqSection}><div style={S.liqHead}><h3 style={S.liqTitle}>Insumos ({insPend.length})</h3>{insPend.length > 0 && <button onClick={allIns} style={S.selAllBtn}>{selIns.length === insPend.length ? "Deseleccionar" : "Seleccionar"} todos</button>}</div>
        {!insPend.length ? <div style={{ fontSize: 13, color: "#999", padding: 10 }}>Sin insumos pendientes</div> : <div style={S.checkList}>{insPend.map(r => (<label key={r.id} style={{ ...S.checkItem, ...(selIns.includes(r.id) ? { ...S.checkItemSel, borderColor: "#e8c8a0" } : {}) }}><input type="checkbox" checked={selIns.includes(r.id)} onChange={() => togIns(r.id)} style={S.chk} /><div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 600 }}>{r.insumoNombre}</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#c0392b" }}>{fCOP(r.costoTotal)}</span></div><div style={{ fontSize: 11, color: "#999" }}>{fDate(r.fecha)} - {r.cantidad} x {fCOP(r.costoUnitario)}</div></div></label>))}</div>}</div>
      {selIng.length > 0 && (<div style={S.liqCalc}><h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#1a2e05" }}>Resumen</h3>
        <LR label={`Ingresos (${selIng.length})`} value={fCOP(tIng)} /><LR label="- Descuentos" value={"-" + fCOP(tDesc)} color="#c0392b" /><div style={S.liqDiv} />
        <LR label="Ingreso neto" value={fCOP(neto)} bold /><LR label={`- Insumos (${selIns.length})`} value={"-" + fCOP(tIns)} color="#c0392b" /><div style={S.liqDiv} />
        <LR label="Utilidad bruta" value={fCOP(utilidad)} bold big color={utilidad >= 0 ? "#2d5a10" : "#c0392b"} /><div style={S.liqDiv} />
        <LR label="Trabajadores (50%)" value={fCOP(mitad)} color="#5b7a3a" /><LR label="Propietario (50%)" value={fCOP(mitad)} color="#2d5016" />
        <button onClick={confirmar} disabled={saving} style={{ ...S.primBtn, background: "linear-gradient(135deg,#1a3a06,#2d5a10)", marginTop: 16, opacity: saving ? 0.5 : 1 }}>{saving ? "Guardando..." : "Confirmar Liquidacion"}</button>
      </div>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RESUMEN TAB
   ═══════════════════════════════════════════════ */
function ResumenTab({ liquidaciones, ingresos, gastos, catServ, setCatServ, catIns, setCatIns, catGas, setCatGas, config, setConfig, subTab, setSubTab }) {
  return (
    <div style={S.sec}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>{[["dashboard", "Dashboard"], ["historial", "Liquidaciones"], ["catalogos", "Catalogos"]].map(([k, l]) => (<button key={k} onClick={() => setSubTab(k)} style={{ ...S.togBtn, ...(subTab === k ? S.togAct : {}), fontSize: 12, padding: "8px 14px" }}>{l}</button>))}</div>
      {subTab === "dashboard" && <DashSub liquidaciones={liquidaciones} gastos={gastos} />}
      {subTab === "historial" && <HistSub liquidaciones={liquidaciones} ingresos={ingresos} />}
      {subTab === "catalogos" && <CatSub catServ={catServ} setCatServ={setCatServ} catIns={catIns} setCatIns={setCatIns} catGas={catGas} setCatGas={setCatGas} config={config} setConfig={setConfig} />}
    </div>
  );
}

function DashSub({ liquidaciones, gastos }) {
  const [p, setP] = useState("mes"); const now = new Date();
  const lf = useMemo(() => liquidaciones.filter(l => { const d = new Date(l.fecha + "T12:00:00"); if (p === "semana") { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; } if (p === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); return true; }), [liquidaciones, p]);
  const gf = useMemo(() => gastos.filter(g => { const d = new Date(g.fecha + "T12:00:00"); if (p === "semana") { const w = new Date(now); w.setDate(w.getDate() - 7); return d >= w; } if (p === "mes") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); return true; }), [gastos, p]);
  const st = useMemo(() => { const s = { ing: 0, ins: 0, util: 0, trab: 0, prop: 0, count: lf.length, srv: 0 }; lf.forEach(l => { s.ing += l.totalIngresos; s.ins += l.totalInsumos; s.util += l.utilidadBruta; s.trab += l.parteTrabajadores; s.prop += l.partePropietario; s.srv += l.numServicios; }); return s; }, [lf]);
  const totalGastos = gf.reduce((s, g) => s + (g.valor || 0), 0);
  const utilidadReal = st.prop - totalGastos;
  if (!liquidaciones.length && !gastos.length) return <div style={S.empty}>Registra datos para ver estadisticas.</div>;
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}><h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a2e05" }}>Dashboard</h3><div style={S.togRow}>{[["semana", "Semana"], ["mes", "Mes"], ["todo", "Todo"]].map(([k, l]) => (<button key={k} onClick={() => setP(k)} style={{ ...S.togBtn, ...(p === k ? S.togAct : {}), fontSize: 11, padding: "5px 10px" }}>{l}</button>))}</div></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
      <SC label="Liquidaciones" value={st.count} /><SC label="Servicios" value={st.srv} /><SC label="Ingresos" value={fCOP(st.ing)} hi /><SC label="Insumos" value={fCOP(st.ins)} /><SC label="Utilidad bruta" value={fCOP(st.util)} hi /><SC label="Trabajadores" value={fCOP(st.trab)} color="#5b7a3a" /><SC label="Propietario 50%" value={fCOP(st.prop)} color="#2d5016" />
    </div>
    {/* Owner real profit card */}
    <div style={{ ...S.dashCard, marginTop: 12, background: "linear-gradient(135deg, #f6faf0, #eaf0dd)", borderColor: "#b8d494" }}>
      <h4 style={{ ...S.dashCardT, fontSize: 14 }}>Utilidad real del Propietario</h4>
      <LR label="Parte propietario (50%)" value={fCOP(st.prop)} />
      <LR label="- Gastos del propietario" value={"-" + fCOP(totalGastos)} color="#922" />
      <div style={S.liqDiv} />
      <LR label="Utilidad REAL" value={fCOP(utilidadReal)} bold big color={utilidadReal >= 0 ? "#2d5016" : "#c0392b"} />
    </div>
    {gf.length > 0 && <div style={{ ...S.dashCard, marginTop: 8 }}>
      <h4 style={S.dashCardT}>Detalle gastos del periodo</h4>
      {gf.map((g, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f0f4e8" }}><span>{g.concepto} <span style={{ color: "#999", fontSize: 11 }}>{fDate(g.fecha)}</span></span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: "#922" }}>{fCOP(g.valor)}</span></div>))}
    </div>}
  </div>);
}

function HistSub({ liquidaciones, ingresos }) {
  const [open, setOpen] = useState(null); const sorted = [...liquidaciones].reverse();
  if (!sorted.length) return <div style={S.empty}>No hay liquidaciones.</div>;
  return (<div><h3 style={{ fontSize: 18, fontWeight: 800, color: "#1a2e05", marginBottom: 12 }}>Historial</h3>
    {sorted.map(l => { const li = l.ingresosIds ? ingresos.filter(i => l.ingresosIds.split(",").includes(i.id)) : []; return (
      <div key={l.id} style={{ ...S.dashCard, marginBottom: 10, cursor: "pointer" }} onClick={() => setOpen(open === l.id ? null : l.id)}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><div><span style={{ fontWeight: 800, color: "#4a7c28", marginRight: 8 }}>#{l.consecutivo}</span><span style={{ fontSize: 13, color: "#777" }}>{fDate(l.fecha)}</span></div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: "#2d5a10", fontSize: 16 }}>{fCOP(l.utilidadBruta)}</span></div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{l.numServicios} srv - {l.numInsumos} ins - Prop: {fCOP(l.partePropietario)}</div>
        {open === l.id && (<div style={{ marginTop: 12, borderTop: "1px solid #e8eddf", paddingTop: 10 }}>{li.map((r, i) => (<div key={i} style={{ fontSize: 12, padding: "3px 0", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f4f7ef" }}><span>{r.placa} - {r.servicioNombre}</span><span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{fCOP(r.precioCobrado)}</span></div>))}
          <div style={{ marginTop: 8 }}><LR label="Ingresos" value={fCOP(l.totalIngresos)} /><LR label="Descuentos" value={"-" + fCOP(l.totalDescuentos)} color="#c0392b" /><LR label="Insumos" value={"-" + fCOP(l.totalInsumos)} color="#c0392b" /><div style={S.liqDiv} /><LR label="Utilidad" value={fCOP(l.utilidadBruta)} bold /></div></div>)}
      </div>); })}
  </div>);
}

function CatSub({ catServ, setCatServ, catIns, setCatIns, catGas, setCatGas, config, setConfig }) {
  const [sN, setSN] = useState(""); const [sP, setSP] = useState("");
  const [iN, setIN] = useState(""); const [iU, setIU] = useState("bolsa"); const [iC, setIC] = useState(""); const [iP, setIP] = useState("");
  const [gN, setGN] = useState(""); const [gV, setGV] = useState("");
  const [sv2, setSv2] = useState(false);
  const addS = async () => { if (!sN.trim() || !sP) return; setSv2(true); await setCatServ([...catServ, { nombre: sN.trim(), precioBase: num(sP) }]); setSN(""); setSP(""); setSv2(false); };
  const delS = async (i) => { setSv2(true); await setCatServ(catServ.filter((_, j) => j !== i)); setSv2(false); };
  const addI = async () => { if (!iN.trim() || !iC) return; setSv2(true); await setCatIns([...catIns, { nombre: iN.trim(), unidad: iU, costoUnitario: num(iC), proveedor: iP }]); setIN(""); setIC(""); setIP(""); setSv2(false); };
  const delI = async (i) => { setSv2(true); await setCatIns(catIns.filter((_, j) => j !== i)); setSv2(false); };
  const addG = async () => { if (!gN.trim() || !gV) return; setSv2(true); await setCatGas([...catGas, { nombre: gN.trim(), valorRef: num(gV) }]); setGN(""); setGV(""); setSv2(false); };
  const delG = async (i) => { setSv2(true); await setCatGas(catGas.filter((_, j) => j !== i)); setSv2(false); };
  return (<div>
    <div style={{ ...S.dashCard, marginBottom: 16, borderColor: "#c5d4a8" }}><h4 style={{ ...S.dashCardT, marginBottom: 10 }}>Descuento Administrativo</h4><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><FI label="Monto ($)" compact><input type="number" value={config.descuento} onChange={e => setConfig({ ...config, descuento: num(e.target.value) })} style={{ ...S.inp, width: 120 }} /></FI><FI label="Si precio >= ($)" compact><input type="number" value={config.umbral} onChange={e => setConfig({ ...config, umbral: num(e.target.value) })} style={{ ...S.inp, width: 120 }} /></FI></div></div>

    <h4 style={{ fontSize: 15, fontWeight: 800, color: "#1a2e05", marginBottom: 8 }}>Servicios</h4>
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}><input placeholder="Nombre" value={sN} onChange={e => setSN(e.target.value)} style={{ ...S.inp, flex: 1, minWidth: 120 }} /><input type="number" placeholder="Precio base" value={sP} onChange={e => setSP(e.target.value)} style={{ ...S.inp, width: 110 }} /><button onClick={addS} disabled={!sN.trim() || !sP || sv2} style={{ ...S.primBtn, padding: "8px 14px", fontSize: 13, marginTop: 0, width: "auto", opacity: (!sN.trim() || !sP) ? 0.4 : 1 }}>+</button></div>
    {catServ.map((s, i) => (<div key={i} style={{ ...S.miniCard, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><strong>{s.nombre}</strong> <span style={{ color: "#5b7a3a", fontSize: 13 }}>{fCOP(s.precioBase)}</span></div><button onClick={() => delS(i)} style={{ ...S.smBtn, color: "#c0392b" }}>x</button></div>))}
    {!catServ.length && <div style={{ fontSize: 13, color: "#999", padding: 10 }}>Sin servicios.</div>}

    <h4 style={{ fontSize: 15, fontWeight: 800, color: "#1a2e05", marginTop: 20, marginBottom: 8 }}>Insumos</h4>
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}><input placeholder="Nombre" value={iN} onChange={e => setIN(e.target.value)} style={{ ...S.inp, flex: 1, minWidth: 100 }} /><select value={iU} onChange={e => setIU(e.target.value)} style={{ ...S.inp, width: 85, padding: "8px 4px" }}>{["bolsa", "galon", "litro", "unidad", "kg", "frasco", "caja"].map(u => <option key={u} value={u}>{u}</option>)}</select><input type="number" placeholder="Costo" value={iC} onChange={e => setIC(e.target.value)} style={{ ...S.inp, width: 90 }} /><input placeholder="Prov." value={iP} onChange={e => setIP(e.target.value)} style={{ ...S.inp, width: 90 }} /><button onClick={addI} disabled={!iN.trim() || !iC || sv2} style={{ ...S.primBtn, padding: "8px 14px", fontSize: 13, marginTop: 0, width: "auto", opacity: (!iN.trim() || !iC) ? 0.4 : 1 }}>+</button></div>
    {catIns.map((s, i) => (<div key={i} style={{ ...S.miniCard, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><strong>{s.nombre}</strong> <span style={{ color: "#888", fontSize: 12 }}>{s.unidad} - {fCOP(s.costoUnitario)}{s.proveedor ? " - " + s.proveedor : ""}</span></div><button onClick={() => delI(i)} style={{ ...S.smBtn, color: "#c0392b" }}>x</button></div>))}
    {!catIns.length && <div style={{ fontSize: 13, color: "#999", padding: 10 }}>Sin insumos.</div>}

    <h4 style={{ fontSize: 15, fontWeight: 800, color: "#1a2e05", marginTop: 20, marginBottom: 8 }}>Gastos del Propietario</h4>
    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}><input placeholder="Concepto (Arriendo, Luz...)" value={gN} onChange={e => setGN(e.target.value)} style={{ ...S.inp, flex: 1, minWidth: 140 }} /><input type="number" placeholder="Valor ref." value={gV} onChange={e => setGV(e.target.value)} style={{ ...S.inp, width: 110 }} /><button onClick={addG} disabled={!gN.trim() || !gV || sv2} style={{ ...S.primBtn, padding: "8px 14px", fontSize: 13, marginTop: 0, width: "auto", opacity: (!gN.trim() || !gV) ? 0.4 : 1 }}>+</button></div>
    {catGas.map((g, i) => (<div key={i} style={{ ...S.miniCard, marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><strong>{g.nombre}</strong> <span style={{ color: "#922", fontSize: 13 }}>{fCOP(g.valorRef)}/mes ref.</span></div><button onClick={() => delG(i)} style={{ ...S.smBtn, color: "#c0392b" }}>x</button></div>))}
    {!catGas.length && <div style={{ fontSize: 13, color: "#999", padding: 10 }}>Sin conceptos de gasto.</div>}
  </div>);
}

/* ═══════════════════════════════════════════════
   REUSABLE
   ═══════════════════════════════════════════════ */
function SH({ title, subtitle }) { return <div style={{ marginBottom: 16 }}><h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a2e05" }}>{title}</h2>{subtitle && <p style={{ fontSize: 13, color: "#8a9a7c", marginTop: 2 }}>{subtitle}</p>}</div>; }
function FI({ label, children, span, compact }) { return <div style={span === 2 ? { gridColumn: "1/-1" } : {}}><label style={{ display: "block", fontSize: compact ? 10 : 11, fontWeight: 700, color: "#6a7d55", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>{children}</div>; }
function LR({ label, value, bold, big, color }) { return <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: big ? 18 : 14 }}><span style={{ color: "#333", fontWeight: bold ? 800 : 400 }}>{label}</span><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: bold ? 800 : 600, color: color || "#1a2e05" }}>{value}</span></div>; }
function SC({ label, value, hi, color }) { return <div style={{ ...S.dashCard, padding: "10px 8px", textAlign: "center", ...(hi ? { background: "linear-gradient(135deg,#1a3a06,#2d5a10)", border: "none" } : {}) }}><div style={{ fontSize: 14, fontWeight: 800, color: color || (hi ? "#fff" : "#1a2e05"), fontFamily: typeof value === "string" && value.includes("$") ? "'JetBrains Mono',monospace" : undefined, lineHeight: 1.2 }}>{value}</div><div style={{ fontSize: 10, color: hi ? "rgba(255,255,255,0.6)" : "#999", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 2 }}>{label}</div></div>; }

/* ═══════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════ */
const S = {
  app: { fontFamily: "'DM Sans',sans-serif", background: "#f0f4e8", minHeight: "100vh", maxWidth: 540, margin: "0 auto", paddingBottom: 80, color: "#1a2e05" },
  header: { background: "linear-gradient(145deg,#0f1f03,#1a3a06 40%,#2d5a10)", padding: "20px 16px 12px" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "4px", lineHeight: 1, fontFamily: "'JetBrains Mono',monospace" },
  logoSub: { fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 },
  headerStats: { display: "flex", gap: 12, alignItems: "center" },
  headerStat: { display: "flex", flexDirection: "column", alignItems: "center" },
  hNum: { fontSize: 18, fontWeight: 800, color: "#78d42d", fontFamily: "'JetBrains Mono',monospace" },
  hLbl: { fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" },
  nav: { display: "flex", background: "#fff", borderBottom: "2px solid #dde6cc", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 2px 6px", border: "none", background: "transparent", cursor: "pointer", borderBottom: "3px solid transparent", transition: "all 0.15s" },
  navAct: { borderBottomColor: "#4a7c28", background: "#f6f9f0" },
  sec: { padding: "18px 14px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  inp: { width: "100%", padding: "9px 11px", border: "2px solid #d0dbb8", borderRadius: 10, fontSize: 14, background: "#fff", color: "#1a2e05", boxSizing: "border-box", transition: "border-color 0.15s,box-shadow 0.15s" },
  selW: { position: "relative" }, sel: { width: "100%", padding: "9px 30px 9px 11px", border: "2px solid #d0dbb8", borderRadius: 10, fontSize: 14, background: "#fff", color: "#1a2e05", appearance: "none", cursor: "pointer", boxSizing: "border-box" },
  selArr: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#999", fontSize: 14 },
  netoBadge: { background: "#eaf0dd", padding: "8px 12px", borderRadius: 8, fontSize: 14, color: "#3d5a1e", textAlign: "center" },
  togRow: { display: "flex", gap: 6 }, togBtn: { flex: 1, padding: "9px 12px", border: "2px solid #d0dbb8", borderRadius: 10, background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#777", transition: "all 0.15s", textAlign: "center" },
  togAct: { borderColor: "#4a7c28", background: "#eaf0dd", color: "#1a3a06", fontWeight: 700 },
  primBtn: { width: "100%", padding: "13px", border: "none", borderRadius: 12, background: "linear-gradient(135deg,#2d5a10,#4a7c28)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 16, letterSpacing: "0.3px", transition: "opacity 0.2s" },
  warn: { background: "#fef9e7", border: "1px solid #f0d860", borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 13, color: "#7d6608" },
  empty: { textAlign: "center", padding: "36px 16px", color: "#aaa", fontSize: 14 },
  expandBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#4a7c28", padding: "6px 0" },
  miniList: { display: "flex", flexDirection: "column", gap: 6, marginTop: 8 },
  miniCard: { background: "#fff", border: "1.5px solid #e0e8d0", borderRadius: 10, padding: "10px 12px" },
  miniPlaca: { fontWeight: 800, letterSpacing: "1.5px", color: "#1a2e05", fontFamily: "'JetBrains Mono',monospace" },
  miniLabel: { display: "block", fontSize: 10, fontWeight: 700, color: "#6a7d55", marginBottom: 2, textTransform: "uppercase" },
  smBtn: { padding: "6px 12px", border: "1.5px solid #ddd", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, color: "#555", fontWeight: 600 },
  liqSection: { background: "#fff", border: "2px solid #dde6cc", borderRadius: 14, padding: 14, marginBottom: 12 },
  liqHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  liqTitle: { fontSize: 15, fontWeight: 800, color: "#1a2e05", margin: 0 },
  selAllBtn: { fontSize: 12, color: "#4a7c28", background: "none", border: "none", cursor: "pointer", fontWeight: 600, textDecoration: "underline" },
  checkList: { display: "flex", flexDirection: "column", gap: 6 },
  checkItem: { display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 10, border: "2px solid #eee", cursor: "pointer", transition: "all 0.15s" },
  checkItemSel: { borderColor: "#b8d494", background: "#f6faf0" },
  chk: { marginTop: 3, accentColor: "#4a7c28", width: 16, height: 16 },
  liqCalc: { background: "linear-gradient(145deg,#f6faf0,#eaf0dd)", border: "2px solid #b8d494", borderRadius: 16, padding: 18, marginTop: 12 },
  liqDiv: { height: 1, background: "#c5d4a8", margin: "6px 0" },
  dashCard: { background: "#fff", border: "2px solid #dde6cc", borderRadius: 12, padding: 14 },
  dashCardT: { margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#4a7c28" },
};


import React, { useEffect, useState } from 'react';
const TOKEN_KEY = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'inventory_drone_ops_token';
const API_BASE = 'http://localhost:4061/api';
export default function DiscrepancyInboxWorkbench(){
  const [rows,setRows]=useState([]);const [filter,setFilter]=useState('all');const [busy,setBusy]=useState(null);
  const load=()=>fetch(API_BASE+'/discrepancies',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(setRows);
  useEffect(()=>{load();},[]);
  const setStatus=async(r,status)=>{
    setBusy(r.id);
    await fetch(API_BASE+'/discrepancies/'+r.id,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)},body:JSON.stringify({...r,status})});
    setBusy(null);load();
  };
  const filtered=rows.filter(r=>filter==='all'||r.severity===filter);
  const order={critical:0,high:1,medium:2,low:3};
  filtered.sort((a,b)=>(order[a.severity]??9)-(order[b.severity]??9));
  return (
    <div>
      <div className="page-header"><div><h2>Discrepancy Inbox</h2><p>Severity-sorted exceptions · click a button to resolve.</p></div></div>
      <div className="toolbar"><div style={{display:'flex',gap:6}}>{['all','critical','high','medium','low'].map(s=>(<button key={s} className={'btn '+(filter===s?'':'secondary')} onClick={()=>setFilter(s)}>{s}</button>))}</div></div>
      {filtered.map(r=>(
        <div key={r.id} style={{padding:14,borderLeft:'3px solid '+(r.severity==='critical'?'#ef4444':r.severity==='high'?'#f59e0b':r.severity==='medium'?'#facc15':'#64748b'),marginBottom:8,background:'#0b1424',borderRadius:4}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <strong>{r.sku} @ {r.location}</strong>
            <div style={{display:'flex',gap:6}}>
              <span className={'badge '+(r.severity||'')}>{r.severity}</span>
              <span className={'badge '+(r.status||'')}>{r.status}</span>
            </div>
          </div>
          <div style={{color:'#94a3b8',fontSize:13}}>Δ {r.delta}</div>
          <div style={{marginTop:10,display:'flex',gap:6}}>
            <button className="btn secondary" disabled={busy===r.id} onClick={()=>setStatus(r,'recount')}>Send to recount</button>
            <button className="btn" disabled={busy===r.id} onClick={()=>setStatus(r,'resolved')}>Resolve</button>
          </div>
        </div>
      ))}
    </div>
  );
}
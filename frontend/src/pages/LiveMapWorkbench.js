
import React, { useEffect, useState } from 'react';
const TOKEN_KEY = Object.keys(localStorage).find((k) => k.endsWith('_token')) || 'inventory_drone_ops_token';
const API_BASE = 'http://localhost:4061/api';
export default function LiveMapWorkbench(){
  const [drones,setDrones]=useState([]);
  const refresh=()=>fetch(API_BASE+'/drones',{headers:{Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)}}).then(r=>r.json()).then(setDrones);
  useEffect(()=>{refresh();const t=setInterval(refresh,3000);return ()=>clearInterval(t);},[]);
  const move=async(d)=>{
    // Move drone to a new random nearby position (real PUT to backend)
    const nx=Math.max(40,Math.min(380,(d.x_position||100)+Math.round((Math.random()-.5)*60)));
    const ny=Math.max(40,Math.min(320,(d.y_position||100)+Math.round((Math.random()-.5)*60)));
    await fetch(API_BASE+'/drones/'+d.id,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+localStorage.getItem(TOKEN_KEY)},body:JSON.stringify({serial:d.serial,model:d.model,status:'flying',flight_hours:d.flight_hours,battery_cycles:d.battery_cycles,x_position:nx,y_position:ny})});
    refresh();
  };
  return (
    <div>
      <div className="page-header"><div><h2>Live Floor Map</h2><p>Polled every 3 s · click a drone to move it (real PUT to /api/drones/:id).</p></div></div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
        <div className="card">
          <div style={{position:'relative',height:400,background:'#0b1424',border:'1px solid #1e293b',borderRadius:8,overflow:'hidden'}}>
            {[1,2,3,4,5,6].map(i=>(<div key={i} style={{position:'absolute',left:30+i*55,top:30,bottom:30,width:6,background:'rgba(100,116,139,0.18)',borderRadius:3}}/>))}
            {drones.map(d=>{
              const tone=d.status==='flying'?'#10b981':d.status==='charging'?'#f59e0b':d.status==='maintenance'?'#ef4444':'#3b82f6';
              const x=Number(d.x_position||100);const y=Number(d.y_position||100);
              return (
                <div key={d.id} title={d.serial+' · '+d.status} onClick={()=>move(d)} style={{position:'absolute',left:x-7,top:y-7,width:14,height:14,borderRadius:'50%',background:tone,boxShadow:'0 0 0 5px '+tone+'33',cursor:'pointer',transition:'left .3s, top .3s'}}/>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h3 style={{margin:'0 0 12px',color:'#cbd5e1'}}>Roster</h3>
          {drones.map(d=>(
            <div key={d.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #1e293b'}}>
              <span>{d.serial} <span style={{color:'#64748b',fontSize:11}}>({d.x_position||'?'},{d.y_position||'?'})</span></span>
              <span className={'badge '+(d.status||'')}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
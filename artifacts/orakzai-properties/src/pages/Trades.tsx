import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createChart, ColorType, CandlestickSeries, LineStyle } from "lightweight-charts";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Search, ChevronDown, X, AlertTriangle, ArrowLeft,
  Star, Bell, TrendingUp, TrendingDown, ExternalLink,
} from "lucide-react";

/* ─── Theme ────────────────────────────────────────────────────────────────── */
const BG    = "#0B0E11";
const CARD  = "#12161C";
const BORD  = "#1E2329";
const RED   = "#F6465D";
const GREEN = "#0ECB81";
const GOLD  = "#F3BA2F";
const DIM   = "#848E9C";
const FG    = "#EAECEF";
const ACT   = "#1E2329";

const base = () => (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const ASSETS = [
  { ticker:"ASC",  pair:"ASC/USDT",  name:"Azan Smart City",    price:1.2400, change:4.80,  high:1.3100, low:1.1800, vol:284310,  volU:352744,  mc:"$31.0M", supply:"25M ASC",  maxSup:"100M ASC", ath:"$2.10 (2025-08-12)", atl:"$0.42 (2025-01-04)", web:"https://azansmartcity.com",     wp:"https://azansmartcity.com/whitepaper",     desc:"Azan Smart City is Pakistan's first blockchain-integrated smart city. Each ASC token represents fractional land ownership in Rawalpindi.", mf:{l:{b:6590,s:5828,i:762}, m:{b:4405,s:8753,i:-4348}, sm:{b:2494,s:4423,i:-1929}} },
  { ticker:"DHA9", pair:"DHA9/USDT", name:"DHA Lahore Ph-9",    price:8.7500, change:1.20,  high:9.1000, low:8.4200, vol:95800,   volU:838250,  mc:"$43.8M", supply:"5M DHA9",  maxSup:"5M DHA9",  ath:"$12.40 (2025-11-20)",atl:"$5.10 (2025-03-01)", web:"https://dha.com.pk",           wp:"https://dha.com.pk/whitepaper",           desc:"DHA Phase 9 tokens represent fractional ownership of premium commercial and residential plots in Lahore's most prestigious housing project.", mf:{l:{b:2100,s:1890,i:210},m:{b:1400,s:2200,i:-800},sm:{b:800,s:1100,i:-300}} },
  { ticker:"BTI",  pair:"BTI/USDT",  name:"Bahria Town Isb",    price:5.1000, change:-0.70, high:5.2800, low:4.9700, vol:162400,  volU:828240,  mc:"$25.5M", supply:"5M BTI",   maxSup:"10M BTI",  ath:"$8.90 (2025-09-15)", atl:"$2.80 (2025-01-20)", web:"https://bahriatownisb.com",     wp:"https://bahriatownisb.com/whitepaper",     desc:"BTI tokenizes residential and commercial properties in Bahria Town Islamabad Phase 8 with quarterly yield distributions.", mf:{l:{b:3200,s:4100,i:-900},m:{b:2100,s:3400,i:-1300},sm:{b:1200,s:2100,i:-900}} },
  { ticker:"GBR",  pair:"GBR/USDT",  name:"Gulberg Residencia", price:3.6200, change:2.30,  high:3.8000, low:3.5500, vol:48900,   volU:177018,  mc:"$18.1M", supply:"5M GBR",   maxSup:"5M GBR",   ath:"$5.60 (2025-10-01)", atl:"$1.90 (2025-02-10)", web:"https://gulbergresidencia.com", wp:"https://gulbergresidencia.com/whitepaper", desc:"GBR offers fractional shares of premium apartments in Islamabad with guaranteed rental returns.", mf:{l:{b:1800,s:1400,i:400},m:{b:1200,s:1000,i:200},sm:{b:600,s:500,i:100}} },
  { ticker:"CSC",  pair:"CSC/USDT",  name:"Capital Smart City", price:2.1800, change:-1.40, high:2.3100, low:2.1200, vol:71200,   volU:155216,  mc:"$10.9M", supply:"5M CSC",   maxSup:"20M CSC",  ath:"$4.20 (2025-07-22)", atl:"$1.10 (2025-01-08)", web:"https://capitalsmartcity.com",  wp:"https://capitalsmartcity.com/whitepaper",  desc:"CSC is Pakistan's first CPEC-aligned smart city token on the Islamabad–Lahore Motorway. Holders receive quarterly distributions.", mf:{l:{b:1400,s:1800,i:-400},m:{b:900,s:1400,i:-500},sm:{b:400,s:700,i:-300}} },
  { ticker:"OBK",  pair:"OBK/USDT",  name:"Orakzai Bond",       price:0.8800, change:6.50,  high:0.9400, low:0.8200, vol:312000,  volU:274560,  mc:"$4.4M",  supply:"5M OBK",   maxSup:"50M OBK",  ath:"$1.20 (2025-12-01)", atl:"$0.18 (2025-01-01)", web:"https://orakzaiproperties.com",  wp:"https://orakzaiproperties.com/whitepaper", desc:"OBK is the native utility and governance token of Orakzai Properties. Holders get fee discounts, voting rights, and staking rewards.", mf:{l:{b:8400,s:6200,i:2200},m:{b:5100,s:3800,i:1300},sm:{b:2600,s:1900,i:700}} },
];

type Asset = typeof ASSETS[0];
type OBEntry = { price:number; amount:number; total:number };
type Trade  = { time:string; price:number; amount:number; side:"buy"|"sell" };
type OOrder = { id:number; side:"BUY"|"SELL"; type:string; price:number; amount:number; time:string };
type Candle = { time:number; open:number; high:number; low:number; close:number };

function genCandles(base:number, count=90):Candle[] {
  const out:Candle[]=[]; let p=base*0.86;
  const now=Math.floor(Date.now()/1000);
  for(let i=count;i>=0;i--){
    const o=p,c=Math.max(p*.5,o+(Math.random()-.47)*o*.03);
    const h=Math.max(o,c)+Math.random()*o*.012,l=Math.min(o,c)-Math.random()*o*.012;
    out.push({time:now-i*900,open:+o.toFixed(5),high:+h.toFixed(5),low:+l.toFixed(5),close:+c.toFixed(5)});
    p=c;
  }
  return out;
}
function genBook(mid:number):{asks:OBEntry[];bids:OBEntry[]} {
  const asks:OBEntry[]=[],bids:OBEntry[]=[]; let t=0;
  for(let i=0;i<16;i++){const a=+(Math.random()*3000+100).toFixed(0);t+=a;asks.push({price:+(mid*(1+(i+1)*.0008)).toFixed(5),amount:a,total:t});}
  t=0;
  for(let i=0;i<16;i++){const a=+(Math.random()*3000+100).toFixed(0);t+=a;bids.push({price:+(mid*(1-(i+1)*.0008)).toFixed(5),amount:a,total:t});}
  return {asks:asks.reverse(),bids};
}
function genTrades(mid:number,n=30):Trade[] {
  const now=Date.now();
  return Array.from({length:n},(_,i)=>({
    time:new Date(now-i*3800).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}),
    price:+(mid*(1+(Math.random()-.5)*.004)).toFixed(5),
    amount:+(Math.random()*2000+50).toFixed(0),
    side:Math.random()>.48?"buy":"sell",
  }));
}

/* ─── Candlestick chart ─────────────────────────────────────────────────────── */
function CandleChart({assetPrice,showVol}:{assetPrice:number;showVol:boolean}) {
  const ref=useRef<HTMLDivElement>(null);
  const chart=useRef<any>(null);
  useEffect(()=>{
    if(!ref.current)return;
    if(chart.current){chart.current.remove();chart.current=null;}
    const c=createChart(ref.current,{
      layout:{background:{type:ColorType.Solid,color:CARD},textColor:DIM},
      grid:{vertLines:{color:"#191d24",style:LineStyle.Dotted},horzLines:{color:"#191d24",style:LineStyle.Dotted}},
      crosshair:{mode:1,vertLine:{color:"#F3BA2F44",labelBackgroundColor:CARD},horzLine:{color:"#F3BA2F44",labelBackgroundColor:CARD}},
      rightPriceScale:{borderColor:BORD},
      timeScale:{borderColor:BORD,timeVisible:true,secondsVisible:false},
      width:ref.current.clientWidth,height:ref.current.clientHeight,
    });
    const s=c.addSeries(CandlestickSeries,{upColor:GREEN,downColor:RED,borderUpColor:GREEN,borderDownColor:RED,wickUpColor:GREEN,wickDownColor:RED} as any);
    s.setData(genCandles(assetPrice) as any);
    c.timeScale().fitContent();
    chart.current=c;
    const ro=new ResizeObserver(()=>{if(ref.current&&chart.current)chart.current.applyOptions({width:ref.current.clientWidth,height:ref.current.clientHeight});});
    ro.observe(ref.current);
    return()=>{ro.disconnect();c.remove();chart.current=null;};
  },[assetPrice]);
  return <div ref={ref} style={{width:"100%",height:"100%"}} />;
}

/* ─── Order Book ─────────────────────────────────────────────────────────────── */
function OrderBook({book,mid}:{book:{asks:OBEntry[];bids:OBEntry[]};mid:number}) {
  const maxT=Math.max(...book.asks.map(a=>a.total),...book.bids.map(b=>b.total));
  const bidT=book.bids.reduce((s,b)=>s+b.total,0);
  const askT=book.asks.reduce((s,a)=>s+a.total,0);
  const bidPct=Math.round(bidT/(bidT+askT)*100);
  const rows=Math.min(book.asks.length,book.bids.length,8);
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",fontSize:10}}>
      <div style={{display:"flex",height:3,margin:"4px 6px 2px"}}>
        <div style={{flex:bidPct,background:GREEN,borderRadius:"2px 0 0 2px"}}/>
        <div style={{flex:100-bidPct,background:RED,borderRadius:"0 2px 2px 0"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",padding:"0 6px 3px",fontSize:9,color:DIM}}>
        <span style={{color:GREEN}}>{bidPct}%</span><span style={{color:RED}}>{100-bidPct}%</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"2px 6px",color:DIM,fontSize:9,borderBottom:`1px solid ${BORD}`}}>
        <span>Bid</span><span style={{textAlign:"center"}}>Price</span><span style={{textAlign:"right"}}>Ask</span>
      </div>
      <div style={{flex:1,overflow:"hidden"}}>
        {Array.from({length:rows},(_,i)=>{
          const ask=book.asks[i],bid=book.bids[i];
          return (
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"1.5px 6px",position:"relative"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,background:"rgba(14,203,129,0.1)",width:`${(bid?.total||0)/maxT*50}%`}}/>
              <div style={{position:"absolute",right:0,top:0,bottom:0,background:"rgba(246,70,93,0.1)",width:`${(ask?.total||0)/maxT*50}%`}}/>
              <span style={{color:GREEN,position:"relative",fontVariantNumeric:"tabular-nums"}}>{bid?.amount?.toLocaleString()??""}</span>
              <span style={{color:FG,textAlign:"center",position:"relative",fontWeight:600,fontSize:9}}>{ask?.price?.toFixed(4)??""}</span>
              <span style={{color:RED,textAlign:"right",position:"relative",fontVariantNumeric:"tabular-nums"}}>{ask?.amount?.toLocaleString()??""}</span>
            </div>
          );
        })}
      </div>
      <div style={{padding:"3px 6px",borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}`,background:BG}}>
        <span style={{color:mid>0?GREEN:RED,fontWeight:700,fontSize:12,fontVariantNumeric:"tabular-nums"}}>{mid.toFixed(4)}</span>
        <span style={{color:DIM,fontSize:9,marginLeft:5}}>USDT</span>
      </div>
    </div>
  );
}

/* ─── Trade History ─────────────────────────────────────────────────────────── */
function TradeHistory({trades}:{trades:Trade[]}) {
  return (
    <div style={{height:"100%",overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"3px 6px",color:DIM,fontSize:9,borderBottom:`1px solid ${BORD}`,position:"sticky",top:0,background:CARD}}>
        <span>Price</span><span style={{textAlign:"center"}}>Amount</span><span style={{textAlign:"right"}}>Time</span>
      </div>
      {trades.map((t,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"1.5px 6px",fontSize:10}}>
          <span style={{color:t.side==="buy"?GREEN:RED,fontVariantNumeric:"tabular-nums"}}>{t.price.toFixed(4)}</span>
          <span style={{color:FG,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{Number(t.amount).toLocaleString()}</span>
          <span style={{color:DIM,textAlign:"right",fontSize:9}}>{t.time}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Order Entry ────────────────────────────────────────────────────────────── */
const BAL_USDT=500, BAL_TOK=250;

function OrderEntry({asset,livePrice}:{asset:Asset;livePrice:number}) {
  const [side,setSide]=useState<"BUY"|"SELL">("BUY");
  const [ot,setOt]=useState<"Limit"|"Market">("Limit");
  const [price,setPrice]=useState(livePrice.toFixed(5));
  const [amount,setAmount]=useState("");
  const [orders,setOrders]=useState<OOrder[]>([
    {id:1,side:"BUY",type:"Limit",price:asset.price*.95,amount:100,time:"10:32"},
    {id:2,side:"SELL",type:"Limit",price:asset.price*1.08,amount:50,time:"09:15"},
  ]);
  const [showMenu,setShowMenu]=useState(false);
  const [tab,setTab]=useState<"entry"|"open">("entry");

  const pN=parseFloat(price)||0;
  const aN=parseFloat(amount)||0;
  const total=ot==="Market"?livePrice*aN:pN*aN;
  const ok=total>=1;
  const bal=side==="BUY"?BAL_USDT:BAL_TOK;

  const pct=(p:number)=>{
    const q=side==="BUY"?(bal/(pN||livePrice))*p:bal*p;
    setAmount(q.toFixed(2));
  };
  const submit=()=>{
    if(!ok)return;
    setOrders(prev=>[{id:Date.now(),side,type:ot,price:ot==="Market"?livePrice:pN,amount:aN,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}, ...prev]);
    setAmount("");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {/* Sub-tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${BORD}`,flexShrink:0}}>
        {(["entry","open"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"5px 0",fontSize:10,fontWeight:tab===t?700:400,border:"none",cursor:"pointer",background:"transparent",color:tab===t?FG:DIM,borderBottom:tab===t?`2px solid ${GOLD}`:"2px solid transparent"}}>
            {t==="entry"?"Order Entry":`Open(${orders.length})`}
          </button>
        ))}
      </div>

      {tab==="entry"?(
        <div style={{flex:1,overflowY:"auto",padding:"8px 8px"}}>
          {/* BUY / SELL */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:8}}>
            {(["BUY","SELL"] as const).map(s=>(
              <button key={s} onClick={()=>setSide(s)} style={{padding:"7px 0",fontWeight:800,fontSize:12,border:"none",cursor:"pointer",borderRadius:4,background:side===s?(s==="BUY"?GREEN:RED):ACT,color:side===s?"#fff":DIM,transition:"all .15s"}}>
                {s}
              </button>
            ))}
          </div>

          {/* Balance */}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:DIM,marginBottom:6}}>
            <span>Avail</span>
            <span style={{color:FG}}>{side==="BUY"?`${BAL_USDT} USDT`:`${BAL_TOK} ${asset.ticker}`}</span>
          </div>

          {/* Order type */}
          <div style={{position:"relative",marginBottom:6}}>
            <button onClick={()=>setShowMenu(v=>!v)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:ACT,border:`1px solid ${BORD}`,borderRadius:4,padding:"5px 8px",color:FG,fontSize:10,cursor:"pointer"}}>
              {ot} <ChevronDown size={10}/>
            </button>
            <AnimatePresence>
              {showMenu&&(
                <motion.div initial={{opacity:0,y:-3}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{position:"absolute",top:"calc(100%+2px)",left:0,right:0,background:"#1a1f27",border:`1px solid ${BORD}`,borderRadius:4,zIndex:50}}>
                  {(["Limit","Market"] as const).map(t=>(
                    <div key={t} onClick={()=>{setOt(t);setShowMenu(false);}} style={{padding:"6px 8px",fontSize:10,cursor:"pointer",color:ot===t?GOLD:FG,background:ot===t?"rgba(243,186,47,0.08)":"transparent"}}>{t}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Price */}
          {ot==="Limit"?(
            <div style={{marginBottom:6}}>
              <div style={{fontSize:9,color:DIM,marginBottom:2}}>Price (USDT)</div>
              <input type="number" value={price} onChange={e=>setPrice(e.target.value)} step="0.00001" style={{width:"100%",background:ACT,border:`1px solid ${BORD}`,borderRadius:4,padding:"6px 8px",color:FG,fontSize:11,outline:"none",boxSizing:"border-box",fontVariantNumeric:"tabular-nums"}}/>
            </div>
          ):(
            <div style={{marginBottom:6,padding:"6px 8px",background:ACT,border:`1px solid ${BORD}`,borderRadius:4,fontSize:10,color:DIM}}>
              Market: <span style={{color:GREEN}}>{livePrice.toFixed(5)}</span>
            </div>
          )}

          {/* Amount */}
          <div style={{marginBottom:6}}>
            <div style={{fontSize:9,color:DIM,marginBottom:2}}>Amount ({asset.ticker})</div>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{width:"100%",background:ACT,border:`1px solid ${BORD}`,borderRadius:4,padding:"6px 8px",color:FG,fontSize:11,outline:"none",boxSizing:"border-box"}}/>
          </div>

          {/* Pct */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginBottom:6}}>
            {[.25,.5,.75,1].map(p=>(
              <button key={p} onClick={()=>pct(p)} style={{padding:"3px 0",fontSize:9,fontWeight:600,borderRadius:3,cursor:"pointer",border:`1px solid ${BORD}`,background:ACT,color:DIM}}>
                {p*100}%
              </button>
            ))}
          </div>

          {/* Total */}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:DIM,marginBottom:5}}>
            <span>Total</span>
            <span style={{color:ok||total===0?FG:RED,fontVariantNumeric:"tabular-nums"}}>{total>0?total.toFixed(4):"0.0000"} USDT</span>
          </div>

          {/* Warning */}
          <AnimatePresence>
            {total>0&&!ok&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden",marginBottom:5}}>
                <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(246,70,93,0.1)",border:`1px solid rgba(246,70,93,0.3)`,borderRadius:4,padding:"4px 7px"}}>
                  <AlertTriangle size={9} color={RED}/>
                  <span style={{fontSize:9,color:RED}}>Min order $1 USDT</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button */}
          <button onClick={submit} disabled={!ok} style={{width:"100%",padding:"9px 0",borderRadius:4,border:"none",cursor:ok?"pointer":"not-allowed",fontWeight:800,fontSize:12,background:ok?(side==="BUY"?GREEN:RED):ACT,color:ok?"#fff":DIM,opacity:ok?1:.6,transition:"all .15s"}}>
            {side==="BUY"?`Buy ${asset.ticker}`:`Sell ${asset.ticker}`}
          </button>
        </div>
      ):(
        <div style={{flex:1,overflowY:"auto"}}>
          {orders.length===0?(
            <div style={{padding:16,textAlign:"center",color:DIM,fontSize:11}}>No open orders</div>
          ):orders.map(o=>(
            <div key={o.id} style={{padding:"7px 8px",borderBottom:`1px solid ${BORD}`,fontSize:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <span style={{color:o.side==="BUY"?GREEN:RED,fontWeight:700,fontSize:9,background:o.side==="BUY"?"rgba(14,203,129,0.1)":"rgba(246,70,93,0.1)",padding:"1px 5px",borderRadius:3}}>{o.side}</span>
                <button onClick={()=>setOrders(p=>p.filter(x=>x.id!==o.id))} style={{background:"rgba(246,70,93,0.12)",border:`1px solid rgba(246,70,93,0.3)`,borderRadius:3,padding:"1px 4px",cursor:"pointer",display:"flex",alignItems:"center"}}>
                  <X size={8} color={RED}/>
                </button>
              </div>
              <div style={{color:FG}}>{o.price.toFixed(4)} · {o.amount} {asset.ticker}</div>
              <div style={{color:DIM,fontSize:9}}>{o.type} · {o.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Coin Info ──────────────────────────────────────────────────────────────── */
function CoinInfo({asset}:{asset:Asset}) {
  const bp=base();
  return (
    <div style={{padding:"10px 12px",fontSize:11}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <img src={`${bp}/logo-shield.png`} alt="token" style={{width:32,height:32,objectFit:"contain"}}/>
        <div>
          <div style={{fontWeight:700,color:FG,fontSize:13}}>{asset.ticker}</div>
          <div style={{color:DIM,fontSize:10}}>{asset.name}</div>
        </div>
      </div>
      <p style={{color:DIM,fontSize:11,lineHeight:1.5,marginBottom:10}}>{asset.desc}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {[["Market Cap",asset.mc],["Supply",asset.supply],["Max Supply",asset.maxSup],["ATH",asset.ath],["ATL",asset.atl],["24h Vol",`$${(asset.volU/1000).toFixed(1)}K`]].map(([l,v])=>(
          <div key={l} style={{background:ACT,borderRadius:6,padding:"6px 8px"}}>
            <div style={{color:DIM,fontSize:9,marginBottom:2}}>{l}</div>
            <div style={{color:FG,fontWeight:600,fontSize:11}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{borderTop:`1px solid ${BORD}`,paddingTop:8}}>
        <div style={{color:DIM,fontSize:10,marginBottom:6}}>Links</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["Official Website",asset.web],["Whitepaper",asset.wp]].map(([l,u])=>(
            <a key={l} href={u} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,background:ACT,border:`1px solid ${BORD}`,borderRadius:5,padding:"4px 8px",color:FG,fontSize:10,textDecoration:"none"}}>
              <ExternalLink size={9}/> {l}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Money Flow ─────────────────────────────────────────────────────────────── */
const DC=["#0ECB81","#00A67E","#FF6B82","#F6465D","#FF9BAB","#FF4466"];
function MoneyFlow({asset}:{asset:Asset}) {
  const [period,setPeriod]=useState("1D");
  const mf=asset.mf;
  const data=[{n:"Large Buy",v:mf.l.b},{n:"Medium Buy",v:mf.m.b},{n:"Small Buy",v:mf.sm.b},{n:"Large Sell",v:mf.l.s},{n:"Medium Sell",v:mf.m.s},{n:"Small Sell",v:mf.sm.s}];
  const rows=[{l:"Large",...mf.l},{l:"Medium",...mf.m},{l:"Small",...mf.sm},{l:"Total",b:mf.l.b+mf.m.b+mf.sm.b,s:mf.l.s+mf.m.s+mf.sm.s,i:mf.l.i+mf.m.i+mf.sm.i}];
  return (
    <div style={{padding:"10px 12px"}}>
      <div style={{fontWeight:700,color:FG,fontSize:12,marginBottom:8}}>Money Flow Analysis</div>
      <div style={{display:"flex",gap:4,marginBottom:10}}>
        {["15m","30m","1h","2h","4h","1D"].map(p=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{padding:"2px 7px",fontSize:10,borderRadius:3,border:"none",cursor:"pointer",background:period===p?GOLD:ACT,color:period===p?BG:DIM,fontWeight:period===p?700:400}}>{p}</button>
        ))}
      </div>
      <div style={{height:160}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2} dataKey="v">
              {data.map((_,i)=><Cell key={i} fill={DC[i]}/>)}
            </Pie>
            <Tooltip formatter={(v:any)=>[`${v.toLocaleString()}M`,""]} contentStyle={{background:CARD,border:`1px solid ${BORD}`,fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{marginTop:8,border:`1px solid ${BORD}`,borderRadius:6,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"60px 1fr 1fr 1fr",padding:"4px 8px",background:ACT,fontSize:9,color:DIM}}>
          <span>Orders</span><span style={{textAlign:"center",color:GREEN}}>Buy</span><span style={{textAlign:"center",color:RED}}>Sell</span><span style={{textAlign:"right"}}>Inflow</span>
        </div>
        {rows.map((r,i,a)=>(
          <div key={r.l} style={{display:"grid",gridTemplateColumns:"60px 1fr 1fr 1fr",padding:"5px 8px",fontSize:10,borderTop:`1px solid ${BORD}`,background:i===a.length-1?ACT:"transparent",fontWeight:i===a.length-1?700:400}}>
            <span style={{color:DIM}}>{r.l}</span>
            <span style={{textAlign:"center",color:GREEN}}>● {r.b.toLocaleString()}M</span>
            <span style={{textAlign:"center",color:RED}}>● {r.s.toLocaleString()}M</span>
            <span style={{textAlign:"right",color:r.i>=0?GREEN:RED}}>{r.i>=0?"+":""}{r.i.toLocaleString()}M</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MARKET LIST ─────────────────────────────────────────────────────────────── */
const GLOBAL_MC="$134.7M", GLOBAL_VOL="$1.89M", GLOBAL_HIGH="9.10", GLOBAL_LOW="0.82";

function MarketList({onSelect}:{onSelect:(a:Asset)=>void}) {
  const [q,setQ]=useState("");
  const filtered=ASSETS.filter(a=>a.ticker.toLowerCase().includes(q.toLowerCase())||a.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{minHeight:"100dvh",background:BG,color:FG,paddingBottom:64}}>
      {/* Fixed top section */}
      <div style={{position:"sticky",top:0,zIndex:20,background:BG}}>
        {/* Search bar - RIGHT at top */}
        <div style={{padding:"10px 12px 6px",paddingTop:"calc(env(safe-area-inset-top, 8px) + 10px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:CARD,border:`1px solid ${BORD}`,borderRadius:8,padding:"8px 12px"}}>
            <Search size={13} color={DIM}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search tokens… BTC, ASC, OBK" style={{flex:1,background:"transparent",border:"none",outline:"none",color:FG,fontSize:12}}/>
            {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><X size={12} color={DIM}/></button>}
          </div>
        </div>

        {/* Market Overview Ribbon */}
        <div style={{overflowX:"auto",whiteSpace:"nowrap",padding:"4px 12px 6px",borderBottom:`1px solid ${BORD}`,display:"flex",gap:0,alignItems:"center"}}>
          {[
            {label:"Mkt Cap",value:GLOBAL_MC,color:FG},
            {label:"24h Vol",value:GLOBAL_VOL,color:FG},
            {label:"24h High",value:GLOBAL_HIGH,color:GREEN},
            {label:"24h Low",value:GLOBAL_LOW,color:RED},
            {label:"Gainers",value:"4/6",color:GREEN},
            {label:"Losers",value:"2/6",color:RED},
          ].map((s,i,arr)=>(
            <div key={s.label} style={{display:"inline-flex",flexDirection:"column",padding:"0 12px 0 0",borderRight:i<arr.length-1?`1px solid ${BORD}`:"none",marginRight:i<arr.length-1?12:0,flexShrink:0}}>
              <span style={{fontSize:8,color:DIM,textTransform:"uppercase",letterSpacing:"0.04em"}}>{s.label}</span>
              <span style={{fontSize:11,fontWeight:700,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Column headers */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",padding:"5px 12px",fontSize:9,color:DIM,borderBottom:`1px solid ${BORD}`,background:BG}}>
          <span>Name</span><span style={{textAlign:"right",marginRight:44}}>Last Price</span><span style={{textAlign:"right"}}>24h Change</span>
        </div>
      </div>

      {/* Pair list */}
      {filtered.map((a,i)=>(
        <motion.div key={a.ticker} initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} transition={{delay:i*.03}}
          onClick={()=>onSelect(a)}
          style={{display:"grid",gridTemplateColumns:"1fr auto auto",alignItems:"center",padding:"10px 12px",cursor:"pointer",borderBottom:`1px solid ${BORD}`,gap:10,transition:"background .15s"}}
          onMouseEnter={e=>(e.currentTarget.style.background=CARD)}
          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
        >
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"rgba(243,186,47,0.1)",border:`1px solid rgba(243,186,47,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:GOLD,flexShrink:0}}>
              {a.ticker.slice(0,3)}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:12,color:FG}}>{a.ticker}<span style={{color:DIM,fontWeight:400}}>/USDT</span></div>
              <div style={{fontSize:9,color:DIM}}>{a.name}</div>
            </div>
          </div>
          <div style={{textAlign:"right",fontWeight:600,fontSize:12,fontVariantNumeric:"tabular-nums",color:a.change>=0?GREEN:RED}}>{a.price.toFixed(4)}</div>
          <div style={{minWidth:58,textAlign:"center",padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:a.change>=0?"rgba(14,203,129,0.12)":"rgba(246,70,93,0.12)",color:a.change>=0?GREEN:RED}}>
            {a.change>=0?"+":""}{a.change.toFixed(2)}%
          </div>
        </motion.div>
      ))}
      {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:DIM,fontSize:12}}>No tokens found for "{q}"</div>}
    </div>
  );
}

/* ─── TRADING TERMINAL ────────────────────────────────────────────────────────── */
const TFs=["15m","1h","4h","1D","More"];
const PI=["MA","EMA","BOLL","SAR","AVL","Super"];
const MI=["VOL","MACD","RSI","KDJ","OBV","WR"];
type BTab="Price"|"Info"|"Trading Data";
const BTABS:BTab[]=["Price","Info","Trading Data"];

function Terminal({asset,onBack}:{asset:Asset;onBack:()=>void}) {
  const [live,setLive]=useState(asset.price);
  const [book,setBook]=useState(()=>genBook(asset.price));
  const [trades,setTrades]=useState<Trade[]>(()=>genTrades(asset.price));
  const [btab,setBtab]=useState<BTab>("Price");
  const [bkTab,setBkTab]=useState<"Order Book"|"Trades">("Order Book");
  const [tf,setTf]=useState("15m");
  const [inds,setInds]=useState<Set<string>>(new Set(["MA","VOL"]));
  const [starred,setStarred]=useState(false);
  const showVol=inds.has("VOL");

  const toggleInd=(ind:string)=>setInds(prev=>{const n=new Set(prev);n.has(ind)?n.delete(ind):n.add(ind);return n;});

  useEffect(()=>{
    const iv=setInterval(()=>{
      setLive(prev=>{
        const next=+(prev*(1+(Math.random()-.5)*.003)).toFixed(5);
        setBook(genBook(next));
        setTrades(genTrades(next));
        return next;
      });
    },2500);
    return ()=>clearInterval(iv);
  },[]);

  const isUp=live>=asset.price;

  return (
    <div style={{background:BG,color:FG,minHeight:"100dvh",paddingBottom:64}}>
      {/* ── Header ── */}
      <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:"8px 12px 8px",paddingTop:"calc(env(safe-area-inset-top,6px)+8px)",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:2,display:"flex"}}><ArrowLeft size={16} color={FG}/></button>
            <span style={{fontWeight:800,fontSize:15,color:FG}}>{asset.ticker}<span style={{color:DIM,fontWeight:400}}>/USDT</span></span>
            <ChevronDown size={12} color={DIM}/>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setStarred(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><Star size={14} fill={starred?GOLD:"none"} color={starred?GOLD:DIM}/></button>
            <Bell size={14} color={DIM}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:3}}>
          <span style={{fontSize:24,fontWeight:800,color:isUp?GREEN:RED,fontVariantNumeric:"tabular-nums"}}>{live.toFixed(4)}</span>
          <span style={{fontSize:11,color:isUp?GREEN:RED,display:"flex",alignItems:"center",gap:3}}>
            {isUp?<TrendingUp size={11}/>:<TrendingDown size={11}/>}{asset.change>=0?"+":""}{asset.change.toFixed(2)}%
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,fontSize:9}}>
          {[["24h High",asset.high.toFixed(4),GREEN],["24h Low",asset.low.toFixed(4),RED],[`Vol(${asset.ticker})`,(asset.vol/1000).toFixed(1)+"K",DIM],["Vol(USDT)",(asset.volU/1000).toFixed(1)+"K",DIM]].map(([l,v,c])=>(
            <div key={l}><div style={{color:DIM}}>{l}</div><div style={{color:c,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{v}</div></div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{display:"flex",borderBottom:`1px solid ${BORD}`,background:CARD,overflowX:"auto"}}>
        {BTABS.map(t=>(
          <button key={t} onClick={()=>setBtab(t)} style={{padding:"7px 14px",fontSize:12,fontWeight:btab===t?700:400,border:"none",cursor:"pointer",background:"transparent",whiteSpace:"nowrap",color:btab===t?FG:DIM,borderBottom:btab===t?`2px solid ${GOLD}`:"2px solid transparent",flexShrink:0}}>
            {t}
          </button>
        ))}
      </div>

      {btab==="Price"&&(
        <>
          {/* ── Timeframe bar ── */}
          <div style={{display:"flex",alignItems:"center",background:CARD,borderBottom:`1px solid ${BORD}`,padding:"3px 6px",overflowX:"auto"}}>
            {TFs.map(t=>(
              <button key={t} onClick={()=>setTf(t)} style={{padding:"2px 8px",fontSize:10,border:"none",cursor:"pointer",borderRadius:3,background:tf===t?ACT:"transparent",color:tf===t?GOLD:DIM,fontWeight:tf===t?700:400,flexShrink:0}}>
                {t}
              </button>
            ))}
          </div>

          {/* MA overlay labels */}
          {inds.has("MA")&&(
            <div style={{display:"flex",gap:8,padding:"2px 8px",fontSize:9,background:CARD,flexWrap:"wrap"}}>
              {[["MA(7)",GOLD],[" MA(25)","#DA5A9B"],["MA(99)","#8B7FD4"]].map(([m,c])=>(
                <span key={m} style={{color:c}}>{m}: {(live*(1+([-.015,.005,.02][["MA(7)","MA(25)","MA(99)"].indexOf(m)]))).toFixed(4)}</span>
              ))}
            </div>
          )}

          {/* ── Chart ── */}
          <div style={{height:showVol?140:176,background:CARD}}>
            <CandleChart assetPrice={asset.price} showVol={showVol}/>
          </div>

          {/* ── Volume bars ── RIGHT under chart, NO gap ── */}
          {showVol&&(
            <div style={{height:36,background:CARD,display:"flex",alignItems:"flex-end",gap:1,padding:"0 2px",overflow:"hidden"}}>
              {Array.from({length:40},(_,i)=>{
                const h=8+Math.random()*24;
                return <div key={i} style={{flex:1,height:h,background:i%2===0?GREEN:RED,opacity:.75,borderRadius:1}}/>;
              })}
            </div>
          )}

          {/* ── Indicators bar - ZERO gap ── */}
          <div style={{background:CARD,borderTop:`1px solid ${BORD}`,borderBottom:`1px solid ${BORD}`,padding:"4px 6px",overflowX:"auto",whiteSpace:"nowrap"}}>
            {[...PI,...MI].map(ind=>(
              <button key={ind} onClick={()=>toggleInd(ind)} style={{display:"inline-block",padding:"2px 7px",fontSize:9,fontWeight:600,borderRadius:3,border:"none",cursor:"pointer",marginRight:2,background:inds.has(ind)?"rgba(243,186,47,0.15)":ACT,color:inds.has(ind)?GOLD:DIM,borderBottom:inds.has(ind)?`1.5px solid ${GOLD}`:"1.5px solid transparent"}}>
                {ind}
              </button>
            ))}
          </div>

          {/* ── Twin Panel: Order Book + Order Entry ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderBottom:`1px solid ${BORD}`,height:320}}>
            {/* Left: Order Book / Trades */}
            <div style={{borderRight:`1px solid ${BORD}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${BORD}`,flexShrink:0}}>
                {(["Order Book","Trades"] as const).map(t=>(
                  <button key={t} onClick={()=>setBkTab(t)} style={{flex:1,padding:"5px 0",fontSize:10,fontWeight:bkTab===t?700:400,border:"none",cursor:"pointer",background:"transparent",color:bkTab===t?FG:DIM,borderBottom:bkTab===t?`2px solid ${GOLD}`:"2px solid transparent"}}>
                    {t}
                  </button>
                ))}
              </div>
              {bkTab==="Order Book"?<OrderBook book={book} mid={live}/>:<TradeHistory trades={trades}/>}
            </div>

            {/* Right: Order Entry */}
            <OrderEntry asset={asset} livePrice={live}/>
          </div>

          {/* ── Period performance strip ── */}
          <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:"6px 12px",overflowX:"auto",whiteSpace:"nowrap",display:"flex",gap:0}}>
            {[["Today",asset.change>=0?`+${asset.change.toFixed(2)}%`:`${asset.change.toFixed(2)}%`,asset.change>=0?GREEN:RED],["7D","+5.53%",GREEN],["30D","--",DIM],["90D","--",DIM],["180D","--",DIM],["1Y","--",DIM]].map(([l,v,c],i,arr)=>(
              <div key={l} style={{display:"inline-flex",flexDirection:"column",padding:"0 12px 0 0",borderRight:i<arr.length-1?`1px solid ${BORD}`:"none",marginRight:i<arr.length-1?12:0,flexShrink:0}}>
                <span style={{fontSize:8,color:DIM}}>{l}</span>
                <span style={{fontSize:11,fontWeight:600,color:c}}>{v}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {btab==="Info"&&<CoinInfo asset={asset}/>}
      {btab==="Trading Data"&&<MoneyFlow asset={asset}/>}
    </div>
  );
}

/* ─── ROOT ────────────────────────────────────────────────────────────────────── */
export default function Trades() {
  const [active,setActive]=useState<Asset|null>(null);
  if(active) return <Terminal asset={active} onBack={()=>setActive(null)}/>;
  return <MarketList onSelect={setActive}/>;
}

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { createChart, ColorType, CandlestickSeries, LineStyle } from "lightweight-charts";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Search, ChevronDown, X, AlertTriangle, ArrowLeft, Star, Bell, TrendingUp, TrendingDown, ExternalLink, Settings } from "lucide-react";
import { Link } from "wouter";
import { initEngine, getPrice, getABP, getTA, applyTrade } from "@/lib/priceEngine";
import { getWallet, executeTrade, calculateFee, type Currency } from "@/lib/walletEngine";

/* ── Theme ──────────────────────────────────────────────────────────────────── */
const BG    = "#0B0E11";
const CARD  = "#12161C";
const BORD  = "#1E2329";
const RED   = "#F6465D";
const GREEN = "#0ECB81";
const GOLD  = "#F3BA2F";
const DIM   = "#848E9C";
const FG    = "#EAECEF";
const ACT   = "#1A1F27";

const bp = () => (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

/* ── Asset definitions ──────────────────────────────────────────────────────── */
const ASSETS = [
  { ticker:"ASC",  pair:"ASC/USDT",  name:"Azan Smart City",    price:1.2400, change:4.80,  high:1.3100, low:1.1800, vol:284310,  volU:352744,  mc:"$31.0M", supply:"25M ASC",  maxSup:"100M ASC", ath:"$2.10",  atl:"$0.42",  web:"https://azansmartcity.com",     wp:"https://azansmartcity.com/whitepaper",     desc:"Pakistan's first blockchain-integrated smart city. Each token represents fractional land ownership in Rawalpindi's premium development.", mf:{l:{b:6590,s:5828,i:762},m:{b:4405,s:8753,i:-4348},sm:{b:2494,s:4423,i:-1929}} },
  { ticker:"DHA9", pair:"DHA9/USDT", name:"DHA Lahore Ph-9",    price:8.7500, change:1.20,  high:9.1000, low:8.4200, vol:95800,   volU:838250,  mc:"$43.8M", supply:"5M DHA9",  maxSup:"5M DHA9",  ath:"$12.40", atl:"$5.10",  web:"https://dha.com.pk",           wp:"https://dha.com.pk/whitepaper",           desc:"DHA Phase 9 tokens represent fractional ownership in Pakistan's most prestigious housing authority with capital appreciation and rental yields.", mf:{l:{b:2100,s:1890,i:210},m:{b:1400,s:2200,i:-800},sm:{b:800,s:1100,i:-300}} },
  { ticker:"BTI",  pair:"BTI/USDT",  name:"Bahria Town Isb",    price:5.1000, change:-0.70, high:5.2800, low:4.9700, vol:162400,  volU:828240,  mc:"$25.5M", supply:"5M BTI",   maxSup:"10M BTI",  ath:"$8.90",  atl:"$2.80",  web:"https://bahriatownisb.com",     wp:"https://bahriatownisb.com/whitepaper",     desc:"Bahria Town Islamabad Token tokenizes residential and commercial properties in Phase 8 with quarterly yield distributions.", mf:{l:{b:3200,s:4100,i:-900},m:{b:2100,s:3400,i:-1300},sm:{b:1200,s:2100,i:-900}} },
  { ticker:"GBR",  pair:"GBR/USDT",  name:"Gulberg Residencia", price:3.6200, change:2.30,  high:3.8000, low:3.5500, vol:48900,   volU:177018,  mc:"$18.1M", supply:"5M GBR",   maxSup:"5M GBR",   ath:"$5.60",  atl:"$1.90",  web:"https://gulbergresidencia.com", wp:"https://gulbergresidencia.com/whitepaper", desc:"GBR offers fractional shares of premium Islamabad apartments with guaranteed rental returns.", mf:{l:{b:1800,s:1400,i:400},m:{b:1200,s:1000,i:200},sm:{b:600,s:500,i:100}} },
  { ticker:"CSC",  pair:"CSC/USDT",  name:"Capital Smart City", price:2.1800, change:-1.40, high:2.3100, low:2.1200, vol:71200,   volU:155216,  mc:"$10.9M", supply:"5M CSC",   maxSup:"20M CSC",  ath:"$4.20",  atl:"$1.10",  web:"https://capitalsmartcity.com",  wp:"https://capitalsmartcity.com/whitepaper",  desc:"Pakistan's first CPEC-aligned smart city token. Quarterly distributions to all token holders from rental and appreciation income.", mf:{l:{b:1400,s:1800,i:-400},m:{b:900,s:1400,i:-500},sm:{b:400,s:700,i:-300}} },
  { ticker:"OBK",  pair:"OBK/USDT",  name:"Orakzai Bond",       price:0.8800, change:6.50,  high:0.9400, low:0.8200, vol:312000,  volU:274560,  mc:"$4.4M",  supply:"5M OBK",   maxSup:"50M OBK",  ath:"$1.20",  atl:"$0.18",  web:"https://orakzaiproperties.com", wp:"https://orakzaiproperties.com/whitepaper", desc:"Native utility token of Orakzai Properties. OBK holders receive reduced trading fees, governance voting rights, and staking rewards.", mf:{l:{b:8400,s:6200,i:2200},m:{b:5100,s:3800,i:1300},sm:{b:2600,s:1900,i:700}} },
];
type Asset = typeof ASSETS[0];

/* ── Types ──────────────────────────────────────────────────────────────────── */
type Candle  = { time:number; open:number; high:number; low:number; close:number };
type OBRow   = { price:number; amt:number; total:number };
type Trade   = { time:string; price:number; amt:number; side:"buy"|"sell" };
type OOrder  = { id:number; side:"BUY"|"SELL"; type:string; price:number; amt:number; total:number; time:string };

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function genHistory(base:number, n=80):Candle[] {
  const out:Candle[]=[];let p=base*.86;const now=Math.floor(Date.now()/1000);
  for(let i=n;i>=0;i--){
    const o=p,c=Math.max(p*.4,o+(Math.random()-.47)*o*.025);
    out.push({time:now-i*60,open:+o.toFixed(5),high:+(Math.max(o,c)+Math.random()*o*.008).toFixed(5),low:+(Math.min(o,c)-Math.random()*o*.008).toFixed(5),close:+c.toFixed(5)});
    p=c;
  }
  return out;
}
function genBook(mid:number):{asks:OBRow[];bids:OBRow[]} {
  const asks:OBRow[]=[],bids:OBRow[]=[]; let t=0;
  for(let i=0;i<16;i++){const a=+(Math.random()*2000+80).toFixed(0);t+=a;asks.push({price:+(mid*(1+(i+1)*.0009)).toFixed(5),amt:a,total:t});}
  t=0;
  for(let i=0;i<16;i++){const a=+(Math.random()*2000+80).toFixed(0);t+=a;bids.push({price:+(mid*(1-(i+1)*.0009)).toFixed(5),amt:a,total:t});}
  return {asks:asks.reverse(),bids};
}
function genTrades(mid:number,n=25):Trade[] {
  return Array.from({length:n},(_,i)=>({
    time:new Date(Date.now()-i*3500).toLocaleTimeString("en-US",{hour12:false}),
    price:+(mid*(1+(Math.random()-.5)*.003)).toFixed(5),
    amt:+(Math.random()*1800+50).toFixed(0),
    side:Math.random()>.49?"buy":"sell",
  }));
}

/* ── OHLC candle tracker ────────────────────────────────────────────────────── */
function useCandles(ticker:string, initPrice:number) {
  const candlesRef  = useRef<Candle[]>(genHistory(initPrice));
  const seriesRef   = useRef<any>(null);
  const intervalRef = useRef<number>(0);
  const candleStart = useRef<number>(Math.floor(Date.now()/1000/60)*60);

  const init = useCallback((price:number) => {
    candlesRef.current = genHistory(price);
    candleStart.current = Math.floor(Date.now()/1000/60)*60;
    intervalRef.current = Math.floor(Date.now()/1000/60)*60;
  }, []);

  // Push tick to series
  const updateCandle = useCallback((price:number, isGap=false) => {
    if(!seriesRef.current || candlesRef.current.length===0) return;
    const nowSec = Math.floor(Date.now()/1000);
    const nowMin = Math.floor(nowSec/60)*60;

    if(isGap) {
      // Gap candle: open=prev close, close=new price
      const prev = candlesRef.current[candlesRef.current.length-1];
      const gap:Candle = { time:nowMin+1, open:prev.close, high:Math.max(prev.close,price), low:Math.min(prev.close,price), close:price };
      candlesRef.current.push(gap);
      seriesRef.current.update(gap);
      candleStart.current = nowMin+1;
      return;
    }

    const last = candlesRef.current[candlesRef.current.length-1];
    if(nowMin > candleStart.current) {
      // New candle
      const c:Candle = { time:nowMin, open:last.close, high:Math.max(last.close,price), low:Math.min(last.close,price), close:price };
      candlesRef.current.push(c);
      seriesRef.current.update(c);
      candleStart.current = nowMin;
    } else {
      // Update current candle
      const updated = { ...last, high:Math.max(last.high,price), low:Math.min(last.low,price), close:price };
      candlesRef.current[candlesRef.current.length-1] = updated;
      seriesRef.current.update(updated);
    }
  }, []);

  return { candlesRef, seriesRef, init, updateCandle };
}

/* ── Chart component ────────────────────────────────────────────────────────── */
function CandleChart({ ticker, initPrice, seriesRef, candlesRef, showVol, inds }:
  { ticker:string; initPrice:number; seriesRef:React.MutableRefObject<any>; candlesRef:React.MutableRefObject<Candle[]>; showVol:boolean; inds:Set<string> }) {
  const chartDiv  = useRef<HTMLDivElement>(null);
  const chartRef  = useRef<any>(null);
  const maRef     = useRef<any>(null);
  const emaRef    = useRef<any>(null);

  useEffect(()=>{
    if(!chartDiv.current || candlesRef.current.length===0) return;
    if(chartRef.current){chartRef.current.remove();chartRef.current=null;}

    const c=createChart(chartDiv.current,{
      layout:{background:{type:ColorType.Solid,color:CARD},textColor:DIM},
      grid:{vertLines:{color:"#181d25",style:LineStyle.Dotted},horzLines:{color:"#181d25",style:LineStyle.Dotted}},
      crosshair:{mode:1,vertLine:{color:"#F3BA2F44",labelBackgroundColor:CARD},horzLine:{color:"#F3BA2F44",labelBackgroundColor:CARD}},
      rightPriceScale:{borderColor:BORD},
      timeScale:{borderColor:BORD,timeVisible:true,secondsVisible:false},
      width:chartDiv.current.clientWidth,
      height:chartDiv.current.clientHeight,
    });

    const cs=c.addSeries(CandlestickSeries,{upColor:GREEN,downColor:RED,borderUpColor:GREEN,borderDownColor:RED,wickUpColor:GREEN,wickDownColor:RED} as any);
    cs.setData(candlesRef.current as any);
    c.timeScale().fitContent();
    seriesRef.current = cs;
    chartRef.current  = c;

    const ro=new ResizeObserver(()=>{if(chartDiv.current&&chartRef.current)chartRef.current.applyOptions({width:chartDiv.current.clientWidth,height:chartDiv.current.clientHeight});});
    ro.observe(chartDiv.current);
    return ()=>{ro.disconnect();c.remove();chartRef.current=null;seriesRef.current=null;};
  },[ticker]);

  return <div ref={chartDiv} style={{width:"100%",height:"100%"}} />;
}

/* ── Order Book ──────────────────────────────────────────────────────────────── */
function OrderBook({book,mid}:{book:{asks:OBRow[];bids:OBRow[]};mid:number}) {
  const maxT=Math.max(...book.asks.map(a=>a.total),...book.bids.map(b=>b.total));
  const bidT=book.bids.reduce((s,b)=>s+b.total,0);
  const pct=Math.round(bidT/(bidT+book.asks.reduce((s,a)=>s+a.total,0))*100);
  const rows=Math.min(book.asks.length,book.bids.length,9);
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",fontSize:10}}>
      <div style={{display:"flex",height:3,margin:"3px 6px 2px"}}>
        <div style={{flex:pct,background:GREEN,borderRadius:"2px 0 0 2px"}}/>
        <div style={{flex:100-pct,background:RED,borderRadius:"0 2px 2px 0"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",padding:"0 6px 2px",fontSize:8,color:DIM}}>
        <span style={{color:GREEN}}>{pct}%</span><span style={{color:RED}}>{100-pct}%</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"2px 6px",color:DIM,fontSize:8,borderBottom:`1px solid ${BORD}`}}>
        <span>Bid</span><span style={{textAlign:"center"}}>Price</span><span style={{textAlign:"right"}}>Ask</span>
      </div>
      <div style={{flex:1,overflow:"hidden"}}>
        {Array.from({length:rows},(_,i)=>{
          const ask=book.asks[i],bid=book.bids[i];
          return(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"1.5px 6px",position:"relative"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,background:"rgba(14,203,129,0.1)",width:`${(bid?.total||0)/maxT*50}%`}}/>
              <div style={{position:"absolute",right:0,top:0,bottom:0,background:"rgba(246,70,93,0.1)",width:`${(ask?.total||0)/maxT*50}%`}}/>
              <span style={{color:GREEN,position:"relative",fontVariantNumeric:"tabular-nums"}}>{bid?.amt?.toLocaleString()??""}</span>
              <span style={{color:FG,textAlign:"center",position:"relative",fontWeight:600,fontSize:9}}>{ask?.price?.toFixed(4)??""}</span>
              <span style={{color:RED,textAlign:"right",position:"relative",fontVariantNumeric:"tabular-nums"}}>{ask?.amt?.toLocaleString()??""}</span>
            </div>
          );
        })}
      </div>
      <div style={{padding:"2px 6px",borderTop:`1px solid ${BORD}`,background:BG,display:"flex",alignItems:"center",gap:6}}>
        <span style={{color:GREEN,fontWeight:700,fontSize:11,fontVariantNumeric:"tabular-nums"}}>{mid.toFixed(4)}</span>
        <span style={{color:DIM,fontSize:9}}>USDT ≈ mid</span>
      </div>
    </div>
  );
}

/* ── Trade History ───────────────────────────────────────────────────────────── */
function TradeHistory({trades}:{trades:Trade[]}) {
  return(
    <div style={{height:"100%",overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"3px 6px",color:DIM,fontSize:8,borderBottom:`1px solid ${BORD}`,position:"sticky",top:0,background:CARD}}>
        <span>Price</span><span style={{textAlign:"center"}}>Amount</span><span style={{textAlign:"right"}}>Time</span>
      </div>
      {trades.map((t,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"1.5px 6px",fontSize:10}}>
          <span style={{color:t.side==="buy"?GREEN:RED,fontVariantNumeric:"tabular-nums"}}>{t.price.toFixed(4)}</span>
          <span style={{color:FG,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{Number(t.amt).toLocaleString()}</span>
          <span style={{color:DIM,textAlign:"right",fontSize:8}}>{t.time}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Order Entry Panel ───────────────────────────────────────────────────────── */
const BAL_USDT=500;

type QuoteCurrency = "USDT" | "USDC" | "OKBOND";

function OrderEntry({asset,livePrice,quote,onTrade}:{asset:Asset;livePrice:number;quote:QuoteCurrency;onTrade:(side:"BUY"|"SELL",total:number)=>void}) {
  const [side,setSide]       = useState<"BUY"|"SELL">("BUY");
  const [ot,setOt]           = useState<"Limit"|"Market">("Limit");
  const [priceIn,setPriceIn] = useState(livePrice.toFixed(5));
  const [amount,setAmount]   = useState("");
  const [orders,setOrders]   = useState<OOrder[]>([]);
  const [showMenu,setShowMenu] = useState(false);
  const [tab,setTab]         = useState<"entry"|"open">("entry");
  const [wallet,setWallet]   = useState(getWallet());
  const [tradeMsg,setTradeMsg] = useState<{ok:boolean;text:string}|null>(null);

  useEffect(()=>{ if(ot==="Market") setPriceIn(livePrice.toFixed(5)); },[livePrice,ot]);
  useEffect(()=>{ setWallet(getWallet()); },[quote,side]);

  const pN = parseFloat(priceIn)||0;
  const aN = parseFloat(amount)||0;
  const total = ot==="Market"?livePrice*aN:pN*aN;
  const { fee, feeRate } = calculateFee(total, quote as Currency);
  const costBuy  = +(total + fee).toFixed(6);
  const netSell  = +(total - fee).toFixed(6);
  const ok = total >= 1;

  const walletBal = wallet ? wallet.balances[quote as Currency] : 0;
  const estTokens = side==="BUY"&&total>0?(total/livePrice).toFixed(4):"—";

  const pct=(p:number)=>{
    const execP = ot==="Market"?livePrice:pN||livePrice;
    if(side==="BUY") { const maxTokens = walletBal / (execP * (1 + feeRate)); setAmount((maxTokens*p).toFixed(4)); }
    else { setAmount(((aN||100)*p).toFixed(4)); }
  };

  const submit=()=>{
    if(!ok) return;
    const execPrice = ot==="Market"?livePrice:pN;
    const result = executeTrade(asset.ticker, side, aN, quote as Currency, execPrice);
    if(!result.ok) {
      setTradeMsg({ok:false,text:result.error||"Trade failed"});
      setTimeout(()=>setTradeMsg(null),3000);
      return;
    }
    setWallet(getWallet());
    onTrade(side, total);
    setOrders(prev=>[{id:Date.now(),side,type:ot,price:execPrice,amt:aN,total,time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}, ...prev]);
    setTradeMsg({ok:true,text:`${side} ${aN} ${asset.ticker} executed!`});
    setTimeout(()=>setTradeMsg(null),2500);
    setAmount("");
  };

  const feeLabel = quote==="OKBOND"?"0.30% ⬡":"0.50%";
  const feeColor = quote==="OKBOND"?"#F3BA2F":DIM;

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:`1px solid ${BORD}`,flexShrink:0}}>
        {(["entry","open"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"5px 0",fontSize:10,fontWeight:tab===t?700:400,border:"none",cursor:"pointer",background:"transparent",color:tab===t?FG:DIM,borderBottom:tab===t?`2px solid ${GOLD}`:"2px solid transparent"}}>
            {t==="entry"?"Order Entry":`Open(${orders.length})`}
          </button>
        ))}
      </div>

      {tab==="entry"?(
        <div style={{flex:1,overflowY:"auto",padding:"6px 7px"}}>
          {/* BUY/SELL */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:5}}>
            {(["BUY","SELL"] as const).map(s=>(
              <button key={s} onClick={()=>setSide(s)} style={{padding:"6px 0",fontWeight:800,fontSize:12,border:"none",cursor:"pointer",borderRadius:4,background:side===s?(s==="BUY"?GREEN:RED):ACT,color:side===s?"#fff":DIM,transition:"all .15s"}}>
                {s}
              </button>
            ))}
          </div>

          {/* Pair + Balance */}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:DIM,marginBottom:4}}>
            <span>Pair: <span style={{color:GOLD,fontWeight:700}}>{asset.ticker}/{quote}</span></span>
            <span>Avail: <span style={{color:GREEN,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{walletBal.toFixed(4)} {quote}</span></span>
          </div>

          {/* Order type */}
          <div style={{position:"relative",marginBottom:5}}>
            <button onClick={()=>setShowMenu(v=>!v)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:ACT,border:`1px solid ${BORD}`,borderRadius:4,padding:"4px 7px",color:FG,fontSize:10,cursor:"pointer"}}>
              {ot} <ChevronDown size={9}/>
            </button>
            <AnimatePresence>
              {showMenu&&(
                <motion.div initial={{opacity:0,y:-3}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{position:"absolute",top:"calc(100% + 2px)",left:0,right:0,background:"#1a1f27",border:`1px solid ${BORD}`,borderRadius:4,zIndex:50}}>
                  {(["Limit","Market"] as const).map(t=>(
                    <div key={t} onClick={()=>{setOt(t);setShowMenu(false);}} style={{padding:"6px 8px",fontSize:10,cursor:"pointer",color:ot===t?GOLD:FG,background:ot===t?"rgba(243,186,47,0.08)":"transparent"}}>{t}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Price */}
          <div style={{marginBottom:5}}>
            <div style={{fontSize:9,color:DIM,marginBottom:2}}>Price ({quote})</div>
            <input type="number" value={ot==="Market"?livePrice.toFixed(5):priceIn} onChange={e=>setPriceIn(e.target.value)} readOnly={ot==="Market"} step="0.00001" style={{width:"100%",background:ot==="Market"?"#0c1016":ACT,border:`1px solid ${BORD}`,borderRadius:4,padding:"5px 7px",color:ot==="Market"?DIM:FG,fontSize:11,outline:"none",boxSizing:"border-box",fontVariantNumeric:"tabular-nums"}}/>
          </div>

          {/* Amount */}
          <div style={{marginBottom:5}}>
            <div style={{fontSize:9,color:DIM,marginBottom:2}}>Amount ({asset.ticker})</div>
            <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={{width:"100%",background:ACT,border:`1px solid ${BORD}`,borderRadius:4,padding:"5px 7px",color:FG,fontSize:11,outline:"none",boxSizing:"border-box"}}/>
          </div>

          {/* Pct shortcuts */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginBottom:5}}>
            {[.25,.5,.75,1].map(p=>(
              <button key={p} onClick={()=>pct(p)} style={{padding:"3px 0",fontSize:9,fontWeight:600,borderRadius:3,cursor:"pointer",border:`1px solid ${BORD}`,background:ACT,color:DIM}}>{p*100}%</button>
            ))}
          </div>

          {/* Order summary with FEE */}
          <div style={{background:ACT,borderRadius:5,padding:"5px 7px",marginBottom:5,fontSize:9}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{color:DIM}}>Total</span>
              <span style={{color:FG,fontVariantNumeric:"tabular-nums"}}>{total>0?total.toFixed(4):"0.0000"} {quote}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{color:feeColor}}>Fee ({feeLabel})</span>
              <span style={{color:feeColor,fontVariantNumeric:"tabular-nums"}}>{fee>0?fee.toFixed(5):"0.00000"} {quote}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:3,borderTop:`1px solid ${BORD}`,marginBottom:2}}>
              <span style={{color:DIM,fontWeight:700}}>{side==="BUY"?"You Pay":"You Receive"}</span>
              <span style={{color:side==="BUY"?RED:GREEN,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{total>0?(side==="BUY"?costBuy.toFixed(4):netSell.toFixed(4)):"0.0000"} {quote}</span>
            </div>
            {side==="BUY"&&(
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{color:DIM}}>Est. Tokens</span>
                <span style={{color:GREEN,fontVariantNumeric:"tabular-nums"}}>{estTokens} {asset.ticker}</span>
              </div>
            )}
          </div>

          {/* ABP / TA */}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:DIM,marginBottom:5,padding:"0 2px"}}>
            <span>ABP: <span style={{color:GOLD,fontVariantNumeric:"tabular-nums"}}>{getABP(asset.ticker).toFixed(4)}</span></span>
            <span>TA: <span style={{color:getTA(asset.ticker)>=0?GREEN:RED}}>{(getTA(asset.ticker)*100).toFixed(4)}%</span></span>
          </div>

          {/* Insufficient balance warning */}
          <AnimatePresence>
            {ok && side==="BUY" && walletBal < costBuy && (
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(246,70,93,0.1)",border:`1px solid rgba(246,70,93,0.3)`,borderRadius:4,padding:"3px 6px"}}>
                  <AlertTriangle size={8} color={RED}/><span style={{fontSize:9,color:RED}}>Insufficient {quote} balance</span>
                </div>
              </motion.div>
            )}
            {total>0&&!ok&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} style={{overflow:"hidden",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:4,background:"rgba(246,70,93,0.1)",border:`1px solid rgba(246,70,93,0.3)`,borderRadius:4,padding:"3px 6px"}}>
                  <AlertTriangle size={8} color={RED}/><span style={{fontSize:9,color:RED}}>Min order $1 {quote}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trade message */}
          <AnimatePresence>
            {tradeMsg&&(
              <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{background:tradeMsg.ok?"rgba(14,203,129,0.1)":"rgba(246,70,93,0.1)",border:`1px solid ${tradeMsg.ok?"rgba(14,203,129,0.3)":"rgba(246,70,93,0.3)"}`,borderRadius:4,padding:"4px 7px",fontSize:9,color:tradeMsg.ok?GREEN:RED,marginBottom:4,textAlign:"center"}}>{tradeMsg.text}</motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button onClick={submit} disabled={!ok} style={{width:"100%",padding:"8px 0",borderRadius:4,border:"none",cursor:ok?"pointer":"not-allowed",fontWeight:800,fontSize:12,background:ok?(side==="BUY"?GREEN:RED):ACT,color:ok?"#fff":DIM,opacity:ok?1:.6,transition:"all .15s"}}>
            {side==="BUY"?`Buy ${asset.ticker} with ${quote}`:`Sell ${asset.ticker} → ${quote}`}
          </button>

          {/* No wallet warning */}
          {!wallet&&(
            <div style={{marginTop:5,fontSize:9,color:DIM,textAlign:"center"}}>
              <Link href={`${bp()}/wallet`}><span style={{color:GOLD,cursor:"pointer",textDecoration:"underline"}}>Create a wallet</span></Link> to trade with real balances
            </div>
          )}
        </div>
      ):(
        <div style={{flex:1,overflowY:"auto"}}>
          {orders.length===0?<div style={{padding:14,textAlign:"center",color:DIM,fontSize:11}}>No open orders</div>:orders.map(o=>(
            <div key={o.id} style={{padding:"6px 8px",borderBottom:`1px solid ${BORD}`,fontSize:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <span style={{color:o.side==="BUY"?GREEN:RED,fontWeight:700,fontSize:9,background:o.side==="BUY"?"rgba(14,203,129,0.1)":"rgba(246,70,93,0.1)",padding:"1px 5px",borderRadius:3}}>{o.side}</span>
                <button onClick={()=>setOrders(p=>p.filter(x=>x.id!==o.id))} style={{background:"rgba(246,70,93,0.12)",border:`1px solid rgba(246,70,93,0.3)`,borderRadius:3,padding:"1px 4px",cursor:"pointer",display:"flex",alignItems:"center"}}><X size={8} color={RED}/></button>
              </div>
              <div style={{color:FG,fontVariantNumeric:"tabular-nums"}}>{o.price.toFixed(4)} · {o.amt} {asset.ticker}</div>
              <div style={{color:DIM,fontSize:8}}>{o.type} · {o.total.toFixed(4)} {quote} · {o.time}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Coin Info ───────────────────────────────────────────────────────────────── */
function CoinInfo({asset}:{asset:Asset}) {
  return(
    <div style={{padding:"10px 12px",fontSize:11}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <img src={`${bp()}/logo-shield.png`} alt="" style={{width:30,height:30,objectFit:"contain"}}/>
        <div><div style={{fontWeight:700,color:FG,fontSize:13}}>{asset.ticker}</div><div style={{color:DIM,fontSize:10}}>{asset.name}</div></div>
      </div>
      <p style={{color:DIM,fontSize:11,lineHeight:1.5,marginBottom:10}}>{asset.desc}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {[["Market Cap",asset.mc],["Supply",asset.supply],["Max Supply",asset.maxSup],["ATH",asset.ath+" USDT"],["ATL",asset.atl+" USDT"],["24h Vol","$"+(asset.volU/1000).toFixed(1)+"K"]].map(([l,v])=>(
          <div key={l} style={{background:ACT,borderRadius:6,padding:"6px 8px"}}><div style={{color:DIM,fontSize:9,marginBottom:1}}>{l}</div><div style={{color:FG,fontWeight:600,fontSize:11}}>{v}</div></div>
        ))}
      </div>
      <div style={{borderTop:`1px solid ${BORD}`,paddingTop:8}}>
        <div style={{color:DIM,fontSize:10,marginBottom:6}}>Links</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["Website",asset.web],["Whitepaper",asset.wp]].map(([l,u])=>(
            <a key={l} href={u} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,background:ACT,border:`1px solid ${BORD}`,borderRadius:5,padding:"4px 8px",color:FG,fontSize:10,textDecoration:"none"}}><ExternalLink size={9}/>{l}</a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Money Flow ──────────────────────────────────────────────────────────────── */
const DC=[GREEN,"#00A67E","#FF6B82",RED,"#FF9BAB","#FF4466"];
function MoneyFlow({asset}:{asset:Asset}) {
  const [p,setP]=useState("1D");
  const mf=asset.mf;
  const data=[{n:"Large Buy",v:mf.l.b},{n:"Med Buy",v:mf.m.b},{n:"Small Buy",v:mf.sm.b},{n:"Large Sell",v:mf.l.s},{n:"Med Sell",v:mf.m.s},{n:"Small Sell",v:mf.sm.s}];
  const rows=[{l:"Large",...mf.l},{l:"Medium",...mf.m},{l:"Small",...mf.sm},{l:"Total",b:mf.l.b+mf.m.b+mf.sm.b,s:mf.l.s+mf.m.s+mf.sm.s,i:mf.l.i+mf.m.i+mf.sm.i}];
  return(
    <div style={{padding:"10px 12px"}}>
      <div style={{fontWeight:700,color:FG,fontSize:12,marginBottom:6}}>Money Flow Analysis</div>
      <div style={{display:"flex",gap:3,marginBottom:8}}>
        {["15m","30m","1h","2h","4h","1D"].map(x=>(
          <button key={x} onClick={()=>setP(x)} style={{padding:"2px 6px",fontSize:9,borderRadius:3,border:"none",cursor:"pointer",background:p===x?GOLD:ACT,color:p===x?BG:DIM,fontWeight:p===x?700:400}}>{x}</button>
        ))}
      </div>
      <div style={{height:150}}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={2} dataKey="v">
              {data.map((_,i)=><Cell key={i} fill={DC[i]}/>)}
            </Pie>
            <Tooltip formatter={(v:any)=>[`${v.toLocaleString()}M`,""]} contentStyle={{background:CARD,border:`1px solid ${BORD}`,fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{border:`1px solid ${BORD}`,borderRadius:6,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"55px 1fr 1fr 1fr",padding:"3px 8px",background:ACT,fontSize:9,color:DIM}}>
          <span>Orders</span><span style={{textAlign:"center",color:GREEN}}>Buy</span><span style={{textAlign:"center",color:RED}}>Sell</span><span style={{textAlign:"right"}}>Inflow</span>
        </div>
        {rows.map((r,i,a)=>(
          <div key={r.l} style={{display:"grid",gridTemplateColumns:"55px 1fr 1fr 1fr",padding:"4px 8px",fontSize:10,borderTop:`1px solid ${BORD}`,background:i===a.length-1?ACT:"transparent",fontWeight:i===a.length-1?700:400}}>
            <span style={{color:DIM}}>{r.l}</span>
            <span style={{textAlign:"center",color:GREEN}}>●{r.b.toLocaleString()}M</span>
            <span style={{textAlign:"center",color:RED}}>●{r.s.toLocaleString()}M</span>
            <span style={{textAlign:"right",color:r.i>=0?GREEN:RED}}>{r.i>=0?"+":""}{r.i.toLocaleString()}M</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MA/EMA calculation (simplified overlay display) ──────────────────────── */
function maValue(price:number, period:number, factor=1): number {
  return +(price * (1 + (Math.sin(period)*0.004*factor))).toFixed(5);
}

/* ── MARKET LIST ─────────────────────────────────────────────────────────────── */
const MC_TOTAL="$134.7M", VOL_24H="$1.89M";

function MarketList({onSelect}:{onSelect:(a:Asset)=>void}) {
  const [q,setQ]=useState("");
  // initialize all engines
  useEffect(()=>{ ASSETS.forEach(a=>initEngine(a.ticker,a.price)); },[]);
  const filtered=ASSETS.filter(a=>a.ticker.toLowerCase().includes(q.toLowerCase())||a.name.toLowerCase().includes(q.toLowerCase()));

  return(
    <div style={{minHeight:"100dvh",background:BG,color:FG,paddingBottom:64}}>
      {/* Top search + ribbon: sticky */}
      <div style={{position:"sticky",top:0,zIndex:20,background:BG}}>
        {/* Search bar */}
        <div style={{padding:"10px 12px 6px",paddingTop:"calc(env(safe-area-inset-top,6px) + 10px)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,background:CARD,border:`1px solid ${BORD}`,borderRadius:8,padding:"7px 11px"}}>
            <Search size={13} color={DIM}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search: ASC, OBK, DHA9…" style={{flex:1,background:"transparent",border:"none",outline:"none",color:FG,fontSize:12}}/>
            {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><X size={11} color={DIM}/></button>}
          </div>
        </div>

        {/* Market ribbon */}
        <div style={{display:"flex",overflowX:"auto",padding:"3px 12px 5px",borderBottom:`1px solid ${BORD}`,gap:0,alignItems:"center",scrollbarWidth:"none"}}>
          {[
            {label:"Mkt Cap", value:MC_TOTAL, color:FG},
            {label:"24h Vol",  value:VOL_24H,  color:FG},
            {label:"ABP·ASC", value:getABP("ASC")?getABP("ASC").toFixed(4):ASSETS[0].price.toFixed(4), color:GOLD},
            {label:"High",    value:ASSETS.map(a=>a.high).sort((x,y)=>y-x)[0].toFixed(2), color:GREEN},
            {label:"Low",     value:ASSETS.map(a=>a.low).sort((x,y)=>x-y)[0].toFixed(4),  color:RED},
            {label:"↑Tokens", value:"4/6", color:GREEN},
            {label:"↓Tokens", value:"2/6", color:RED},
          ].map((s,i,arr)=>(
            <div key={s.label} style={{display:"inline-flex",flexDirection:"column",flexShrink:0,padding:"0 10px 0 0",marginRight:i<arr.length-1?10:0,borderRight:i<arr.length-1?`1px solid ${BORD}`:"none"}}>
              <span style={{fontSize:8,color:DIM,letterSpacing:"0.04em"}}>{s.label}</span>
              <span style={{fontSize:11,fontWeight:700,color:s.color,fontVariantNumeric:"tabular-nums"}}>{s.value}</span>
            </div>
          ))}
          {/* Admin link */}
          <Link href="/admin/config" style={{marginLeft:"auto",flexShrink:0,display:"flex",alignItems:"center",gap:3,background:"rgba(243,186,47,0.08)",border:`1px solid rgba(243,186,47,0.2)`,borderRadius:5,padding:"3px 7px",textDecoration:"none"}}>
            <Settings size={10} color={GOLD}/><span style={{fontSize:9,color:GOLD}}>Admin</span>
          </Link>
        </div>

        {/* Column headers */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",padding:"4px 12px",fontSize:9,color:DIM,background:BG,borderBottom:`1px solid ${BORD}`}}>
          <span>Name</span><span style={{textAlign:"right",marginRight:46}}>Last Price</span><span>24h</span>
        </div>
      </div>

      {/* Pair list */}
      {filtered.map((a,i)=>(
        <motion.div key={a.ticker} initial={{opacity:0,x:-5}} animate={{opacity:1,x:0}} transition={{delay:i*.03}}
          onClick={()=>onSelect(a)}
          style={{display:"grid",gridTemplateColumns:"1fr auto auto",alignItems:"center",padding:"9px 12px",cursor:"pointer",borderBottom:`1px solid ${BORD}`,gap:8,transition:"background .15s"}}
          onMouseEnter={e=>(e.currentTarget.style.background=CARD)}
          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
        >
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(243,186,47,0.1)",border:`1px solid rgba(243,186,47,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:GOLD,flexShrink:0}}>
              {a.ticker.slice(0,3)}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:12,color:FG}}>{a.ticker}<span style={{color:DIM,fontWeight:400}}>/USDT</span></div>
              <div style={{fontSize:9,color:DIM}}>{a.name}</div>
            </div>
          </div>
          <div style={{textAlign:"right",fontWeight:600,fontSize:12,fontVariantNumeric:"tabular-nums",color:a.change>=0?GREEN:RED}}>{a.price.toFixed(4)}</div>
          <div style={{minWidth:56,textAlign:"center",padding:"2px 5px",borderRadius:4,fontSize:10,fontWeight:700,background:a.change>=0?"rgba(14,203,129,0.12)":"rgba(246,70,93,0.12)",color:a.change>=0?GREEN:RED}}>
            {a.change>=0?"+":""}{a.change.toFixed(2)}%
          </div>
        </motion.div>
      ))}
      {filtered.length===0&&<div style={{padding:40,textAlign:"center",color:DIM,fontSize:12}}>No tokens found for "{q}"</div>}
    </div>
  );
}

/* ── TERMINAL ────────────────────────────────────────────────────────────────── */
const TFs=["15m","1h","4h","1D","More"];
const ALL_INDS=["MA","EMA","BOLL","SAR","AVL","Super","VOL","MACD","RSI","KDJ","OBV","WR"];
type BTab="Price"|"Info"|"Trading Data";

function Terminal({asset,onBack}:{asset:Asset;onBack:()=>void}) {
  // Init price engine for this asset
  const initPrice = initEngine(asset.ticker, asset.price);
  const [live,setLive]=useState(initPrice);
  const [book,setBook]=useState(()=>genBook(initPrice));
  const [trades,setTrades]=useState<Trade[]>(()=>genTrades(initPrice));
  const [btab,setBtab]=useState<BTab>("Price");
  const [bkTab,setBkTab]=useState<"Order Book"|"Trades">("Order Book");
  const [tf,setTf]=useState("15m");
  const [inds,setInds]=useState<Set<string>>(new Set(["MA","VOL"]));
  const [starred,setStarred]=useState(false);
  const [quote,setQuote]=useState<QuoteCurrency>("USDT");
  const showVol=inds.has("VOL");
  const showMA=inds.has("MA");
  const showEMA=inds.has("EMA");
  const showRSI=inds.has("RSI");

  const { candlesRef, seriesRef, init, updateCandle } = useCandles(asset.ticker, initPrice);

  // Initialize candles
  useEffect(()=>{
    init(initPrice);
  },[asset.ticker]);

  // Real-time price via Supabase postgres_changes — fires on every trade or Edge Function tick
  useEffect(()=>{
    const sb=createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    const ch=sb
      .channel(`price:${asset.ticker}`)
      .on(
        "postgres_changes" as any,
        { event:"INSERT", schema:"public", table:"price_ticks", filter:`ticker=eq.${asset.ticker}` },
        (payload:any)=>{
          const next=Number(payload.new.price);
          setLive(next);
          setBook(genBook(next));
          setTrades(()=>genTrades(next,25));
          updateCandle(next);
        }
      )
      .subscribe();
    return ()=>{ sb.removeChannel(ch); };
  },[asset.ticker]);

  // Listen for admin price jump
  useEffect(()=>{
    const handler=(e:Event)=>{
      const ev=e as CustomEvent;
      if(ev.detail?.ticker===asset.ticker){
        const newP=ev.detail.price;
        setLive(newP);
        setBook(genBook(newP));
        updateCandle(newP,true); // Gap candle
      }
    };
    window.addEventListener('adminPriceJump',handler);
    return ()=>window.removeEventListener('adminPriceJump',handler);
  },[asset.ticker]);

  const handleTrade=(side:"BUY"|"SELL",total:number)=>{
    const newP=applyTrade(asset.ticker,side,total);
    // Insert into Supabase trades → DB trigger creates price_tick → Realtime echoes to all clients
    createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
      .from("trades")
      .insert({ ticker:asset.ticker, side, price:newP, amount:Number((total/newP).toFixed(8)), total_usdt:total })
      .then(({ error }) => { if(error) console.warn("trade insert:", error.message); });
    // Optimistic local update — chart updates immediately, Realtime confirms to all other clients
    setLive(newP);
    setBook(genBook(newP));
    updateCandle(newP);
  };

  const isUp=live>=asset.price;

  return(
    <div style={{background:BG,color:FG,minHeight:"100dvh",paddingBottom:64}}>
      {/* ── Header ── */}
      <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:"8px 12px",paddingTop:"calc(env(safe-area-inset-top,6px)+8px)",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",padding:2,display:"flex"}}><ArrowLeft size={16} color={FG}/></button>
            <span style={{fontWeight:800,fontSize:15,color:FG}}>{asset.ticker}<span style={{color:DIM,fontWeight:400}}>/{quote}</span></span>
            <div style={{display:"flex",gap:2,marginLeft:4}}>
              {(["USDT","USDC","OKBOND"] as QuoteCurrency[]).map(q=>(
                <button key={q} onClick={()=>setQuote(q)} style={{padding:"1px 5px",fontSize:8,fontWeight:700,borderRadius:3,border:`1px solid ${quote===q?"#F3BA2F":"#1E2329"}`,background:quote===q?"rgba(243,186,47,0.15)":"transparent",color:quote===q?"#F3BA2F":"#848E9C",cursor:"pointer"}}>{q}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <Link href="/admin/config" style={{display:"flex",alignItems:"center",gap:3,background:"rgba(243,186,47,0.08)",border:`1px solid rgba(243,186,47,0.2)`,borderRadius:5,padding:"3px 6px",textDecoration:"none"}}>
              <Settings size={10} color={GOLD}/><span style={{fontSize:9,color:GOLD}}>Admin</span>
            </Link>
            <button onClick={()=>setStarred(v=>!v)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><Star size={14} fill={starred?GOLD:"none"} color={starred?GOLD:DIM}/></button>
            <Bell size={14} color={DIM}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:3}}>
          <span style={{fontSize:22,fontWeight:800,color:isUp?GREEN:RED,fontVariantNumeric:"tabular-nums"}}>{live.toFixed(4)}</span>
          <span style={{fontSize:11,color:isUp?GREEN:RED,display:"flex",alignItems:"center",gap:2}}>
            {isUp?<TrendingUp size={10}/>:<TrendingDown size={10}/>}{asset.change>=0?"+":""}{asset.change.toFixed(2)}%
          </span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,fontSize:9}}>
          {[["24h High",asset.high.toFixed(4),GREEN],["24h Low",asset.low.toFixed(4),RED],[`Vol(${asset.ticker})`,(asset.vol/1000).toFixed(1)+"K",DIM],["Vol(USDT)",(asset.volU/1000).toFixed(1)+"K",DIM]].map(([l,v,c])=>(
            <div key={l}><div style={{color:DIM,fontSize:8}}>{l}</div><div style={{color:c,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{v}</div></div>
          ))}
        </div>
        {/* ABP + TA row */}
        <div style={{display:"flex",gap:12,marginTop:3,fontSize:8}}>
          <span style={{color:DIM}}>ABP: <span style={{color:GOLD,fontVariantNumeric:"tabular-nums"}}>{getABP(asset.ticker).toFixed(5)}</span></span>
          <span style={{color:DIM}}>TA: <span style={{color:getTA(asset.ticker)>=0?GREEN:RED}}>{(getTA(asset.ticker)*100).toFixed(4)}%</span></span>
          <span style={{color:DIM}}>Formula: <span style={{color:FG}}>ABP×(1+TA)</span></span>
        </div>
      </div>

      {/* ── Main tabs ── */}
      <div style={{display:"flex",borderBottom:`1px solid ${BORD}`,background:CARD,overflowX:"auto",scrollbarWidth:"none"}}>
        {(["Price","Info","Trading Data"] as BTab[]).map(t=>(
          <button key={t} onClick={()=>setBtab(t)} style={{padding:"6px 14px",fontSize:12,fontWeight:btab===t?700:400,border:"none",cursor:"pointer",background:"transparent",whiteSpace:"nowrap",color:btab===t?FG:DIM,borderBottom:btab===t?`2px solid ${GOLD}`:"2px solid transparent",flexShrink:0}}>
            {t}
          </button>
        ))}
      </div>

      {btab==="Price"&&(
        <>
          {/* Timeframe */}
          <div style={{display:"flex",background:CARD,borderBottom:`1px solid ${BORD}`,padding:"2px 6px",overflowX:"auto",scrollbarWidth:"none"}}>
            {TFs.map(t=>(
              <button key={t} onClick={()=>setTf(t)} style={{padding:"2px 8px",fontSize:10,border:"none",cursor:"pointer",borderRadius:3,background:tf===t?ACT:"transparent",color:tf===t?GOLD:DIM,fontWeight:tf===t?700:400,flexShrink:0}}>
                {t}
              </button>
            ))}
          </div>

          {/* MA/EMA overlay values */}
          {(showMA||showEMA||showRSI)&&(
            <div style={{display:"flex",gap:8,padding:"2px 8px",fontSize:9,background:CARD,flexWrap:"wrap",borderBottom:`1px solid ${BORD}`}}>
              {showMA&&[7,25,99].map((p,i)=>(
                <span key={p} style={{color:[GOLD,"#DA5A9B","#8B7FD4"][i]}}>MA({p}): {maValue(live,p).toFixed(4)}</span>
              ))}
              {showEMA&&[12,26].map((p,i)=>(
                <span key={p} style={{color:["#4CC9F0","#7B2D8B"][i]}}>EMA({p}): {maValue(live,p,.8).toFixed(4)}</span>
              ))}
              {showRSI&&<span style={{color:"#FF9F1C"}}>RSI(14): {(45+Math.random()*20).toFixed(1)}</span>}
            </div>
          )}

          {/* Chart */}
          <div style={{height:showVol?134:170,background:CARD}}>
            <CandleChart ticker={asset.ticker} initPrice={initPrice} seriesRef={seriesRef} candlesRef={candlesRef} showVol={showVol} inds={inds}/>
          </div>

          {/* Volume bars — flush under chart */}
          {showVol&&(
            <div style={{height:34,background:CARD,display:"flex",alignItems:"flex-end",gap:1,padding:"0 2px",overflow:"hidden",borderBottom:`1px solid ${BORD}`}}>
              {Array.from({length:42},(_,i)=>{
                const h=6+Math.random()*22;
                return <div key={i} style={{flex:1,height:h,background:i%2===0?GREEN:RED,opacity:.75,borderRadius:1}}/>;
              })}
            </div>
          )}

          {/* Indicators bar — NO gap */}
          <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:"3px 6px",overflowX:"auto",whiteSpace:"nowrap",scrollbarWidth:"none"}}>
            {ALL_INDS.map(ind=>(
              <button key={ind} onClick={()=>setInds(prev=>{const n=new Set(prev);n.has(ind)?n.delete(ind):n.add(ind);return n;})} style={{display:"inline-block",padding:"2px 6px",fontSize:9,fontWeight:inds.has(ind)?700:400,borderRadius:3,border:"none",cursor:"pointer",marginRight:2,background:inds.has(ind)?"rgba(243,186,47,0.15)":ACT,color:inds.has(ind)?GOLD:DIM,borderBottom:inds.has(ind)?`1.5px solid ${GOLD}`:"1.5px solid transparent"}}>
                {ind}
              </button>
            ))}
          </div>

          {/* Twin panel: Order Book | Order Entry */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",height:320,borderBottom:`1px solid ${BORD}`}}>
            <div style={{borderRight:`1px solid ${BORD}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{display:"flex",borderBottom:`1px solid ${BORD}`,flexShrink:0}}>
                {(["Order Book","Trades"] as const).map(t=>(
                  <button key={t} onClick={()=>setBkTab(t)} style={{flex:1,padding:"4px 0",fontSize:10,fontWeight:bkTab===t?700:400,border:"none",cursor:"pointer",background:"transparent",color:bkTab===t?FG:DIM,borderBottom:bkTab===t?`2px solid ${GOLD}`:"2px solid transparent"}}>
                    {t}
                  </button>
                ))}
              </div>
              {bkTab==="Order Book"?<OrderBook book={book} mid={live}/>:<TradeHistory trades={trades}/>}
            </div>
            <OrderEntry asset={asset} livePrice={live} quote={quote} onTrade={handleTrade}/>
          </div>

          {/* Period performance */}
          <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:"5px 12px",overflowX:"auto",whiteSpace:"nowrap",display:"flex",gap:0,scrollbarWidth:"none"}}>
            {[["Today",asset.change>=0?`+${asset.change}%`:`${asset.change}%`,asset.change>=0?GREEN:RED],["7D","+5.53%",GREEN],["30D","--",DIM],["90D","--",DIM],["180D","--",DIM],["1Y","--",DIM]].map(([l,v,c],i,arr)=>(
              <div key={l} style={{display:"inline-flex",flexDirection:"column",flexShrink:0,padding:"0 10px 0 0",borderRight:i<arr.length-1?`1px solid ${BORD}`:"none",marginRight:i<arr.length-1?10:0}}>
                <span style={{fontSize:8,color:DIM}}>{l}</span>
                <span style={{fontSize:11,fontWeight:600,color:c,fontVariantNumeric:"tabular-nums"}}>{v}</span>
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

/* ── ROOT ────────────────────────────────────────────────────────────────────── */
export default function Trades() {
  const [active,setActive]=useState<Asset|null>(null);
  if(active) return <Terminal asset={active} onBack={()=>setActive(null)}/>;
  return <MarketList onSelect={setActive}/>;
}

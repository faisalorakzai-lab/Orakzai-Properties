import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import {
  TrendingUp, TrendingDown, BarChart3, ArrowLeft,
  RefreshCw, PieChart, Coins, ArrowUpRight,
} from "lucide-react";
import { getTradingPositions, getWallet, type TokenPosition, type Currency } from "@/lib/walletEngine";
import { getPrice, initEngine } from "@/lib/priceEngine";

/* ── Theme ── */
const BG    = "#0B0E11";
const CARD  = "#12161C";
const BORD  = "#1E2329";
const GOLD  = "#F3BA2F";
const GREEN = "#0ECB81";
const RED   = "#F6465D";
const DIM   = "#848E9C";
const FG    = "#EAECEF";
const bp    = () => (import.meta.env.BASE_URL||"/").replace(/\/$/,"");

/* ── Default prices for P&L calculation ── */
const DEFAULT_PRICES: Record<string,number> = {
  ASC:1.2400, DHA9:8.7500, BTI:5.1000, GBR:3.6200, CSC:2.1800, OBK:0.8800,
};

const fmt = (n:number | undefined | null,d=4) => {
  if (n === undefined || n === null || isNaN(n)) return (0).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
  return n.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
};
const fmtU = (n:number | undefined | null) => {
  if (n === undefined || n === null || isNaN(n)) return (0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  return n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
};

/* ── Sparkline data ── */
function genSparkline(avgBuy:number, current:number, n=12): {v:number}[] {
  const out:{v:number}[] = [];
  let p = avgBuy * 0.92;
  for(let i=0;i<n;i++){
    p = p + (current - p) / (n - i) + (Math.random()-.5)*avgBuy*.02;
    out.push({v:+p.toFixed(5)});
  }
  out[n-1]={v:current};
  return out;
}

/* ── Position Card ── */
function PositionCard({pos,index}:{pos:TokenPosition;index:number}) {
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(()=>{
    const p = initEngine(pos.ticker, DEFAULT_PRICES[pos.ticker]||1);
    setCurrentPrice(p);
    const iv = setInterval(()=>{ setCurrentPrice(getPrice(pos.ticker)||p); },3000);
    return ()=>clearInterval(iv);
  },[pos.ticker]);

  if(!currentPrice) return null;

  const currentValue   = pos.netTokens * currentPrice;
  const costBasis      = pos.netTokens * pos.avgBuyPrice;
  const unrealizedPnL  = currentValue - costBasis;
  const unrealizedPct  = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
  const isGain         = unrealizedPnL >= 0;
  const sparkData      = genSparkline(pos.avgBuyPrice, currentPrice);

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:index*.06}}
      style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:14,overflow:"hidden",marginBottom:10}}>
      {/* Gain/loss indicator line */}
      <div style={{height:2,background:isGain?GREEN:RED,width:"100%"}}/>

      <div style={{padding:"12px 14px"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(243,186,47,0.1)",border:`1px solid rgba(243,186,47,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:GOLD,flexShrink:0}}>
              {pos.ticker.slice(0,3)}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:13,color:FG}}>{pos.ticker}<span style={{color:DIM,fontWeight:400}}>/{pos.quote}</span></div>
              <div style={{fontSize:9,color:DIM}}>{pos.netTokens.toFixed(4)} tokens held</div>
            </div>
          </div>
          <Link href={`${bp()}/trades`}>
            <button style={{display:"flex",alignItems:"center",gap:3,background:"rgba(243,186,47,0.08)",border:`1px solid rgba(243,186,47,0.2)`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:10,color:GOLD,fontWeight:600}}>
              <ArrowUpRight size={10}/> Trade
            </button>
          </Link>
        </div>

        {/* P&L highlight */}
        <div style={{background:isGain?"rgba(14,203,129,0.05)":"rgba(246,70,93,0.05)",border:`1px solid ${isGain?"rgba(14,203,129,0.2)":"rgba(246,70,93,0.2)"}`,borderRadius:10,padding:"10px 12px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:9,color:DIM,marginBottom:2}}>Unrealized P&L</div>
            <div style={{fontSize:18,fontWeight:800,color:isGain?GREEN:RED,fontVariantNumeric:"tabular-nums"}}>
              {isGain?"+":""}{fmtU(unrealizedPnL)} <span style={{fontSize:11,fontWeight:400}}>{pos.quote}</span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:DIM,marginBottom:2}}>Return</div>
            <div style={{fontSize:16,fontWeight:800,color:isGain?GREEN:RED,display:"flex",alignItems:"center",gap:3}}>
              {isGain?<TrendingUp size={14}/>:<TrendingDown size={14}/>}
              {isGain?"+":""}{unrealizedPct.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Sparkline */}
        <div style={{height:48,marginBottom:10}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`sg-${pos.ticker}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isGain?GREEN:RED} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isGain?GREEN:RED} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={isGain?GREEN:RED} strokeWidth={1.5} fill={`url(#sg-${pos.ticker})`} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
          {[
            ["Avg Buy",`${fmt(pos.avgBuyPrice)} ${pos.quote}`,FG],
            ["Current",`${fmt(currentPrice)} ${pos.quote}`,isGain?GREEN:RED],
            ["Cur. Value",`${fmtU(currentValue)} ${pos.quote}`,GOLD],
            ["Cost Basis",`${fmtU(costBasis)} ${pos.quote}`,DIM],
            ["Bought",`${pos.totalBought.toFixed(2)} ${pos.ticker}`,DIM],
            ["Sold",`${pos.totalSold.toFixed(2)} ${pos.ticker}`,DIM],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:BG,borderRadius:7,padding:"6px 8px"}}>
              <div style={{fontSize:8,color:DIM,marginBottom:2}}>{l}</div>
              <div style={{fontSize:10,fontWeight:600,color:c as string,fontVariantNumeric:"tabular-nums"}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Trade count */}
        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6,fontSize:9,color:DIM}}>
          <Coins size={10}/> {pos.trades.length} trade{pos.trades.length!==1?"s":""} · Avg buy {fmt(pos.avgBuyPrice)} {pos.quote} · Current {fmt(currentPrice)} {pos.quote}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Summary bar ── */
function SummaryBar({positions}:{positions:TokenPosition[]}) {
  const [totals, setTotals] = useState({invested:0,current:0,pnl:0,pct:0});

  useEffect(()=>{
    let inv=0, cur=0;
    positions.forEach(pos=>{
      const price = getPrice(pos.ticker) || DEFAULT_PRICES[pos.ticker]||1;
      inv += pos.netTokens * pos.avgBuyPrice;
      cur += pos.netTokens * price;
    });
    const pnl = cur - inv;
    const pct = inv>0?pnl/inv*100:0;
    setTotals({invested:inv,current:cur,pnl,pct});
    const iv = setInterval(()=>{
      let c2=0;
      positions.forEach(pos=>{ c2 += pos.netTokens*(getPrice(pos.ticker)||DEFAULT_PRICES[pos.ticker]||1); });
      const p2=c2-inv;
      setTotals({invested:inv,current:c2,pnl:p2,pct:inv>0?p2/inv*100:0});
    },3000);
    return ()=>clearInterval(iv);
  },[positions]);

  const isGain = totals.pnl>=0;

  return (
    <div style={{background:`linear-gradient(135deg,#0c1a0a,${CARD})`,border:`1px solid ${BORD}`,borderRadius:14,padding:"14px 16px",marginBottom:14}}>
      <div style={{fontSize:10,color:DIM,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Total Trading Portfolio</div>
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10}}>
        <span style={{fontSize:24,fontWeight:800,color:GOLD,fontVariantNumeric:"tabular-nums"}}>{fmtU(totals.current)}</span>
        <span style={{fontSize:12,color:DIM}}>USDT</span>
        <span style={{fontSize:13,fontWeight:700,color:isGain?GREEN:RED,display:"flex",alignItems:"center",gap:3}}>
          {isGain?<TrendingUp size={12}/>:<TrendingDown size={12}/>}
          {isGain?"+":""}{fmtU(totals.pnl)} ({totals.pct>=0?"+":""}{totals.pct.toFixed(2)}%)
        </span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        {[["Cost Basis",`${fmtU(totals.invested)} USDT`,DIM],["Market Value",`${fmtU(totals.current)} USDT`,GOLD],["Tokens Held",positions.length+" assets",FG]].map(([l,v,c])=>(
          <div key={l} style={{background:BG,borderRadius:7,padding:"6px 8px"}}>
            <div style={{fontSize:8,color:DIM,marginBottom:1}}>{l}</div>
            <div style={{fontSize:10,fontWeight:600,color:c as string}}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState() {
  const wallet = getWallet();
  return (
    <div style={{textAlign:"center",padding:"60px 20px 80px"}}>
      <div style={{width:72,height:72,borderRadius:20,background:"rgba(243,186,47,0.08)",border:`1px solid rgba(243,186,47,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
        <PieChart size={30} color={GOLD} style={{opacity:.5}}/>
      </div>
      <div style={{fontSize:18,fontWeight:700,color:FG,marginBottom:6}}>No Trading Positions</div>
      <div style={{fontSize:12,color:DIM,maxWidth:280,margin:"0 auto 24px",lineHeight:1.6}}>
        {wallet?"You haven't made any trades yet. Go to the Trades screen to buy your first token.":"Create a wallet first, then start trading property tokens."}
      </div>
      <Link href={`${bp()}/${wallet?"/trades":"/wallet"}`}>
        <button style={{padding:"12px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#F3BA2F,#c89000)",color:"#0B0E11",fontWeight:800,fontSize:13,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
          <BarChart3 size={14}/> {wallet?"Go to Trades":"Create Wallet"}
        </button>
      </Link>
    </div>
  );
}

/* ── Main Page ── */
export default function TradingPortfolio() {
  const [positions, setPositions] = useState<TokenPosition[]>([]);
  const [loading, setLoading]     = useState(true);

  const reload = () => {
    // Init price engines
    Object.entries(DEFAULT_PRICES).forEach(([t,p])=>initEngine(t,p));
    setPositions(getTradingPositions());
    setLoading(false);
  };

  useEffect(()=>{ reload(); },[]);

  return (
    <div style={{minHeight:"100dvh",background:BG,color:FG,paddingBottom:80}}>
      {/* Header */}
      <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:"12px 16px",paddingTop:"calc(env(safe-area-inset-top,8px)+12px)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Link href={`${bp()}/trades`}>
            <button style={{background:"none",border:"none",cursor:"pointer",padding:2,display:"flex"}}><ArrowLeft size={16} color={FG}/></button>
          </Link>
          <div>
            <div style={{fontWeight:800,fontSize:14,color:FG}}>Trading Portfolio</div>
            <div style={{fontSize:9,color:DIM}}>P&L from all token trades</div>
          </div>
        </div>
        <button onClick={reload} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><RefreshCw size={13} color={DIM}/></button>
      </div>

      <div style={{padding:"14px 14px 0"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:DIM}}>Loading…</div>
        ) : positions.length === 0 ? (
          <EmptyState/>
        ) : (
          <>
            <SummaryBar positions={positions}/>
            {positions.map((pos,i)=>(
              <PositionCard key={pos.ticker} pos={pos} index={i}/>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

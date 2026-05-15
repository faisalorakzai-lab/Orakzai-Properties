import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Link } from "wouter";
import {
  Search, Bell, ChevronRight, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, RefreshCw, TrendingUp, TrendingDown, Plus,
  Shield, Layers, Cpu, BarChart3, Repeat, Home, FolderOpen,
  Wallet2, User, Star, MapPin, CheckCircle2, Sparkles,
  DollarSign, Activity, Clock, BadgeCheck,
} from "lucide-react";
import {
  getWallet, createWallet, deposit, getTxns,
  type WalletState, type Currency,
} from "@/lib/walletEngine";

/* ─── Design tokens ─────────────────────────────────────────────────────────── */
const BG      = "#070B14";
const CARD    = "rgba(255,255,255,0.04)";
const BORD    = "rgba(255,255,255,0.08)";
const GOLD    = "#F3BA2F";
const GOLD2   = "#C89000";
const FG      = "#FFFFFF";
const DIM     = "#8B93A7";
const GREEN   = "#22C55E";
const RED     = "#EF4444";
const PURPLE  = "#8B5CF6";
const CYAN    = "#06B6D4";

const bp = () => (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

/* ─── Static data ────────────────────────────────────────────────────────────── */
const PKR_RATE   = 278;   // 1 USDT ≈ PKR
const OKB_RATE   = 88;    // 1 OKBOND ≈ PKR

const PERF_DATA = [
  {m:"Jan",v:18500000},{m:"Feb",v:19200000},{m:"Mar",v:20100000},
  {m:"Apr",v:19800000},{m:"May",v:21500000},{m:"Jun",v:23000000},
  {m:"Jul",v:22200000},{m:"Aug",v:24100000},{m:"Sep",v:25300000},
  {m:"Oct",v:26800000},{m:"Nov",v:27200000},{m:"Dec",v:28790450},
];

const INCOME_DATA = [
  {m:"Jan",v:220000},{m:"Feb",v:245000},{m:"Mar",v:268000},
  {m:"Apr",v:290000},{m:"May",v:315000},{m:"Jun",v:345750},
];

const ALLOCATION = [
  {name:"Property",value:53,color:GOLD,     amount:"PKR 15,250,000"},
  {name:"Crypto",  value:30,color:PURPLE,   amount:"PKR 8,750,450"},
  {name:"Fiat",    value:17,color:CYAN,     amount:"PKR 4,790,000"},
];

const PROPERTIES = [
  {name:"Orakzai Heights",      loc:"DHA, Lahore",           own:35,value:"PKR 8,750,000",roi:12.45, bg:"linear-gradient(135deg,#1a2a40,#2a3f60)"},
  {name:"Orakzai Ocean Tower",  loc:"Dubai Maritime City",   own:25,value:"PKR 4,250,000",roi:9.75,  bg:"linear-gradient(135deg,#1a3030,#1a4040)"},
  {name:"Orakzai Business Hub", loc:"Bahria Town, Karachi",  own:20,value:"PKR 2,850,000",roi:11.20, bg:"linear-gradient(135deg,#2a1a35,#3a2050)"},
];

const PAYOUTS = [
  {name:"Orakzai Heights",     date:"30 Jun 2025",amount:"+PKR 125,000"},
  {name:"Orakzai Ocean Tower", date:"05 Jul 2025",amount:"+PKR 145,750"},
  {name:"Orakzai Business Hub",date:"10 Jul 2025",amount:"+PKR 75,000"},
];

const MARKETS = [
  {city:"Karachi Market",pct:9.25, roi:11.20,spark:[7,8,8.5,9,8.8,9.25]},
  {city:"Dubai Market",  pct:12.45,roi:13.75,spark:[10,11,12,11.5,12.1,12.45]},
  {city:"Lahore Market", pct:7.85, roi:10.45,spark:[6,7,7.2,7.5,7.8,7.85]},
];

const QUICK_ACTIONS = [
  {label:"Deposit",    icon:ArrowDownToLine,  color:GREEN,  glow:"rgba(34,197,94,0.2)"},
  {label:"Withdraw",   icon:ArrowUpFromLine,  color:RED,    glow:"rgba(239,68,68,0.2)"},
  {label:"Transfer",   icon:ArrowLeftRight,   color:CYAN,   glow:"rgba(6,182,212,0.2)"},
  {label:"Convert",    icon:Repeat,           color:PURPLE, glow:"rgba(139,92,246,0.2)"},
  {label:"Buy Property",icon:Layers,          color:GOLD,   glow:"rgba(243,186,47,0.2)"},
  {label:"AI Advisor", icon:Sparkles,         color:"#F97316",glow:"rgba(249,115,22,0.2)"},
];

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const fmtPKR = (n:number) => {
  if(n>=10_000_000) return `PKR ${(n/10_000_000).toFixed(2)} Cr`;
  if(n>=100_000)    return `PKR ${(n/100_000).toFixed(2)}L`;
  return `PKR ${n.toLocaleString("en-PK",{maximumFractionDigits:0})}`;
};
const fmtNum = (n:number,d=2) => n.toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});

/* ─── Inline sparkline (no recharts overhead) ───────────────────────────────── */
function Sparkline({data,color,width=60,height=24}:{data:number[];color:string;width?:number;height?:number}) {
  const min=Math.min(...data), max=Math.max(...data);
  const range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-(((v-min)/range)*height)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ─── Animated counter ──────────────────────────────────────────────────────── */
function Counter({target,prefix="",suffix="",decimals=2}:{target:number;prefix?:string;suffix?:string;decimals?:number}) {
  const [val,setVal]=useState(0);
  useEffect(()=>{
    const dur=1400,t0=Date.now();
    let raf:number;
    const tick=()=>{
      const p=Math.min((Date.now()-t0)/dur,1);
      const e=1-Math.pow(1-p,4);
      setVal(target*e);
      if(p<1) raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[target]);
  return <span>{prefix}{fmtNum(val,decimals)}{suffix}</span>;
}

/* ─── Card wrapper ──────────────────────────────────────────────────────────── */
function Card({children,style={},className=""}:{children:React.ReactNode;style?:React.CSSProperties;className?:string}) {
  return (
    <div className={className} style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:16,overflow:"hidden",...style}}>
      {children}
    </div>
  );
}

/* ─── Section header ────────────────────────────────────────────────────────── */
function SectionHeader({title,icon:Icon,action,href}:{title:string;icon?:any;action?:string;href?:string}) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        {Icon&&<Icon size={15} color={GOLD}/>}
        <span style={{fontWeight:700,fontSize:14,color:FG}}>{title}</span>
      </div>
      {action&&href&&(
        <Link href={href}>
          <button style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:GOLD,background:"none",border:"none",cursor:"pointer"}}>
            {action}<ChevronRight size={12}/>
          </button>
        </Link>
      )}
    </div>
  );
}

/* ─── Deposit Modal ──────────────────────────────────────────────────────────── */
function DepositModal({open,onClose,onDone}:{open:boolean;onClose:()=>void;onDone:()=>void}) {
  const [tab,setTab]=useState<Currency>("USDT");
  const [amount,setAmount]=useState("");
  const [done,setDone]=useState(false);
  const CRYPTO_ADDR="0x3aB5C9a14e3d2F1c7a0E8fB2D4A69c05e72f1A3";

  const doDeposit=()=>{
    const a=parseFloat(amount); if(!a||a<=0) return;
    deposit(tab,a,`Manual ${tab} Deposit`);
    setDone(true); setTimeout(()=>{onDone();onClose();setDone(false);setAmount("");},1600);
  };
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.8)"}}/>
      <motion.div initial={{scale:.92,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.92,opacity:0}}
        style={{position:"relative",width:"100%",maxWidth:440,background:"#0f1520",border:`1px solid ${BORD}`,borderRadius:20,padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <span style={{fontWeight:800,fontSize:16,color:FG}}>Deposit Funds</span>
          <button onClick={onClose} style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:8,padding:"4px 8px",color:DIM,cursor:"pointer",fontSize:12}}>✕</button>
        </div>
        {done?(
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <CheckCircle2 size={56} color={GREEN} style={{margin:"0 auto 12px"}}/>
            <div style={{fontSize:16,fontWeight:700,color:FG}}>Deposit Recorded!</div>
            <div style={{fontSize:12,color:DIM,marginTop:4}}>{fmtNum(parseFloat(amount)||0)} {tab} added to wallet</div>
          </div>
        ):(
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:16}}>
              {(["PKR","USDT","USDC","OKBOND"] as Currency[]).map(c=>(
                <button key={c} onClick={()=>setTab(c)} style={{padding:"8px 4px",borderRadius:8,border:`1px solid ${tab===c?GOLD:BORD}`,background:tab===c?"rgba(243,186,47,0.1)":"transparent",color:tab===c?GOLD:DIM,fontWeight:700,fontSize:11,cursor:"pointer"}}>
                  {c}
                </button>
              ))}
            </div>
            {tab==="PKR"&&(
              <div style={{background:"rgba(0,195,255,0.06)",border:"1px solid rgba(0,195,255,0.2)",borderRadius:10,padding:12,marginBottom:12,fontSize:11,color:DIM,lineHeight:1.7}}>
                <div style={{color:FG,fontWeight:700,marginBottom:6}}>🏦 Meezan Bank Transfer</div>
                <div>Account: <span style={{color:FG}}>Orakzai Properties (Pvt) Ltd</span></div>
                <div>IBAN: <span style={{color:FG,fontFamily:"monospace"}}>PK36MEZN0000000343101234567</span></div>
                <div style={{marginTop:8,color:FG,fontWeight:700}}>📱 EasyPaisa: <span style={{fontFamily:"monospace"}}>0300-1234567</span></div>
              </div>
            )}
            {(tab==="USDT"||tab==="USDC")&&(
              <div style={{background:"rgba(14,203,129,0.06)",border:"1px solid rgba(14,203,129,0.2)",borderRadius:10,padding:12,marginBottom:12,fontSize:11,color:DIM,lineHeight:1.7}}>
                <div style={{color:FG,fontWeight:700,marginBottom:6}}>{tab} — {tab==="USDT"?"Polygon (MATIC)":"ERC-20"}</div>
                <div style={{fontFamily:"monospace",wordBreak:"break-all",color:FG,fontSize:10}}>{CRYPTO_ADDR}</div>
              </div>
            )}
            {tab==="OKBOND"&&(
              <div style={{background:"rgba(243,186,47,0.06)",border:`1px solid rgba(243,186,47,0.2)`,borderRadius:10,padding:12,marginBottom:12,fontSize:11,color:DIM,lineHeight:1.7}}>
                <div style={{color:GOLD,fontWeight:700,marginBottom:6}}>⬡ OKBOND Bridge — OKB Chain</div>
                <div style={{fontFamily:"monospace",wordBreak:"break-all",color:FG,fontSize:10}}>0xOKB7c4F91d3B2e0A8c5D6E1F4a3B2C9d7E0F1A2</div>
              </div>
            )}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:DIM,marginBottom:5}}>Amount in {tab}</div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Enter ${tab} amount`}
                style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${BORD}`,borderRadius:10,padding:"10px 14px",color:FG,fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <button onClick={doDeposit} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${GOLD},${GOLD2})`,color:"#070B14",fontWeight:800,fontSize:14,cursor:"pointer"}}>
              Confirm Deposit
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ─── Create Wallet Screen ───────────────────────────────────────────────────── */
function CreateWalletScreen({onCreate}:{onCreate:()=>void}) {
  const [loading,setLoading]=useState(false);
  const logoUrl=`${bp()}/logo-official.png`;
  return (
    <div style={{minHeight:"100dvh",background:BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px 100px",textAlign:"center"}}>
      <motion.div initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",damping:20}}>
        <img src={logoUrl} alt="Orakzai Properties" style={{width:96,height:96,objectFit:"contain",margin:"0 auto 20px",display:"block",filter:"drop-shadow(0 0 24px rgba(243,186,47,0.4))"}}/>
        <div style={{fontSize:11,color:DIM,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>Orakzai Properties</div>
        <div style={{fontSize:24,fontWeight:800,color:FG,marginBottom:8}}>Private Wealth Dashboard</div>
        <div style={{fontSize:13,color:DIM,maxWidth:300,lineHeight:1.6,marginBottom:32}}>
          Create your secure multi-asset wallet to manage PKR, USDT, USDC, and OKBOND with zero-fee deposits.
        </div>
        <button
          onClick={()=>{setLoading(true);setTimeout(()=>{createWallet();onCreate();},900);}}
          disabled={loading}
          style={{padding:"14px 40px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${GOLD},${GOLD2})`,color:"#070B14",fontWeight:800,fontSize:15,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
          {loading?<><RefreshCw size={16} style={{animation:"spin 1s linear infinite"}}/> Generating…</>:<><Plus size={16}/> Create Secure Wallet</>}
        </button>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────────── */
function Dashboard({wallet,onReload}:{wallet:WalletState;onReload:()=>void}) {
  const [showDeposit,setSD]=useState(false);
  const [activeNav,setAN]=useState("Assets");
  const txns=getTxns();

  const basePath=bp();
  const logoUrl=`${basePath}/logo-official.png`;

  // Calculate total net worth
  const cryptoPKR = (wallet.balances.USDT + wallet.balances.USDC) * PKR_RATE + wallet.balances.OKBOND * OKB_RATE;
  const fiatPKR   = wallet.balances.PKR;
  const propPKR   = 15_250_000;
  const totalNW   = fiatPKR + cryptoPKR + propPKR;
  const monthlyInc= 345_750;

  const NAV_ITEMS = [
    {label:"Assets",    icon:Wallet2},
    {label:"Overview",  icon:Activity},
    {label:"Properties",icon:Layers},
    {label:"Trade",     icon:BarChart3},
    {label:"Investments",icon:TrendingUp},
    {label:"Transactions",icon:Clock},
    {label:"Analytics", icon:BarChart3},
    {label:"AI Copilot",icon:Sparkles},
    {label:"Security",  icon:Shield},
  ];

  const ASSETS = [
    {name:"USDT",sub:"Tether",icon:"₮",color:"#26A17B",bg:"rgba(38,161,123,0.15)", bal:wallet.balances.USDT,        unit:"USDT",  chg:0.35,  pkr:wallet.balances.USDT*PKR_RATE, spark:[1.00,1.002,1.001,1.003,1.002,1.0035]},
    {name:"USDC",sub:"USD Coin",icon:"$",color:"#2775CA",bg:"rgba(39,117,202,0.15)",bal:wallet.balances.USDC,        unit:"USDC",  chg:0.12,  pkr:wallet.balances.USDC*PKR_RATE, spark:[1.00,1.001,1.002,1.001,1.002,1.0012]},
    {name:"OKBOND",sub:"Orakzai Bond",icon:"⬡",color:GOLD,bg:"rgba(243,186,47,0.15)",bal:wallet.balances.OKBOND,    unit:"OKBOND",chg:2.85,  pkr:wallet.balances.OKBOND*OKB_RATE,spark:[0.85,0.87,0.88,0.89,0.875,0.88]},
    {name:"PKR",sub:"Pakistani Rupee",icon:"₨",color:"#00C3FF",bg:"rgba(0,195,255,0.15)",bal:wallet.balances.PKR,   unit:"PKR",   chg:0,     pkr:wallet.balances.PKR, spark:[1,1,1,1,1,1]},
    {name:"INR",sub:"Indian Rupee",icon:"₹",color:"#FF9F1C",bg:"rgba(255,159,28,0.15)",  bal:150_000,               unit:"INR",   chg:0.08,  pkr:540_000, spark:[3.3,3.31,3.30,3.32,3.31,3.32]},
  ];

  const RECENT = txns.slice(0,4).length>0 ? txns.slice(0,4).map((t,i)=>({
    label: t.type==="deposit"?`${t.currency} Deposit`:`${t.side} ${t.ticker}/${t.quote}`,
    sub:   t.type==="deposit"?t.note:`${t.amount} tokens @ ${t.price?.toFixed(4)}`,
    date:  new Date(t.time||t.time).toLocaleDateString("en-US",{day:"2-digit",month:"short",year:"numeric"}),
    amount:t.type==="deposit"?`+${fmtNum(t.amount,2)} ${t.currency}`:`${t.side==="BUY"?"-":"+"} ${t.type==="trade"?fmtNum(t.netTotal??0,4)+" "+t.quote:""}`,
    isPos: t.type==="deposit"||t.side==="SELL",
  })) : [
    {label:"USDT Deposit",sub:"Tron Network",date:"26 May 2025",amount:"+2,500 USDT",isPos:true},
    {label:"Property Investment",sub:"Orakzai Ocean Tower",date:"26 May 2025",amount:"-PKR 2,500,000",isPos:false},
    {label:"Rental Income",sub:"Orakzai Heights",date:"26 May 2025",amount:"+PKR 85,750",isPos:true},
    {label:"OKBOND Purchase",sub:"OKBOND Token",date:"26 May 2025",amount:"-PKR 450,000",isPos:false},
  ];

  /* custom donut tooltip */
  const DonutTooltip=({active,payload}:any)=>{
    if(!active||!payload?.length) return null;
    const d=payload[0].payload;
    return (
      <div style={{background:"#0f1520",border:`1px solid ${BORD}`,borderRadius:8,padding:"8px 12px",fontSize:11}}>
        <div style={{color:d.color,fontWeight:700}}>{d.name}</div>
        <div style={{color:FG}}>{d.amount}</div>
        <div style={{color:DIM}}>{d.value}%</div>
      </div>
    );
  };

  return (
    <div style={{minHeight:"100dvh",background:BG,color:FG,display:"flex"}}>

      {/* ── Left Sidebar (desktop only) ───────────────────────────────────────── */}
      <aside style={{width:200,flexShrink:0,background:"rgba(7,11,20,0.98)",borderRight:`1px solid ${BORD}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:50,padding:"0 0 20px"}} className="hidden lg:flex">
        {/* Logo */}
        <div style={{padding:"20px 16px 16px",borderBottom:`1px solid ${BORD}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <img src={logoUrl} alt="Orakzai Properties" style={{width:44,height:44,objectFit:"contain",filter:"drop-shadow(0 0 8px rgba(243,186,47,0.3))"}}/>
            <div>
              <div style={{fontWeight:800,fontSize:13,color:GOLD,lineHeight:1.1}}>ORAKZAI</div>
              <div style={{fontSize:8,color:DIM,letterSpacing:"0.12em",textTransform:"uppercase"}}>PROPERTIES</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <div style={{flex:1,overflowY:"auto",padding:"12px 8px"}}>
          {NAV_ITEMS.map(({label,icon:Icon})=>{
            const active=activeNav===label;
            return (
              <button key={label} onClick={()=>setAN(label)} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",cursor:"pointer",textAlign:"left",marginBottom:2,background:active?"rgba(243,186,47,0.1)":"transparent",transition:"all .15s",position:"relative"}}>
                {active&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,borderRadius:4,background:GOLD}}/>}
                <Icon size={15} color={active?GOLD:DIM}/>
                <span style={{fontSize:12,fontWeight:active?700:500,color:active?FG:DIM}}>{label}</span>
              </button>
            );
          })}
        </div>
        {/* Bottom promo */}
        <div style={{margin:"0 10px",padding:"14px",background:"rgba(243,186,47,0.06)",border:`1px solid rgba(243,186,47,0.15)`,borderRadius:12}}>
          <div style={{fontSize:11,fontWeight:700,color:GOLD,marginBottom:4}}>Orakzai Private Wealth Ecosystem</div>
          <div style={{fontSize:9,color:DIM,lineHeight:1.5,marginBottom:10}}>Built on Real Assets. Backed by Trust.</div>
          <button style={{width:"100%",padding:"6px",borderRadius:7,border:`1px solid rgba(243,186,47,0.3)`,background:"transparent",color:GOLD,fontSize:10,fontWeight:700,cursor:"pointer"}}>Learn More</button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────────── */}
      <main style={{flex:1,marginLeft:0,paddingBottom:80,minHeight:"100dvh"}} className="lg:ml-[200px]">

        {/* ── Top Header ────────────────────────────────────────────────────── */}
        <div style={{background:"rgba(7,11,20,0.92)",backdropFilter:"blur(16px)",borderBottom:`1px solid ${BORD}`,padding:"12px 16px",position:"sticky",top:0,zIndex:40,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {/* Mobile logo */}
          <div style={{display:"flex",alignItems:"center",gap:8}} className="lg:hidden">
            <img src={logoUrl} alt="Orakzai" style={{width:32,height:32,objectFit:"contain"}}/>
            <div>
              <div style={{fontWeight:800,fontSize:11,color:GOLD}}>ORAKZAI</div>
              <div style={{fontSize:7,color:DIM,letterSpacing:"0.1em",textTransform:"uppercase"}}>PROPERTIES</div>
            </div>
          </div>
          {/* Desktop welcome */}
          <div className="hidden lg:block">
            <div style={{fontSize:11,color:DIM}}>Welcome back,</div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:15,fontWeight:700,color:FG}}>
              Syed Ali Raza <BadgeCheck size={14} color={GOLD} fill={GOLD}/>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:"50%",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <Search size={15} color={DIM}/>
            </button>
            <button style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:"50%",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
              <Bell size={15} color={DIM}/>
              <div style={{position:"absolute",top:6,right:8,width:6,height:6,borderRadius:"50%",background:RED}}/>
            </button>
            <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${GOLD},${GOLD2})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#070B14"}}>SA</div>
          </div>
        </div>

        <div style={{padding:"16px 14px"}}>

          {/* ── Hero + Donut row ─────────────────────────────────────────────── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:12}} className="md:grid-cols-[1fr_240px]">

            {/* Portfolio hero card */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.5}}>
              <Card style={{padding:"20px 20px 0",background:"linear-gradient(135deg,rgba(243,186,47,0.05),rgba(255,255,255,0.03))"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{fontSize:11,color:DIM,display:"flex",alignItems:"center",gap:4}}>
                    Total Net Worth <span style={{opacity:.5}}>👁</span>
                  </div>
                  <button style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:GOLD,background:"none",border:"none",cursor:"pointer"}}>
                    Portfolio Performance <ChevronRight size={11}/>
                  </button>
                </div>
                <div style={{fontSize:28,fontWeight:800,color:FG,marginBottom:6,letterSpacing:"-0.02em",fontVariantNumeric:"tabular-nums"}}>
                  PKR <Counter target={totalNW} prefix="" suffix="" decimals={2}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:3,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:20,padding:"2px 8px"}}>
                    <TrendingUp size={10} color={GREEN}/>
                    <span style={{fontSize:11,fontWeight:700,color:GREEN}}>+12.45%</span>
                  </div>
                  <span style={{fontSize:10,color:DIM}}>(All time)</span>
                </div>
                {/* Performance chart */}
                <div style={{height:90,marginLeft:-20,marginRight:-20}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PERF_DATA}>
                      <defs>
                        <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GOLD} stopOpacity={0.25}/>
                          <stop offset="100%" stopColor={GOLD} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={GOLD} strokeWidth={2} fill="url(#perfGrad)" dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Mini stats */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:`1px solid ${BORD}`}}>
                  {[
                    {label:"Fiat Balance",val:`PKR ${fmtNum(fiatPKR/1000,0)}K`,sub:"Available",icon:"💳"},
                    {label:"Crypto Balance",val:`PKR ${fmtNum(cryptoPKR/1000,0)}K`,sub:"Across 6 Assets",icon:"🔮"},
                    {label:"Property Assets",val:`PKR ${fmtNum(propPKR/1000000,2)}M`,sub:"Across 4 Projects",icon:"🏢"},
                    {label:"Monthly Income",val:fmtPKR(monthlyInc),sub:"Rental Yield",icon:"💰"},
                  ].map(({label,val,sub,icon})=>(
                    <div key={label} style={{padding:"12px 10px",borderRight:`1px solid ${BORD}`,lastChild:{border:"none"}}}>
                      <div style={{fontSize:16,marginBottom:4}}>{icon}</div>
                      <div style={{fontSize:9,color:DIM,marginBottom:3}}>{label}</div>
                      <div style={{fontSize:11,fontWeight:700,color:FG}}>{val}</div>
                      <div style={{fontSize:8,color:DIM}}>{sub}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Total Assets donut */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.5,delay:.1}}>
              <Card style={{padding:18,display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{fontSize:11,color:DIM,marginBottom:12,textAlign:"center"}}>Total Assets</div>
                <div style={{position:"relative",width:160,height:160}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ALLOCATION} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                        {ALLOCATION.map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}
                      </Pie>
                      <Tooltip content={<DonutTooltip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:800,color:FG}}>{fmtNum(totalNW/1000000,2)}M</div>
                    <div style={{fontSize:8,color:DIM}}>PKR</div>
                  </div>
                </div>
                <div style={{width:"100%",marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
                  {ALLOCATION.map(e=>(
                    <div key={e.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:e.color,flexShrink:0}}/>
                        <span style={{fontSize:11,color:DIM}}>{e.name}</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:FG}}>{e.value}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Quick Actions ────────────────────────────────────────────────── */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.2}}>
            <Card style={{padding:"16px",marginBottom:12}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>
                {QUICK_ACTIONS.map(({label,icon:Icon,color,glow})=>(
                  <button key={label} onClick={label==="Deposit"?()=>setSD(true):undefined}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 4px",borderRadius:12,border:`1px solid rgba(255,255,255,0.06)`,background:"rgba(255,255,255,0.03)",cursor:"pointer",transition:"all .2s"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.boxShadow=`0 0 16px ${glow}`;(e.currentTarget as HTMLElement).style.borderColor=color+"40";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.boxShadow="none";(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.06)";}}>
                    <div style={{width:38,height:38,borderRadius:"50%",background:`rgba(${color==="rgba(255,255,255,0.04)"?"255,255,255":color.replace("#","").match(/.{2}/g)?.map(h=>parseInt(h,16)).join(",")??""}, 0.12)`,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${color}30`}}>
                      <Icon size={15} color={color}/>
                    </div>
                    <span style={{fontSize:9,fontWeight:600,color:DIM,textAlign:"center",lineHeight:1.2}}>{label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* ── Assets Table + Portfolio Allocation ──────────────────────────── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:12}} className="md:grid-cols-[1fr_260px]">

            {/* My Assets */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.25}}>
              <Card style={{padding:16}}>
                <SectionHeader title="My Assets" icon={Wallet2} action="View All" href={`${basePath}/wallet`}/>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:`1px solid ${BORD}`}}>
                        {["Asset","Balance","24h Change","Value (PKR)",""].map(h=>(
                          <th key={h} style={{padding:"4px 8px",textAlign:"left",color:DIM,fontWeight:500,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ASSETS.map((a,i)=>(
                        <tr key={a.name} style={{borderBottom:`1px solid rgba(255,255,255,0.04)`}}>
                          <td style={{padding:"10px 8px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:32,height:32,borderRadius:"50%",background:a.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:a.color,fontWeight:700,flexShrink:0}}>{a.icon}</div>
                              <div>
                                <div style={{fontWeight:700,color:FG}}>{a.name}</div>
                                <div style={{fontSize:9,color:DIM}}>{a.sub}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{padding:"10px 8px"}}>
                            <div style={{color:FG,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmtNum(a.bal,2)}</div>
                            <div style={{fontSize:9,color:DIM}}>{fmtNum(a.bal,2)} {a.unit}</div>
                          </td>
                          <td style={{padding:"10px 8px"}}>
                            {a.chg!==0?(
                              <span style={{color:a.chg>0?GREEN:RED,fontWeight:700}}>{a.chg>0?"+":""}{a.chg.toFixed(2)}%</span>
                            ):<span style={{color:DIM}}>--</span>}
                          </td>
                          <td style={{padding:"10px 8px"}}>
                            <span style={{color:FG,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{fmtNum(a.pkr/1000,1)}K</span>
                          </td>
                          <td style={{padding:"10px 8px"}}>
                            <Sparkline data={a.spark} color={a.chg>=0?GREEN:RED} width={55} height={22}/>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{borderTop:`1px solid ${BORD}`}}>
                        <td colSpan={3} style={{padding:"10px 8px",fontSize:11,fontWeight:700,color:DIM}}>Total Assets</td>
                        <td colSpan={2} style={{padding:"10px 8px",fontSize:12,fontWeight:800,color:GOLD}}>{fmtPKR(ASSETS.reduce((s,a)=>s+a.pkr,0))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* Portfolio Allocation */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.3}}>
              <Card style={{padding:16}}>
                <SectionHeader title="Portfolio Allocation" icon={Activity} action="View Report" href={`${basePath}/portfolio`}/>
                <div style={{position:"relative",width:"100%",height:150,marginBottom:14}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ALLOCATION} cx="50%" cy="50%" innerRadius={44} outerRadius={62} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                        {ALLOCATION.map((e,i)=><Cell key={i} fill={e.color} stroke="none"/>)}
                      </Pie>
                      <Tooltip content={<DonutTooltip/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontSize:13,fontWeight:800,color:FG}}>{fmtNum(totalNW/1000000,2)}M</div>
                    <div style={{fontSize:8,color:DIM}}>PKR</div>
                  </div>
                </div>
                {ALLOCATION.map(e=>(
                  <div key={e.name} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:e.color}}/>
                        <span style={{fontSize:11,color:DIM}}>{e.name} Assets</span>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:FG}}>{e.value}%</span>
                    </div>
                    <div style={{fontSize:10,color:DIM,paddingLeft:12}}>{e.amount}</div>
                  </div>
                ))}
                <div style={{marginTop:12,borderTop:`1px solid ${BORD}`,paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:9,color:DIM}}>Your Risk Profile</div>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                      <span style={{fontSize:10,fontWeight:700,color:GREEN,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:20,padding:"2px 8px"}}>Balanced</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:9,color:DIM}}>Risk Score</div>
                    <div style={{fontSize:14,fontWeight:800,color:GOLD}}>6.2<span style={{fontSize:10,color:DIM}}>/10</span></div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Property Holdings ────────────────────────────────────────────── */}
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.35}} style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <Layers size={15} color={GOLD}/>
                <span style={{fontWeight:700,fontSize:14,color:FG}}>Property Holdings</span>
              </div>
              <button style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:GOLD,background:"none",border:"none",cursor:"pointer"}}>
                View All Properties<ChevronRight size={11}/>
              </button>
            </div>
            <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8,scrollbarWidth:"none"}}>
              {PROPERTIES.map((p,i)=>(
                <motion.div key={p.name} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} transition={{delay:.35+i*.08}}
                  style={{minWidth:200,background:CARD,border:`1px solid ${BORD}`,borderRadius:14,overflow:"hidden",flexShrink:0}}>
                  {/* Property image placeholder */}
                  <div style={{height:110,background:p.bg,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Layers size={32} color={"rgba(243,186,47,0.3)"}/>
                    <div style={{position:"absolute",top:8,right:8,display:"flex",alignItems:"center",gap:3,background:"rgba(34,197,94,0.2)",border:"1px solid rgba(34,197,94,0.4)",borderRadius:20,padding:"2px 8px",fontSize:9,color:GREEN,fontWeight:700}}>
                      <BadgeCheck size={9}/> Verified
                    </div>
                  </div>
                  <div style={{padding:"12px 12px"}}>
                    <div style={{fontWeight:700,fontSize:12,color:FG,marginBottom:2}}>{p.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:DIM,marginBottom:10}}>
                      <MapPin size={9}/>{p.loc}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:10}}>
                      {[["Ownership",`${p.own}%`],["Market Value",p.value],["ROI (APY)",`${p.roi}%`]].map(([l,v])=>(
                        <div key={l}>
                          <div style={{fontSize:8,color:DIM,marginBottom:1}}>{l}</div>
                          <div style={{fontSize:9,fontWeight:700,color:l==="ROI (APY)"?GREEN:FG}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <button style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:8,border:`1px solid ${BORD}`,background:"rgba(255,255,255,0.04)",color:DIM,fontSize:10,cursor:"pointer"}}>
                      View Details <ChevronRight size={10}/>
                    </button>
                  </div>
                </motion.div>
              ))}
              {/* Invest More card */}
              <div style={{minWidth:160,background:"rgba(243,186,47,0.04)",border:`1px dashed rgba(243,186,47,0.3)`,borderRadius:14,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16,gap:8,cursor:"pointer"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(243,186,47,0.1)",border:`1px solid rgba(243,186,47,0.3)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Plus size={18} color={GOLD}/>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:FG,textAlign:"center"}}>Invest in More</div>
                <div style={{fontSize:9,color:DIM,textAlign:"center"}}>Explore new opportunities</div>
                <button style={{padding:"6px 16px",borderRadius:20,border:`1px solid ${GOLD}`,background:"rgba(243,186,47,0.1)",color:GOLD,fontSize:10,fontWeight:700,cursor:"pointer"}}>Invest Now</button>
              </div>
            </div>
            {/* Pagination dots */}
            <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:10}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:i===0?20:6,height:6,borderRadius:3,background:i===0?GOLD:"rgba(255,255,255,0.15)",transition:"all .3s"}}/>
              ))}
            </div>
          </motion.div>

          {/* ── AI Copilot + Monthly Income + Upcoming Payouts ───────────────── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:12}} className="md:grid-cols-3">

            {/* AI Wealth Copilot */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.4}}>
              <Card style={{padding:16,minHeight:200}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Sparkles size={14} color={GOLD}/>
                    <span style={{fontWeight:700,fontSize:13,color:FG}}>AI Wealth Copilot</span>
                  </div>
                  <ChevronRight size={14} color={DIM}/>
                </div>
                <div style={{fontSize:10,color:DIM,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Market Opportunity</div>
                <div style={{fontSize:12,color:FG,lineHeight:1.6,marginBottom:16}}>
                  AI suggests increasing Dubai property exposure by 12% for better yield opportunities this quarter.
                </div>
                {/* Animated glow orb */}
                <div style={{display:"flex",justifyContent:"center",marginBottom:14}}>
                  <motion.div animate={{scale:[1,1.08,1],opacity:[0.7,1,0.7]}} transition={{duration:2.5,repeat:Infinity}}
                    style={{width:52,height:52,borderRadius:"50%",background:`radial-gradient(circle,${GOLD}50,${GOLD2}30,transparent)`,border:`1px solid ${GOLD}50`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Sparkles size={20} color={GOLD}/>
                  </motion.div>
                </div>
                <button style={{width:"100%",padding:"8px",borderRadius:8,border:`1px solid rgba(243,186,47,0.3)`,background:"rgba(243,186,47,0.08)",color:GOLD,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  View AI Insights
                </button>
              </Card>
            </motion.div>

            {/* Monthly Income Chart */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.45}}>
              <Card style={{padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{fontSize:11,color:DIM}}>Monthly Rental Income</div>
                  <button style={{fontSize:10,color:GOLD,background:"none",border:"none",cursor:"pointer"}}>View Details</button>
                </div>
                <div style={{fontSize:20,fontWeight:800,color:FG,marginBottom:2,fontVariantNumeric:"tabular-nums"}}>PKR 345,750.00</div>
                <div style={{fontSize:10,color:GREEN,marginBottom:12,display:"flex",alignItems:"center",gap:3}}>
                  <TrendingUp size={10}/> +8.65% from last month
                </div>
                <div style={{height:90}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={INCOME_DATA} barSize={22}>
                      <XAxis dataKey="m" tick={{fontSize:8,fill:DIM}} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v:any)=>["PKR "+fmtNum(v,0),"Income"]} contentStyle={{background:"#0f1520",border:`1px solid ${BORD}`,borderRadius:8,fontSize:11}}/>
                      <Bar dataKey="v" radius={[4,4,0,0]}>
                        {INCOME_DATA.map((_,i)=>(
                          <Cell key={i} fill={i===INCOME_DATA.length-1?GOLD:"rgba(243,186,47,0.3)"}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </motion.div>

            {/* Upcoming Payouts */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.5}}>
              <Card style={{padding:16}}>
                <SectionHeader title="Upcoming Payouts" icon={Clock} action="View All" href={`${basePath}/portfolio`}/>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {PAYOUTS.map((p,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:10,background:"rgba(243,186,47,0.08)",border:`1px solid rgba(243,186,47,0.2)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <Layers size={14} color={GOLD}/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:600,color:FG,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                        <div style={{fontSize:9,color:DIM}}>{p.date}</div>
                      </div>
                      <div style={{fontSize:11,fontWeight:700,color:GREEN,flexShrink:0}}>{p.amount}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Recent Transactions + Market Pulse ───────────────────────────── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:12,marginBottom:12}} className="md:grid-cols-[1fr_1fr]">

            {/* Recent Transactions */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.55}}>
              <Card style={{padding:16}}>
                <SectionHeader title="Recent Transactions" icon={Clock} action="View All" href={`${basePath}/wallet`}/>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {RECENT.map((t,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<RECENT.length-1?`1px solid rgba(255,255,255,0.04)`:"none"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:t.isPos?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${t.isPos?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {t.isPos?<ArrowDownToLine size={14} color={GREEN}/>:<ArrowUpFromLine size={14} color={RED}/>}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:600,color:FG,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</div>
                        <div style={{fontSize:9,color:DIM}}>{t.sub}</div>
                        <div style={{fontSize:8,color:"rgba(139,147,167,0.6)"}}>{t.date}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:11,fontWeight:700,color:t.isPos?GREEN:RED}}>{t.amount}</div>
                        <div style={{fontSize:8,color:GREEN,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,padding:"1px 6px",marginTop:2}}>Completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Market Pulse */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.6}}>
              <Card style={{padding:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Activity size={14} color={GOLD}/>
                    <span style={{fontWeight:700,fontSize:14,color:FG}}>Market Pulse</span>
                  </div>
                  <button style={{fontSize:10,color:GOLD,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:2}}>View Market Analytics<ChevronRight size={10}/></button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {MARKETS.map(m=>(
                    <div key={m.city} style={{background:"rgba(255,255,255,0.03)",border:`1px solid ${BORD}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:FG,marginBottom:2}}>{m.city}</div>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}>
                          <TrendingUp size={9} color={GREEN}/>
                          <span style={{fontSize:10,fontWeight:700,color:GREEN}}>▲ {m.pct.toFixed(2)}%</span>
                        </div>
                        <div style={{fontSize:9,color:DIM}}>Avg ROI (APY)</div>
                        <div style={{fontSize:12,fontWeight:800,color:FG}}>{m.roi.toFixed(2)}%</div>
                      </div>
                      <div>
                        <Sparkline data={m.spark} color={GREEN} width={70} height={30}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:12,fontSize:10,color:DIM,textAlign:"center"}}>
                  Stay ahead with real-time market updates and trends
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Deposit quick button ────────────────────────────────────────── */}
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.65}}>
            <button onClick={()=>setSD(true)} style={{width:"100%",padding:"14px",borderRadius:14,border:`1px solid rgba(243,186,47,0.3)`,background:"linear-gradient(135deg,rgba(243,186,47,0.08),rgba(200,144,0,0.04))",color:GOLD,fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <ArrowDownToLine size={16}/> Deposit Funds — Add PKR, USDT, USDC or OKBOND
            </button>
          </motion.div>

        </div>
      </main>

      {/* ── Deposit Modal ── */}
      <AnimatePresence>
        {showDeposit&&<DepositModal open={showDeposit} onClose={()=>setSD(false)} onDone={onReload}/>}
      </AnimatePresence>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────────── */
export default function Wallet() {
  const [wallet,setWallet]=useState<WalletState|null>(null);
  const [loading,setLoading]=useState(true);

  const reload=()=>{ setWallet(getWallet()); setLoading(false); };
  useEffect(()=>{ reload(); },[]);

  if(loading) return (
    <div style={{minHeight:"100dvh",background:BG,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}>
        <RefreshCw size={28} color={GOLD}/>
      </motion.div>
    </div>
  );

  if(!wallet) return <CreateWalletScreen onCreate={reload}/>;
  return <Dashboard wallet={wallet} onReload={reload}/>;
}

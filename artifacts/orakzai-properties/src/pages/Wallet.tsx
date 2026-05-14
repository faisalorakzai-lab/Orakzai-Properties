import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet2, Plus, ArrowDownToLine, ArrowUpFromLine, Copy, Check,
  Shield, Zap, Building2, X, ExternalLink, RefreshCw,
  TrendingUp, Clock, CheckCircle2,
} from "lucide-react";
import {
  getWallet, createWallet, deposit, getTxns,
  type WalletState, type WalletTx, type Currency,
} from "@/lib/walletEngine";

/* ── Theme ── */
const BG    = "#0B0E11";
const CARD  = "#12161C";
const BORD  = "#1E2329";
const GOLD  = "#F3BA2F";
const GREEN = "#0ECB81";
const RED   = "#F6465D";
const DIM   = "#848E9C";
const FG    = "#EAECEF";

const DEPOSIT_ADDRESS = "0x3aB5C9a14e3d2F1c7a0E8fB2D4A69c05e72f1A3";
const OKBOND_ADDRESS  = "0xOKB7c4F91d3B2e0A8c5D6E1F4a3B2C9d7E0F1A2";

const CUR_CFG: Record<Currency, { icon: string; color: string; bg: string; name: string; network?: string }> = {
  PKR:    { icon: "₨", color: "#00C3FF", bg: "rgba(0,195,255,0.1)",  name: "Pakistani Rupee" },
  USDT:   { icon: "₮", color: GREEN,     bg: "rgba(14,203,129,0.1)", name: "Tether USD",     network: "Polygon (MATIC)" },
  USDC:   { icon: "$", color: "#2775CA", bg: "rgba(39,117,202,0.1)", name: "USD Coin",       network: "ERC-20" },
  OKBOND: { icon: "⬡", color: GOLD,      bg: "rgba(243,186,47,0.1)", name: "Orakzai Bond",  network: "OKB Chain" },
};

const fmt  = (n: number, d = 4) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtC = (n: number, c: Currency) => c === "PKR" ? n.toLocaleString("en-PK", { maximumFractionDigits: 0 }) : fmt(n);
const shortAddr = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

/* ── CopyBtn ── */
function CopyBtn({ value, size = 13 }: { value: string; size?: number }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(value).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
      style={{ background:"none",border:"none",cursor:"pointer",padding:2,display:"flex" }}>
      {copied ? <Check size={size} color={GREEN}/> : <Copy size={size} color={DIM}/>}
    </button>
  );
}

/* ── Modal ── */
function Modal({ open, onClose, title, children }: { open:boolean; onClose:()=>void; title:string; children:React.ReactNode }) {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)"}}/>
      <motion.div initial={{y:60,opacity:0}} animate={{y:0,opacity:1}} exit={{y:60,opacity:0}}
        style={{position:"relative",width:"100%",maxWidth:480,background:CARD,borderRadius:"20px 20px 0 0",border:`1px solid ${BORD}`,borderBottom:"none",maxHeight:"90dvh",overflowY:"auto",paddingBottom:"env(safe-area-inset-bottom,16px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 18px",borderBottom:`1px solid ${BORD}`,position:"sticky",top:0,background:CARD,zIndex:1}}>
          <span style={{fontWeight:700,fontSize:14,color:FG}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:2}}><X size={16} color={DIM}/></button>
        </div>
        <div style={{padding:"16px 18px"}}>{children}</div>
      </motion.div>
    </div>
  );
}

/* ── Deposit Modal ── */
function DepositModal({ open, onClose, onDone }: { open:boolean; onClose:()=>void; onDone:()=>void }) {
  const [tab,setTab]     = useState<Currency>("USDT");
  const [amount,setAmount] = useState("");
  const [step,setStep]   = useState<"select"|"confirm"|"done">("select");
  const [copied,setCopied] = useState("");

  const copyText = (v:string, k:string) => {
    navigator.clipboard.writeText(v).catch(()=>{});
    setCopied(k); setTimeout(()=>setCopied(""),2000);
  };
  const doDeposit = () => {
    const amt = parseFloat(amount);
    if(!amt || amt<=0) return;
    deposit(tab, amt, `Manual ${tab} Deposit`);
    setStep("done");
    setTimeout(()=>{ onDone(); onClose(); setStep("select"); setAmount(""); }, 1800);
  };
  const reset = () => { setStep("select"); setAmount(""); };

  const tabBtns = (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:16}}>
      {(["PKR","USDT","USDC","OKBOND"] as Currency[]).map(c=>{
        const cfg=CUR_CFG[c];
        return (
          <button key={c} onClick={()=>setTab(c)} style={{padding:"8px 4px",borderRadius:8,border:`1px solid ${tab===c?cfg.color:BORD}`,background:tab===c?cfg.bg:"transparent",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
            <div style={{fontSize:16,marginBottom:2}}>{cfg.icon}</div>
            <div style={{fontSize:9,fontWeight:700,color:tab===c?cfg.color:DIM}}>{c}</div>
          </button>
        );
      })}
    </div>
  );

  return (
    <Modal open={open} onClose={()=>{onClose();reset();}} title="Deposit Funds">
      {step==="select" && (
        <div>
          {tabBtns}

          {/* PKR */}
          {tab==="PKR" && (
            <>
              <div style={{background:BG,borderRadius:10,border:`1px solid ${BORD}`,overflow:"hidden",marginBottom:12}}>
                <div style={{padding:"8px 12px",background:"rgba(0,195,255,0.06)",borderBottom:`1px solid ${BORD}`,fontSize:10,color:"#00C3FF",fontWeight:700}}>🏦 Meezan Bank Transfer</div>
                {[["Account Title","Orakzai Properties (Pvt) Ltd"],["Account No.","0343-0101234567-03"],["IBAN","PK36MEZN0000000343101234567"]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderBottom:`1px solid ${BORD}`}}>
                    <span style={{fontSize:10,color:DIM}}>{l}</span>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:10,color:FG,fontFamily:"monospace"}}>{v}</span>
                      <button onClick={()=>copyText(v,l)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                        {copied===l?<Check size={10} color={GREEN}/>:<Copy size={10} color={DIM}/>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{background:BG,borderRadius:10,border:`1px solid ${BORD}`,overflow:"hidden",marginBottom:12}}>
                <div style={{padding:"8px 12px",background:"rgba(0,195,255,0.06)",borderBottom:`1px solid ${BORD}`,fontSize:10,color:"#00C3FF",fontWeight:700}}>📱 EasyPaisa / JazzCash</div>
                {[["Mobile","0300-1234567"],["Account Title","Orakzai Properties"]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderBottom:`1px solid ${BORD}`}}>
                    <span style={{fontSize:10,color:DIM}}>{l}</span>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:10,color:FG,fontFamily:"monospace"}}>{v}</span>
                      <button onClick={()=>copyText(v,l+"2")} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                        {copied===l+"2"?<Check size={10} color={GREEN}/>:<Copy size={10} color={DIM}/>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:DIM,marginBottom:8}}>Enter amount you've sent for pending verification:</div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount in PKR"
                style={{width:"100%",background:BG,border:`1px solid ${BORD}`,borderRadius:8,padding:"10px 12px",color:FG,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
              <button onClick={()=>{if(parseFloat(amount)>0)setStep("confirm");}} style={{width:"100%",padding:"12px",borderRadius:8,background:"linear-gradient(135deg,#00C3FF,#0090c0)",border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>Submit Deposit Request</button>
            </>
          )}

          {/* USDT / USDC */}
          {(tab==="USDT"||tab==="USDC") && (
            <>
              <div style={{background:BG,borderRadius:10,border:`1px solid ${BORD}`,padding:14,marginBottom:12,textAlign:"center"}}>
                {/* Simulated QR */}
                <div style={{width:120,height:120,margin:"0 auto 10px",background:"#fff",borderRadius:8,display:"grid",gridTemplateColumns:"repeat(10,1fr)",padding:8,boxSizing:"border-box",gap:1}}>
                  {Array.from({length:100},(_,i)=>(<div key={i} style={{background:Math.sin(i*7.3+tab.length)>0.1?"#000":"#fff",borderRadius:1}}/>))}
                </div>
                <div style={{fontSize:10,color:DIM,marginBottom:6}}>Network: <span style={{color:CUR_CFG[tab].color}}>{CUR_CFG[tab].network}</span></div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"#0c1016",borderRadius:6,padding:"8px 10px"}}>
                  <span style={{fontSize:10,color:FG,fontFamily:"monospace",wordBreak:"break-all"}}>{DEPOSIT_ADDRESS}</span>
                  <CopyBtn value={DEPOSIT_ADDRESS} size={12}/>
                </div>
              </div>
              <div style={{background:"rgba(243,186,47,0.07)",border:`1px solid rgba(243,186,47,0.2)`,borderRadius:8,padding:"8px 12px",fontSize:10,color:GOLD,marginBottom:12}}>
                ⚠️ Only send {tab} on {CUR_CFG[tab].network}. Wrong network = permanent loss.
              </div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`Amount in ${tab}`}
                style={{width:"100%",background:BG,border:`1px solid ${BORD}`,borderRadius:8,padding:"10px 12px",color:FG,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
              <button onClick={()=>{if(parseFloat(amount)>0)setStep("confirm");}} style={{width:"100%",padding:"12px",borderRadius:8,background:`linear-gradient(135deg,${CUR_CFG[tab].color},${tab==="USDT"?"#00a060":"#1a5a9a"})`,border:"none",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                I've Sent {tab} — Confirm Deposit
              </button>
            </>
          )}

          {/* OKBOND */}
          {tab==="OKBOND" && (
            <>
              <div style={{background:"rgba(243,186,47,0.06)",border:`1px solid rgba(243,186,47,0.2)`,borderRadius:10,padding:14,marginBottom:12}}>
                <div style={{fontSize:11,color:GOLD,fontWeight:700,marginBottom:8}}>⬡ OKBOND Token Bridge</div>
                <div style={{fontSize:10,color:DIM,lineHeight:1.6,marginBottom:10}}>Transfer OKBOND tokens to your Orakzai wallet address. Bridge from external chains via the OKB Bridge protocol.</div>
                <div style={{fontSize:10,color:DIM,marginBottom:4}}>Your OKB Deposit Address:</div>
                <div style={{display:"flex",alignItems:"center",gap:6,background:BG,borderRadius:6,padding:"8px 10px",marginBottom:10}}>
                  <span style={{fontSize:10,color:FG,fontFamily:"monospace",wordBreak:"break-all"}}>{OKBOND_ADDRESS}</span>
                  <CopyBtn value={OKBOND_ADDRESS} size={12}/>
                </div>
                <a href="#" onClick={e=>e.preventDefault()} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,color:GOLD,textDecoration:"none",border:`1px solid rgba(243,186,47,0.3)`,borderRadius:5,padding:"4px 8px"}}>
                  <ExternalLink size={9}/> Open OKB Bridge
                </a>
              </div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Amount in OKBOND"
                style={{width:"100%",background:BG,border:`1px solid ${BORD}`,borderRadius:8,padding:"10px 12px",color:FG,fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
              <button onClick={()=>{if(parseFloat(amount)>0)setStep("confirm");}} style={{width:"100%",padding:"12px",borderRadius:8,background:"linear-gradient(135deg,#F3BA2F,#c89000)",border:"none",color:"#0B0E11",fontWeight:800,fontSize:13,cursor:"pointer"}}>
                Confirm OKBOND Receipt
              </button>
            </>
          )}
        </div>
      )}

      {step==="confirm" && (
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:13,color:DIM,marginBottom:6}}>Confirming deposit of</div>
          <div style={{fontSize:30,fontWeight:800,color:CUR_CFG[tab].color,marginBottom:4,fontVariantNumeric:"tabular-nums"}}>{fmt(parseFloat(amount)||0)} <span style={{fontSize:14}}>{tab}</span></div>
          <div style={{fontSize:10,color:DIM,marginBottom:20}}>Status: Manual verification pending</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>setStep("select")} style={{padding:"12px",borderRadius:8,border:`1px solid ${BORD}`,background:"transparent",color:DIM,cursor:"pointer",fontWeight:600}}>Back</button>
            <button onClick={doDeposit} style={{padding:"12px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#F3BA2F,#c89000)",color:"#0B0E11",fontWeight:800,cursor:"pointer"}}>Confirm</button>
          </div>
        </div>
      )}

      {step==="done" && (
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring"}}>
            <CheckCircle2 size={56} color={GREEN} style={{margin:"0 auto 12px"}}/>
          </motion.div>
          <div style={{fontSize:15,fontWeight:700,color:FG,marginBottom:4}}>Deposit Recorded!</div>
          <div style={{fontSize:11,color:DIM}}>{fmt(parseFloat(amount)||0)} {tab} added to your wallet</div>
        </div>
      )}
    </Modal>
  );
}

/* ── Create Wallet Screen ── */
function CreateWallet({ onCreate }: { onCreate:()=>void }) {
  const [creating,setCreating] = useState(false);
  const doCreate = () => {
    setCreating(true);
    setTimeout(()=>{ createWallet(); onCreate(); },900);
  };
  return (
    <div style={{minHeight:"100dvh",background:BG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px 80px",textAlign:"center"}}>
      <motion.div initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring"}}>
        <div style={{width:88,height:88,borderRadius:24,background:"rgba(243,186,47,0.1)",border:`2px solid rgba(243,186,47,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <Wallet2 size={38} color={GOLD}/>
        </div>
        <div style={{fontSize:22,fontWeight:800,color:FG,marginBottom:8}}>Create Your Secure Wallet</div>
        <div style={{fontSize:13,color:DIM,maxWidth:300,lineHeight:1.6,marginBottom:28}}>
          Generate a non-custodial wallet to hold PKR, USDT, USDC, and OKBOND. Trade all property tokens at competitive fees.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:28,textAlign:"left",maxWidth:340}}>
          {[{icon:Shield,label:"Encrypted",sub:"AES-256 secured"},{icon:Zap,label:"Instant",sub:"Zero setup time"},{icon:Building2,label:"Multi-Asset",sub:"PKR · USDT · USDC · OKBOND"},{icon:TrendingUp,label:"Trading Ready",sub:"0.3%–0.5% tiered fees"}].map(({icon:Icon,label,sub})=>(
            <div key={label} style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:10,padding:"10px 12px"}}>
              <Icon size={14} color={GOLD} style={{marginBottom:4}}/>
              <div style={{fontSize:11,fontWeight:700,color:FG}}>{label}</div>
              <div style={{fontSize:9,color:DIM}}>{sub}</div>
            </div>
          ))}
        </div>
        <button onClick={doCreate} disabled={creating} style={{width:"100%",maxWidth:320,padding:"15px",borderRadius:12,border:"none",background:creating?CARD:"linear-gradient(135deg,#F3BA2F,#c89000)",color:creating?DIM:"#0B0E11",fontWeight:800,fontSize:15,cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {creating?<><RefreshCw size={16} style={{animation:"spin 1s linear infinite"}}/> Generating…</>:<><Plus size={16}/> Create Secure Wallet</>}
        </button>
        <div style={{fontSize:10,color:DIM,marginTop:12}}>Your keys stay in your browser. We never store your private key.</div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── Balance Card ── */
function BalanceCard({currency,balance}:{currency:Currency;balance:number}) {
  const cfg=CUR_CFG[currency];
  return (
    <div style={{background:CARD,border:`1px solid ${BORD}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:cfg.bg,border:`1px solid ${cfg.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:cfg.color,fontWeight:700,flexShrink:0}}>
          {cfg.icon}
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:FG}}>{currency}</div>
          <div style={{fontSize:9,color:DIM}}>{cfg.name}</div>
          {cfg.network&&<div style={{fontSize:8,color:cfg.color}}>{cfg.network}</div>}
        </div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:15,fontWeight:700,color:cfg.color,fontVariantNumeric:"tabular-nums"}}>{fmtC(balance,currency)}</div>
        <div style={{fontSize:9,color:DIM}}>{currency}</div>
      </div>
    </div>
  );
}

/* ── Transaction Row ── */
function TxRow({tx}:{tx:WalletTx}) {
  const time=new Date(tx.time).toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"});
  if(tx.type==="deposit") return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${BORD}`}}>
      <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(14,203,129,0.1)",border:"1px solid rgba(14,203,129,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <ArrowDownToLine size={12} color={GREEN}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,fontWeight:600,color:FG}}>Deposit · {tx.currency}</div>
        <div style={{fontSize:9,color:DIM,marginTop:1}}>{tx.note} · {time}</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:11,fontWeight:700,color:GREEN}}>+{fmtC(tx.amount,tx.currency)} {tx.currency}</div>
      </div>
    </div>
  );
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:`1px solid ${BORD}`}}>
      <div style={{width:30,height:30,borderRadius:"50%",background:tx.side==="BUY"?"rgba(14,203,129,0.1)":"rgba(246,70,93,0.1)",border:`1px solid ${tx.side==="BUY"?"rgba(14,203,129,0.2)":"rgba(246,70,93,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {tx.side==="BUY"?<ArrowDownToLine size={12} color={GREEN}/>:<ArrowUpFromLine size={12} color={RED}/>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:11,fontWeight:600,color:FG}}>{tx.side} {tx.ticker}/{tx.quote}</div>
        <div style={{fontSize:9,color:DIM,marginTop:1}}>{tx.amount} tokens @ {tx.price.toFixed(4)} · Fee {(tx.feeRate*100).toFixed(2)}% · {time}</div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:11,fontWeight:700,color:tx.side==="BUY"?RED:GREEN}}>
          {tx.side==="BUY"?"-":"+"}{tx.netTotal.toFixed(4)} {tx.quote}
        </div>
        <div style={{fontSize:8,color:DIM}}>Fee: {tx.fee.toFixed(4)} {tx.quote}</div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
function WalletDashboard() {
  const [wallet,setWallet]   = useState<WalletState|null>(null);
  const [txns,setTxns]       = useState<WalletTx[]>([]);
  const [showDeposit,setSD]  = useState(false);
  const [txFilter,setTxF]    = useState<"all"|"trade"|"deposit">("all");
  const [copiedAddr,setCopA] = useState(false);

  const reload=()=>{ setWallet(getWallet()); setTxns(getTxns()); };
  useEffect(()=>{ reload(); },[]);

  if(!wallet) return <CreateWallet onCreate={reload}/>;

  const filtered = txFilter==="all"?txns:txns.filter(t=>t.type===txFilter);
  const totalUsdt = +(wallet.balances.USDT + wallet.balances.USDC + wallet.balances.OKBOND*0.88).toFixed(2);
  const copyAddr  = ()=>{ navigator.clipboard.writeText(wallet.address).catch(()=>{}); setCopA(true); setTimeout(()=>setCopA(false),2000); };

  return (
    <div style={{minHeight:"100dvh",background:BG,color:FG,paddingBottom:80}}>
      {/* Header */}
      <div style={{background:CARD,borderBottom:`1px solid ${BORD}`,padding:"14px 16px",paddingTop:"calc(env(safe-area-inset-top,8px) + 14px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <Wallet2 size={18} color={GOLD}/>
            <span style={{fontWeight:800,fontSize:15,color:FG}}>My Wallet</span>
          </div>
          <button onClick={reload} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><RefreshCw size={13} color={DIM}/></button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:BG,borderRadius:6,padding:"5px 10px"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:GREEN,flexShrink:0}}/>
          <span style={{fontSize:10,color:DIM,fontFamily:"monospace",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{shortAddr(wallet.address)}</span>
          <button onClick={copyAddr} style={{background:"none",border:"none",cursor:"pointer",padding:2,flexShrink:0}}>
            {copiedAddr?<Check size={11} color={GREEN}/>:<Copy size={11} color={DIM}/>}
          </button>
        </div>
      </div>

      {/* Total value + actions */}
      <div style={{margin:14,borderRadius:14,overflow:"hidden",background:`linear-gradient(135deg,#0c1a0a 0%,${CARD} 100%)`,border:`1px solid ${BORD}`}}>
        <div style={{padding:"18px 18px 14px"}}>
          <div style={{fontSize:10,color:DIM,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Total Portfolio Value (est.)</div>
          <div style={{fontSize:26,fontWeight:800,color:GOLD,fontVariantNumeric:"tabular-nums",marginBottom:2}}>≈ {totalUsdt.toLocaleString("en-US",{minimumFractionDigits:2})} <span style={{fontSize:13,fontWeight:400,color:DIM}}>USDT</span></div>
          <div style={{fontSize:10,color:DIM}}>PKR + USDT + USDC + OKBOND combined · Live prices</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,borderTop:`1px solid ${BORD}`}}>
          <button onClick={()=>setSD(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",background:"rgba(14,203,129,0.08)",border:"none",borderRight:`1px solid ${BORD}`,cursor:"pointer",fontWeight:700,fontSize:12,color:GREEN}}>
            <ArrowDownToLine size={14}/> Deposit
          </button>
          <button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",background:"rgba(246,70,93,0.08)",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,color:RED}}>
            <ArrowUpFromLine size={14}/> Withdraw
          </button>
        </div>
      </div>

      {/* Asset balances */}
      <div style={{padding:"0 14px 14px"}}>
        <div style={{fontSize:10,color:DIM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Assets</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(["PKR","USDT","USDC","OKBOND"] as Currency[]).map(c=>(
            <BalanceCard key={c} currency={c} balance={wallet.balances[c]}/>
          ))}
        </div>
      </div>

      {/* Trading fee info */}
      <div style={{margin:"0 14px 14px",background:"rgba(243,186,47,0.05)",border:`1px solid rgba(243,186,47,0.2)`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:11,color:GOLD,fontWeight:700,marginBottom:8}}>⚡ Tiered Trading Fee Engine</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          {[["USDT / USDC","0.50%",DIM],["OKBOND Pairs","0.30% ⬡",GOLD]].map(([l,v,c])=>(
            <div key={l} style={{background:BG,borderRadius:8,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:DIM}}>{l}</div>
              <div style={{fontSize:16,fontWeight:800,color:c as string}}>{v}</div>
              <div style={{fontSize:8,color:DIM}}>per trade</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:9,color:DIM}}>All fees tracked in Admin Revenue Wallet. Use OKBOND pairs to save 40% on every trade.</div>
      </div>

      {/* Pairs info */}
      <div style={{margin:"0 14px 14px",background:CARD,border:`1px solid ${BORD}`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:11,color:FG,fontWeight:700,marginBottom:8}}>📊 Available Trading Pairs</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
          {["ASC","DHA9","BTI","GBR","CSC","OBK"].flatMap(t=>["USDT","USDC","OKBOND"].map(q=>`${t}/${q}`)).map(p=>(
            <span key={p} style={{fontSize:9,fontWeight:600,padding:"2px 7px",borderRadius:4,background:"rgba(243,186,47,0.08)",border:`1px solid rgba(243,186,47,0.2)`,color:GOLD}}>{p}</span>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div style={{padding:"0 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:10,color:DIM,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Transaction History</div>
          <div style={{display:"flex",gap:4}}>
            {(["all","deposit","trade"] as const).map(f=>(
              <button key={f} onClick={()=>setTxF(f)} style={{padding:"2px 7px",fontSize:9,borderRadius:4,border:`1px solid ${txFilter===f?GOLD:BORD}`,background:txFilter===f?"rgba(243,186,47,0.1)":"transparent",color:txFilter===f?GOLD:DIM,cursor:"pointer",fontWeight:txFilter===f?700:400,textTransform:"capitalize"}}>{f}</button>
            ))}
          </div>
        </div>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"30px 0",color:DIM,fontSize:12}}>
            <Clock size={24} style={{margin:"0 auto 8px",display:"block",opacity:.4}}/>
            No transactions yet
          </div>
        ):filtered.map(t=><TxRow key={t.id} tx={t}/>)}
      </div>

      <AnimatePresence>
        {showDeposit&&<DepositModal open={showDeposit} onClose={()=>setSD(false)} onDone={reload}/>}
      </AnimatePresence>
    </div>
  );
}

export default function Wallet() {
  return <WalletDashboard/>;
}

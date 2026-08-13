import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FirebaseAuthProvider, useUser, useClerk } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import PropertyDetail from "@/pages/PropertyDetail";
import PostProperty from "@/pages/PostProperty";
import MyProperties from "@/pages/MyProperties";
import AzanSmartCity from "@/pages/AzanSmartCity";
import InvestPortal from "@/pages/InvestPortal";
import InvestDetail from "@/pages/InvestDetail";
import Portfolio from "@/pages/Portfolio";
import TradingFloor from "@/pages/TradingFloor";
import Wallet from "@/pages/Wallet";
import OkzBytePayReceive from "@/pages/OkzBytePayReceive";
import OkzBytePaySend from "@/pages/OkzBytePaySend";
import DepositDetail from "@/pages/DepositDetail";
import Notifications from "@/pages/Notifications";
import NotificationSettings from "@/pages/NotificationSettings";
import AgentDashboard from "@/pages/AgentDashboard";
import Pricing from "@/pages/Pricing";
import Subscribe from "@/pages/Subscribe";
import Profile from "@/pages/Profile";
import Trades from "@/pages/Trades";
import Markets from "@/pages/Markets";
import Trade from "@/pages/Trade";
import Projects from "@/pages/Projects";
import KYC from "@/pages/KYC";
import AdminConfig from "@/pages/AdminConfig";
import AdminKYC from "@/pages/AdminKYC";
import AdminPanel, { ADMIN_EMAIL } from "@/pages/AdminPanel";
import TradingPortfolio from "@/pages/TradingPortfolio";
import PriceAlerts from "@/pages/PriceAlerts";
import Inbox from "@/pages/Inbox";
import Services from "@/pages/Services";
import ProfileCenter from "@/pages/ProfileCenter";
import Launchpad from "@/pages/Launchpad";
import ChatRoom from "@/pages/ChatRoom";
import BottomNav from "@/components/BottomNav";
import AuthPage from "@/pages/AuthPage";
import P2P from "@/pages/P2P";
import CryptoWithdrawFlow, { WithdrawalHistoryPage } from "@/pages/CryptoWithdrawFlow";
import WithdrawalHelp from "@/pages/WithdrawalHelp";
import Feedback from "@/pages/Feedback";
import RwaStaking from "@/pages/RwaStaking";
import BotTrading from "@/pages/BotTrading";
import GiftRewards from "@/pages/GiftRewards";
import AccountStatement from "@/pages/AccountStatement";
import Referral from "@/pages/Referral";
import SecurityCenter from "@/pages/SecurityCenter";
import Staking from "@/pages/Staking";
import Wealth from "@/pages/Wealth";
import { ModeProvider } from "@/contexts/ModeContext";
import { AppStoreProvider } from "@/store/AppStoreContext";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000, gcTime: 5 * 60_000 } },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

/* ── Stable dark wrapper — no key so it never unmounts/remounts on route change ── */
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#040b14" }}>
      {children}
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [location, setLocation] = useLocation();
  const publicPaths = ["/sign-in", "/sign-up", "/help/how-to-withdraw"];
  const isPublic = publicPaths.some((p) => location.startsWith(p));

  useEffect(() => {
    if (!isLoaded) return;

    /* Admin auto-redirect */
    if (isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
      if (!location.startsWith("/admin")) {
        setLocation("/admin");
      }
      return;
    }

    if (!isSignedIn && !isPublic) {
      setLocation("/sign-in");
    }
  }, [isLoaded, isSignedIn, isPublic, location, setLocation, user]);

  if (!isLoaded) {
    const BASE = import.meta.env.BASE_URL;
    return (
      <div style={{
        minHeight: "100dvh",
        background: "radial-gradient(ellipse 70% 55% at 50% 38%, rgba(201,168,76,0.07) 0%, #040b14 68%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      }}>

        {/* ── Brand icon ────────────────────────────────── */}
        <div style={{
          width: 108, height: 108, borderRadius: 26,
          overflow: "hidden", marginBottom: 30,
          boxShadow: "0 0 0 1px rgba(201,168,76,0.18), 0 12px 48px rgba(201,168,76,0.18)",
          animation: "splashPop 0.5s cubic-bezier(.34,1.56,.64,1) both",
        }}>
          <img src={`${BASE}okzbyte-icon.png`} alt="OkzByte"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>

        {/* ── Word-mark ─────────────────────────────────── */}
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-0.6px", lineHeight: 1, marginBottom: 9,
          animation: "splashFade 0.5s 0.15s both" }}>
          <span style={{ color: "#C9A84C" }}>Okz</span>
          <span style={{ color: "#EAECEF" }}>byte</span>
        </div>

        {/* ── Tagline ───────────────────────────────────── */}
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "4px",
          color: "rgba(201,168,76,0.55)", textTransform: "uppercase" as const,
          marginBottom: 56,
          animation: "splashFade 0.5s 0.25s both",
        }}>
          Real&nbsp;Estate&nbsp;&nbsp;·&nbsp;&nbsp;Exchange
        </div>

        {/* ── Bounce-dot loader ─────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 9,
          animation: "splashFade 0.4s 0.4s both" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#C9A84C",
              animation: `splashDot 1.4s ease-in-out ${i * 0.22}s infinite`,
            }} />
          ))}
        </div>

        <style>{`
          @keyframes spin       { to { transform: rotate(360deg); } }
          @keyframes splashPop  { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes splashFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
          @keyframes splashDot  {
            0%, 60%, 100% { transform: translateY(0) scale(0.7); opacity: 0.3; }
            30%            { transform: translateY(-10px) scale(1);  opacity: 1;   }
          }
        `}</style>
      </div>
    );
  }

  if (!isSignedIn && !isPublic) return null;
  return <>{children}</>;
}

function HideBottomNavOnAuthPages() {
  const [location] = useLocation();
  const { isSignedIn } = useUser();
  const hidden = ["/sign-in", "/sign-up", "/admin", "/p2p", "/help/how-to-withdraw"].some((p) => location.startsWith(p));
  // Hide bottom nav inside any open chat room so it doesn't overlap the input dock
  const isChatRoom = /^\/inbox\/.+/.test(location);
  if (hidden || isChatRoom || !isSignedIn) return null;
  return <BottomNav />;
}

function FirebaseQueryCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const uid = user?.uid ?? null;
      if (prevUidRef.current !== undefined && prevUidRef.current !== uid) {
        qc.clear();
      }
      prevUidRef.current = uid;
    });
    return () => {
      unsubscribe();
    };
  }, [addListener, qc]);

  return null;
}

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseQueryCacheInvalidator />
      <TooltipProvider>
        <AuthGuard>
          <PageTransition>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/browse" component={Browse} />
              <Route path="/property/:id" component={PropertyDetail} />
              <Route path="/post-property" component={PostProperty} />
              <Route path="/my-properties" component={MyProperties} />
              <Route path="/invest" component={InvestPortal} />
              <Route path="/invest/:id" component={InvestDetail} />
              <Route path="/portfolio" component={Portfolio} />
              <Route path="/rwa-staking" component={RwaStaking} />
              <Route path="/bot-trading" component={BotTrading} />
              <Route path="/my-gift" component={GiftRewards} />
              <Route path="/account-statement" component={AccountStatement} />
              <Route path="/referral" component={Referral} />
              <Route path="/security" component={SecurityCenter} />
              <Route path="/staking" component={Staking} />
              <Route path="/wealth" component={Wealth} />
              <Route path="/trade/:id" component={TradingFloor} />
              <Route path="/wallet" component={Wallet} />
              <Route path="/withdraw/on-chain" component={CryptoWithdrawFlow} />
              <Route path="/help/how-to-withdraw" component={WithdrawalHelp} />
              <Route path="/feedback" component={Feedback} />
              <Route path="/history" component={WithdrawalHistoryPage} />
              <Route path="/wallet/okzbyte-pay" component={OkzBytePayReceive} />
              <Route path="/wallet/okzbyte-pay-send" component={OkzBytePaySend} />
              <Route path="/wallet/transaction/:id" component={DepositDetail} />
              <Route path="/project/azan-smart-city" component={AzanSmartCity} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/notification-settings" component={NotificationSettings} />
              <Route path="/agent/dashboard" component={AgentDashboard} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/subscribe/:planId" component={Subscribe} />
              <Route path="/profile" component={Profile} />
              <Route path="/trades" component={Trades} />
              <Route path="/markets" component={Markets} />
              <Route path="/trade" component={Trade} />
              <Route path="/p2p" component={P2P} />
              <Route path="/projects" component={Projects} />
              <Route path="/kyc" component={KYC} />
              <Route path="/admin" component={AdminPanel} />
              <Route path="/admin/config" component={AdminConfig} />
              <Route path="/admin/kyc" component={AdminKYC} />
              <Route path="/trading-portfolio" component={TradingPortfolio} />
              <Route path="/price-alerts" component={PriceAlerts} />
              <Route path="/inbox" component={Inbox} />
              <Route path="/inbox/:id" component={ChatRoom} />
              <Route path="/services" component={Services} />
              <Route path="/launchpad" component={Launchpad} />
              <Route path="/profile-center" component={ProfileCenter} />
              <Route path="/sign-in/*?">{() => <AuthPage defaultMode="signin" />}</Route>
              <Route path="/sign-up/*?">{() => <AuthPage defaultMode="signup" />}</Route>
              <Route component={NotFound} />
            </Switch>
          </PageTransition>
          <HideBottomNavOnAuthPages />
        </AuthGuard>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <FirebaseAuthProvider>
        <ModeProvider>
          <AppStoreProvider>
            <AppContent />
          </AppStoreProvider>
        </ModeProvider>
      </FirebaseAuthProvider>
    </WouterRouter>
  );
}

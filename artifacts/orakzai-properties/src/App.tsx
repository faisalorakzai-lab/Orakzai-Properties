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
import Notifications from "@/pages/Notifications";
import NotificationSettings from "@/pages/NotificationSettings";
import AgentDashboard from "@/pages/AgentDashboard";
import Pricing from "@/pages/Pricing";
import Subscribe from "@/pages/Subscribe";
import Profile from "@/pages/Profile";
import Trades from "@/pages/Trades";
import Projects from "@/pages/Projects";
import KYC from "@/pages/KYC";
import AdminConfig from "@/pages/AdminConfig";
import AdminKYC from "@/pages/AdminKYC";
import AdminPanel, { ADMIN_EMAIL } from "@/pages/AdminPanel";
import TradingPortfolio from "@/pages/TradingPortfolio";
import BottomNav from "@/components/BottomNav";
import AuthPage from "@/pages/AuthPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [location, setLocation] = useLocation();
  const publicPaths = ["/sign-in", "/sign-up"];
  const isPublic = publicPaths.some((p) => location.startsWith(p));

  useEffect(() => {
    if (!isLoaded) return;

    /* ── Admin auto-redirect: when admin email logs in → go to /admin ── */
    if (isSignedIn && user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL) {
      if (!location.startsWith("/admin")) {
        setLocation("/admin");
      }
      return;
    }

    /* ── Normal auth guard ── */
    if (!isSignedIn && !isPublic) {
      setLocation("/sign-in");
    }
  }, [isLoaded, isSignedIn, isPublic, location, setLocation, user]);

  if (!isLoaded) {
    return (
      <div style={{ minHeight: "100dvh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid rgba(212,175,55,0.2)", borderTop: "3px solid #D4AF37", animation: "spin 0.9s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isSignedIn && !isPublic) return null;
  return <>{children}</>;
}

function HideBottomNavOnAuthPages() {
  const [location] = useLocation();
  const { isSignedIn } = useUser();
  const hidden = ["/sign-in", "/sign-up", "/admin"].some((p) => location.startsWith(p));
  if (hidden || !isSignedIn) return null;
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
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <FirebaseQueryCacheInvalidator />
      <TooltipProvider>
        <AuthGuard>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/browse" component={Browse} />
            <Route path="/property/:id" component={PropertyDetail} />
            <Route path="/post-property" component={PostProperty} />
            <Route path="/my-properties" component={MyProperties} />
            <Route path="/invest" component={InvestPortal} />
            <Route path="/invest/:id" component={InvestDetail} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/trade/:id" component={TradingFloor} />
            <Route path="/wallet" component={Wallet} />
            <Route path="/project/azan-smart-city" component={AzanSmartCity} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/notification-settings" component={NotificationSettings} />
            <Route path="/agent/dashboard" component={AgentDashboard} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/subscribe/:planId" component={Subscribe} />
            <Route path="/profile" component={Profile} />
            <Route path="/trades" component={Trades} />
            <Route path="/projects" component={Projects} />
            <Route path="/kyc" component={KYC} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/admin/config" component={AdminConfig} />
            <Route path="/admin/kyc" component={AdminKYC} />
            <Route path="/trading-portfolio" component={TradingPortfolio} />
            <Route path="/sign-in/*?">{() => <AuthPage defaultMode="signin" />}</Route>
            <Route path="/sign-up/*?">{() => <AuthPage defaultMode="signup" />}</Route>
            <Route component={NotFound} />
          </Switch>
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
        <AppContent />
      </FirebaseAuthProvider>
    </WouterRouter>
  );
}

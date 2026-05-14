import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
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
import TradingPortfolio from "@/pages/TradingPortfolio";
import BottomNav from "@/components/BottomNav";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Resolve Clerk publishable key
const HARDCODED_CLERK_KEY = "pk_test_cG93ZXJmdWwtYmVlLTUwLmNsZXJrLmFjY291bnRzLmRldiQ";

let clerkPubKey: string | null = null;
try {
  const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
  const keyToTry = envKey || HARDCODED_CLERK_KEY;
  if (keyToTry && keyToTry.startsWith("pk_")) {
    clerkPubKey = keyToTry;
  } else {
    const k = publishableKeyFromHost(
      window.location.hostname,
      keyToTry,
    );
    if (k && k.startsWith("pk_")) clerkPubKey = k;
  }
} catch {
  clerkPubKey = HARDCODED_CLERK_KEY;
}

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "none" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "#D4AF37",
    colorForeground: "#f8f8f8",
    colorMutedForeground: "rgba(255,255,255,0.4)",
    colorDanger: "#ef4444",
    colorBackground: "#080604",
    colorInput: "rgba(255,255,255,0.04)",
    colorInputForeground: "#ffffff",
    colorNeutral: "#1a1510",
    fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.875rem",
    fontSize: "14px",
    spacingUnit: "18px",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "w-full",
  },
};

function OrakzaiBranding() {
  const logoSrc = `${window.location.origin}${basePath}/logo-ob-shield.png`;
  return (
    <div className="orakzai-auth-branding">
      <img
        src={logoSrc}
        alt="Orakzai Properties"
        className="orakzai-auth-logo"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `${window.location.origin}${basePath}/logo-shield.png`;
        }}
      />
      <div className="orakzai-auth-wordmark">
        <div className="orakzai-auth-wordmark-title">ORAKZAI</div>
        <div className="orakzai-auth-wordmark-sub">Properties</div>
        <div className="orakzai-auth-divider-line" />
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="orakzai-auth-page">
      <OrakzaiBranding />
      <div className="orakzai-auth-clerk">
        <SignIn
          appearance={clerkAppearance}
          signUpUrl={`${basePath}/sign-up`}
          forceRedirectUrl={`${basePath}/`}
          afterSignInUrl={`${basePath}/`}
          routing="path"
          path={`${basePath}/sign-in`}
        />
      </div>
      <p style={{
        marginTop: 28,
        fontSize: 11,
        color: "rgba(255,255,255,0.18)",
        letterSpacing: "0.06em",
        fontFamily: "'Inter', sans-serif",
        textTransform: "uppercase",
        textAlign: "center",
      }}>
        Assets of Today · Legacies of Tomorrow
      </p>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="orakzai-auth-page">
      <OrakzaiBranding />
      <div className="orakzai-auth-clerk">
        <SignUp
          appearance={clerkAppearance}
          signInUrl={`${basePath}/sign-in`}
          forceRedirectUrl={`${basePath}/`}
          afterSignUpUrl={`${basePath}/`}
          routing="path"
          path={`${basePath}/sign-up`}
        />
      </div>
      <p style={{
        marginTop: 28,
        fontSize: 11,
        color: "rgba(255,255,255,0.18)",
        letterSpacing: "0.06em",
        fontFamily: "'Inter', sans-serif",
        textTransform: "uppercase",
        textAlign: "center",
      }}>
        Assets of Today · Legacies of Tomorrow
      </p>
    </div>
  );
}

// Auth Guard — redirects unauthenticated users to sign-in
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const [location, setLocation] = useLocation();

  const publicPaths = ["/sign-in", "/sign-up"];
  const isPublic = publicPaths.some(p => location.startsWith(p));

  useEffect(() => {
    if (isLoaded && !isSignedIn && !isPublic) {
      setLocation("/sign-in");
    }
  }, [isLoaded, isSignedIn, isPublic, location, setLocation]);

  if (!isLoaded) {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#070B14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid rgba(243,186,47,0.3)",
          borderTop: "3px solid #F3BA2F",
          animation: "spin 0.9s linear infinite",
        }} />
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
  const hideOn = ["/sign-in", "/sign-up"];
  const hidden = hideOn.some((p) => location.startsWith(p));
  if (hidden || !isSignedIn) return null;
  return <BottomNav />;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

const appRoutes = (
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
    <Route path="/admin/config" component={AdminConfig} />
    <Route path="/admin/kyc" component={AdminKYC} />
    <Route path="/trading-portfolio" component={TradingPortfolio} />
    <Route path="/sign-in/*?" component={SignInPage} />
    <Route path="/sign-up/*?" component={SignUpPage} />
    <Route component={NotFound} />
  </Switch>
);

function AppWithClerk() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome Back", subtitle: "Sign in to your Orakzai Properties account" } },
        signUp: { start: { title: "Create Account", subtitle: "Join Orakzai Properties today" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AuthGuard>
            {appRoutes}
            <HideBottomNavOnAuthPages />
          </AuthGuard>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function AppWithoutClerk() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {appRoutes}
        <BottomNav />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  if (clerkPubKey) {
    return <AppWithClerk />;
  }
  return <AppWithoutClerk />;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
    </WouterRouter>
  );
}

export default App;

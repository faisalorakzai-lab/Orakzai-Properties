import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
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
import TradingPortfolio from "@/pages/TradingPortfolio";
import BottomNav from "@/components/BottomNav";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Safe key resolution — never throws, returns null if unavailable
let clerkPubKey: string | null = null;
try {
  const k = publishableKeyFromHost(
    window.location.hostname,
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  );
  if (k && k.startsWith("pk_")) clerkPubKey = k;
} catch {
  clerkPubKey = null;
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
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#F3BA2F",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#ef4444",
    colorBackground: "#070B14",
    colorInput: "#0D1421",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#1a1a1a",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#070B14] border border-[#F3BA2F]/30 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-[#F3BA2F]/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#f1f5f9] font-serif",
    headerSubtitle: "text-[#94a3b8]",
    socialButtonsBlockButtonText: "text-[#f1f5f9]",
    formFieldLabel: "text-[#94a3b8]",
    footerActionLink: "text-[#F3BA2F] hover:text-[#e8c060]",
    footerActionText: "text-[#94a3b8]",
    dividerText: "text-[#94a3b8]",
    formButtonPrimary: "bg-[#F3BA2F] text-[#070B14] font-bold hover:bg-[#e8c060]",
    identityPreviewText: "text-[#f1f5f9]",
    identityPreviewEditButton: "text-[#F3BA2F]",
    formFieldInputShowPasswordButton: "text-[#94a3b8]",
  },
};

function SignInPage() {
  const [, setLocation] = useLocation();
  return (
    <div style={{ minHeight: "100dvh", background: "#070B14", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <SignIn
        appearance={clerkAppearance}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/`}
        afterSignInUrl={`${basePath}/`}
        routing="path"
        path={`${basePath}/sign-in`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "#070B14", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <SignUp
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/`}
        afterSignUpUrl={`${basePath}/`}
        routing="path"
        path={`${basePath}/sign-up`}
      />
    </div>
  );
}

function HideBottomNavOnAuthPages() {
  const [location] = useLocation();
  const hideOn = ["/sign-in", "/sign-up"];
  const hidden = hideOn.some((p) => location.startsWith(p));
  if (hidden) return null;
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
          {appRoutes}
          <HideBottomNavOnAuthPages />
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
        <HideBottomNavOnAuthPages />
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

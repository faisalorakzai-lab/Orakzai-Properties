import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
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
import BottomNav from "@/components/BottomNav";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

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
    colorPrimary: "#D4AF37",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#ef4444",
    colorBackground: "#050505",
    colorInput: "#111111",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#1a1a1a",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#050505] border border-[#D4AF37]/30 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-[#D4AF37]/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#f1f5f9] font-serif",
    headerSubtitle: "text-[#94a3b8]",
    socialButtonsBlockButtonText: "text-[#f1f5f9]",
    formFieldLabel: "text-[#94a3b8]",
    footerActionLink: "text-[#D4AF37] hover:text-[#e8c060]",
    footerActionText: "text-[#94a3b8]",
    dividerText: "text-[#94a3b8]",
    identityPreviewEditButton: "text-[#D4AF37]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-300",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-12",
    socialButtonsBlockButton: "border-[#1a1a1a] bg-[#111111] hover:bg-[#1a1a1a] text-[#f1f5f9]",
    formButtonPrimary: "bg-[#D4AF37] hover:bg-[#e8c060] text-[#050505] font-semibold",
    formFieldInput: "bg-[#111111] border-[#1a1a1a] text-[#f1f5f9]",
    footerAction: "bg-[#020202]",
    dividerLine: "bg-[#1a1a1a]",
    alert: "bg-[#111111] border-red-500/30",
    otpCodeFieldInput: "bg-[#111111] border-[#D4AF37] text-[#f1f5f9]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Home />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
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

function HideBottomNavOnAuthPages() {
  const [location] = useLocation();
  const hideOn = ["/sign-in", "/sign-up"];
  const hidden = hideOn.some((p) => location.startsWith(p));
  if (hidden) return null;
  return <BottomNav />;
}

function ClerkProviderWithRoutes() {
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
          <Switch>
            <Route path="/" component={HomeRedirect} />
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
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route component={NotFound} />
          </Switch>
          <HideBottomNavOnAuthPages />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
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
    colorPrimary: "#C9A84C",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#ef4444",
    colorBackground: "#0f1929",
    colorInput: "#1a2940",
    colorInputForeground: "#f1f5f9",
    colorNeutral: "#1e3a5f",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#0f1929] border border-[#C9A84C]/30 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl shadow-[#C9A84C]/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#f1f5f9] font-serif",
    headerSubtitle: "text-[#94a3b8]",
    socialButtonsBlockButtonText: "text-[#f1f5f9]",
    formFieldLabel: "text-[#94a3b8]",
    footerActionLink: "text-[#C9A84C] hover:text-[#e8c060]",
    footerActionText: "text-[#94a3b8]",
    dividerText: "text-[#94a3b8]",
    identityPreviewEditButton: "text-[#C9A84C]",
    formFieldSuccessText: "text-green-400",
    alertText: "text-red-300",
    logoBox: "flex justify-center mb-4",
    logoImage: "h-12",
    socialButtonsBlockButton: "border-[#1e3a5f] bg-[#1a2940] hover:bg-[#1e3a5f] text-[#f1f5f9]",
    formButtonPrimary: "bg-[#C9A84C] hover:bg-[#e8c060] text-[#0f1929] font-semibold",
    formFieldInput: "bg-[#1a2940] border-[#1e3a5f] text-[#f1f5f9]",
    footerAction: "bg-[#0a1220]",
    dividerLine: "bg-[#1e3a5f]",
    alert: "bg-[#1a2940] border-red-500/30",
    otpCodeFieldInput: "bg-[#1a2940] border-[#C9A84C] text-[#f1f5f9]",
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
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route component={NotFound} />
          </Switch>
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

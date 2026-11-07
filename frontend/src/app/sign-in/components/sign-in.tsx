import {
  BrainCircuit,
  CalendarDays,
  CalendarSync,
  MessageCircle,
  PlugZap,
  Sparkles,
  Video,
} from "lucide-react";
import { AuthRoute } from "@/components/auth/auth-route";
import { DescopeFlow } from "./descope-flow";

const productCapabilities = [
  {
    icon: CalendarSync,
    title: "Keep Google Calendar in sync",
    description:
      "Connect securely with Descope Connections and reflect meeting changes in your calendar.",
  },
  {
    icon: MessageCircle,
    title: "Manage meetings by asking",
    description:
      "Create, find, reschedule, or cancel meetings in everyday language.",
  },
  {
    icon: Video,
    title: "Bring everyone together",
    description:
      "Add Google Meet details and email invitations to your plans.",
  },
  {
    icon: BrainCircuit,
    title: "Pick up where you left off",
    description:
      "Keep conversation history and useful agent context between sessions.",
  },
];

export default function SignInComponent() {
  return (
    <AuthRoute mode="unauthenticated">
      <main className="app-shell-bg min-h-svh px-5 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto flex min-h-[calc(100svh-3rem)] max-w-6xl flex-col sm:min-h-[calc(100svh-5rem)]">
          <header className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <CalendarDays aria-hidden="true" className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Agentic Calendar
            </span>
          </header>

          <section className="my-auto grid items-center gap-12 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:py-16">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3.5 py-2 text-sm font-medium text-primary shadow-sm">
                <Sparkles aria-hidden="true" className="size-4" />
                Your calendar, in conversation
              </div>
              <h1 className="font-heading text-5xl leading-[1.08] tracking-tight sm:text-6xl">
                Plan meetings
                <br />
                <span className="text-primary">by simply asking.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                We’re building an AI assistant that connects to Google Calendar
                and turns everyday requests into meeting updates that sync back
                to your calendar.
              </p>
              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  What we’re building
                </h2>
                <ul className="mt-5 grid gap-5 sm:grid-cols-2">
                  {productCapabilities.map(
                    ({ icon: Icon, title, description }) => (
                      <li className="flex gap-3" key={title}>
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                          <Icon aria-hidden="true" className="size-4" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold">{title}</h3>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {description}
                          </p>
                        </div>
                      </li>
                    ),
                  )}
                  <li className="flex gap-3 sm:col-span-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <PlugZap aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">
                        Built for AI workflows
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        We plan to make calendar capabilities available to
                        external AI clients through MCP.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="w-full justify-self-center md:max-w-md">
              <div className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_24px_80px_-36px_oklch(0.35_0.07_210_/_0.35)] backdrop-blur sm:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Agentic Calendar
                </p>
                <h2 className="mt-3 font-heading text-3xl tracking-tight sm:text-4xl">
                  Start with a secure sign-in
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Sign in to get started. Google Calendar connections and the
                  AI meeting assistant are part of the product we’re building.
                </p>
                <DescopeFlow />
                <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
                  By continuing, you agree to keep your account secure.
                </p>
              </div>
              <p className="mt-5 text-center text-xs text-muted-foreground">
                Secure authentication with Descope
              </p>
            </div>
          </section>

          <footer className="flex items-center justify-between border-t border-border/60 pt-5 text-xs text-muted-foreground">
            <span>Agentic Calendar</span>
            <span>Make today a little lighter.</span>
          </footer>
        </div>
      </main>
    </AuthRoute>
  );
}

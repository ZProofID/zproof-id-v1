import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  Home,
  SearchX,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050711] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_15%_0%,rgba(168,85,247,0.14),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6">
        <nav className="flex items-center justify-between py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-black text-slate-950 shadow-lg shadow-blue-500/20">
              Z
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">ZProof.ID</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
                Private verification layer
              </p>
            </div>
          </Link>

          <Link
            to="/verify"
            className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 sm:inline-flex"
          >
            Start verification
          </Link>
        </nav>

        <section className="flex flex-1 items-center py-16">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
                <SearchX className="h-4 w-4" />
                404 / Route not found
              </div>

              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                This proof path does not exist.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                The page you are looking for may have been moved, deleted, or
                never generated. Return home or restart verification.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-blue-950/30 hover:bg-blue-100"
                >
                  <Home className="h-4 w-4" />
                  Back home
                </Link>

                <Link
                  to="/verify"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 py-4 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Verify again
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-blue-950/40 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-[#080B18] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-300">
                      Verification route
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Requested page could not be resolved.
                    </p>
                  </div>

                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300">
                    Not found
                  </span>
                </div>

                <div className="space-y-3">
                  <Metric label="Route status" value="Missing" />
                  <Metric label="Proof state" value="Unavailable" />
                  <Metric label="Data exposure" value="None" />
                  <Metric label="Recommended action" value="Return home" />
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-blue-200">
                    <Fingerprint className="h-4 w-4" />
                    Error output
                  </div>

                  <div className="space-y-2 font-mono text-[11px] leading-5 text-slate-400">
                    <p>{`{ "status": 404,`}</p>
                    <p>{`  "proof": "not_found",`}</p>
                    <p>{`  "verification": "unavailable",`}</p>
                    <p>{`  "private_data": "safe" }`}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-blue-300" />
                  <p className="text-sm leading-6 text-slate-300">
                    No private verification data was exposed by this missing
                    route.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8">
          <div className="flex flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row">
            <p>ZProof.ID</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to private verification
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

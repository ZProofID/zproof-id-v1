import { useEffect, useState } from "react";
import Logo from "../assets/socketLogo.svg";
import { Link } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { ArrowUpRight, Menu, X } from "lucide-react";

export default function Header() {
  const isLargeScreen = useMediaQuery({ minWidth: 1024 });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isLargeScreen) setExpanded(false);
  }, [isLargeScreen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/75 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[80px] items-center justify-between gap-4">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 rounded-2xl outline-none transition"
            aria-label="SocketFi home"
          >
            <img
              className="h-9 w-auto transition duration-300 group-hover:opacity-90"
              src={Logo}
              alt="SocketFi"
            />
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href="https://docs.socket.fi/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-200 hover:bg-white hover:text-slate-950"
            >
              Documentation
              <ArrowUpRight className="h-4 w-4" />
            </a>

            <a
              href="https://console.socket.fi/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.16)] transition hover:bg-slate-800"
            >
              Start Building
            </a>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={expanded}
          >
            {expanded ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-300 lg:hidden ${
            expanded ? "max-h-64 pb-4 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="grid gap-3">
              <a
                href="https://docs.socket.fi/"
                target="_blank"
                rel="noreferrer"
                onClick={() => setExpanded(false)}
                className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span>Documentation</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>

              <a
                href="https://console.socket.fi/"
                target="_blank"
                rel="noreferrer"
                onClick={() => setExpanded(false)}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Start Building
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

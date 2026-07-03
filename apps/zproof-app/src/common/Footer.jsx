import Logo from "../assets/socketLogo.svg";
import { Link } from "react-router-dom";
import { Send, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <img className="h-9 w-auto" src={Logo} alt="SocketFi" />
              <p className="max-w-sm text-center text-sm leading-6 text-slate-500 lg:text-left">
                Embedded wallet infrastructure for Stellar applications.
              </p>
            </div>

            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600 lg:justify-start">
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://console.socket.fi/"
                  title="Developer Console"
                  className="transition hover:text-slate-950"
                >
                  Console
                </a>
              </li>

              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.socket.fi/"
                  title="Documentation"
                  className="transition hover:text-slate-950"
                >
                  Documentation
                </a>
              </li>

              <li>
                <a
                  href="mailto:info@socket.fi?subject=SocketFi%20Support%20and%20Enquiries"
                  title="SocketFi Support and Enquiries"
                  className="transition hover:text-slate-950"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <ul className="flex items-center justify-center gap-3 lg:justify-end">
            <li>
              <a
                href="https://x.com/Socket_Fi"
                target="_blank"
                rel="noreferrer"
                title="SocketFi on X"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.901 2H22l-6.768 7.736L23.2 22h-6.238l-4.886-6.613L6.29 22H3.19l7.24-8.274L.8 2h6.396l4.417 6.01L18.9 2Zm-1.094 18h1.717L6.267 3.896H4.425L17.807 20Z" />
                </svg>
              </a>
            </li>

            <li>
              <a
                href="https://t.me/SocketFi"
                target="_blank"
                rel="noreferrer"
                title="SocketFi on Telegram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                <Send className="h-4 w-4" />
              </a>
            </li>

            <li>
              <a
                href="https://github.com/orgs/Socket-Fi/repositories"
                target="_blank"
                rel="noreferrer"
                title="SocketFi on GitHub"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.486 2 12.02c0 4.427 2.865 8.183 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.158-1.11-1.466-1.11-1.466-.907-.62.069-.608.069-.608 1.003.071 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.338-2.22-.254-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.652 0 0 .84-.27 2.75 1.027A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.297 2.748-1.027 2.748-1.027.546 1.38.202 2.399.1 2.652.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.694-4.566 4.943.359.31.678.921.678 1.855 0 1.338-.012 2.419-.012 2.748 0 .268.18.58.688.482A10.025 10.025 0 0 0 22 12.02C22 6.486 17.523 2 12 2Z"
                  />
                </svg>
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p className="text-center md:text-left">
            © 2026 SocketFi. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-end">
            <Link
              to="/privacy-policy"
              className="transition hover:text-slate-900"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-and-conditions"
              className="transition hover:text-slate-900"
            >
              Terms &amp; Conditions
            </Link>

            <a
              href="https://docs.socket.fi/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 transition hover:text-slate-900"
            >
              Developer Docs
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

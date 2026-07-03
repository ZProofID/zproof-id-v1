import React, { useEffect, useState } from "react";
import { CheckCircle2, Download, X, ChevronRight, Wallet } from "lucide-react";
import { WalletKitService } from "./services/global-service";
import { useStates } from "../contexts/StatesContext";

export default function WalletKitModal() {
  const [isAvailableMap, setIsAvailableMap] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const {
    walletKitIsOpen,
    setWalletKitIsOpen,
    setUserKey,
    setNetwork,
    setWalletApp,
  } = useStates();

  const stellarWalletKitOptions = WalletKitService.walletKit.modules;

  useEffect(() => {
    Promise.all(
      stellarWalletKitOptions.map(({ isAvailable }) => isAvailable())
    ).then((results) => {
      const map = new Map();
      results.forEach((isAvailable, index) => {
        map.set(stellarWalletKitOptions[index].productName, isAvailable);
      });
      setIsAvailableMap(map);
    });
  }, [stellarWalletKitOptions]);

  useEffect(() => {
    if (walletKitIsOpen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 20);
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [walletKitIsOpen]);

  const closeHandler = () => {
    setWalletKitIsOpen(false);
  };

  const handleDownload = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleWalletClick = (option) => {
    const available = isAvailableMap?.get(option?.productName);

    if (available) {
      WalletKitService.login(option?.productId, setUserKey, setNetwork);
    } else {
      handleDownload(option?.productUrl);
    }

    setWalletApp(option?.productId);
    setWalletKitIsOpen(false);
  };

  if (!shouldRender) return null;

  return (
    <div
      onClick={closeHandler}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#02040c]/30 px-3 py-5 backdrop-blur-xs sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-slate-600 bg-[#080B18]/95 shadow-2xl shadow-blue-950/50 backdrop-blur transition-all duration-300 ease-out ${
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-[0.98] opacity-0"
        }`}
      >
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400" />

        <button
          type="button"
          onClick={closeHandler}
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-7">
          <div className="mb-6 flex items-start gap-4 pr-10">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
              <Wallet className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xl font-bold text-white">
                Connect Stellar wallet
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Select a wallet to sign verification transactions and connect
                your ZProof.ID profile.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {stellarWalletKitOptions?.map((option) => {
              const available = isAvailableMap?.get(option?.productName);

              return (
                <button
                  type="button"
                  key={option?.productName}
                  onClick={() => handleWalletClick(option)}
                  className="group w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left shadow-sm transition hover:border-blue-400/30 hover:bg-blue-500/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                        <img
                          className="h-9 w-9 rounded-full object-cover"
                          src={option?.productIcon}
                          alt={option?.productName}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-white">
                            {option?.productName}
                          </p>

                          {available && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              Ready
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-sm font-medium text-slate-500">
                          {option?.productUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 p-2 text-slate-400 transition group-hover:border-blue-400/30 group-hover:text-blue-300">
                      {available ? (
                        <ChevronRight className="h-5 w-5" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

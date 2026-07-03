"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { COUNTRIES } from "@/lib/currency";

interface CurrencyContextType {
  currency: string;
  countryCode: string;
  setCurrency: (currency: string) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "CLP",
  countryCode: "CL",
  setCurrency: () => {},
  isLoading: true,
});

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState("CLP");
  const [countryCode, setCountryCode] = useState("CL");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Try to detect from saved preference
    const saved = localStorage.getItem("compra-todo-currency");
    if (saved) {
      const country = COUNTRIES.find((c) => c.currency === saved);
      if (country) {
        setCurrencyState(saved);
        setCountryCode(country.code);
        setIsLoading(false);
        return;
      }
    }

    // 2. Auto-detect from browser
    fetch("/api/currencies?detect=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.detected) {
          setCurrencyState(data.detected.currency);
          setCountryCode(data.detected.code);
          localStorage.setItem("compra-todo-currency", data.detected.currency);
        }
      })
      .catch(() => {
        // fallback CLP
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setCurrency = useCallback(
    (newCurrency: string) => {
      const country = COUNTRIES.find((c) => c.currency === newCurrency);
      if (country) {
        setCurrencyState(newCurrency);
        setCountryCode(country.code);
        localStorage.setItem("compra-todo-currency", newCurrency);
        // Refresh the page to update prices
        router.refresh();
      }
    },
    [router]
  );

  return (
    <CurrencyContext.Provider value={{ currency, countryCode, setCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function CurrencySelector() {
  const { currency, setCurrency, isLoading } = useCurrency();
  const [open, setOpen] = useState(false);

  const current = COUNTRIES.find((c) => c.currency === currency) || COUNTRIES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm hover:bg-gray-100 transition-colors"
        title="Cambiar moneda"
      >
        <span>{current.flag}</span>
        <span className="font-medium text-gray-700">{currency}</span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[200px]">
            {COUNTRIES.map((country) => (
              <button
                key={country.currency}
                onClick={() => {
                  setCurrency(country.currency);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-purple-50 transition-colors ${
                  currency === country.currency ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <div className="text-left">
                  <p className="text-xs text-gray-400">{country.code}</p>
                  <p className="font-medium">
                    {country.currencySymbol} {country.currency}
                  </p>
                </div>
                <span className="text-xs text-gray-400 ml-auto">{country.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

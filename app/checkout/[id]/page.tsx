"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { plans } from "@/lib/plan";
import { CheckCircle2, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

declare global {
  interface Window {
    Paddle?: any;
  }
}

export default function CheckoutPage() {
  const { userId } = useAuth();
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const selectedPlan = plans.find((p) => p.priceId === id);

  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isPaddleReady, setIsPaddleReady] = useState(false);

  const paddleInitializedRef = useRef(false);
  const checkoutOpenedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (id && !selectedPlan && id !== "loading") {
      router.push("/");
    }
  }, [selectedPlan, id, router]);

  useEffect(() => {
    if (window.Paddle) {
      setIsScriptLoaded(true);
      return;
    }
    const handleLoaded = () => setIsScriptLoaded(true);
    const handleError = () => {
      console.error("Failed to load Paddle script");
      setIsScriptLoaded(false);
    };
    window.addEventListener("paddle:loaded", handleLoaded);
    window.addEventListener("paddle:error", handleError);
    return () => {
      window.removeEventListener("paddle:loaded", handleLoaded);
      window.removeEventListener("paddle:error", handleError);
    };
  }, []);

  useEffect(() => {
    if (!isScriptLoaded || !window.Paddle || paddleInitializedRef.current) return;
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;

    try {
      window.Paddle.Environment.set(
        process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox"
      );
      window.Paddle.Initialize({ token });
      paddleInitializedRef.current = true;
      setIsPaddleReady(true);
    } catch (err) {
      console.error("Paddle init error:", err);
    }
  }, [isScriptLoaded]);

  useEffect(() => {
    checkoutOpenedRef.current = false;
  }, [selectedPlan?.priceId, userId]);

  useEffect(() => {
    if (!isPaddleReady || !selectedPlan || !userId || !window.Paddle) return;
    if (!containerRef.current) return;
    if (checkoutOpenedRef.current) return;

    try {
      window.Paddle.Checkout.open({
        settings: {
          displayMode: "inline",
          frameTarget: "checkout-container",
          frameInitialHeight: "450",
          frameStyle: "width: 100%; min-width: 312px; background-color: transparent; border: none;",
        },
        items: [{ priceId: selectedPlan.priceId, quantity: 1 }],
        customData: { userId: userId },
      });
      checkoutOpenedRef.current = true;
    } catch (err) {
      console.error("Checkout open error:", err);
    }
  }, [isPaddleReady, selectedPlan, userId]);

  useEffect(() => {
    return () => {
      try {
        window.Paddle?.Checkout?.close?.();
      } catch {}
    };
  }, []);

  if (!selectedPlan) return null;

  const featureList = Array.isArray(selectedPlan.features) ? selectedPlan.features : [];
  const featureSummary = Array.isArray(selectedPlan.features)
    ? selectedPlan.features.join(" • ")
    : String(selectedPlan.features ?? "");

  return (
    <div className="fixed inset-0 flex flex-col lg:flex-row bg-white z-[9999]">
      
      {/* LEFT SIDE: Order Details */}
      <div className="w-full lg:w-[40%] border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto bg-slate-50/50">
        <div className="max-w-md mx-auto w-full p-8 lg:p-12 flex flex-col min-h-full">
          <div className="flex-grow">
            <Link
              href="/documents"
              className="flex items-center text-slate-500 mb-8 hover:text-blue-600 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return homepage
            </Link>

            <div className="mb-8">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Your order for {userId?.substring(0, 8) ?? "user"}...
              </span>
              <h1 className="text-3xl lg:text-4xl font-extrabold mt-4 text-slate-900">
                Gói {selectedPlan.name}
              </h1>
              <p className="text-slate-500 mt-2 text-sm">{featureSummary}</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between text-xl font-bold text-slate-900">
                <span>Total</span>
                <span>{selectedPlan.price}</span>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <p className="font-bold mb-4 text-slate-800">Features Included:</p>
                <ul className="space-y-3">
                  {featureList.map((f, i) => (
                    <li key={i} className="flex items-start text-sm text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center text-[10px] text-slate-400">
            <ShieldCheck className="w-4 h-4 mr-2 text-green-500" />
            SECURE PAYMENT POWERED BY PADDLE
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Payment Form */}
      <div className="w-full lg:w-[60%] overflow-y-auto bg-white flex flex-col items-center">
        <div className="w-full max-w-[600px] p-8 lg:p-12">
          {(!isScriptLoaded || !isPaddleReady) && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
              <p className="text-sm font-medium">Loading payment secure form...</p>
            </div>
          )}

          <div
            id="checkout-container"
            ref={containerRef}
            className="checkout-container w-full transition-opacity duration-500"
          />
        </div>
      </div>
    </div>
  );
}
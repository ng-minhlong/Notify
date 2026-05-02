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

  // Redirect nếu plan không tồn tại
  useEffect(() => {
    if (id && !selectedPlan && id !== "loading") {
      router.push("/");
    }
  }, [selectedPlan, id, router]);

  // Theo doi trang thai load cua Paddle script
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

  // INIT PADDLE (chỉ 1 lần)
  useEffect(() => {
    if (!isScriptLoaded || !window.Paddle || paddleInitializedRef.current) return;

    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) {
      console.error("Missing Paddle token");
      return;
    }

    try {
      window.Paddle.Environment.set(
        process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
          ? "production"
          : "sandbox"
      );

      window.Paddle.Initialize({ token });

      paddleInitializedRef.current = true;
      setIsPaddleReady(true);
    } catch (err) {
      console.error("Paddle init error:", err);
    }
  }, [isScriptLoaded]);

  // reset khi đổi plan hoặc user
  useEffect(() => {
    checkoutOpenedRef.current = false;
  }, [selectedPlan?.priceId, userId]);

  // OPEN CHECKOUT
  useEffect(() => {
    if (!isPaddleReady || !selectedPlan || !userId || !window.Paddle) return;
    if (!containerRef.current) return;
    if (checkoutOpenedRef.current) return;

    console.log("OPEN CHECKOUT WITH USER:", userId);

    try {
      window.Paddle.Checkout.open({
        settings: {
          displayMode: "inline",
          frameTarget: "checkout-container",
          frameInitialHeight: "550",
          frameStyle:
            "width: 100%; min-width: 312px; background-color: transparent; border: none;",
        },
        items: [
          {
            priceId: selectedPlan.priceId,
            quantity: 1,
          },
        ],
        customData: {
          userId: userId,
        },
      });

      checkoutOpenedRef.current = true;
    } catch (err) {
      console.error("Checkout open error:", err);
    }
  }, [isPaddleReady, selectedPlan, userId]);

  // cleanup
  useEffect(() => {
    return () => {
      try {
        window.Paddle?.Checkout?.close?.();
      } catch {}
    };
  }, []);

  if (!selectedPlan) return null;

  const featureList = Array.isArray(selectedPlan.features)
    ? selectedPlan.features
    : [];

  const featureSummary = Array.isArray(selectedPlan.features)
    ? selectedPlan.features.join(" • ")
    : String(selectedPlan.features ?? "");

  return (
    <>
     

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          minHeight: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
        }}
        className="flex-wrap lg:flex-nowrap"
      >
        {/* LEFT */}
        <div
          style={{
            flex: "1 1 40%",
            padding: "3rem",
            backgroundColor: "#fff",
            borderRight: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div className="max-w-md mx-auto w-full">
            <Link
              href="/documents"
              className="flex items-center text-slate-500 mb-10 hover:text-blue-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return homepage
            </Link>

            <div className="mb-10">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                Your order for {userId ?? "loading..."}
              </span>

              <h1 className="text-4xl font-extrabold mt-6">
                Gói {selectedPlan.name}
              </h1>

              <p className="text-slate-600 mt-2">{featureSummary}</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{selectedPlan.price}</span>
              </div>

              <div className="pt-6 border-t">
                <p className="font-bold mb-4">Features Included:</p>

                <ul className="space-y-3">
                  {featureList.map((f, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 mr-2 text-green-500" />
            Secure payment powered by Paddle
          </div>
        </div>

        {/* RIGHT */}
        <div
          style={{
            flex: "1 1 60%",
            padding: "2rem",
          }}
          className="flex flex-col items-center"
        >
          {(!isScriptLoaded || !isPaddleReady) && (
            <div className="flex flex-col items-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              Loading payment form...
            </div>
          )}

          <div
            id="checkout-container"
            ref={containerRef}
            className="checkout-container w-full max-w-[550px] min-h-[550px]"
          />
        </div>
      </div>
    </>
  );
}

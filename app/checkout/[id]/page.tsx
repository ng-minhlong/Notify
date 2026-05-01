"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { plans } from "@/lib/plan";
import { CheckCircle2, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { useAuth } from "@clerk/nextjs";
// Khai báo kiểu cho Paddle để TS không báo lỗi
declare global {
  interface Window {
    Paddle: any;
  }
}

export default function CheckoutPage() {
  const { userId } = useAuth();
  const { id } = useParams();
  const router = useRouter();
  const [isPaddleLoaded, setIsPaddleLoaded] = useState(false);

  const selectedPlan = plans.find((p) => p.priceId === id);

  useEffect(() => {
    if (!selectedPlan && id !== "loading") {
      router.push("/");
    }
  }, [selectedPlan, id, router]);

  // Khởi tạo Paddle khi script đã load xong
  useEffect(() => {
    if (isPaddleLoaded && selectedPlan && window.Paddle) {
      window.Paddle.Environment.set("sandbox"); // Đổi thành 'production' khi chạy thật
      window.Paddle.Initialize({ 
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN // Lấy ở Paddle Dashboard > Developer Tools > Authentication
      });

      // Render Inline Checkout vào cái div có class .checkout-container
      window.Paddle.Checkout.open({
        settings: {
          displayMode: "inline",
          frameTarget: "checkout-container",
          frameStyle: "width: 100%;  background-color: transparent; border: none;"
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
    }
  }, [isPaddleLoaded, selectedPlan]);

  if (!selectedPlan) return null;

  return (
    <>
      {/* Load SDK Paddle */}
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={() => setIsPaddleLoaded(true)}
      />

      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'row',
          minHeight: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999,
        }}
        className="flex-wrap lg:flex-nowrap"
      >
        {/* --- CỘT TRÁI: THÔNG TIN GÓI --- */}
        <div 
          style={{ 
            flex: '1 1 40%', 
            padding: '3rem',
            backgroundColor: "#fff",
            color: "black",
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
          }}
        >
          <div className="max-w-md mx-auto w-full">
            <Link href="/documents" className="flex items-center text-slate-500 mb-10 hover:text-blue-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> Return homepage
            </Link>

            <div className="mb-10">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest">
                Your order for {userId}
              </span>
              <h1 className="text-4xl font-extrabold mt-6 text-slate-900">Gói {selectedPlan.name}</h1>
              <p className="text-slate-600 mt-2 text-lg">{selectedPlan.features}</p>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-xl font-bold text-slate-900">
                <span>Total</span>
                <span>{selectedPlan.price}</span>
              </div>
              
              <div className="pt-6 border-t border-slate-200">
                <p className="font-bold text-slate-800 mb-4">Features Included:</p>
                <ul className="space-y-3">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex items-center text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 mr-2 text-green-500" />
            Secure payment powered by Paddle
          </div>
        </div>

        {/* --- CỘT PHẢI: RENDER PADDLE FORM --- */}
        <div 
          style={{ 
            flex: '1 1 60%', 
            overflowY: 'auto',
            backgroundColor: "#fff",
            color: "black",
            padding: '2rem'
          }}
          className="flex flex-col items-center justify-start lg:justify-center"
        >
          {!isPaddleLoaded && (
            <div className="flex flex-col items-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Loading payment secure form...</p>
            </div>
          )}
          
          {/* ĐÂY LÀ NƠI PADDLE SẼ NHẢY VÀO RENDER */}
          <div className="checkout-container w-full max-w-[550px]"></div>
        </div>
      </div>
    </>
  );
}
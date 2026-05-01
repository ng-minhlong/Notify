"use client";

import Script from "next/script";

export default function PaddleProvider() {
  return (
    <Script
      src="https://cdn.paddle.com/paddle/v2/paddle.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.Paddle?.Initialize({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        });
      }}
    />
  );
}
"use client";

import Script from "next/script";

export default function PaddleProvider() {
  return (
    <Script
      src="https://cdn.paddle.com/paddle/v2/paddle.js"
      strategy="afterInteractive"
      onLoad={() => {
        window.dispatchEvent(new Event("paddle:loaded"));
      }}
      onError={() => {
        window.dispatchEvent(new Event("paddle:error"));
      }}
    />
  );
}

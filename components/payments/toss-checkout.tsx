"use client";

import Script from "next/script";
import { useState } from "react";
import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKrw } from "@/lib/utils";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      requestPayment: (
        method: "카드" | "가상계좌" | "계좌이체" | "휴대폰",
        options: {
          amount: number;
          orderId: string;
          orderName: string;
          customerName: string;
          customerEmail: string;
          successUrl: string;
          failUrl: string;
        }
      ) => Promise<void>;
    };
  }
}

export function TossCheckout({
  clientKey,
  order
}: {
  clientKey: string;
  order: {
    orderId: string;
    orderName: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    successUrl: string;
    failUrl: string;
  };
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestPayment() {
    if (!window.TossPayments || !clientKey) {
      setError("Toss Payments client key is not configured.");
      return;
    }

    setError(null);
    await window.TossPayments(clientKey).requestPayment("카드", {
      amount: order.amount,
      orderId: order.orderId,
      orderName: order.orderName,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      successUrl: order.successUrl,
      failUrl: order.failUrl
    });
  }

  return (
    <>
      <Script src="https://js.tosspayments.com/v1/payment" onLoad={() => setReady(true)} strategy="afterInteractive" />
      <Card className="glass-panel mx-auto max-w-xl">
        <CardContent className="p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 text-[#98763d]">
            <CreditCard className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Secure checkout</h1>
          <p className="mt-2 text-muted-foreground">Complete payment through Toss Payments to activate your KIOSQ purchase.</p>
          <div className="mt-7 rounded-3xl bg-white/80 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order</span>
              <span className="font-medium">{order.orderName}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-display text-3xl font-semibold">{formatKrw(order.amount)}</span>
            </div>
          </div>
          {error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
          <Button className="mt-7 w-full" size="lg" variant="accent" disabled={!ready || !clientKey} onClick={requestPayment}>
            Pay with Toss
          </Button>
          {!clientKey ? <p className="mt-3 text-center text-xs text-muted-foreground">Set NEXT_PUBLIC_TOSS_CLIENT_KEY before production checkout.</p> : null}
        </CardContent>
      </Card>
    </>
  );
}

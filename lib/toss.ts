import { absoluteUrl } from "@/lib/utils";

type TossConfirmResponse = {
  paymentKey: string;
  orderId: string;
  method?: string;
  totalAmount: number;
  receipt?: {
    url?: string;
  };
  status: string;
};

export function getTossClientKey() {
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
}

export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossConfirmResponse> {
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY is required to confirm payments.");
  }

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Toss payment confirmation failed: ${errorBody}`);
  }

  return response.json();
}

export function createPaymentRedirects(orderId: string) {
  return {
    successUrl: absoluteUrl(`/payments/success?orderId=${encodeURIComponent(orderId)}`),
    failUrl: absoluteUrl(`/payments/fail?orderId=${encodeURIComponent(orderId)}`)
  };
}

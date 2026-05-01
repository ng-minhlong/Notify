import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { plans } from "@/lib/plan";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function getData(payload: any) {
  return payload?.data ?? payload;
}

function getPriceId(data: any) {
  return (
    data?.items?.[0]?.price?.id ||
    data?.details?.line_items?.[0]?.price_id ||
    null
  );
}

function getProductId(data: any) {
  return (
    data?.items?.[0]?.price?.product_id ||
    data?.details?.line_items?.[0]?.product?.id ||
    null
  );
}

function getSubscriptionId(data: any) {
  return data?.subscription_id || data?.id;
}

function getCustomerId(data: any) {
  return data?.customer_id || data?.customer?.id || data?.customer?.customer_id;
}

function getCurrentPeriodEnd(data: any) {
  const value =
    data?.billing_period?.ends_at ||
    data?.details?.line_items?.[0]?.subscription?.current_billing_period?.ends_at ||
    data?.next_billed_at;

  return value ? Date.parse(value) : undefined;
}

function getUserId(data: any) {
  return (
    data?.custom_data?.userId ||
    data?.custom_data?.user_id ||
    data?.customer?.custom_data?.userId ||
    data?.customer?.custom_data?.user_id ||
    null
  );
}

function resolvePlanByPriceId(priceId: string | null) {
  if (!priceId) return null;

  const plan = plans.find((p) => p.priceId === priceId);
  if (!plan) return null;

  if (plan.name.toLowerCase() === "starter") return "starter";
  if (plan.name.toLowerCase() === "pro") return "pro";
  return null;
}
export async function POST(req: NextRequest) {
  const payload = await req.json();

  // 🔥 trả response ngay
  processWebhook(payload).catch((err) => {
    console.error("Webhook async error:", err);
  });

  return NextResponse.json({ ok: true });
}



async function processWebhook(payload: any) {
  const data = payload?.data ?? payload;

  const status = data?.status;
  const subscriptionId = data?.subscription_id || data?.id;
  const customerId = data?.customer_id;

  

  const priceId =
    data?.items?.[0]?.price?.id ||
    data?.details?.line_items?.[0]?.price_id;

  const userId =
    data?.custom_data?.userId ||
    data?.customer?.custom_data?.userId;

  const currentPeriodEnd = data?.billing_period?.ends_at
    ? Date.parse(data.billing_period.ends_at)
    : undefined;

  const plan = plans.find((p) => p.priceId === priceId);

  // 👉 log để debug
  console.log("Webhook received:", {
    status,
    subscriptionId,
    customerId,
    priceId,
    userId,
  });

  // ===== UPSERT SUBSCRIPTION =====
  await convex.mutation(api.subscription.upsertSubscriptionFromWebhook, {
    subscriptionId,
    customerId,
    status,
    priceId,
    currentPeriodEnd,
    userId,
  });

  // ===== UPDATE PLAN =====
  if (!userId) {
    console.warn("Missing userId → skip plan update");
    return;
  }

  

  if (status === "completed" && plan) {
    await convex.mutation(api.userPlan.updateUserPlanFromWebhook, {
        userId,
        plan:
            plan.name.toLowerCase() === "starter"
            ? "starter"
            : plan.name.toLowerCase() === "pro"
            ? "pro"
            : "free",
        status: "active",
        paddleCustomerId: customerId,
        paddleSubscriptionId: subscriptionId,
        currentPeriodEnd,
        });
  }
}
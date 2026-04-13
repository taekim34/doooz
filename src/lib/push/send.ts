import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  console.log("[PUSH] ensureVapid pub length:", pub?.length, "priv length:", priv?.length, "pub last5:", pub?.slice(-5));
  if (pub && priv) {
    try {
      webpush.setVapidDetails("mailto:noreply@do-ooz.vercel.app", pub, priv);
      vapidConfigured = true;
      console.log("[PUSH] VAPID configured OK");
    } catch (e) {
      console.error("[PUSH] VAPID config failed:", e);
    }
  }
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/**
 * Send push notification to all devices of given user IDs.
 * Silently removes expired subscriptions.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
) {
  console.log("[PUSH] sendPushToUsers called", { userIds, payload });

  if (userIds.length === 0) {
    console.log("[PUSH] no userIds, skipping");
    return;
  }
  ensureVapid();
  if (!vapidConfigured) {
    console.error("[PUSH] VAPID not configured, skipping");
    return;
  }

  const admin = createAdminClient();
  const { data: subs, error: subErr } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, keys_p256dh, keys_auth")
    .in("user_id", userIds);

  console.log("[PUSH] subscriptions found:", subs?.length ?? 0, subErr ? `error: ${subErr.message}` : "");

  if (!subs || subs.length === 0) return;

  const expiredIds: string[] = [];

  const results = await Promise.allSettled(
    (subs as Array<{ id: string; endpoint: string; keys_p256dh: string; keys_auth: string }>).map(
      async (sub) => {
        try {
          const result = await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            },
            JSON.stringify(payload),
          );
          console.log("[PUSH] sent OK to", sub.endpoint.slice(-20), "status:", result.statusCode);
          return result;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          console.error("[PUSH] send FAILED to", sub.endpoint.slice(-20), "status:", statusCode, err);
          if (statusCode === 410 || statusCode === 404) {
            expiredIds.push(sub.id);
          }
          throw err;
        }
      },
    ),
  );

  console.log("[PUSH] results:", results.map((r) => r.status));

  if (expiredIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", expiredIds);
    console.log("[PUSH] cleaned expired:", expiredIds.length);
  }
}

/**
 * Send push to all parents in a family.
 */
export async function pushToParents(familyId: string, payload: PushPayload) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("family_id", familyId)
    .eq("role", "parent");
  const ids = ((data ?? []) as Array<{ id: string }>).map((u) => u.id);
  await sendPushToUsers(ids, payload);
}

/**
 * Send push to a specific child.
 */
export async function pushToChild(childId: string, payload: PushPayload) {
  await sendPushToUsers([childId], payload);
}

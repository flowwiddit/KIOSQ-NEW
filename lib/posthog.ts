import { PostHog } from "posthog-node";

let posthog: PostHog | null = null;

export function getPostHogServer() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  if (!posthog) {
    posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
    });
  }

  return posthog;
}

export async function captureServerEvent(distinctId: string, event: string, properties?: Record<string, unknown>) {
  const client = getPostHogServer();

  if (!client) {
    return;
  }

  client.capture({
    distinctId,
    event,
    properties
  });

  await client.flush();
}

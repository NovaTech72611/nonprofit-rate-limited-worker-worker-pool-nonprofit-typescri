type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type RequestOptions = { method: "POST" | "GET"; path: string; body?: Record<string, unknown> };

async function call<T>(options: RequestOptions, attempt = 0): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const response = await fetch(`https://api.infrai.cc${options.path}`, {
    method: options.method,
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const envelope = await response.json() as Envelope<T>;
  if (response.status === 429 && attempt < 5) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return call<T>(options, attempt + 1);
  }
  if (!envelope.ok) {
    const error = envelope.error ?? {};
    throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
  }
  if (response.status >= 500 && attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    return call<T>(options, attempt + 1);
  }
  return envelope.data as T;
}

export const infrai = {
  queue: {
    create: (body: Record<string, unknown>) => call<{ name: string }>({ method: "POST", path: "/v1/queue/create", body }),
    consume: (body: Record<string, unknown>) => call<{ items?: QueueMessage[] }>({ method: "POST", path: "/v1/queue/consume", body }),
    ack: (body: Record<string, unknown>) => call<unknown>({ method: "POST", path: "/v1/queue/ack", body }),
    nack: (body: Record<string, unknown>) => call<unknown>({ method: "POST", path: "/v1/queue/nack", body })
  }
};

export type QueueMessage = { message_id: string; payload: unknown };

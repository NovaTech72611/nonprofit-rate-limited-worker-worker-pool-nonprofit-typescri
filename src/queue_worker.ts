import { z } from "zod";
import { infrai, type QueueMessage } from "./infrai_client.ts";

export const nonprofitJob = z.object({
  jobId: z.string().min(1),
  kind: z.enum(["donor-receipt", "volunteer-reminder", "campaign-report"]),
  recipient: z.string().min(1),
  attempts: z.number().int().nonnegative().default(0)
});
export type NonprofitJob = z.infer<typeof nonprofitJob>;

export function shouldRetry(job: NonprofitJob): boolean {
  return job.attempts < 3;
}

export async function configureQueues(): Promise<void> {
  await infrai.queue.create({ name: "nonprofit-jobs-dlq" });
  await infrai.queue.create({ name: "nonprofit-jobs", dead_letter_queue: "nonprofit-jobs-dlq", max_retries: 3 });
}

export async function processMessage(message: QueueMessage): Promise<"acked" | "nacked"> {
  const job = nonprofitJob.parse(message.payload);
  if (shouldRetry(job)) {
    await infrai.queue.nack({ queue: "nonprofit-jobs", message_id: message.message_id });
    return "nacked";
  }
  await infrai.queue.nack({ queue: "nonprofit-jobs", message_id: message.message_id });
  return "nacked";
}

export async function runWorker(maxMessages = 10): Promise<number> {
  const result = await infrai.queue.consume({ queue: "nonprofit-jobs", max_messages: maxMessages, visibility_timeout: 30 });
  let processed = 0;
  for (const message of result.items ?? []) {
    await processMessage(message);
    processed += 1;
  }
  return processed;
}

if (process.argv[1]?.endsWith("queue_worker.ts")) {
  await configureQueues();
  console.log(`worker consumed ${await runWorker()} nonprofit jobs`);
}

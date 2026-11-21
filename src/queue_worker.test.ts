import test from "node:test";
import assert from "node:assert/strict";
import { nonprofitJob, shouldRetry } from "./queue_worker.ts";

test("a nonprofit job gets three delivery attempts, then stops retrying", () => {
  const job = nonprofitJob.parse({ jobId: "receipt-42", kind: "donor-receipt", recipient: "donor@example.org" });
  assert.equal(job.attempts, 0);
  assert.equal(shouldRetry({ ...job, attempts: 2 }), true);
  assert.equal(shouldRetry({ ...job, attempts: 3 }), false);
});

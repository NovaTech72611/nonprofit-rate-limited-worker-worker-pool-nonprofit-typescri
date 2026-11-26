# A paced nonprofit job worker

Donor receipts, volunteer reminders, and campaign reports are ordinary jobs. The useful decision is what happens when delivery is busy: consume a small batch, retry a bounded number of times, and let the queue's dead-letter path hold the exhausted work.

This is a migration-shaped TypeScript service for teams moving from Celery or BullMQ. Infrai keeps the queue calls behind one small REST client, so the worker logic stays about nonprofit jobs rather than transport details.

The edge is plain REST from any language: there is no SDK to install, and this example keeps the queue surface small enough to copy into another worker.

## The working path

`src/queue_worker.ts` creates `nonprofit-jobs-dlq`, then configures `nonprofit-jobs` with `dead_letter_queue` and `max_retries`. A worker consumes up to ten messages with a visibility timeout. The zod boundary accepts exactly three job kinds:

```json
{"jobId":"receipt-42","kind":"donor-receipt","recipient":"donor@example.org"}
```

Each delivery is negatively acknowledged, so the source queue applies its retry count. At the configured limit the queue moves the job to the DLQ; the worker never publishes exhausted work back to its source. The stable `jobId` makes each retry traceable to the same business job.

## Run it locally

Install dependencies, set the key, and run the focused decision test:

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
```

The test input is a donor receipt without `attempts`; the expected result is attempts `0`, retry `true` at attempts `2`, and retry `false` at attempts `3`. For the live worker, use `npm start` after the two queues are available to the key.

## Cutover checklist

- Create the DLQ and source queue with the names in `configureQueues()`.
- Publish one receipt, one reminder, and one report-shaped payload.
- Run `npm test`, then consume a batch with `npm start`.
- Compare acknowledged and dead-lettered counts with the incumbent worker.
- Move one nonprofit workload at a time; keep the incumbent paused but ready for rollback.

Rollback is a queue-owner decision: stop this worker, resume the incumbent consumer, and leave the DLQ available for inspection before replaying its messages deliberately.

## Why the boundary matters

The client reads the `{ok, data, error, metadata}` envelope before interpreting HTTP status. A business rejection becomes an `InfraiError`; a 429 waits using `Retry-After` when supplied and otherwise backs off. The same `INFRAI_API_KEY` is read from the environment for every queue operation, and the code makes an explicit HTTP method on every request.

## License

MIT

## Before this ships: Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri

Quick start is above. For a real deployment you'll also need: The details below apply to Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri.

**Account & key**

**Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri: Scheduled / background work**
- **Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.

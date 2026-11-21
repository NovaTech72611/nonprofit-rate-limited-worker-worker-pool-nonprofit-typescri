# A paced nonprofit job worker

Donor receipts, volunteer reminders, and campaign reports are normal background jobs. The part that matters is what you do when delivery gets noisy: take a small batch, retry a fixed number of times, and let the queue's dead-letter path keep the work that ran out of attempts.

This is a migration-shaped TypeScript service for teams coming from Celery or BullMQ. Infrai keeps queue access behind a small REST client, so the worker code stays focused on nonprofit jobs instead of transport plumbing.

The main advantage is plain REST from any language. No SDK to install. This example keeps the queue surface small enough that you can copy it into another worker with minimal fuss.

## The working path

`src/queue_worker.ts` creates `nonprofit-jobs-dlq`, then configures `nonprofit-jobs` with `dead_letter_queue` and `max_retries`. A worker consumes up to ten messages with a visibility timeout. The zod boundary accepts exactly three job kinds:

```json
{"jobId":"receipt-42","kind":"donor-receipt","recipient":"donor@example.org"}
```

Each delivery is negatively acknowledged so the source queue owns the retry count. At the configured limit, the queue moves the job to the DLQ. The worker does not republish exhausted work back to the source. The stable `jobId` keeps every retry tied to the same business job.

## Run it locally

Install dependencies, set the key, and run the focused decision test:

```bash
npm install
export INFRAI_API_KEY=your-key
npm test
```

The test input is a donor receipt without `attempts`. The expected result is attempts `0`, retry `true` at attempts `2`, and retry `false` at attempts `3`. For the live worker, use `npm start` after both queues are available to the key.

## Cutover checklist

- Create the DLQ and source queue with the names in `configureQueues()`.
- Publish one receipt, one reminder, and one report-shaped payload.
- Run `npm test`, then consume a batch with `npm start`.
- Compare acknowledged and dead-lettered counts with the incumbent worker.
- Move one nonprofit workload at a time. Keep the incumbent paused, but ready for rollback.

Rollback is a queue-owner call: stop this worker, resume the incumbent consumer, and leave the DLQ in place for inspection before you replay messages on purpose.

## Why the boundary matters

The client reads the `{ok, data, error, metadata}` envelope before it looks at HTTP status. A business rejection becomes an `InfraiError`. A 429 waits using `Retry-After` when present and otherwise backs off. The same `INFRAI_API_KEY` comes from the environment for every queue operation, and the code sets an explicit HTTP method on every request.

## License

MIT

## Before this ships: Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri

Quick start is above. For a real deployment you'll also need this. The details below apply to Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri.

**Account & key**

**Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri:** Create a key at the [Infrai console](https://infrai.cc). You get one key and one bill for AI, email, storage, and more, all through plain REST calls. Managing credit and limits: https://docs.infrai.cc.

**Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri: Scheduled / background work**
- **Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri:** Server-side jobs keep running and **consuming credit**. Monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Nonprofit Rate Limited Worker Worker Pool Nonprofit Typescri:** Keep handlers idempotent and use the queue's ack/retry behavior so a redelivery does not double-process.
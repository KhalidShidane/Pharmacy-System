const mongoose = require('mongoose');

function isTransactionsUnsupported(err) {
  return (
    err?.code === 20 ||
    /Transaction numbers/i.test(err?.message || '') ||
    /IllegalOperation/i.test(err?.codeName || '')
  );
}

/**
 * Runs `work(session)` inside a Mongo transaction. Standalone MongoDB
 * instances (common in local dev) don't support transactions at all, so if
 * the very first operation fails for that reason, we transparently retry
 * once without a session. Production should run against a replica set
 * (Atlas always is) so writes stay atomic there.
 */
async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    if (isTransactionsUnsupported(err)) {
      return work(null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = withTransaction;

// src/components/ReviewPanel.jsx
import React from "react";

export default function ReviewPanel({ reviews, tasks, vote }) {
  if (!reviews.length)
    return <p className="italic text-gray-500">No active reviews.</p>;

  return (
    <div className="space-y-4">
      {reviews.map(r => (
        <ReviewCard
          key={r.id}
          r={r}
          task={tasks.find(t => t.id === r.id)}  // ← pass matching task
          vote={vote}
        />
      ))}
    </div>
  );
}

function ReviewCard({ r, task, vote }) {
  const total = r.yes + r.no;

  // find this reviewer’s submission
  const sub = task?.submissions.find(s => s.worker === r.worker);

  return (
    <div className="border rounded p-4 space-y-2">
      <h3 className="font-semibold text-lg">
        Review for Task #{r.id.toString()}
      </h3>

      <p className="text-sm">
        Submitted by{" "}
        <span className="font-semibold">{r.workerName || r.worker}</span>
      </p>

      {/* ── NEW: proof link ── */}
      {sub?.proof && (
        <p className="text-sm">
          Proof:{" "}
          <a
            href={sub.proof}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {sub.proof}
          </a>
        </p>
      )}

      <div className="flex items-center gap-2">
        <span className="px-2 bg-green-200 text-green-800 rounded text-xs">
          Yes {r.yes}
        </span>
        <span className="px-2 bg-red-200 text-red-800 rounded text-xs">
          No {r.no}
        </span>
        <span className="text-xs text-gray-600">{total}/3 votes</span>
      </div>

      {!r.iVoted ? (
        <div className="flex gap-2">
          <button
            onClick={() => vote(r.id, true)}
            className="bg-green-600 text-white px-3 py-1 rounded"
          >
            Vote Yes
          </button>
          <button
            onClick={() => vote(r.id, false)}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Vote No
          </button>
        </div>
      ) : (
        <p className="text-sm italic text-gray-500">You already voted.</p>
      )}
    </div>
  );
}

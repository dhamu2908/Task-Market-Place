import React, { useState } from "react";
import { ethers } from "ethers";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Format reward to avoid scientific notation or long zeros
function formatReward(weiBN) {
  const eth = parseFloat(ethers.formatEther(weiBN));
  if (eth === 0) return "0";
  if (eth < 0.000001) return eth.toExponential(2); // e.g. "3.40e-9"
  return eth.toFixed(6).replace(/\.?0+$/g, "");    // trim trailing zeros
}

export default function TaskCard({ t, me, onClaim, onSubmit, onApprove, onReject, onDispute }) {
  // console.log("Rendering TaskCard:", t); 
  // console.log("Id :", t.id);

  const isClient = me === t.client;
  const mySub    = t.submissions.find(s => s.worker === me);

  // compute deadline and expired flag
  const deadlineDt = dayjs.unix(t.deadline);
  const expired    = dayjs().isAfter(deadlineDt);

  return (
    <div className="border p-4 rounded space-y-2">
      <header className="flex justify-between items-center">
        {/* <h2 className="text-lg font-semibold">Task #{t.id}</h2> */}
         <h2 className="font-semibold">
  Task #{t.id.toString()}
 </h2>
        <span className="italic">{t.status}</span>
      </header>


      <p>
        CreatedBy: <b>{t.clientName}</b>
      </p>
      <p>
        Reward: <b>{formatReward(t.reward)} ℏ</b>
      </p>

      <p className="flex items-baseline gap-2">
        Deadline:
        <time dateTime={deadlineDt.toISOString()} className="font-medium">
          {deadlineDt.format("MM/D/YYYY, h:mm A")}
        </time>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            expired ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
          }`}
        >
          {expired ? deadlineDt.fromNow() : `in ${deadlineDt.fromNow(true)}`}
        </span>
      </p>

      {/* ───── Buttons depending on role / state ───── */}
      {t.state === 0 && !isClient && !mySub && (
        <button
          onClick={() => onClaim(t.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Claim
        </button>
      )}

      {mySub && !mySub.submitted && (
        <SubmitBox onSubmit={link => onSubmit(t.id, link)} />
      )}

      {isClient && t.status === "Submitted" && t.submissions.map(s => (
        <div key={s.worker} className="ml-2 py-1 flex items-center space-x-2">
          <a
            href={s.proof}
            className="text-blue-600 underline"
            target="_blank"
            rel="noreferrer"
          >
            Proof by {s.name}
          </a>
          <button
            onClick={() => onApprove(t.id, s.worker)}
            className="bg-green-600 text-white px-2 rounded"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(t.id, s.worker)}
            className="bg-red-600 text-white px-2 rounded"
          >
            Reject
          </button>
        </div>
      ))}

    {mySub && mySub.rejected && (
    <div className="mt-2">
      <span className="text-red-600 font-semibold">
        Your submission was rejected.
      </span>
      <button
        onClick={() => onDispute(t.id)}
        className="ml-2 bg-orange-600 text-white px-3 py-1 rounded"
      >
        Raise Dispute
      </button>
    </div>
    )}

    </div>
  );
}

function SubmitBox({ onSubmit }) {
  const [link, setLink] = useState("");
  return (
    <div className="space-x-1 mt-2">
      <input
        value={link}
        onChange={e => setLink(e.target.value)}
        placeholder="Proof URL"
        className="border px-2 py-1 w-72"
      />
      <button
        onClick={() => onSubmit(link)}
        className="bg-purple-600 text-white px-2 py-1 rounded"
      >
        Submit
      </button>
    </div>
  );
}

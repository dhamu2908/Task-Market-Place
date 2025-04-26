import React, { useState, useEffect } from "react";
import NameForm from "./NameForm";

export default function Header({
  me,
  myName,
  balance,    // ← now received as prop
  contract,
  connect,
  reload
}) {
  /* dark-mode toggle */
  const [dark, setDark] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          Tasks And  Bounties
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500 text-white">
            IITM
          </span>
        </h1>
        <label className="cursor-pointer select-none ml-2">
          <input
            type="checkbox"
            checked={dark}
            onChange={e => setDark(e.target.checked)}
            className="hidden"
          />
          <span className="inline-block w-5 h-5 text-yellow-400">
            {dark ? "🌙" : "☀️"}
          </span>
        </label>
      </div>

      {me ? (
        <div className="flex items-center gap-3">
          <span className="truncate bg-indigo-600 text-white px-3 py-1 rounded max-w-[10rem]">
            {me.slice(0, 6)}…{me.slice(-4)}
          </span>

          {/* display HBAR balance */}
          <span className="text-sm font-mono bg-green-600 text-white px-2 py-1 rounded">
            {balance} ℏ
          </span>

          <NameForm contract={contract} myName={myName} refresh={reload} />
        </div>
      ) : (
        <button onClick={connect} className="btn btn-primary">
          Connect
        </button>
      )}
    </header>
  );
}

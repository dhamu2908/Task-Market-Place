import { useState, useEffect } from "react";

export default function NameForm({ contract, myName, refresh }) {
  const [name, setName]   = useState(myName ?? "");
  const [open, setOpen]   = useState(!myName);   // auto-open first time
  const [busy, setBusy]   = useState(false);

  /* keep input synced if parent reloads */
  useEffect(() => setName(myName ?? ""), [myName]);

  async function save() {
    if (!name.trim()) return alert("Name cannot be empty");
    setBusy(true);
    try {
      const tx = await contract.setName(name.trim());
      await tx.wait();
      await refresh();              // pull fresh name + tasks
      setOpen(false);
    } catch (e) {
      alert(e.reason ?? e.message);
    } finally { setBusy(false); }
  }

  if (!contract) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
      >
        {myName ? "Edit name" : "Set name"}
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded p-6 w-72 space-y-4 shadow-lg">
            <h2 className="font-semibold text-lg">
              {myName ? "Change display name" : "Set your display name"}
            </h2>

            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. satya_bhagavan"
              className="border w-full px-2 py-1"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState } from "react";
export default function SubmitBox({ onSend }) {
  const [link, set] = useState("");
  return (
    <div className="flex gap-1 mt-2">
      <input className="input flex-1" value={link} placeholder="proof link"
             onChange={e => set(e.target.value)} />
      <button onClick={() => { onSend(link); set(""); }}
              className="bg-purple-600 text-white px-3 rounded">
        Submit
      </button>
    </div>
  );
}

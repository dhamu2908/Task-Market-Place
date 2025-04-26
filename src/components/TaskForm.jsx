import { useState } from "react";
export default function TaskForm({ onCreate }) {
  const [desc, setDesc]       = useState("");
  const [reward, setReward]   = useState("");
  const [deadline, setDl]     = useState("");   // unix seconds

  return (
    <form className="space-x-2 mb-4"
          onSubmit={e => {e.preventDefault();
                          onCreate({ desc, rewardEth: reward,
                                     deadline: Math.floor(new Date(deadline)/1000) });
                          setDesc(""); setReward("");}}>
      <input value={desc} onChange={e=>setDesc(e.target.value)}
             placeholder="Description" className="border px-2 py-1" required/>
      <input value={reward} onChange={e=>setReward(e.target.value)}
             placeholder="Reward (ℏ)" className="border w-24 px-2 py-1" required/>
      <input type="datetime-local"
             onChange={e=>setDl(e.target.value)}
             className="border px-2 py-1" required/>
      <button className="bg-green-600 text-white px-3 py-1 rounded">Create</button>
    </form>
  );
}

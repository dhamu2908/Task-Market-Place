export default function Navbar({ view, setView, isJudge }) {
    const btn = (id, label) => (
      <button
        onClick={() => setView(id)}
        className={`px-3 py-1 rounded
          ${view === id
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 hover:bg-gray-300"}`}
      >
        {label}
      </button>
    );
  
    return (
      <nav className="flex gap-2 flex-wrap mb-4">
        {btn("open",   "Open Tasks")}
        {btn("mine",   "My Tasks")}
        {btn("create", "Create")}
             {/* new “My Submissions” button */}
     <button
        onClick={() => setView("submitted")}
        className={`px-3 py-1 rounded ${
          view === "submitted"
           ? "bg-indigo-600 text-white"
           : "bg-gray-200 hover:bg-gray-300"       }`}
      >
        My Submissions
      </button>
        {isJudge && btn("judge", "Judge Panel")}
      </nav>
    );
  }
  
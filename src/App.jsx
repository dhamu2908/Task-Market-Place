import React, { useState, useMemo,useEffect  } from "react";
import { Toaster } from "react-hot-toast";
import useMarketplace from "./hooks/useMarketplace";

import Header      from "./components/Header";
import Navbar      from "./components/Navbar";
import TaskForm    from "./components/TaskForm";
import TaskCard    from "./components/TaskCard";
import ReviewPanel from "./components/ReviewPanel";

export default function App() {
  const mp = useMarketplace();
  const {
    me,
    myName,
    balance,
    tasks,
    reviews,
    isJudge,
    reload,
    connect,
    createTask,
    claimTask,
    submitTask,
    approveTask,
    rejectSub,
    raiseDispute,
    voteReview
  } = mp;

  const [view, setView] = useState("open");

  useEffect(() => {
    if (view === "judge" && isJudge) {
      reload();
    }
  }, [view, isJudge, reload]);

  // Tasks I created
  const myTasks = useMemo(
    () => tasks.filter(t => t.client.toLowerCase() === me?.toLowerCase()),
    [tasks, me]
  );

  // Tasks I’ve ever submitted to
  const mySubmissions = useMemo(
    () =>
      tasks.filter(t =>
        t.submissions.some(s => s.worker.toLowerCase() === me?.toLowerCase())
      ),
    [tasks, me]
  );

  // Open tasks that I neither created nor claimed
  const openTasksForMe = useMemo(
    () =>
      tasks.filter(
        t =>
          t.client.toLowerCase() !== me?.toLowerCase() &&
          !t.submissions.some(s => s.worker.toLowerCase() === me?.toLowerCase())
      ),
    [tasks, me]
  );

  return (
    <>
      <Toaster position="top-right" />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <Header
          me={me}
          myName={myName}
          balance={balance}
          contract={mp.contract}
          connect={connect}
          reload={mp.reload}
        />

        {me ? (
          <>
            <Navbar view={view} setView={setView} isJudge={isJudge} />

            {/* Create */}
            {view === "create" && (
              <TaskForm onCreate={createTask} />
            )}

            {/* Open (filtered) */}
            {view === "open" && (
              <TaskList
                list={openTasksForMe}
                me={me}
                onClaim={claimTask}
                onSubmit={submitTask}
                onApprove={approveTask}
                onReject={rejectSub}
                onDispute={raiseDispute}
                emptyText="No new tasks available."
              />
            )}

            {/* My Tasks */}
            {view === "mine" && (
              <TaskList
                list={myTasks}
                me={me}
                onClaim={claimTask}
                onSubmit={submitTask}
                onApprove={approveTask}
                onReject={rejectSub}
                onDispute={raiseDispute}
                emptyText="You haven’t created any tasks yet."
              />
            )}

            {/* My Submissions */}
            {view === "submitted" && (
              <TaskList
                list={mySubmissions}
                me={me}
                onClaim={claimTask}           // if you want them to reclaim
                onSubmit={submitTask}         // ← now SubmitBox will call this
                onReject={rejectSub}          // optional: let them retract
                onDispute={raiseDispute}
                emptyText="You haven’t submitted to any tasks yet."
              />
            )}

            {/* Judge Panel */}
            {view === "judge" && isJudge && (
              <ReviewPanel
                reviews={reviews}
                tasks={tasks}           // ← add this
                vote={voteReview}
              />
            )}
          </>
        ) : (
          <p className="text-center italic text-gray-500">
            Connect your wallet to get started.
          </p>
        )}
      </main>
    </>
  );
}

/* small helper component */
// src/App.jsx (bottom of file)

// at the bottom of src/App.jsx (or wherever TaskList lives)

function TaskList({
  list,
  me,
  onClaim   = () => {},
  onSubmit  = () => {},
  onApprove = () => {},
  onReject  = () => {},
  onDispute = () => {},
  emptyText
}) {
  return (
    <section className="space-y-4">
      {list.map(t => (
        <TaskCard
          key={t.id.toString()}
          t={t}
          me={me}
          onClaim={onClaim}
          onSubmit={onSubmit}
          onApprove={onApprove}
          onReject={onReject}
          onDispute={onDispute}
        />
      ))}
      {!list.length && (
        <p className="text-center italic text-gray-500">{emptyText}</p>
      )}
    </section>
  );
}



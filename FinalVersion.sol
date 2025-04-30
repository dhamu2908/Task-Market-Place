// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HederaTaskMarketplace {
    /* ─────────── Types ─────────── */

    enum TaskState { Open, Completed, Cancelled }
    enum Vote     { None, Yes, No }
    enum SubmissionStatus { None, Claimed, Submitted, Approved, Rejected }

    struct Task {
        address payable client;
        string  name;         
        string  description;  // 🆕 Added
        uint256 reward;
        uint256 deadline;
        TaskState state;
        address payable approvedWorker;
        string status; // Open | Claimed | Submitted | Approved | Cancelled | Rejected
    }

    struct Submission {
        address payable worker;
        string  name;
        string  proof;
        bool    submitted;
        bool    rejected;
    }

    struct ReviewRequest {
        bool    active;
        mapping(address => Vote) voted;
        uint256 yesVotes;
        uint256 noVotes;
        address payable worker;
    }

    /* ─────────── Storage ─────────── */

    uint8 private constant JUDGE_COUNT = 3;

    mapping(address => bool) public isJudge;
    uint256 public taskCount;

    mapping(uint256 => Task) public tasks;
    mapping(uint256 => Submission[]) private taskSubs;
    mapping(address => mapping(uint256 => SubmissionStatus)) public submissionStatus;
    mapping(uint256 => ReviewRequest) private reviewReq;
    mapping(address => uint256) public reputation;
    mapping(address => string) public nameOf;
    uint256[] private taskIds;

    bool private locked;
    modifier nonReentrant() { require(!locked); locked = true; _; locked = false; }
    modifier validTask(uint256 id) { require(id > 0 && id <= taskCount, "Bad id"); _; }
    modifier onlyClient(uint256 id) { require(msg.sender == tasks[id].client, "Not client"); _; }

    /* ─────────── Events ─────────── */

    event TaskCreated(uint256 id, address client, string desc, uint256 reward, uint256 deadline);
    event TaskClaimed(uint256 id, address worker, string name);
    event TaskSubmitted(uint256 id, address worker, string proof, string name);
    event TaskApproved(uint256 id, address client, address worker, uint256 reward, string workerName);
    event TaskRejected(uint256 id, address worker);
    event TaskCancelled(uint256 id);
    event ReviewRequested(uint256 id, address worker);
    event ReviewVoted(uint256 id, address judge, bool yes);

    /* ─────────── Constructor ─────────── */

    constructor() {
        isJudge[0x71B5742419d93AaDc89094209e219197AcDC2475] = true;
        isJudge[0x1C65dadE06339b2fe79E2DB9174c4647a0F73521] = true;
        isJudge[0x80314D31c0f83a59523F83B3881D14fB4360a90c] = true;
    }

    /* ─────────── Name and Reputation Helpers ─────────── */

    function setName(string calldata n) external { nameOf[msg.sender] = n; }
    function getMyName() external view returns (string memory) { return nameOf[msg.sender]; }
    function getName(address user) external view returns (string memory) { return nameOf[user]; }
    function getReputation(address a) external view returns (uint256) { return reputation[a]; }

    /* ─────────── View Helpers ─────────── */

    function getOpenTaskIds() external view returns (uint256[] memory ids) {
        ids = new uint256[](taskIds.length);
        uint n;
        for (uint i; i < taskIds.length; ++i)
            if (tasks[taskIds[i]].state == TaskState.Open) ids[n++] = taskIds[i];
        assembly { mstore(ids, n) }
    }

    function getAllTaskIds() external view returns (uint256[] memory) {
        return taskIds;
    }

    function getTask(uint256 id) external view validTask(id) returns (Task memory) {
        return tasks[id];
    }

    function getSubmissions(uint256 id)
        external
        view
        validTask(id)
        returns (Submission[] memory subs, string memory description)
    {
        subs        = taskSubs[id];
        description = tasks[id].description;
    }

    function getSubmissionStatus(uint256 id, address user)
        external
        view
        validTask(id)
        returns (SubmissionStatus)
    {
        return submissionStatus[user][id];
    }

    /* ─────────── Task Lifecycle ─────────── */

    function createTask(string calldata desc, uint256 deadline) external payable {
        require(msg.value > 0, "Reward 0");
        require(deadline > block.timestamp, "Past deadline");
        require(bytes(nameOf[msg.sender]).length != 0, "Set name first");

        ++taskCount;
        uint256 id = taskCount;

        tasks[id] = Task({
            client: payable(msg.sender),
            name: nameOf[msg.sender],
            description: desc,     // 🆕 Save description
            reward: msg.value,
            deadline: deadline,
            state: TaskState.Open,
            approvedWorker: payable(address(0)),
            status: "Open"
        });

        taskIds.push(id);
        emit TaskCreated(id, msg.sender, desc, msg.value, deadline);
    }

    function claimTask(uint256 id) external validTask(id) {
        Task storage t = tasks[id];
        require(t.state == TaskState.Open && block.timestamp < t.deadline);
        require(bytes(nameOf[msg.sender]).length != 0, "Set name");
        require(submissionStatus[msg.sender][id] == SubmissionStatus.None, "Already claimed");

        taskSubs[id].push(Submission({
            worker: payable(msg.sender),
            name: nameOf[msg.sender],
            proof: "",
            submitted: false,
            rejected: false
        }));

        submissionStatus[msg.sender][id] = SubmissionStatus.Claimed;
        t.status = "Claimed";

        emit TaskClaimed(id, msg.sender, nameOf[msg.sender]);
    }

    function submitTask(uint256 id, string calldata proof) external validTask(id) {
        Task storage t = tasks[id];
        require(t.state == TaskState.Open && block.timestamp <= t.deadline);
        require(submissionStatus[msg.sender][id] == SubmissionStatus.Claimed, "Not claimed");

        Submission[] storage subs = taskSubs[id];
        bool ok;
        for (uint i = 0; i < subs.length; ++i)
            if (subs[i].worker == msg.sender) {
                subs[i].proof = proof;
                subs[i].submitted = true;
                subs[i].rejected = false;
                subs[i].name = nameOf[msg.sender];
                ok = true;
                break;
            }
        require(ok, "Not claimant");

        submissionStatus[msg.sender][id] = SubmissionStatus.Submitted;
        t.status = "Submitted";

        emit TaskSubmitted(id, msg.sender, proof, nameOf[msg.sender]);
    }

    function approveTask(uint256 id, address payable w) external validTask(id) onlyClient(id) nonReentrant {
        Task storage t = tasks[id];
        require(t.state == TaskState.Open && block.timestamp <= t.deadline);
        require(submissionStatus[w][id] == SubmissionStatus.Submitted, "No submission");

        Submission[] storage subs = taskSubs[id];
        bool found;
        for (uint i = 0; i < subs.length; ++i)
            if (subs[i].worker == w) { found = true; break; }
        require(found, "Worker not found");

        t.state = TaskState.Completed;
        t.status = "Approved";
        t.approvedWorker = w;

        uint256 payout = t.reward;
        t.reward = 0;
        w.transfer(payout);

        reputation[w]++;
        reputation[t.client]++;
        submissionStatus[w][id] = SubmissionStatus.Approved;

        emit TaskApproved(id, t.client, w, payout, nameOf[w]);
    }

    function rejectSubmission(uint256 id, address payable w) external validTask(id) onlyClient(id) {
        Task storage t = tasks[id];
        require(t.state == TaskState.Open, "Closed");

        Submission[] storage subs = taskSubs[id];
        bool found;
        for (uint i = 0; i < subs.length; ++i)
            if (subs[i].worker == w) {
                subs[i].rejected = true;
                found = true;
                break;
            }
        require(found, "Worker not found");

        submissionStatus[w][id] = SubmissionStatus.Rejected;
        emit TaskRejected(id, w);

        bool any;
        for (uint i = 0; i < subs.length; ++i)
            if (subs[i].submitted) { any = true; break; }
        if (!any) t.status = "Rejected";
    }

    function cancelTask(uint256 id) external validTask(id) onlyClient(id) nonReentrant {
        Task storage t = tasks[id];
        require(t.state == TaskState.Open, "Already finished");

        Submission[] storage subs = taskSubs[id];
        for (uint i = 0; i < subs.length; ++i) {
            require(!subs[i].submitted, "Submission exists");
        }

        t.state = TaskState.Cancelled;
        t.status = "Cancelled";

        uint256 refund = t.reward;
        t.reward = 0;
        t.client.transfer(refund);

        emit TaskCancelled(id);
    }

    /* ─────────── Review Flow ─────────── */

    function raiseReviewRequest(uint256 id) external validTask(id) {
        ReviewRequest storage r = reviewReq[id];
        require(!r.active, "Review active");

        Submission[] storage subs = taskSubs[id];
        bool ok;
        for (uint i = 0; i < subs.length; ++i) {
            if (subs[i].worker == msg.sender && subs[i].rejected) {
                ok = true;
                break;
            }
        }
        require(ok, "Not eligible");

        r.active = true;
        r.worker = payable(msg.sender);
        emit ReviewRequested(id, msg.sender);
    }

    function voteOnReview(uint256 id, bool yes) external validTask(id) {
        require(isJudge[msg.sender], "Not judge");
        ReviewRequest storage r = reviewReq[id];
        require(r.active && r.voted[msg.sender] == Vote.None, "Already voted / no review");

        r.voted[msg.sender] = yes ? Vote.Yes : Vote.No;
        if (yes) r.yesVotes++; else r.noVotes++;
        emit ReviewVoted(id, msg.sender, yes);

        if (r.yesVotes + r.noVotes == JUDGE_COUNT) _finalizeReview(id, r);
    }

    function _finalizeReview(uint256 id, ReviewRequest storage r) internal nonReentrant {
        Task storage t = tasks[id];
        if (r.yesVotes > r.noVotes && t.state == TaskState.Open && t.reward > 0) {
            t.state = TaskState.Completed;
            t.status = "Approved";
            t.approvedWorker = r.worker;

            uint payout = t.reward;
            t.reward = 0;
            r.worker.transfer(payout);

            reputation[r.worker]++;
            reputation[t.client]++;
            submissionStatus[r.worker][id] = SubmissionStatus.Approved;

            emit TaskApproved(id, t.client, r.worker, payout, nameOf[r.worker]);

            Submission[] storage subs = taskSubs[id];
            for (uint i = 0; i < subs.length; ++i) {
                if (subs[i].worker != r.worker) {
                    emit TaskRejected(id, subs[i].worker);
                }
            }
        }
        r.active = false;
    }

    /* ─────────── Review View Helpers ─────────── */

    function getActiveReviewIds() external view returns (uint256[] memory ids) {
        uint count;
        for (uint i = 1; i <= taskCount; ++i) {
            if (reviewReq[i].active) count++;
        }

        ids = new uint[](count);
        uint n;
        for (uint i = 1; i <= taskCount; ++i) {
            if (reviewReq[i].active) ids[n++] = i;
        }
    }

    function getReviewStatus(uint256 id) external view validTask(id)
        returns (bool active, uint256 yes, uint256 no, bool iVoted, address worker)
    {
        ReviewRequest storage r = reviewReq[id];
        return (
            r.active,
            r.yesVotes,
            r.noVotes,
            r.voted[msg.sender] != Vote.None,
            r.worker
        );
    }
}

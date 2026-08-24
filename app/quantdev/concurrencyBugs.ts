// Forensic concurrency defects.
//
// These are read, not executed: the sandbox runs JavaScript in a Web Worker
// and cannot compile or run C++, so there is no honest way to produce a real
// ThreadSanitizer verdict here. What it can test is the thing the interview
// actually tests — can you point at the defective line and name the fix.

export type Fix = { text: string; correct: boolean; why: string };

export type ConcurrencyCase = {
  id: string;
  title: string;
  premise: string;
  /** Source lines, 1-indexed on display. */
  code: string[];
  /** 1-indexed line number carrying the defect. */
  bugLine: number;
  bugName: string;
  bugExplain: string;
  fixes: Fix[];
};

export const CASES: ConcurrencyCase[] = [
  {
    id: "counter",
    title: "The shared counter",
    premise: "Eight threads each increment a global counter 100,000 times. The final total is short, and short by a different amount every run.",
    code: [
      "long counter = 0;",
      "",
      "void worker(int n) {",
      "    for (int i = 0; i < n; ++i) {",
      "        counter++;",
      "    }",
      "}",
      "",
      "int main() {",
      "    std::vector<std::thread> ts;",
      "    for (int i = 0; i < 8; ++i)",
      "        ts.emplace_back(worker, 100000);",
      "    for (auto& t : ts) t.join();",
      "    std::cout << counter << '\\n';",
      "}",
    ],
    bugLine: 5,
    bugName: "Data race",
    bugExplain:
      "counter++ is a read-modify-write: load, add one, store. Two threads can load the same value and both store the same result, so an increment is lost. Concurrent unsynchronised access to a non-atomic object is a data race, which is undefined behaviour — not merely a wrong number.",
    fixes: [
      {
        text: "std::atomic<long> counter{0}; and counter.fetch_add(1, std::memory_order_relaxed);",
        correct: true,
        why: "Makes the increment indivisible. Relaxed is sufficient and correct here: the only requirement is atomicity of the counter itself, and the join() calls already establish the happens-before edge needed to read the final value safely.",
      },
      {
        text: "Declare it volatile long counter;",
        correct: false,
        why: "A common and costly misconception. In C++ volatile means 'do not optimise away this access' — it is for memory-mapped hardware. It provides neither atomicity nor inter-thread ordering, so the race is entirely unfixed.",
      },
      {
        text: "Take a std::lock_guard around the whole for-loop in worker().",
        correct: false,
        why: "It does remove the race, but by serialising the entire loop each thread runs to completion while the others block — you have written single-threaded code with extra steps.",
      },
      {
        text: "Give each thread its own local counter and sum them after join().",
        correct: false,
        why: "Genuinely correct and often the fastest answer in production. But it changes the program's structure rather than fixing the defect on this line, and the interviewer asked what is wrong with this code.",
      },
    ],
  },
  {
    id: "condvar",
    title: "The consumer that wakes too early",
    premise: "A worker pool drains a task queue. Occasionally a consumer crashes dereferencing the front of an empty queue.",
    code: [
      "std::queue<Task> q;",
      "std::mutex m;",
      "std::condition_variable cv;",
      "",
      "void consumer() {",
      "    std::unique_lock<std::mutex> lock(m);",
      "    cv.wait(lock);",
      "    Task t = q.front();",
      "    q.pop();",
      "    process(t);",
      "}",
      "",
      "void producer(Task t) {",
      "    { std::lock_guard<std::mutex> g(m); q.push(t); }",
      "    cv.notify_one();",
      "}",
    ],
    bugLine: 7,
    bugName: "Missing wait predicate",
    bugExplain:
      "Waiting without a predicate fails two ways. Condition variables permit spurious wakeups, so wait() can return with nothing to do. Worse, a notify_one() issued before any consumer is waiting is simply lost — nothing queues it — so a consumer can wake on a later notification and find the queue already drained by a peer.",
    fixes: [
      {
        text: "cv.wait(lock, [&]{ return !q.empty(); });",
        correct: true,
        why: "The predicate overload loops until the condition truly holds, which absorbs spurious wakeups and re-checks state after every notification. This is why the guidance is to always wait on a predicate.",
      },
      {
        text: "Replace notify_one() with notify_all().",
        correct: false,
        why: "Wakes every consumer instead of one, so more of them race to an empty queue. It changes who crashes, not whether.",
      },
      {
        text: "Add a short sleep before q.front() so the producer can finish.",
        correct: false,
        why: "Timing-based synchronisation. It makes the failure rarer and therefore harder to diagnose, which is strictly worse than a crash that reproduces.",
      },
      {
        text: "Move the notify_one() inside the lock_guard scope.",
        correct: false,
        why: "Legal, and occasionally desirable, but it does not help. The consumer still has no predicate, so a spurious wakeup still walks into q.front() on an empty queue.",
      },
    ],
  },
  {
    id: "ring",
    title: "The lock-free ring buffer",
    premise: "A single-producer, single-consumer queue on the market-data path. Under load the consumer occasionally reads a message that was never written — stale bytes from a previous lap of the buffer.",
    code: [
      "T buffer[N];",
      "std::atomic<size_t> head{0}, tail{0};",
      "",
      "bool push(const T& v) {",
      "    size_t h    = head.load(std::memory_order_relaxed);",
      "    size_t next = (h + 1) % N;",
      "    if (next == tail.load(std::memory_order_acquire))",
      "        return false;              // full",
      "    buffer[h] = v;",
      "    head.store(next, std::memory_order_relaxed);",
      "    return true;",
      "}",
    ],
    bugLine: 10,
    bugName: "Publishing store is not a release",
    bugExplain:
      "The store on line 10 publishes the slot to the consumer, but a relaxed store carries no ordering. Both the compiler and the CPU are free to move the write on line 9 after it. The consumer's acquire load of head can therefore observe the new index while buffer[h] still holds the previous lap's contents.",
    fixes: [
      {
        text: "head.store(next, std::memory_order_release);",
        correct: true,
        why: "A release store pairs with the consumer's acquire load of head. Everything written before the release — including buffer[h] — is guaranteed visible to any thread that observes the released value. This is the canonical publish pattern, and it is free on x86.",
      },
      {
        text: "Change line 5 to head.load(std::memory_order_acquire).",
        correct: false,
        why: "In SPSC the producer is the only writer of head, so it already sees its own value; strengthening this load orders nothing that matters and leaves the publish unordered.",
      },
      {
        text: "Make buffer a std::atomic<T> array.",
        correct: false,
        why: "Heavy-handed and usually not even possible for a non-trivially-copyable T. It also misses the point: the problem is not the buffer write's atomicity, it is when that write becomes visible relative to the index.",
      },
      {
        text: "Insert std::atomic_thread_fence(std::memory_order_seq_cst) before line 10.",
        correct: false,
        why: "A full fence would happen to work, but it is stronger and more expensive than required, and on a hot market-data path the release store expresses the actual requirement precisely.",
      },
    ],
  },
  {
    id: "deadlock",
    title: "The transfer that stops the world",
    premise: "Position transfers between two books. In production the process occasionally freezes entirely, with two threads alive and neither progressing.",
    code: [
      "void transfer(Account& from, Account& to, int amt) {",
      "    std::lock_guard<std::mutex> l1(from.m);",
      "    std::lock_guard<std::mutex> l2(to.m);",
      "    from.balance -= amt;",
      "    to.balance   += amt;",
      "}",
      "",
      "// thread 1: transfer(a, b, 100);",
      "// thread 2: transfer(b, a, 50);",
    ],
    bugLine: 3,
    bugName: "Inconsistent lock ordering",
    bugExplain:
      "Each call locks 'from' then 'to', so the two threads acquire the same pair in opposite orders. Thread 1 holds a and wants b; thread 2 holds b and wants a. Neither can release, and neither can proceed — a textbook deadlock that depends entirely on interleaving, which is why it survives testing and appears in production.",
    fixes: [
      {
        text: "std::scoped_lock lock(from.m, to.m);",
        correct: true,
        why: "Locks both mutexes with a deadlock-avoiding algorithm — it acquires all or backs off and retries, so no fixed order is needed and no thread can hold one while blocking on the other.",
      },
      {
        text: "Impose a global order, e.g. always lock the account with the lower id first.",
        correct: false,
        why: "This genuinely works and is the standard alternative. It is only the weaker answer here because it needs every future call site to remember the convention, whereas scoped_lock enforces it locally.",
      },
      {
        text: "Use a single global mutex for all transfers.",
        correct: false,
        why: "Correct and deadlock-free, at the cost of serialising every transfer in the system. Acceptable at low volume; not on a book that has to keep up with a feed.",
      },
      {
        text: "Add try_lock with a timeout and retry on failure.",
        correct: false,
        why: "Removes the hard freeze but replaces it with livelock risk and unbounded latency under contention — you have converted a deterministic bug into a probabilistic one.",
      },
    ],
  },
];

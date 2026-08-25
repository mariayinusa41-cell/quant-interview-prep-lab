// Forensic concurrency defects — procedural generator.
//
// These are read, not executed: the sandbox runs JavaScript in a Web Worker
// and cannot compile or run C++, so there is no honest way to produce a real
// ThreadSanitizer verdict here. What it can test is the thing the interview
// actually tests — can you point at the defective line and name the fix.
//
// Content is generated on demand rather than drawn from a fixed list. Each
// difficulty level (1 = easiest, 5 = hardest) has a small pool of scenario
// templates — data races, condition-variable bugs, memory-ordering bugs,
// deadlocks, lock-free bugs — and every template re-rolls its variable
// names, thread/iteration counts, and wording on every call, so replaying a
// level never shows the identical snippet twice. Levels get harder by using
// subtler defect families, longer code, and red herrings (lines that look
// like the bug, or look like a fix, but aren't) rather than just more
// volume.

export type Fix = { text: string; correct: boolean; why: string };

export type ConcurrencyCase = {
  id: string;
  level: number;
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

type Blueprint = Omit<ConcurrencyCase, "id" | "level">;

export const LEVEL_COUNT = 5;

// ---------------------------------------------------------------------------
// small random helpers
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

// ===========================================================================
// LEVEL 1 — obvious races and asymmetric locking
// ===========================================================================

function genCounterRace(): Blueprint {
  const name = pick(["counter", "total", "tally", "sum"] as const);
  const threads = pick([2, 4, 8, 16] as const);
  const iterations = pick([10000, 50000, 100000, 200000] as const);
  return {
    title: "The shared counter",
    premise: `${threads} threads each increment a global ${name} ${iterations.toLocaleString()} times. The final total is short, and short by a different amount every run.`,
    code: [
      `long ${name} = 0;`,
      "",
      "void worker(int n) {",
      "    for (int i = 0; i < n; ++i) {",
      `        ${name}++;`,
      "    }",
      "}",
      "",
      "int main() {",
      "    std::vector<std::thread> ts;",
      `    for (int i = 0; i < ${threads}; ++i)`,
      `        ts.emplace_back(worker, ${iterations});`,
      "    for (auto& t : ts) t.join();",
      `    std::cout << ${name} << '\\n';`,
      "}",
    ],
    bugLine: 5,
    bugName: "Data race",
    bugExplain:
      `${name}++ is a read-modify-write: load, add one, store. Two threads can load the same value and both store the same result, so an increment is lost. Concurrent unsynchronised access to a non-atomic object is a data race, which is undefined behaviour — not merely a wrong number.`,
    fixes: [
      {
        text: `std::atomic<long> ${name}{0}; and ${name}.fetch_add(1, std::memory_order_relaxed);`,
        correct: true,
        why: "Makes the increment indivisible. Relaxed is sufficient and correct here: the only requirement is atomicity of the counter itself, and the join() calls already establish the happens-before edge needed to read the final value safely.",
      },
      {
        text: `Declare it volatile long ${name};`,
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
  };
}

function genVectorPushRace(): Blueprint {
  const name = pick(["results", "output", "log", "records"] as const);
  const threads = pick([4, 8] as const);
  const itemsEach = pick([1000, 5000, 10000] as const);
  return {
    title: "The shared results vector",
    premise: `${threads} worker threads each push their results into a shared ${name} vector as they finish. Under heavy load the program occasionally crashes inside std::vector, or the final size is smaller than the item count.`,
    code: [
      `std::vector<int> ${name};`,
      "",
      "void worker(int id, int n) {",
      "    for (int i = 0; i < n; ++i) {",
      `        ${name}.push_back(id * 1000 + i);`,
      "    }",
      "}",
      "",
      "int main() {",
      "    std::vector<std::thread> ts;",
      `    for (int id = 0; id < ${threads}; ++id)`,
      `        ts.emplace_back(worker, id, ${itemsEach});`,
      "    for (auto& t : ts) t.join();",
      `    std::cout << ${name}.size() << '\\n';`,
      "}",
    ],
    bugLine: 5,
    bugName: "Data race on an unsynchronised container",
    bugExplain:
      "push_back can reallocate the underlying buffer and always updates the vector's internal size/capacity bookkeeping. Two threads calling push_back at the same time are racing on that shared bookkeeping, not just on 'whose element goes where' — that is undefined behaviour, and it is why the failure ranges from a wrong size() to an outright crash.",
    fixes: [
      {
        text: "Wrap the push_back call with a std::lock_guard<std::mutex> held for the whole call.",
        correct: true,
        why: "std::vector gives no thread-safety guarantee for concurrent mutation. A mutex around the mutating call serialises access to the shared buffer and its bookkeeping, which is required any time more than one thread can be inside push_back at once.",
      },
      {
        text: `Reserve enough capacity up front with ${name}.reserve(...) so it never reallocates.`,
        correct: false,
        why: "Removes reallocation as a trigger but not the race itself — two threads still write the shared size counter concurrently, which is a data race even when the underlying buffer never moves.",
      },
      {
        text: `Make the element type std::atomic<int>, i.e. std::vector<std::atomic<int>> ${name};`,
        correct: false,
        why: "Doesn't touch the container's own internal state, which is what's actually being raced on here — only individual elements would be atomic. It also doesn't compile as written: std::atomic<int> isn't copy-constructible, which push_back and reallocation both need.",
      },
      {
        text: "Give each thread its own local vector and merge them after join().",
        correct: false,
        why: "Correct and often the preferred production answer, but it changes the program's structure rather than fixing the defect on this line, and the interviewer asked what is wrong with this code.",
      },
    ],
  };
}

function genAsymmetricLock(): Blueprint {
  const className = pick(["Account", "Wallet", "Ledger"] as const);
  return {
    title: `The ${className.toLowerCase()} that goes negative`,
    premise: `${className}'s deposit() protects the balance with a mutex, but the balance goes negative under concurrent withdraw() calls, even though every individual withdraw() checks for sufficient funds first.`,
    code: [
      `class ${className} {`,
      "    double balance = 0;",
      "    std::mutex m;",
      "public:",
      "    void deposit(double amt) {",
      "        std::lock_guard<std::mutex> g(m);",
      "        balance += amt;",
      "    }",
      "",
      "    void withdraw(double amt) {",
      "        if (balance >= amt) {",
      "            balance -= amt;",
      "        }",
      "    }",
      "};",
    ],
    bugLine: 11,
    bugName: "Missing lock in withdraw()",
    bugExplain:
      "deposit() takes the mutex before touching balance, but withdraw() never does. The read of balance on this line and the write two lines below run with no lock held at all, so a deposit or a concurrent withdraw can interleave between the check and the update — the balance can go negative even though every call individually checked funds first. A check-then-act pair with no lock around it is a race no matter how careful the check looks.",
    fixes: [
      {
        text: "Add std::lock_guard<std::mutex> g(m); as the first line of withdraw(), matching deposit().",
        correct: true,
        why: "Both the read of balance and the write to it need to happen while holding the same mutex deposit() already uses. Taking the lock at entry makes the check-then-act pair atomic with respect to every other locked accessor.",
      },
      {
        text: "Make balance a std::atomic<double>.",
        correct: false,
        why: "Makes the read and the write individually atomic, but check-then-act is still two separate atomic operations with a window between them — another thread can deposit or withdraw in that window and the balance can still go negative.",
      },
      {
        text: "Add a second, separate mutex used only inside withdraw().",
        correct: false,
        why: "Two different mutexes protecting the same balance field don't exclude each other. deposit() and withdraw() now run through unrelated locks and race exactly as before.",
      },
      {
        text: "Re-check balance >= amt a second time immediately before the subtraction.",
        correct: false,
        why: "Re-checking without holding a lock doesn't close the window between check and act — another thread can still interleave between the second check and the subtraction.",
      },
    ],
  };
}

// ===========================================================================
// LEVEL 2 — condition variables and check-then-act races
// ===========================================================================

function genCondvarNoPredicate(): Blueprint {
  const taskType = pick(["Task", "Job", "Order", "Message"] as const);
  const qName = pick(["q", "queue_", "pending"] as const);
  return {
    title: "The consumer that wakes too early",
    premise: `A worker pool drains a queue of ${taskType.toLowerCase()}s. Occasionally a consumer crashes dereferencing the front of an empty queue.`,
    code: [
      `std::queue<${taskType}> ${qName};`,
      "std::mutex m;",
      "std::condition_variable cv;",
      "",
      "void consumer() {",
      "    std::unique_lock<std::mutex> lock(m);",
      "    cv.wait(lock);",
      `    ${taskType} t = ${qName}.front();`,
      `    ${qName}.pop();`,
      "    process(t);",
      "}",
      "",
      `void producer(${taskType} t) {`,
      `    { std::lock_guard<std::mutex> g(m); ${qName}.push(t); }`,
      "    cv.notify_one();",
      "}",
    ],
    bugLine: 7,
    bugName: "Missing wait predicate",
    bugExplain:
      "Waiting without a predicate fails two ways. Condition variables permit spurious wakeups, so wait() can return with nothing to do. Worse, a notify_one() issued before any consumer is waiting is simply lost — nothing queues it — so a consumer can wake on a later notification and find the queue already drained by a peer.",
    fixes: [
      {
        text: `cv.wait(lock, [&]{ return !${qName}.empty(); });`,
        correct: true,
        why: "The predicate overload loops until the condition truly holds, which absorbs spurious wakeups and re-checks state after every notification. This is why the guidance is to always wait on a predicate.",
      },
      {
        text: "Replace notify_one() with notify_all().",
        correct: false,
        why: "Wakes every consumer instead of one, so more of them race to an empty queue. It changes who crashes, not whether.",
      },
      {
        text: "Add a short sleep before front() so the producer can finish.",
        correct: false,
        why: "Timing-based synchronisation. It makes the failure rarer and therefore harder to diagnose, which is strictly worse than a crash that reproduces.",
      },
      {
        text: "Move the notify_one() inside the lock_guard scope.",
        correct: false,
        why: "Legal, and occasionally desirable, but it does not help. The consumer still has no predicate, so a spurious wakeup still walks into front() on an empty queue.",
      },
    ],
  };
}

function genCheckThenActQueue(): Blueprint {
  const jobType = pick(["Job", "Task", "Ticket"] as const);
  const qName = pick(["jobs", "backlog", "inbox"] as const);
  return {
    title: "The dispatcher that hands out the same job twice",
    premise: `A dispatcher hands work to whichever consumer asks first. Occasionally two consumers both grab the same ${jobType.toLowerCase()}, or a consumer segfaults reading the front of an empty queue.`,
    code: [
      `std::queue<${jobType}> ${qName};`,
      "std::mutex m;",
      "",
      `${jobType}* tryTake() {`,
      `    if (${qName}.empty()) return nullptr;`,
      "    std::lock_guard<std::mutex> g(m);",
      `    ${jobType} j = ${qName}.front();`,
      `    ${qName}.pop();`,
      "    return new auto(j);",
      "}",
    ],
    bugLine: 5,
    bugName: "Check happens before the lock",
    bugExplain:
      `The emptiness check on this line reads ${qName} with no lock held at all, and even once the lock is taken further down, another thread can pop the last item between this check and the lock_guard acquiring the mutex. Two consumers can both pass the empty check and then both take 'the' front item, or one can sail through the check on a queue another consumer is about to drain.`,
    fixes: [
      {
        text: `Move std::lock_guard<std::mutex> g(m); to the very first line, and do the emptiness check inside the locked section.`,
        correct: true,
        why: "Locking before the check makes 'is there work' and 'take the work' one atomic operation with respect to every other locked caller — no other thread can change the queue between the check and the pop.",
      },
      {
        text: "Replace the queue with a lock-free queue implementation instead.",
        correct: false,
        why: "Solves a different problem and requires a correctly-implemented concurrent queue; it doesn't fix the actual defect on this line, which is that the check and the act aren't atomic with each other.",
      },
      {
        text: "Wrap only the pop() call in the lock_guard, leave front() unlocked.",
        correct: false,
        why: "front() and pop() are still two unsynchronised operations relative to each other — another thread's pop() can run between this thread's front() and pop(), so it can still act on an item it doesn't actually own.",
      },
      {
        text: "Add a std::atomic<bool> hasWork flag set alongside the queue and check that instead.",
        correct: false,
        why: "Adds a second piece of state that must itself stay perfectly in sync with the queue's real contents. The flag and the queue are updated in two separate steps, which just relocates the same check-then-act race onto the flag.",
      },
    ],
  };
}

function genDclpNoAtomics(): Blueprint {
  const className = pick(["Logger", "Cache", "ConnectionPool"] as const);
  return {
    title: `The lazily-built ${className.toLowerCase()}`,
    premise: `A lazily-constructed ${className} is shared across the process. In debug builds it is always fine; under a real multi-threaded load a caller occasionally receives a pointer that crashes as soon as it's used.`,
    code: [
      `${className}* instance = nullptr;`,
      "std::mutex m;",
      "",
      `${className}* get${className}() {`,
      "    if (instance == nullptr) {",
      "        std::lock_guard<std::mutex> g(m);",
      "        if (instance == nullptr) {",
      `            instance = new ${className}();`,
      "        }",
      "    }",
      "    return instance;",
      "}",
    ],
    bugLine: 8,
    bugName: "Double-checked locking without atomics",
    bugExplain:
      "instance is a plain pointer, so this store and the outer read at the top of the function are not synchronised at all — that's a data race by itself. Worse, even with the lock preventing two constructions, the compiler and CPU are free to make instance visible to another thread's outer check before the object it points to is fully constructed, because there is no publish/acquire relationship between this write and that read.",
    fixes: [
      {
        text: `Make it std::atomic<${className}*> instance; and use .load(acquire) for both checks / .store(..., release) on this line.`,
        correct: true,
        why: "An atomic pointer with acquire/release ordering makes this write release everything written during construction, and pairs with an acquire load on the outer check, so any thread that observes the non-null pointer is guaranteed to observe a fully-constructed object.",
      },
      {
        text: "Take the mutex before the outer check too, so both checks are locked.",
        correct: false,
        why: "Removes the race but also removes the entire point of the double-checked pattern — the lock is now taken on every call. It's a correct fix to a simpler, different design, not a fix to the code as written.",
      },
      {
        text: "Declare instance volatile.",
        correct: false,
        why: "The same misconception as always: volatile prevents the compiler from eliding repeated accesses in isolation but provides no atomicity and no cross-thread memory-ordering guarantee. The race and the reordering both survive.",
      },
      {
        text: `Construct it eagerly as a function-local static ${className} instead.`,
        correct: false,
        why: "Genuinely the standard modern fix — C++11 guarantees thread-safe static initialisation — but it sidesteps the double-checked pattern shown rather than fixing what's wrong with this code as written.",
      },
    ],
  };
}

// ===========================================================================
// LEVEL 3 — memory ordering
// ===========================================================================

function genRingBufferRelaxedPublish(): Blueprint {
  const typeName = pick(["Tick", "Quote", "Msg", "Order"] as const);
  return {
    title: "The lock-free ring buffer",
    premise: `A single-producer, single-consumer queue of ${typeName} on the market-data path. Under load the consumer occasionally reads a message that was never written — stale bytes from a previous lap of the buffer.`,
    code: [
      `${typeName} buffer[N];`,
      "std::atomic<size_t> head{0}, tail{0};",
      "",
      `bool push(const ${typeName}& v) {`,
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
        text: `Make buffer a std::atomic<${typeName}> array.`,
        correct: false,
        why: "Heavy-handed and usually not even possible for a non-trivially-copyable type. It also misses the point: the problem is not the buffer write's atomicity, it is when that write becomes visible relative to the index.",
      },
      {
        text: "Insert std::atomic_thread_fence(std::memory_order_seq_cst) before line 10.",
        correct: false,
        why: "A full fence would happen to work, but it is stronger and more expensive than required, and on a hot market-data path the release store expresses the actual requirement precisely.",
      },
    ],
  };
}

function genVolatileFlag(): Blueprint {
  const resultName = pick(["Result", "Frame", "Snapshot"] as const);
  return {
    title: "The flag that lies",
    premise: `A background thread computes a ${resultName.toLowerCase()} into a shared struct, then flips a 'done' flag. The main thread spins on the flag and reads the value once it flips — except sometimes it reads a value that's still mid-write.`,
    code: [
      `${resultName} result;`,
      "volatile bool done = false;",
      "",
      "void worker() {",
      "    result = compute();",
      "    done = true;",
      "}",
      "",
      "void waitAndUse() {",
      "    while (!done) { /* spin */ }",
      "    use(result);",
      "}",
    ],
    bugLine: 6,
    bugName: "volatile is not synchronisation",
    bugExplain:
      "volatile only tells the compiler not to elide repeated accesses to done — it says nothing about the store to result on the line above becoming visible to another thread before this flag flips, and nothing about the CPU's own reordering. waitAndUse() can observe done == true while result is still being written, so use(result) reads a value mid-construction.",
    fixes: [
      {
        text: "std::atomic<bool> done{false}; store with memory_order_release on this line, load with memory_order_acquire in the while loop.",
        correct: true,
        why: "A release store paired with an acquire load creates a real happens-before edge — everything written before the release (result) is guaranteed visible to any thread whose acquire load observes the released value. That is exactly the guarantee volatile does not provide.",
      },
      {
        text: "Add a short sleep before checking done, to let the write finish.",
        correct: false,
        why: "Timing-based synchronisation. It lowers the probability of hitting the race without removing it, trading a reproducible bug for an intermittent one.",
      },
      {
        text: "Make result volatile too.",
        correct: false,
        why: "Extends the same misconception to a second variable. volatile still provides no atomicity for a non-scalar struct and no ordering guarantee between the two writes, so the underlying visibility problem is untouched.",
      },
      {
        text: "Wrap the spin loop's body in a std::lock_guard.",
        correct: false,
        why: "You cannot hold a lock across a busy-wait like this without a corresponding acquisition point in worker() — nothing here establishes a happens-before relationship between the write and the read; it only adds unnecessary lock overhead to the spin.",
      },
    ],
  };
}

function genRelaxedLoadAsymmetric(): Blueprint {
  const cfgName = pick(["Config", "Settings", "Params"] as const);
  return {
    title: "The publish that's only half right",
    premise: `A single writer publishes a ${cfgName.toLowerCase()} pointer with a proper release store. The bug report says reads are correct 'almost always' — the failures only show up on ARM hardware, never on the x86 dev boxes.`,
    code: [
      `std::atomic<${cfgName}*> ptr{nullptr};`,
      "",
      `void publish(${cfgName}* c) {`,
      "    ptr.store(c, std::memory_order_release);",
      "}",
      "",
      `${cfgName}* read() {`,
      "    return ptr.load(std::memory_order_relaxed);",
      "}",
    ],
    bugLine: 8,
    bugName: "Acquire/release pair broken on the read side",
    bugExplain:
      "The publish side is correct — a release store on line 4 is exactly right. But a release store only creates a happens-before edge when paired with an acquire (or stronger) load on the other side. Reading with memory_order_relaxed on this line accepts the pointer value but drops the ordering guarantee, so the reader can see the new pointer while still observing stale values inside the object it points to. x86's strong memory model hides this in testing; ARM's weaker model does not.",
    fixes: [
      {
        text: "Change the load on this line to std::memory_order_acquire.",
        correct: true,
        why: "Completes the release/acquire pair the publish side already set up. Once matched, everything written before the release store on line 4 is guaranteed visible to this thread after this load observes it — on every architecture, not just the strongly-ordered ones.",
      },
      {
        text: "Change the store on line 4 to memory_order_seq_cst as well.",
        correct: false,
        why: "Strengthening the side that was already correct doesn't fix the side that's wrong. The read is still relaxed and still drops the ordering guarantee, regardless of how strong the write is.",
      },
      {
        text: "Add a mutex around both the store and the load.",
        correct: false,
        why: "Works, but throws away the entire reason to use a lock-free atomic pointer here — a single acquire keyword gets the same correctness for a fraction of the cost on this hot path.",
      },
      {
        text: `Make ${cfgName}'s fields individually atomic instead of changing this load's memory order.`,
        correct: false,
        why: "Doesn't address the actual gap, which is the missing happens-before edge between the pointer publish and the pointer read. You would need every field access ordered relative to ptr, which is exactly what one acquire load already gives you for free.",
      },
    ],
  };
}

// ===========================================================================
// LEVEL 4 — deadlocks and lost-wakeup structural bugs
// ===========================================================================

function genLockOrderDeadlock(): Blueprint {
  const [nameA, nameB] = pick([
    ["a", "b"],
    ["x", "y"],
    ["p", "q"],
  ] as const);
  const amt1 = pick([50, 75, 100, 150] as const);
  const amt2 = pick([25, 40, 50, 60] as const);
  return {
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
      `// thread 1: transfer(${nameA}, ${nameB}, ${amt1});`,
      `// thread 2: transfer(${nameB}, ${nameA}, ${amt2});`,
    ],
    bugLine: 3,
    bugName: "Inconsistent lock ordering",
    bugExplain:
      `Each call locks 'from' then 'to', so the two threads acquire the same pair in opposite orders. Thread 1 holds ${nameA} and wants ${nameB}; thread 2 holds ${nameB} and wants ${nameA}. Neither can release, and neither can proceed — a textbook deadlock that depends entirely on interleaving, which is why it survives testing and appears in production.`,
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
  };
}

function genSelfDeadlock(): Blueprint {
  const className = pick(["Ledger", "AuditLog", "Journal"] as const);
  return {
    title: `The ${className.toLowerCase()} that hangs on its own call`,
    premise: "A single-threaded test never triggers it, but under real traffic the server hangs forever on the first request that both records and audits in the same call.",
    code: [
      `class ${className} {`,
      "    std::mutex m;",
      "public:",
      "    void record(int amt) {",
      "        std::lock_guard<std::mutex> g(m);",
      "        total += amt;",
      "        audit(amt);",
      "    }",
      "",
      "    void audit(int amt) {",
      "        std::lock_guard<std::mutex> g(m);",
      "        history.push_back(amt);",
      "    }",
      "};",
    ],
    bugLine: 11,
    bugName: "Self-deadlock on a non-recursive mutex",
    bugExplain:
      "std::mutex is not recursive: a thread that already holds m and calls lock() on it again blocks — even though it's the very thread holding the lock. record() takes the lock on line 5 and then calls audit() on line 7 while still holding it; audit() tries to take the same mutex again on this line, and the thread deadlocks against itself. This only shows up on the call path that goes through both functions together.",
    fixes: [
      {
        text: "Factor the locked body of audit() into a private auditLocked(int amt) that assumes the lock is already held, and have record() call that instead of the public audit().",
        correct: true,
        why: "Removes the reentrant lock attempt entirely by making the actual critical section a separate function with an explicit locking contract, while audit() itself still locks correctly when called on its own.",
      },
      {
        text: "Change std::mutex to std::recursive_mutex.",
        correct: false,
        why: "Fixes the hang, but recursive mutexes are usually a sign the locking design is unclear about who owns what, and are commonly discouraged in review because they make it easy to hide the same self-deadlock under one more layer of indirection.",
      },
      {
        text: "Have record() release its lock before calling audit(), by scoping the lock_guard to end before the call.",
        correct: false,
        why: "Works in this specific case, but record()'s own state mutation and its audit call are no longer atomic with respect to each other — another thread can run between the unlock and the audit() call and observe a recorded amount with no matching audit entry yet.",
      },
      {
        text: "Give audit() its own separate mutex.",
        correct: false,
        why: "Removes the immediate deadlock but means total and history are now protected by two uncoordinated locks, so a reader that needs a consistent view of both can observe one updated and the other not.",
      },
    ],
  };
}

function genBatchedNotifyOne(): Blueprint {
  const itemType = pick(["Item", "Task", "Message"] as const);
  const consumers = pick([2, 3, 4] as const);
  return {
    title: "The burst that only wakes one consumer",
    premise: `${consumers} consumer threads wait on the same condition variable to drain a work queue. When the producer enqueues a burst of ${itemType.toLowerCase()}s at once, only one consumer wakes up — the rest sit untouched until something else happens to nudge one awake.`,
    code: [
      `std::queue<${itemType}> items;`,
      "std::mutex m;",
      "std::condition_variable cv;",
      "",
      `void produceBatch(std::vector<${itemType}> batch) {`,
      "    std::lock_guard<std::mutex> g(m);",
      "    for (auto& it : batch) items.push(it);",
      "    cv.notify_one();",
      "}",
      "",
      "void consume() {",
      "    std::unique_lock<std::mutex> lock(m);",
      "    cv.wait(lock, [&]{ return !items.empty(); });",
      `    ${itemType} it = items.front();`,
      "    items.pop();",
      "    process(it);",
      "}",
    ],
    bugLine: 8,
    bugName: "One notification for many items",
    bugExplain:
      "notify_one() wakes at most one waiting thread, but this call follows a loop that may have just pushed many items. If more than one consumer is asleep, only one of them wakes to drain a queue that now has enough work for several — the rest stay parked until some unrelated notify happens to wake them.",
    fixes: [
      {
        text: "Call cv.notify_all(); instead, since the batch may contain enough work for every waiting consumer.",
        correct: true,
        why: "Wakes every waiting thread so each one re-checks the predicate and either takes an item or goes back to sleep if a peer got there first — correct regardless of how many items were pushed or how many consumers are waiting.",
      },
      {
        text: "Call cv.notify_one() once per item pushed, inside the for loop.",
        correct: false,
        why: `Closer, and it can work, but with ${consumers} consumers a tight loop of notify_one() calls usually still only wakes one before the lock is released, since a woken consumer needs the lock back before it can even proceed past cv.wait.`,
      },
      {
        text: "Have each consumer call cv.notify_one() itself right after popping, to pass the wakeup along.",
        correct: false,
        why: "Consumers don't know how many items are still queued or how many peers are asleep; this turns wakeup propagation into an ad hoc protocol that's easy to get wrong, instead of just describing accurately how many items became available.",
      },
      {
        text: "Increase the number of consumer threads so there's always one awake.",
        correct: false,
        why: "Doesn't address that notify_one() only wakes one sleeper regardless of how many exist; it just makes the specific failure less visible by having more threads that could be the lucky one.",
      },
    ],
  };
}

// ===========================================================================
// LEVEL 5 — subtle multi-lock / memory-model bugs with red herrings
// ===========================================================================

function genThirdMutexDeadlock(): Blueprint {
  const [nameX, nameY] = pick([
    ["x", "y"],
    ["a", "b"],
    ["p", "q"],
  ] as const);
  const amt = pick([50, 75, 100, 150] as const);
  return {
    title: "The scoped_lock that isn't the problem",
    premise: "Transfers between two accounts use scoped_lock, which the last review confirmed is deadlock-safe for the pair. The freeze still happens — always when a transfer overlaps with the nightly snapshot job.",
    code: [
      "std::mutex logMutex;",
      "",
      "void transfer(Account& from, Account& to, int amt) {",
      "    std::scoped_lock lock(from.m, to.m);   // safe: scoped_lock avoids ordering deadlock",
      "    from.balance -= amt;",
      "    to.balance   += amt;",
      "    std::lock_guard<std::mutex> lg(logMutex);",
      "    appendLog(from.id, to.id, amt);",
      "}",
      "",
      "void snapshot(Account& a) {",
      "    std::lock_guard<std::mutex> lg(logMutex);",
      "    appendLog(a.id, a.id, 0);",
      "    std::lock_guard<std::mutex> l(a.m);",
      "    record(a.balance);",
      "}",
      "",
      `// thread 1: transfer(${nameX}, ${nameY}, ${amt});`,
      `// thread 2: snapshot(${nameX});`,
    ],
    bugLine: 12,
    bugName: "Inconsistent lock ordering across a third mutex",
    bugExplain:
      "scoped_lock on line 4 really is deadlock-safe for from.m/to.m — that part of the review was right, which is exactly why it survived. The actual defect is logMutex: transfer() takes the account locks first and logMutex second (line 7), but snapshot() takes logMutex first and the account lock second (this line and line 14). If transfer holds an account lock and wants logMutex while snapshot holds logMutex and wants that same account lock, both threads block forever — a deadlock hiding behind a pair of locks that were, individually, taken correctly.",
    fixes: [
      {
        text: "In snapshot(), take a.m first and logMutex second, matching transfer() — or fold both into one scoped_lock(a.m, logMutex).",
        correct: true,
        why: "Makes every code path acquire the account mutex before logMutex, which is the actual missing invariant. scoped_lock(a.m, logMutex) gets this for free without anyone having to remember the convention.",
      },
      {
        text: "Replace the account-lock scoped_lock in transfer() with two separate lock_guards, taken in id order.",
        correct: false,
        why: "Rebuilds a fix for a lock pair that was never actually broken — the deadlock is between an account mutex and logMutex, not between from.m and to.m, so this changes the one part of the code that was already correct.",
      },
      {
        text: "Make appendLog() lock-free instead, using an internal queue.",
        correct: false,
        why: "A legitimate redesign for a hot logging path, but it sidesteps identifying which two locks are actually taken in conflicting order in the code as written — the interviewer asked what's wrong with this code, not for a rewrite of the logging subsystem.",
      },
      {
        text: "Add a timeout to every lock_guard via try_lock, and retry the whole function on failure.",
        correct: false,
        why: "Converts a deterministic hang into a livelock-prone retry loop under contention, and doesn't identify or fix the actual ordering conflict — it just makes the same conflict resolve itself eventually, at unpredictable cost.",
      },
    ],
  };
}

function genDclpWrongOrder(): Blueprint {
  const cfgName = pick(["Config", "Settings", "Options"] as const);
  return {
    title: "The double-checked lock that was already 'fixed'",
    premise: "Someone already changed this from a raw-pointer double-checked lock to use std::atomic, following an earlier review comment almost to the letter. Crashes on ARM builds continued anyway.",
    code: [
      `std::atomic<${cfgName}*> ptr{nullptr};`,
      "std::mutex m;",
      "",
      `${cfgName}* get() {`,
      "    auto* p = ptr.load(std::memory_order_relaxed);",
      "    if (p == nullptr) {",
      "        std::lock_guard<std::mutex> g(m);",
      "        p = ptr.load(std::memory_order_relaxed);",
      "        if (p == nullptr) {",
      "            p = new auto(loadFromDisk());",
      "            ptr.store(p, std::memory_order_release);",
      "        }",
      "    }",
      "    return p;",
      "}",
    ],
    bugLine: 5,
    bugName: "Fast path load needs acquire, not relaxed",
    bugExplain:
      "This is the fast, no-lock path that most calls take once ptr is set — which is exactly why it matters most. A relaxed load gets the correct pointer value (atomics guarantee that), but it creates no happens-before edge with the release store on line 11. A caller can see p as non-null here and dereference an object whose constructor's writes haven't become visible to this thread yet. The locked slow path (line 8) is fine as written, because the mutex itself orders that load relative to the store on lines 10-11 — the bug is specifically the unlocked fast path.",
    fixes: [
      {
        text: "Change the load on this line to std::memory_order_acquire.",
        correct: true,
        why: "Pairs with the release store on line 11 so that any thread whose fast-path load observes the non-null pointer is also guaranteed to see everything written during construction — exactly the guarantee the unlocked fast path needs, since it has no mutex to fall back on.",
      },
      {
        text: "Change the load on line 8 to memory_order_acquire as well.",
        correct: false,
        why: "That load already happens while holding m, and the store it's racing to observe also happens while holding m, so the mutex already provides the needed ordering there. Strengthening an already-correct locked load doesn't fix the unlocked one.",
      },
      {
        text: "Change the store on line 11 to memory_order_seq_cst.",
        correct: false,
        why: "The store's own order isn't the problem — it's already a valid release. Sequential consistency doesn't fix a load that's still relaxed on the other end; the missing pairing is acquire-on-read, not stronger-on-write.",
      },
      {
        text: "Remove the outer unlocked check entirely and always take the lock.",
        correct: false,
        why: "Works, and is simpler, but it throws away the entire performance reason this pattern exists — the whole point of a fast path is to avoid the lock once ptr is set, so removing it 'fixes' the bug by deleting the feature.",
      },
    ],
  };
}

function genAbaStack(): Blueprint {
  const field = pick(["value", "payload", "data"] as const);
  return {
    title: "The free-list that occasionally becomes a loop",
    premise: "A lock-free free-list recycles Node objects across threads for speed. Under heavy concurrent push/pop, the list occasionally becomes cyclic or a popped node's data is corrupted — but only when allocation and reuse happen fast enough for one thread to recycle a node mid-CAS on another thread.",
    code: [
      `struct Node { int ${field}; Node* next; };`,
      "std::atomic<Node*> head{nullptr};",
      "",
      "void push(Node* n) {",
      "    n->next = head.load(std::memory_order_relaxed);",
      "    while (!head.compare_exchange_weak(n->next, n, std::memory_order_release, std::memory_order_relaxed)) {}",
      "}",
      "",
      "Node* pop() {",
      "    Node* old = head.load(std::memory_order_acquire);",
      "    while (old && !head.compare_exchange_weak(old, old->next, std::memory_order_acquire, std::memory_order_relaxed)) {}",
      "    return old;",
      "}",
    ],
    bugLine: 11,
    bugName: "ABA problem — a raw pointer CAS can't tell A′ from A",
    bugExplain:
      "compare_exchange_weak only compares bit patterns. If old is popped and freed by another thread, then a new node is allocated at the exact same address and pushed back (call it A′, indistinguishable from the original A by address alone), this CAS sees head == old and happily succeeds — but old->next is now A′'s next pointer, not A's, and A's memory may already be reused or hold a different value than what this thread read on line 10. head can end up pointing into freed memory, or the list can become inconsistent, with no error and no crash at the point of corruption.",
    fixes: [
      {
        text: "Use a tagged/versioned pointer — pack a monotonically-incrementing counter alongside the pointer and CAS both together (e.g. via double-width CAS).",
        correct: true,
        why: "Makes A and a later A′ at the same address compare unequal because their version tags differ, even though the raw addresses match — exactly the distinction a plain pointer CAS cannot make.",
      },
      {
        text: "Add memory_order_seq_cst to both CAS calls instead of acquire/release.",
        correct: false,
        why: "Memory ordering controls visibility of surrounding writes, not identity — ABA is about the CAS being fooled by address reuse, which a stronger memory order does nothing to prevent.",
      },
      {
        text: "Never actually free popped nodes — leak them intentionally so every address stays unique.",
        correct: false,
        why: "Would genuinely sidestep ABA by construction, but at the cost of unbounded memory growth in a structure meant to run indefinitely — trading one production incident for a slower, guaranteed one.",
      },
      {
        text: "Wrap push() and pop() bodies in a single global std::mutex.",
        correct: false,
        why: "Eliminates the lock-free property entirely, which is presumably why this was written as a CAS loop in the first place, and is a heavier change than the defect calls for — the ABA problem has well-known lock-free fixes.",
      },
    ],
  };
}

// ===========================================================================
// generation entry point
// ===========================================================================

const LEVEL_TEMPLATES: Record<number, Array<() => Blueprint>> = {
  1: [genCounterRace, genVectorPushRace, genAsymmetricLock],
  2: [genCondvarNoPredicate, genCheckThenActQueue, genDclpNoAtomics],
  3: [genRingBufferRelaxedPublish, genVolatileFlag, genRelaxedLoadAsymmetric],
  4: [genLockOrderDeadlock, genSelfDeadlock, genBatchedNotifyOne],
  5: [genThirdMutexDeadlock, genDclpWrongOrder, genAbaStack],
};

let idCounter = 0;
function nextId(level: number, templateIndex: number): string {
  idCounter += 1;
  return `L${level}-T${templateIndex}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Procedurally generate one concurrency-bug case for the given difficulty
 * level (1-5). Pass the templateIndex of the previously-shown case as
 * `avoidTemplateIndex` to guarantee the new case is a different scenario
 * family — used when the player answers a level wrong and must be shown a
 * new question at the same level rather than a repeat.
 */
export function generateCase(
  level: number,
  avoidTemplateIndex?: number,
): { case: ConcurrencyCase; templateIndex: number } {
  const clampedLevel = Math.min(LEVEL_COUNT, Math.max(1, level));
  const pool = LEVEL_TEMPLATES[clampedLevel] ?? LEVEL_TEMPLATES[1];
  let templateIndex = randInt(0, pool.length - 1);
  if (pool.length > 1 && avoidTemplateIndex !== undefined) {
    while (templateIndex === avoidTemplateIndex) {
      templateIndex = randInt(0, pool.length - 1);
    }
  }
  const blueprint = pool[templateIndex]();
  return {
    case: { id: nextId(clampedLevel, templateIndex), level: clampedLevel, ...blueprint },
    templateIndex,
  };
}

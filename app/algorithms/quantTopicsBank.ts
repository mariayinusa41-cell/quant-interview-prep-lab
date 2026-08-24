import type { CodingChallenge, MCQuestion } from "./codingTypes";

function mc(prompt: string, choices: string[], answer: number, explanation: string): MCQuestion {
  return { prompt, choices, answer, explanation };
}

function makeChallenge(
  base: Omit<CodingChallenge, "preQuestions" | "postQuestions">,
  preQuestions: MCQuestion[],
  postQuestions: MCQuestion[],
): CodingChallenge {
  return { ...base, preQuestions, postQuestions };
}

export const QUANT_TOPIC_CHALLENGES: CodingChallenge[] = [
  // ---------- Rookie: complexity fundamentals and market-data scans ----------
  makeChallenge(
    {
      level: "rookie",
      title: "First Threshold Crossing",
      prompt: "Given a time series of prices, return the first index whose price is at least threshold. Return -1 if no price qualifies.",
      functionName: "firstThresholdCrossing",
      starterCode: `function firstThresholdCrossing(prices, threshold) {
  // your code here
}`,
      referenceSolution: `function firstThresholdCrossing(prices, threshold) {
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] >= threshold) return i;
  }
  return -1;
}`,
      testCases: [
        { args: [[100, 101, 99, 105], 104], expected: 3, label: "firstThresholdCrossing([100,101,99,105], 104)" },
        { args: [[1, 2, 3], 4], expected: -1, label: "firstThresholdCrossing([1,2,3], 4)" },
        { args: [[10], 10], expected: 0, label: "firstThresholdCrossing([10], 10)" },
      ],
    },
    [
      mc("What is the worst-case time complexity?", ["O(1)", "O(log N)", "O(N)", "O(N²)"], 2, "The scan may inspect every observation once."),
      mc("What lets the function stop before reading the entire tape?", ["A hash map", "Early return when the threshold is reached", "Sorting first", "Recursion"], 1, "The first qualifying observation is already the answer."),
    ],
    [
      mc("What is the extra space complexity?", ["O(1)", "O(log N)", "O(N)", "O(N²)"], 0, "Only the loop index and threshold are stored."),
      mc("If prices were sorted, which approach could improve the search?", ["Binary search", "Nested loops", "A stack", "Random sampling"], 0, "Sorted values allow binary search for the first qualifying index."),
    ],
  ),
  makeChallenge(
    {
      level: "rookie",
      title: "Unique Traded Assets",
      prompt: "Given an array of asset symbols from executed trades, return the number of distinct symbols.",
      functionName: "countUniqueAssets",
      starterCode: `function countUniqueAssets(symbols) {
  // your code here
}`,
      referenceSolution: `function countUniqueAssets(symbols) {
  return new Set(symbols).size;
}`,
      testCases: [
        { args: [["AAPL", "AAPL", "MSFT"]], expected: 2, label: "countUniqueAssets([AAPL,AAPL,MSFT])" },
        { args: [[]], expected: 0, label: "countUniqueAssets([])" },
        { args: [["SPY", "QQQ", "SPY", "IWM"]], expected: 3, label: "countUniqueAssets([SPY,QQQ,SPY,IWM])" },
      ],
    },
    [
      mc("What is the average lookup complexity of a Set?", ["O(N)", "O(1)", "O(log N)", "O(N²)"], 1, "Hash-based Set membership is O(1) on average."),
      mc("What is the overall time complexity?", ["O(1)", "O(log N)", "O(N)", "O(N²)"], 2, "Every symbol is inserted or checked once."),
    ],
    [
      mc("What is the extra space complexity?", ["O(1)", "O(N)", "O(log N)", "O(N²)"], 1, "The Set can contain one entry for every distinct symbol."),
      mc("What does the Set remove from this problem?", ["The need to preserve duplicate observations", "The need to read the input", "All time cost", "The output"], 0, "Only uniqueness matters, so duplicate symbols need no separate representation."),
    ],
  ),
  makeChallenge(
    {
      level: "rookie",
      title: "Best Quote Seen",
      prompt: "Given quote objects with price and size fields, return the quote with the highest price. Keep the first quote when prices tie.",
      functionName: "bestQuote",
      starterCode: `function bestQuote(quotes) {
  // your code here
}`,
      referenceSolution: `function bestQuote(quotes) {
  let best = quotes[0];
  for (const quote of quotes) {
    if (quote.price > best.price) best = quote;
  }
  return best;
}`,
      testCases: [
        { args: [[{ price: 100, size: 5 }, { price: 101, size: 2 }]], expected: { price: 101, size: 2 }, label: "bestQuote([{price:100},{price:101}])" },
        { args: [[{ price: 99, size: 1 }, { price: 99, size: 8 }]], expected: { price: 99, size: 1 }, label: "bestQuote([two equal prices])" },
        { args: [[{ price: 10, size: 3 }]], expected: { price: 10, size: 3 }, label: "bestQuote([{price:10}])" },
      ],
    },
    [
      mc("Which pattern fits this problem?", ["One pass tracking the best so far", "Breadth-first search", "Binary tree rotation", "Nested pair enumeration"], 0, "The answer can be updated as each quote arrives."),
      mc("What is the worst-case time complexity?", ["O(1)", "O(log N)", "O(N)", "O(N²)"], 2, "Each quote is inspected once."),
    ],
    [
      mc("Why use > rather than >= in the comparison?", ["To keep the first quote on a tie", "To sort the quotes", "To avoid decimals", "It has no effect"], 0, "Strict comparison preserves the earlier quote when prices match."),
      mc("What extra memory does the reference solution use?", ["O(1)", "O(N)", "O(log N)", "O(N²)"], 0, "It keeps only one current best reference."),
    ],
  ),
  makeChallenge(
    {
      level: "rookie",
      title: "Fill an Order Capacity",
      prompt: "Given order quantities arriving in sequence, return how many units can be filled before reaching capacity. A partial final order is allowed.",
      functionName: "fillCapacity",
      starterCode: `function fillCapacity(orders, capacity) {
  // your code here
}`,
      referenceSolution: `function fillCapacity(orders, capacity) {
  let filled = 0;
  for (const quantity of orders) {
    if (filled + quantity >= capacity) return capacity;
    filled += quantity;
  }
  return filled;
}`,
      testCases: [
        { args: [[3, 4, 5], 10], expected: 10, label: "fillCapacity([3,4,5], 10)" },
        { args: [[2, 2], 10], expected: 4, label: "fillCapacity([2,2], 10)" },
        { args: [[7], 5], expected: 5, label: "fillCapacity([7], 5)" },
      ],
    },
    [
      mc("What is the key invariant?", ["filled never exceeds capacity", "orders stay sorted", "every order is accepted", "capacity grows each step"], 0, "The running total is capped at the available capacity."),
      mc("What is the time complexity?", ["O(1)", "O(N)", "O(N²)", "O(log N)"], 1, "Orders are processed in arrival order once."),
    ],
    [
      mc("Why can the final order be partial?", ["Capacity is a hard upper bound", "Queues require recursion", "The price is sorted", "It reduces memory"], 0, "Only the remaining capacity can be filled."),
      mc("What is the extra space complexity?", ["O(1)", "O(N)", "O(log N)", "O(N²)"], 0, "Only the running fill is stored."),
    ],
  ),
  makeChallenge(
    {
      level: "rookie",
      title: "Count Cheap Pairs",
      prompt: "Return the number of index pairs (i, j), with i < j, whose two values have sum strictly below target.",
      functionName: "countPairsBelow",
      starterCode: `function countPairsBelow(values, target) {
  // your code here
}`,
      referenceSolution: `function countPairsBelow(values, target) {
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      if (values[i] + values[j] < target) count++;
    }
  }
  return count;
}`,
      testCases: [
        { args: [[1, 2, 3, 4], 6], expected: 3, label: "countPairsBelow([1,2,3,4], 6)" },
        { args: [[5, 5, 5], 10], expected: 0, label: "countPairsBelow([5,5,5], 10)" },
        { args: [[-2, 1, 4], 3], expected: 1, label: "countPairsBelow([-2,1,4], 3)" },
      ],
    },
    [
      mc("What is the complexity of the nested-loop reference?", ["O(N)", "O(log N)", "O(N²)", "O(1)"], 2, "It examines every eligible pair."),
      mc("Why must the inner loop start at i + 1?", ["To avoid double-counting and self-pairs", "To sort values", "To skip negative numbers", "To make recursion work"], 0, "The pair is unordered and indices must satisfy i < j."),
    ],
    [
      mc("If values are sorted, what can replace the nested loops?", ["A two-pointer scan", "A stack only", "A random walk", "A linked list"], 0, "For each left value, a moving right boundary counts valid partners."),
      mc("What does the counter represent?", ["Number of valid pairs found so far", "Current maximum value", "The last index", "The target itself"], 0, "It accumulates exactly one count per qualifying pair."),
    ],
  ),

  // ---------- Novice: trees, heaps, and relational data ----------
  makeChallenge(
    {
      level: "novice",
      title: "Tree Depth",
      prompt: "Given a binary tree whose nodes have left and right fields, return its maximum depth. An empty tree has depth 0.",
      functionName: "treeDepth",
      starterCode: `function treeDepth(root) {
  // your code here
}`,
      referenceSolution: `function treeDepth(root) {
  if (root === null) return 0;
  return 1 + Math.max(treeDepth(root.left), treeDepth(root.right));
}`,
      testCases: [
        { args: [null], expected: 0, label: "treeDepth(null)" },
        { args: [{ value: 5, left: null, right: null }], expected: 1, label: "treeDepth(single node)" },
        { args: [{ value: 5, left: { value: 3, left: null, right: null }, right: { value: 8, left: null, right: { value: 9, left: null, right: null } } }], expected: 3, label: "treeDepth(balanced-ish tree)" },
      ],
    },
    [
      mc("What does the recursive call compute?", ["The depth of a child subtree", "The tree's sorted order", "The number of leaves only", "The root price"], 0, "Each call asks for the maximum depth below one node."),
      mc("What is the worst-case time complexity?", ["O(1)", "O(log N)", "O(N)", "O(N²)"], 2, "Every node is visited once."),
    ],
    [
      mc("What is the recursion stack space in a skewed tree?", ["O(1)", "O(log N)", "O(N)", "O(N²)"], 2, "A chain of N nodes creates N nested calls."),
      mc("Why is the base case necessary?", ["It stops at an empty child", "It sorts the tree", "It prevents all recursion", "It chooses the larger value"], 0, "Null children have depth zero and terminate the recursion."),
    ],
  ),
  makeChallenge(
    {
      level: "novice",
      title: "In-Order Price Walk",
      prompt: "Return the values of a binary tree in in-order: left subtree, node, then right subtree.",
      functionName: "inorderValues",
      starterCode: `function inorderValues(root) {
  // your code here
}`,
      referenceSolution: `function inorderValues(root) {
  if (root === null) return [];
  return [...inorderValues(root.left), root.value, ...inorderValues(root.right)];
}`,
      testCases: [
        { args: [null], expected: [], label: "inorderValues(null)" },
        { args: [{ value: 2, left: { value: 1, left: null, right: null }, right: { value: 3, left: null, right: null } }], expected: [1, 2, 3], label: "inorderValues([1,2,3])" },
        { args: [{ value: 5, left: null, right: { value: 7, left: null, right: null } }], expected: [5, 7], label: "inorderValues([5,null,7])" },
      ],
    },
    [
      mc("For a binary search tree, what does in-order traversal produce?", ["Sorted values", "Random values", "Only leaves", "Reverse insertion order"], 0, "The BST ordering invariant places smaller values left and larger values right."),
      mc("What is the time complexity?", ["O(1)", "O(N)", "O(log N)", "O(N²)"], 1, "Every node appears once in the output."),
    ],
    [
      mc("What is the extra recursion space in a balanced tree?", ["O(1)", "O(log N)", "O(N²)", "O(2ⁿ)"], 1, "The height of a balanced tree is logarithmic."),
      mc("Why return [] for null?", ["It is the neutral result for concatenation", "Null is a valid value", "It avoids visiting the root", "It reverses the tree"], 0, "Empty subtrees contribute no values to the output."),
    ],
  ),
  makeChallenge(
    {
      level: "novice",
      title: "Push Into a Min-Heap",
      prompt: "Given an array representing a valid min-heap, return a new array after inserting value and restoring the heap property.",
      functionName: "minHeapPush",
      starterCode: `function minHeapPush(heap, value) {
  // your code here
}`,
      referenceSolution: `function minHeapPush(heap, value) {
  const out = heap.slice();
  out.push(value);
  let i = out.length - 1;
  while (i > 0) {
    const parent = Math.floor((i - 1) / 2);
    if (out[parent] <= out[i]) break;
    [out[parent], out[i]] = [out[i], out[parent]];
    i = parent;
  }
  return out;
}`,
      testCases: [
        { args: [[1, 3, 5], 2], expected: [1, 2, 5, 3], label: "minHeapPush([1,3,5], 2)" },
        { args: [[], 7], expected: [7], label: "minHeapPush([], 7)" },
        { args: [[2, 4, 6, 8], 1], expected: [1, 2, 6, 8, 4], label: "minHeapPush([2,4,6,8], 1)" },
      ],
    },
    [
      mc("Where does a new heap element start?", ["At the root", "At the next open leaf position", "At a random index", "At the last parent"], 1, "Appending preserves the complete-tree shape before bubbling upward."),
      mc("What is the worst-case insertion complexity?", ["O(1)", "O(log N)", "O(N)", "O(N²)"], 1, "The item can move up at most the heap height."),
    ],
    [
      mc("What does the parent index equal for child index i?", ["i / 2", "Math.floor((i - 1) / 2)", "2i", "i - 1"], 1, "That is the zero-based array representation of a binary heap."),
      mc("Why return a copy instead of mutating heap?", ["It preserves the caller's input", "It makes lookup O(1)", "Heaps cannot be mutated", "It sorts automatically"], 0, "Copying makes the function easier to reason about as a pure transformation."),
    ],
  ),
  makeChallenge(
    {
      level: "novice",
      title: "Merge Sorted Quotes",
      prompt: "Merge two arrays of already sorted quote prices into one sorted array without sorting the final result.",
      functionName: "mergeSortedQuotes",
      starterCode: `function mergeSortedQuotes(a, b) {
  // your code here
}`,
      referenceSolution: `function mergeSortedQuotes(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) out.push(a[i++]);
    else out.push(b[j++]);
  }
  return out.concat(a.slice(i), b.slice(j));
}`,
      testCases: [
        { args: [[1, 4, 9], [2, 3, 10]], expected: [1, 2, 3, 4, 9, 10], label: "mergeSortedQuotes([1,4,9], [2,3,10])" },
        { args: [[], [2, 5]], expected: [2, 5], label: "mergeSortedQuotes([], [2,5])" },
        { args: [[1, 1], [1]], expected: [1, 1, 1], label: "mergeSortedQuotes([1,1], [1])" },
      ],
    },
    [
      mc("Why can we avoid sorting?", ["Both inputs are already ordered", "Arrays cannot be sorted", "The output is random", "Sorting is always slower than recursion"], 0, "The two pointers expose the smallest remaining candidate from each input."),
      mc("What is the time complexity?", ["O(1)", "O(log N)", "O(A + B)", "O(A × B)"], 2, "Each input element is consumed once."),
    ],
    [
      mc("What does each pointer represent?", ["The largest element seen", "The next unmerged element", "The output length", "The midpoint"], 1, "Pointers mark the front of each remaining sorted suffix."),
      mc("What is the output space complexity?", ["O(1)", "O(A + B)", "O(log A)", "O(A × B)"], 1, "The merged output contains every input element."),
    ],
  ),
  makeChallenge(
    {
      level: "novice",
      title: "Desk PnL Group-By",
      prompt: "Given trade rows with desk and pnl fields, return an object containing the total PnL for each desk. This is a JavaScript model of SQL GROUP BY.",
      functionName: "groupPnLByDesk",
      starterCode: `function groupPnLByDesk(rows) {
  // your code here
}`,
      referenceSolution: `function groupPnLByDesk(rows) {
  const totals = {};
  for (const row of rows) totals[row.desk] = (totals[row.desk] || 0) + row.pnl;
  return totals;
}`,
      testCases: [
        { args: [[{ desk: "rates", pnl: 4 }, { desk: "equity", pnl: -2 }, { desk: "rates", pnl: 6 }]], expected: { rates: 10, equity: -2 }, label: "groupPnLByDesk(rows)" },
        { args: [[]], expected: {}, label: "groupPnLByDesk([])" },
        { args: [[{ desk: "credit", pnl: 0 }]], expected: { credit: 0 }, label: "groupPnLByDesk([{desk:'credit',pnl:0}])" },
      ],
    },
    [
      mc("What SQL operation does this model?", ["GROUP BY desk with SUM(pnl)", "ORDER BY pnl", "DELETE", "CROSS JOIN"], 0, "Rows are partitioned by desk and their PnL is aggregated."),
      mc("What is the average time complexity?", ["O(1)", "O(N)", "O(N²)", "O(log N)"], 1, "Each row performs one average-constant-time map update."),
    ],
    [
      mc("Why initialize a missing desk total with zero?", ["It is the additive identity", "It sorts keys", "It removes negative PnL", "It prevents all grouping"], 0, "Zero is the correct starting point for a sum."),
      mc("What is the output space in the worst case?", ["O(1)", "O(D)", "O(N²)", "O(log N)"], 1, "D distinct desks may appear in the result."),
    ],
  ),
  makeChallenge(
    {
      level: "novice",
      title: "Top K Returns",
      prompt: "Return the k largest values from an array of trade returns, sorted from largest to smallest.",
      functionName: "topKReturns",
      starterCode: `function topKReturns(values, k) {
  // your code here
}`,
      referenceSolution: `function topKReturns(values, k) {
  return values.slice().sort((a, b) => b - a).slice(0, k);
}`,
      testCases: [
        { args: [[3, 1, 5, 2, 4], 3], expected: [5, 4, 3], label: "topKReturns([3,1,5,2,4], 3)" },
        { args: [[-1, -5, -2], 2], expected: [-1, -2], label: "topKReturns([-1,-5,-2], 2)" },
        { args: [[7, 8], 5], expected: [8, 7], label: "topKReturns([7,8], 5)" },
      ],
    },
    [
      mc("What is the complexity of the reference solution?", ["O(N)", "O(log N)", "O(N log N)", "O(K²)"], 2, "Sorting N values dominates the slice."),
      mc("Why call slice before sort?", ["To avoid mutating the input", "To make sorting stable", "To create a heap", "To remove negative values"], 0, "slice creates a copy before the in-place sort."),
    ],
    [
      mc("What data structure can improve this for small K?", ["A min-heap of size K", "A linked list of all values", "A stack only", "A matrix"], 0, "A size-K heap keeps only the current top candidates."),
      mc("What is the copy's worst-case space cost?", ["O(1)", "O(N)", "O(log N)", "O(K²)"], 1, "slice duplicates the input array before sorting."),
    ],
  ),

  // ---------- Intermediate: graph traversal, heaps, joins, and Markov chains ----------
  makeChallenge(
    {
      level: "intermediate",
      title: "BFS Shortest Path",
      prompt: "Given an unweighted graph as an adjacency-list object, return the fewest number of edges from start to target, or -1 if unreachable.",
      functionName: "bfsShortestPath",
      starterCode: `function bfsShortestPath(graph, start, target) {
  // your code here
}`,
      referenceSolution: `function bfsShortestPath(graph, start, target) {
  const queue = [[start, 0]];
  const seen = new Set([start]);
  while (queue.length) {
    const [node, distance] = queue.shift();
    if (node === target) return distance;
    for (const next of (graph[node] || [])) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push([next, distance + 1]);
      }
    }
  }
  return -1;
}`,
      testCases: [
        { args: [{ A: ["B", "C"], B: ["D"], C: ["D"], D: [] }, "A", "D"], expected: 2, label: "bfsShortestPath(graph, 'A', 'D')" },
        { args: [{ A: ["B"], B: [], C: [] }, "A", "C"], expected: -1, label: "bfsShortestPath(disconnected graph)" },
        { args: [{ A: [] }, "A", "A"], expected: 0, label: "bfsShortestPath(graph, 'A', 'A')" },
      ],
    },
    [
      mc("Why does BFS find the shortest path in an unweighted graph?", ["It visits nodes in nondecreasing distance", "It sorts every edge", "It uses recursion", "It picks the largest neighbor"], 0, "The queue processes all nodes at distance d before distance d + 1."),
      mc("What is the complexity in terms of vertices V and edges E?", ["O(V + E)", "O(V²E)", "O(log V)", "O(E²)"], 0, "Each reachable vertex and adjacency entry is processed once."),
    ],
    [
      mc("Why keep a seen set?", ["To prevent revisiting nodes and infinite cycles", "To sort neighbors", "To count prices", "To make the queue recursive"], 0, "Graphs may contain cycles, so each node should be enqueued once."),
      mc("What is the queue space in the worst case?", ["O(1)", "O(V)", "O(E²)", "O(log V)"], 1, "A frontier can contain a linear number of vertices."),
    ],
  ),
  makeChallenge(
    {
      level: "intermediate",
      title: "Directed Graph Cycle",
      prompt: "Given a directed graph as an adjacency-list object, return true if it contains a directed cycle and false otherwise.",
      functionName: "hasDirectedCycle",
      starterCode: `function hasDirectedCycle(graph) {
  // your code here
}`,
      referenceSolution: `function hasDirectedCycle(graph) {
  const state = {};
  function visit(node) {
    if (state[node] === 1) return true;
    if (state[node] === 2) return false;
    state[node] = 1;
    for (const next of (graph[node] || [])) {
      if (visit(next)) return true;
    }
    state[node] = 2;
    return false;
  }
  return Object.keys(graph).some(visit);
}`,
      testCases: [
        { args: [{ A: ["B"], B: ["C"], C: ["A"] }], expected: true, label: "hasDirectedCycle(A→B→C→A)" },
        { args: [{ A: ["B"], B: ["C"], C: [] }], expected: false, label: "hasDirectedCycle(chain)" },
        { args: [{ A: ["A"] }], expected: true, label: "hasDirectedCycle(self-loop)" },
      ],
    },
    [
      mc("What does state 1 mean in the DFS?", ["Currently on the recursion path", "Fully processed", "Unreachable", "A weighted edge"], 0, "Seeing a node that is already active means a back edge has closed a cycle."),
      mc("What is the time complexity?", ["O(V + E)", "O(V²E)", "O(log V)", "O(E²)"], 0, "Each node and directed edge is examined at most once."),
    ],
    [
      mc("Why mark a node state 2 after visiting its children?", ["It is fully processed and need not be searched again", "It becomes a cycle", "It removes the node", "It sorts the graph"], 0, "The finished state prevents duplicate work from other DFS roots."),
      mc("What can happen without a recursion-path state?", ["A cycle may be missed", "The graph becomes sorted", "All edges disappear", "The algorithm becomes O(1)"], 0, "A global visited flag alone cannot distinguish a back edge from a finished branch."),
    ],
  ),
  makeChallenge(
    {
      level: "intermediate",
      title: "Kth Largest with a Heap",
      prompt: "Return the kth largest value in an array. Maintain a min-heap of size k so the intended complexity is O(N log K).",
      functionName: "kthLargest",
      starterCode: `function kthLargest(values, k) {
  // your code here
}`,
      referenceSolution: `function kthLargest(values, k) {
  const heap = [];
  const push = (value) => {
    heap.push(value);
    let i = heap.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const root = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let child = i * 2 + 1;
        if (child >= heap.length) break;
        if (child + 1 < heap.length && heap[child + 1] < heap[child]) child++;
        if (heap[i] <= heap[child]) break;
        [heap[i], heap[child]] = [heap[child], heap[i]];
        i = child;
      }
    }
    return root;
  };
  for (const value of values) {
    push(value);
    if (heap.length > k) pop();
  }
  return heap[0];
}`,
      testCases: [
        { args: [[3, 2, 1, 5, 6, 4], 2], expected: 5, label: "kthLargest([3,2,1,5,6,4], 2)" },
        { args: [[7], 1], expected: 7, label: "kthLargest([7], 1)" },
        { args: [[-1, -5, -2], 2], expected: -2, label: "kthLargest([-1,-5,-2], 2)" },
      ],
    },
    [
      mc("Why use a min-heap for kth largest?", ["Its root is the smallest among the kept top k", "It sorts all values", "It removes all negatives", "It stores graph edges"], 0, "The smallest member of the top-k set is the boundary for admitting a new value."),
      mc("What is the intended time complexity?", ["O(N log K)", "O(N²)", "O(log N)", "O(K²)"], 0, "Each insertion or removal costs O(log K) while the heap stays size K."),
    ],
    [
      mc("What is the extra space complexity?", ["O(1)", "O(K)", "O(N²)", "O(log N)"], 1, "Only the size-k heap is maintained."),
      mc("If k equals N, what does the approach become?", ["A full heap-based sort-like process", "O(1)", "A graph traversal", "Impossible"], 0, "The heap is allowed to grow to the full input size."),
    ],
  ),
  makeChallenge(
    {
      level: "intermediate",
      title: "Trade-Quote Inner Join",
      prompt: "Given trade rows and quote rows keyed by symbol, return trade rows enriched with the matching quote price. Ignore trades without a quote.",
      functionName: "joinTradesQuotes",
      starterCode: `function joinTradesQuotes(trades, quotes) {
  // your code here
}`,
      referenceSolution: `function joinTradesQuotes(trades, quotes) {
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote.price]));
  return trades
    .filter((trade) => bySymbol.has(trade.symbol))
    .map((trade) => ({ ...trade, price: bySymbol.get(trade.symbol) }));
}`,
      testCases: [
        { args: [[{ symbol: "A", qty: 2 }, { symbol: "B", qty: 3 }], [{ symbol: "A", price: 101 }]], expected: [{ symbol: "A", qty: 2, price: 101 }], label: "joinTradesQuotes(trades, quotes)" },
        { args: [[], [{ symbol: "A", price: 1 }]], expected: [], label: "joinTradesQuotes([], quotes)" },
        { args: [[{ symbol: "X", qty: 1 }], [{ symbol: "X", price: 9 }]], expected: [{ symbol: "X", qty: 1, price: 9 }], label: "joinTradesQuotes(one matching row)" },
      ],
    },
    [
      mc("What SQL operation does this model?", ["INNER JOIN on symbol", "GROUP BY only", "ORDER BY", "UNION ALL"], 0, "Only rows with a matching symbol in both inputs survive."),
      mc("Why build a Map for quotes?", ["It gives average O(1) key lookup", "It sorts prices", "It removes all trades", "It makes arrays immutable"], 0, "The map avoids scanning every quote for every trade."),
    ],
    [
      mc("What is the average complexity with T trades and Q quotes?", ["O(T + Q)", "O(TQ)", "O(log T)", "O(Q²)"], 0, "Build the quote map once, then scan trades once."),
      mc("What happens to an unmatched trade in an inner join?", ["It is omitted", "It becomes price zero", "It is duplicated", "It throws automatically"], 0, "An inner join keeps only rows with a matching key."),
    ],
  ),
  makeChallenge(
    {
      level: "intermediate",
      title: "Markov Chain Stepper",
      prompt: "Simulate a finite Markov chain for a supplied sequence of uniform draws. transitions[state] contains sorted objects with to and probability fields. Return the final state.",
      functionName: "simulateMarkovChain",
      starterCode: `function simulateMarkovChain(start, transitions, draws) {
  // your code here
}`,
      referenceSolution: `function simulateMarkovChain(start, transitions, draws) {
  let state = start;
  for (const draw of draws) {
    let cumulative = 0;
    for (const step of transitions[state]) {
      cumulative += step.probability;
      if (draw < cumulative) {
        state = step.to;
        break;
      }
    }
  }
  return state;
}`,
      testCases: [
        { args: ["A", { A: [{ to: "A", probability: 0.5 }, { to: "B", probability: 0.5 }], B: [{ to: "B", probability: 1 }] }, [0.2, 0.9]], expected: "B", label: "simulateMarkovChain(A, transitions, [0.2,0.9])" },
        { args: ["A", { A: [{ to: "A", probability: 0.25 }, { to: "B", probability: 0.75 }], B: [{ to: "A", probability: 1 }] }, [0.8, 0.2]], expected: "A", label: "simulateMarkovChain(A, alternating draws)" },
        { args: ["flat", { flat: [{ to: "flat", probability: 1 }] }, [0.1, 0.7, 0.99]], expected: "flat", label: "simulateMarkovChain(absorbing state)" },
      ],
    },
    [
      mc("What makes this process Markov?", ["The next state depends only on the current state", "All states have equal probability", "The chain must be sorted", "It cannot revisit a state"], 0, "The transition rule conditions on the present state, not the full history."),
      mc("Why inject draws instead of calling Math.random in the tests?", ["It makes tests deterministic", "It makes the chain faster only", "Randomness is invalid", "It sorts transitions"], 0, "Fixed draws let the same path be checked every run."),
    ],
    [
      mc("What is the complexity for D draws and at most K outgoing transitions?", ["O(DK)", "O(D + K)", "O(log D)", "O(K²)"], 0, "Each draw scans the current state's transition row."),
      mc("What does an absorbing state do?", ["It transitions to itself with probability one", "It must have no transitions", "It always disappears", "It reverses the chain"], 0, "Once entered, the process remains there."),
    ],
  ),
  makeChallenge(
    {
      level: "intermediate",
      title: "Prefix Range PnL",
      prompt: "Given an array of daily PnL values and inclusive [left, right] queries, return the sum for each range. Precompute so each query is O(1).",
      functionName: "prefixRangeSums",
      starterCode: `function prefixRangeSums(values, queries) {
  // your code here
}`,
      referenceSolution: `function prefixRangeSums(values, queries) {
  const prefix = [0];
  for (const value of values) prefix.push(prefix[prefix.length - 1] + value);
  return queries.map(([left, right]) => prefix[right + 1] - prefix[left]);
}`,
      testCases: [
        { args: [[1, 2, 3, 4], [[0, 1], [1, 3]]], expected: [3, 9], label: "prefixRangeSums([1,2,3,4], [[0,1],[1,3]])" },
        { args: [[-2, 5], [[0, 0], [0, 1]]], expected: [-2, 3], label: "prefixRangeSums([-2,5], [[0,0],[0,1]])" },
        { args: [[], []], expected: [], label: "prefixRangeSums([], [])" },
      ],
    },
    [
      mc("What does prefix[i] store?", ["The sum before index i", "The maximum value", "The number of queries", "The sorted input"], 0, "A prefix array stores the cumulative total before the current position."),
      mc("What is the total complexity for N values and Q queries?", ["O(N + Q)", "O(NQ)", "O(log Q)", "O(Q²)"], 0, "Build the prefix once, then answer each query with constant arithmetic."),
    ],
    [
      mc("Why is prefix[right + 1] used?", ["The prefix array includes an initial zero", "It skips the right endpoint", "It sorts the range", "It doubles the sum"], 0, "The extra leading zero makes an inclusive range a difference of two prefix entries."),
      mc("What is each query's time complexity after preprocessing?", ["O(1)", "O(log N)", "O(N)", "O(N²)"], 0, "Only two array lookups and one subtraction are required."),
    ],
  ),

  // ---------- Advanced: shortest paths, SQL windows, stationary distributions ----------
  makeChallenge(
    {
      level: "advanced",
      title: "Dijkstra Price Routes",
      prompt: "Given a directed graph whose adjacency lists contain {to, weight} edges, return shortest distances from source. All weights are nonnegative.",
      functionName: "dijkstraDistances",
      starterCode: `function dijkstraDistances(graph, source) {
  // your code here
}`,
      referenceSolution: `function dijkstraDistances(graph, source) {
  const distances = {};
  for (const node of Object.keys(graph)) distances[node] = Infinity;
  distances[source] = 0;
  const done = new Set();
  while (done.size < Object.keys(graph).length) {
    let current = null;
    for (const node of Object.keys(distances)) {
      if (!done.has(node) && (current === null || distances[node] < distances[current])) current = node;
    }
    if (current === null || distances[current] === Infinity) break;
    done.add(current);
    for (const edge of (graph[current] || [])) {
      distances[edge.to] = Math.min(distances[edge.to], distances[current] + edge.weight);
    }
  }
  return distances;
}`,
      testCases: [
        { args: [{ A: [{ to: "B", weight: 4 }, { to: "C", weight: 1 }], B: [{ to: "D", weight: 1 }], C: [{ to: "B", weight: 2 }, { to: "D", weight: 5 }], D: [] }, "A"], expected: { A: 0, B: 3, C: 1, D: 4 }, label: "dijkstraDistances(graph, 'A')" },
        { args: [{ A: [], B: [] }, "A"], expected: { A: 0, B: Infinity }, label: "dijkstraDistances(disconnected graph)" },
        { args: [{ A: [{ to: "B", weight: 2 }], B: [] }, "A"], expected: { A: 0, B: 2 }, label: "dijkstraDistances(two nodes)" },
      ],
    },
    [
      mc("Why must edge weights be nonnegative?", ["The greedy settled distance must never improve later", "Negative values cannot be stored", "It makes graphs undirected", "It avoids objects"], 0, "Dijkstra permanently settles the smallest tentative distance, which only works without negative edges."),
      mc("What is the complexity of this simple implementation?", ["O(V² + E)", "O(log V)", "O(E²)", "O(1)"], 0, "Selecting the next node by scanning all vertices costs O(V²), plus edge relaxations."),
    ],
    [
      mc("What does relaxing an edge mean?", ["Trying to improve a neighbor's best-known distance", "Deleting the edge", "Sorting all nodes", "Adding a negative cycle"], 0, "The candidate route through the current node is compared with the stored distance."),
      mc("What data structure improves next-node selection?", ["A min-priority queue", "A stack", "A string", "A hash set only"], 0, "A min-heap reduces repeated minimum selection to logarithmic time."),
    ],
  ),
  makeChallenge(
    {
      level: "advanced",
      title: "Top Frequent Symbols",
      prompt: "Return the k most frequent symbols, sorted by descending frequency and then alphabetically for ties.",
      functionName: "topFrequentSymbols",
      starterCode: `function topFrequentSymbols(symbols, k) {
  // your code here
}`,
      referenceSolution: `function topFrequentSymbols(symbols, k) {
  const counts = {};
  for (const symbol of symbols) counts[symbol] = (counts[symbol] || 0) + 1;
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b)).slice(0, k);
}`,
      testCases: [
        { args: [["A", "B", "A", "C", "B", "A"], 2], expected: ["A", "B"], label: "topFrequentSymbols([A,B,A,C,B,A], 2)" },
        { args: [["B", "A", "B", "A"], 2], expected: ["A", "B"], label: "topFrequentSymbols(tied symbols, 2)" },
        { args: [["SPY", "QQQ"], 5], expected: ["QQQ", "SPY"], label: "topFrequentSymbols([SPY,QQQ], 5)" },
      ],
    },
    [
      mc("What is the first useful intermediate structure?", ["A frequency map", "A call stack", "A matrix inverse", "A random seed"], 0, "Counts must be accumulated before ranking symbols."),
      mc("What dominates the reference complexity?", ["Sorting the distinct symbols", "One hash lookup", "Returning k", "Comparing two strings once"], 0, "With D distinct symbols, sorting costs O(D log D)."),
    ],
    [
      mc("Why include an alphabetical tie-break?", ["It makes output deterministic", "It increases frequency", "It removes symbols", "It creates a heap"], 0, "Equal counts otherwise allow multiple valid orderings."),
      mc("How could a heap improve the general top-k problem?", ["Keep a size-k heap instead of sorting all D symbols", "Remove the count map", "Make every lookup O(D²)", "Use recursion only"], 0, "A bounded heap avoids fully sorting symbols when k is small."),
    ],
  ),
  makeChallenge(
    {
      level: "advanced",
      title: "SQL-Style Cumulative PnL",
      prompt: "Given rows sorted by timestamp with desk and pnl fields, return each row with cumulative PnL within its desk. This models SUM(pnl) OVER (PARTITION BY desk ORDER BY timestamp).",
      functionName: "cumulativeDeskPnL",
      starterCode: `function cumulativeDeskPnL(rows) {
  // your code here
}`,
      referenceSolution: `function cumulativeDeskPnL(rows) {
  const running = {};
  return rows.map((row) => {
    running[row.desk] = (running[row.desk] || 0) + row.pnl;
    return { ...row, cumulative: running[row.desk] };
  });
}`,
      testCases: [
        { args: [[{ desk: "rates", timestamp: 1, pnl: 2 }, { desk: "equity", timestamp: 2, pnl: 5 }, { desk: "rates", timestamp: 3, pnl: -1 }]], expected: [{ desk: "rates", timestamp: 1, pnl: 2, cumulative: 2 }, { desk: "equity", timestamp: 2, pnl: 5, cumulative: 5 }, { desk: "rates", timestamp: 3, pnl: -1, cumulative: 1 }], label: "cumulativeDeskPnL(rows)" },
        { args: [[{ desk: "credit", timestamp: 1, pnl: 0 }]], expected: [{ desk: "credit", timestamp: 1, pnl: 0, cumulative: 0 }], label: "cumulativeDeskPnL(one row)" },
        { args: [[]], expected: [], label: "cumulativeDeskPnL([])" },
      ],
    },
    [
      mc("What does PARTITION BY desk mean?", ["Maintain a separate running total per desk", "Sort desks alphabetically only", "Remove duplicate desks", "Join two tables"], 0, "Each desk has its own cumulative state."),
      mc("What does ORDER BY timestamp control?", ["The order in which the window accumulates", "Which rows are deleted", "The table schema", "The number of desks"], 0, "A running window depends on row order."),
    ],
    [
      mc("What is the time complexity once rows are sorted?", ["O(N)", "O(N²)", "O(log N)", "O(1)"], 0, "The cumulative pass touches each row once."),
      mc("What extra space is required for D desks?", ["O(1)", "O(D)", "O(N²)", "O(log D)"], 1, "The running map stores one total per desk, excluding the output."),
    ],
  ),
  makeChallenge(
    {
      level: "advanced",
      title: "One Markov Distribution Step",
      prompt: "Given a current probability distribution and a row-stochastic transition matrix represented as objects, return the distribution after one transition step.",
      functionName: "markovDistributionStep",
      starterCode: `function markovDistributionStep(distribution, transitions) {
  // your code here
}`,
      referenceSolution: `function markovDistributionStep(distribution, transitions) {
  const next = {};
  for (const state of Object.keys(transitions)) next[state] = 0;
  for (const from of Object.keys(distribution)) {
    for (const step of transitions[from]) {
      next[step.to] = (next[step.to] || 0) + distribution[from] * step.probability;
    }
  }
  return next;
}`,
      testCases: [
        { args: [{ A: 1, B: 0 }, { A: [{ to: "A", probability: 0.5 }, { to: "B", probability: 0.5 }], B: [{ to: "A", probability: 0.25 }, { to: "B", probability: 0.75 }] }], expected: { A: 0.5, B: 0.5 }, label: "markovDistributionStep(start at A)" },
        { args: [{ A: 0.25, B: 0.75 }, { A: [{ to: "A", probability: 1 }], B: [{ to: "B", probability: 1 }] }], expected: { A: 0.25, B: 0.75 }, label: "markovDistributionStep(absorbing states)" },
        { args: [{ A: 1 }, { A: [{ to: "B", probability: 1 }], B: [{ to: "A", probability: 1 }] }], expected: { A: 0, B: 1 }, label: "markovDistributionStep(A to B)" },
      ],
    },
    [
      mc("What mathematical operation is this?", ["A probability-vector times transition-matrix multiplication", "A shortest path", "A sort", "A tree rotation"], 0, "Each current state's mass is distributed across its outgoing transitions."),
      mc("What must each transition row sum to?", ["1", "0", "The number of states", "The current PnL"], 0, "A row-stochastic matrix represents a complete probability distribution."),
    ],
    [
      mc("What happens to total probability under a valid transition matrix?", ["It remains 1", "It doubles", "It becomes zero", "It is sorted"], 0, "Transition probabilities redistribute mass without creating or destroying it."),
      mc("What is the complexity with S states and at most K outgoing transitions?", ["O(SK)", "O(S²K)", "O(log S)", "O(1)"], 0, "Each state-transition entry contributes once."),
    ],
  ),
  makeChallenge(
    {
      level: "advanced",
      title: "Negative Cycle Detector",
      prompt: "Given a directed edge list with from, to, and weight fields, return true if the graph contains a reachable negative-weight cycle from source.",
      functionName: "hasNegativeCycle",
      starterCode: `function hasNegativeCycle(edges, nodes, source) {
  // your code here
}`,
      referenceSolution: `function hasNegativeCycle(edges, nodes, source) {
  const distance = {};
  for (const node of nodes) distance[node] = Infinity;
  distance[source] = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    for (const edge of edges) {
      if (distance[edge.from] !== Infinity) {
        distance[edge.to] = Math.min(distance[edge.to], distance[edge.from] + edge.weight);
      }
    }
  }
  return edges.some((edge) => distance[edge.from] !== Infinity && distance[edge.from] + edge.weight < distance[edge.to]);
}`,
      testCases: [
        { args: [[{ from: "A", to: "B", weight: 1 }, { from: "B", to: "C", weight: -3 }, { from: "C", to: "A", weight: 1 }], ["A", "B", "C"], "A"], expected: true, label: "hasNegativeCycle(negative cycle)" },
        { args: [[{ from: "A", to: "B", weight: 2 }, { from: "B", to: "C", weight: 3 }], ["A", "B", "C"], "A"], expected: false, label: "hasNegativeCycle(acyclic graph)" },
        { args: [[{ from: "X", to: "Y", weight: -5 }, { from: "Y", to: "X", weight: 1 }], ["A", "X", "Y"], "A"], expected: false, label: "hasNegativeCycle(unreachable cycle)" },
      ],
    },
    [
      mc("Which algorithm does this implement?", ["Bellman-Ford", "Binary search", "Heap sort", "BFS only"], 0, "Bellman-Ford relaxes all edges V - 1 times, then checks for one more improvement."),
      mc("Why perform V - 1 full passes?", ["A simple path has at most V - 1 edges", "There are always V - 1 cycles", "It sorts vertices", "It builds a heap"], 0, "Any shortest simple path can use at most V - 1 edges."),
    ],
    [
      mc("What does an extra possible relaxation after V - 1 passes prove?", ["A reachable negative cycle exists", "The graph is sorted", "All distances are positive", "The source is isolated"], 0, "A negative cycle can keep improving a reachable distance indefinitely."),
      mc("What is the time complexity?", ["O(VE)", "O(V + E)", "O(log V)", "O(E²)"], 0, "The algorithm scans E edges across V passes."),
    ],
  ),
  makeChallenge(
    {
      level: "advanced",
      title: "Count Inversions",
      prompt: "Return the number of pairs i < j where values[i] > values[j]. Use a divide-and-conquer approach rather than checking every pair.",
      functionName: "countInversions",
      starterCode: `function countInversions(values) {
  // your code here
}`,
      referenceSolution: `function countInversions(values) {
  function sortAndCount(items) {
    if (items.length < 2) return { items, count: 0 };
    const mid = Math.floor(items.length / 2);
    const left = sortAndCount(items.slice(0, mid));
    const right = sortAndCount(items.slice(mid));
    const merged = [];
    let i = 0;
    let j = 0;
    let count = left.count + right.count;
    while (i < left.items.length && j < right.items.length) {
      if (left.items[i] <= right.items[j]) merged.push(left.items[i++]);
      else {
        merged.push(right.items[j++]);
        count += left.items.length - i;
      }
    }
    return { items: merged.concat(left.items.slice(i), right.items.slice(j)), count };
  }
  return sortAndCount(values).count;
}`,
      testCases: [
        { args: [[2, 4, 1, 3, 5]], expected: 3, label: "countInversions([2,4,1,3,5])" },
        { args: [[1, 2, 3]], expected: 0, label: "countInversions([1,2,3])" },
        { args: [[3, 2, 1]], expected: 3, label: "countInversions([3,2,1])" },
      ],
    },
    [
      mc("What does an inversion represent in a time series?", ["An out-of-order pair", "A zero return", "A graph cycle", "A heap root"], 0, "It counts pairs whose relative ordering conflicts with sorted order."),
      mc("What is the target time complexity?", ["O(N²)", "O(N log N)", "O(log N)", "O(1)"], 1, "Merge-sort recursion counts cross-half inversions in linear work per level."),
    ],
    [
      mc("When a right value is smaller than left[i], how many inversions does it add?", ["The remaining left values", "One always", "All right values", "Zero"], 0, "The left half is sorted, so every unmerged left value is larger."),
      mc("What does the merge step preserve?", ["Sorted order of the returned subarray", "The original recursion stack", "A graph invariant", "Only the first element"], 0, "Sorted halves are merged into a sorted result while counting crossings."),
    ],
  ),
];

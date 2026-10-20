// Subjects, sections and topics seeded for each user, plus the 26-week plan generator.

export type SubjectKey = "cyber" | "dsa" | "csf" | "apt" | "proj" | "hr";

export const SUBJECT_META: Record<
  SubjectKey | "review",
  { colorVar: string; dot: string; tint: string; text: string }
> = {
  cyber: {
    colorVar: "var(--subj-cyber)",
    dot: "bg-subj-cyber",
    tint: "bg-subj-cyber/12",
    text: "text-subj-cyber",
  },
  dsa: {
    colorVar: "var(--subj-dsa)",
    dot: "bg-subj-dsa",
    tint: "bg-subj-dsa/12",
    text: "text-subj-dsa",
  },
  csf: {
    colorVar: "var(--subj-csf)",
    dot: "bg-subj-csf",
    tint: "bg-subj-csf/12",
    text: "text-subj-csf",
  },
  apt: {
    colorVar: "var(--subj-apt)",
    dot: "bg-subj-apt",
    tint: "bg-subj-apt/15",
    text: "text-subj-apt",
  },
  proj: {
    colorVar: "var(--subj-proj)",
    dot: "bg-subj-proj",
    tint: "bg-subj-proj/12",
    text: "text-subj-proj",
  },
  hr: {
    colorVar: "var(--subj-hr)",
    dot: "bg-subj-hr",
    tint: "bg-subj-hr/12",
    text: "text-subj-hr",
  },
  review: {
    colorVar: "var(--subj-review)",
    dot: "bg-subj-review",
    tint: "bg-subj-review/20",
    text: "text-muted-foreground",
  },
};

type Seed = {
  key: SubjectKey;
  name: string;
  tagline: string;
  is_main?: boolean;
  sections: [string, string[]][];
};

export const CURRICULUM: Seed[] = [
  {
    key: "cyber",
    name: "Cybersecurity",
    tagline: "Blue team, web security and pentesting",
    is_main: true,
    sections: [
      [
        "Networking & Linux basics",
        [
          "OSI & TCP/IP model",
          "IP addressing & subnetting",
          "DNS, DHCP, ARP",
          "HTTP/HTTPS & TLS",
          "Wireshark basics",
          "Linux filesystem & permissions",
          "Bash essentials",
          "Processes, services, cron",
        ],
      ],
      [
        "Security fundamentals",
        [
          "CIA triad",
          "Threats, vulnerabilities, risk",
          "Symmetric & asymmetric crypto",
          "Hashing & salting",
          "PKI & certificates",
          "Authentication & MFA",
          "Access control models",
          "Linux hardening",
        ],
      ],
      [
        "Web security & OWASP Top 10",
        [
          "How the web works",
          "Broken access control",
          "Injection & SQLi",
          "XSS",
          "CSRF & SSRF",
          "Auth & session flaws",
          "Burp Suite basics",
          "TryHackMe web rooms",
        ],
      ],
      [
        "SOC / blue team",
        [
          "SOC roles & workflow",
          "SIEM concepts",
          "Splunk searches",
          "Log analysis",
          "Incident response lifecycle",
          "Windows event logs",
          "Active Directory basics",
          "MITRE ATT&CK",
        ],
      ],
      [
        "Pentesting basics",
        [
          "Methodology & scoping",
          "Recon & OSINT",
          "Nmap scanning",
          "Enumeration",
          "Metasploit basics",
          "Privilege escalation intro",
          "HackTheBox easy boxes",
          "Report writing",
        ],
      ],
      [
        "Cloud security basics",
        [
          "Shared responsibility",
          "IAM fundamentals",
          "Cloud misconfigurations",
          "Logging & monitoring in cloud",
        ],
      ],
      [
        "Python for security automation",
        ["Sockets & requests", "Log parsing scripts", "Port scanner", "Hash & password tools"],
      ],
      ["Certification prep (optional Security+)", ["Domain review", "Practice exams"]],
    ],
  },
  {
    key: "dsa",
    name: "DSA",
    tagline: "DSA in Python, from zero",
    sections: [
      [
        "Python basics",
        [
          "Variables & types",
          "Loops & conditions",
          "Functions",
          "Lists, dicts, sets",
          "Comprehensions",
        ],
      ],
      ["Complexity", ["Big-O intuition", "Time vs space"]],
      [
        "Arrays",
        ["Traversal & prefix sums", "Two Sum", "Best Time to Buy Stock", "Kadane's algorithm"],
      ],
      ["Strings", ["String basics", "Palindromes", "Anagrams"]],
      ["Hashing", ["Hash maps", "Frequency counting", "Subarray sum = K"]],
      ["Recursion", ["Base cases", "Recursion tree", "Subsets"]],
      ["Linked List", ["Singly linked list", "Reverse a list", "Fast & slow pointers"]],
      ["Stack/Queue", ["Stack basics", "Valid parentheses", "Monotonic stack", "Queues & deque"]],
      ["Binary Search", ["Classic search", "Search on answer"]],
      ["Sorting", ["Bubble/insertion", "Merge sort", "Quick sort"]],
      ["Two Pointers/Sliding Window", ["Two pointers", "Fixed window", "Variable window"]],
      ["Trees", ["Traversals", "BST", "Level order", "LCA"]],
      ["Heaps", ["heapq basics", "Top K elements"]],
      ["Graphs", ["Representation", "BFS", "DFS", "Topological sort", "Shortest path"]],
      ["DP", ["Memoization", "1D DP", "Knapsack", "LCS", "Grid DP"]],
      ["Backtracking", ["Permutations", "N-Queens", "Word search"]],
    ],
  },
  {
    key: "csf",
    name: "CS Fundamentals",
    tagline: "OOP, DBMS, OS and networks",
    sections: [
      ["OOP", ["Classes & objects", "Encapsulation", "Inheritance", "Polymorphism", "Abstraction"]],
      [
        "DBMS & SQL",
        [
          "ER model",
          "Normalization",
          "Keys & joins",
          "Transactions & ACID",
          "Indexing",
          "SQL practice",
        ],
      ],
      [
        "Operating Systems",
        [
          "Processes & threads",
          "CPU scheduling",
          "Synchronization",
          "Deadlocks",
          "Memory & paging",
        ],
      ],
      [
        "Computer Networks",
        ["Layers revisited", "TCP vs UDP", "Routing basics", "Network security"],
      ],
    ],
  },
  {
    key: "apt",
    name: "Aptitude & Reasoning",
    tagline: "Quant, logic and verbal",
    sections: [
      [
        "Quant",
        ["Percentages", "Ratios", "Time & work", "Speed & distance", "Probability", "Permutations"],
      ],
      [
        "Logical reasoning",
        ["Series", "Blood relations", "Seating arrangement", "Syllogisms", "Puzzles"],
      ],
      ["Verbal", ["Reading comprehension", "Grammar", "Vocabulary"]],
    ],
  },
  {
    key: "proj",
    name: "Projects & Resume",
    tagline: "Build, polish, present",
    sections: [
      ["SDE project", ["Pick an idea", "Build MVP", "Write README"]],
      ["Security project", ["Pick a tool idea", "Build & document"]],
      ["GitHub cleanup", ["Pin repos", "Profile README"]],
      ["LinkedIn", ["Headline & about", "Post your projects"]],
      ["Resume versions", ["SDE resume", "Security resume"]],
    ],
  },
  {
    key: "hr",
    name: "HR / Behavioral",
    tagline: "Tell your story calmly",
    sections: [
      ["Self-introduction", ["Draft intro", "Practice out loud"]],
      ["STAR stories", ["Challenge story", "Teamwork story", "Failure story"]],
      ["Common questions", ["Strengths & weaknesses", "Why this company"]],
      ["Mock interviews", ["Mock 1", "Mock 2"]],
    ],
  },
];

export const MONTH_THEMES = [
  "Foundations",
  "Core DSA + Security basics",
  "Web & Trees",
  "SOC & Graphs",
  "Pentest & DP",
  "Mocks & Interviews",
];

type MonthPlan = {
  dsa: string[];
  cyber: string[];
  csf: string[];
  apt: string[];
  extra?: { key: SubjectKey; items: string[] };
};

const MONTHS: MonthPlan[] = [
  {
    dsa: [
      "Python basics: variables & types",
      "Python basics: loops & conditions",
      "Python basics: functions",
      "Python: lists, dicts, sets",
      "Python: comprehensions",
      "Complexity: Big-O intuition",
      "Arrays: traversal & prefix sums",
      "Arrays: Two Sum, Best Time to Buy Stock",
      "Arrays: Kadane's algorithm",
      "Strings: basics & palindromes",
      "Strings: anagrams",
      "Hashing: hash maps",
      "Hashing: frequency counting",
      "Hashing: subarray sum = K",
    ],
    cyber: [
      "Networking: OSI & TCP/IP",
      "Networking: IP & subnetting",
      "Networking: DNS, DHCP, ARP",
      "Networking: HTTP & TLS",
      "Wireshark: first capture",
      "Linux: filesystem & permissions",
      "Linux: bash essentials",
      "Linux: processes & services",
      "TryHackMe: Pre-Security path",
    ],
    csf: [],
    apt: [
      "Quant: percentages",
      "Quant: ratios",
      "Logic: series",
      "Verbal: reading comprehension",
      "Quant: time & work",
    ],
  },
  {
    dsa: [
      "Recursion: base cases",
      "Recursion: recursion tree",
      "Recursion: subsets",
      "Linked list: basics",
      "Linked list: reverse",
      "Linked list: fast & slow pointers",
      "Stack: valid parentheses",
      "Stack: monotonic stack",
      "Queue & deque",
      "Binary search: classic",
      "Binary search: on answer",
      "Sorting: merge sort",
      "Sorting: quick sort",
    ],
    cyber: [
      "Security: CIA triad & risk",
      "Crypto: symmetric & asymmetric",
      "Crypto: hashing & salting",
      "PKI & certificates",
      "Auth & MFA",
      "Access control models",
      "Linux hardening basics",
      "TryHackMe: Intro to Cyber",
    ],
    csf: [
      "OOP: classes & objects",
      "OOP: encapsulation & inheritance",
      "OOP: polymorphism & abstraction",
      "DBMS: ER model",
      "DBMS: normalization",
    ],
    apt: ["Quant: speed & distance", "Logic: blood relations"],
  },
  {
    dsa: [
      "Two pointers",
      "Sliding window: fixed",
      "Sliding window: variable",
      "Trees: traversals",
      "Trees: BST",
      "Trees: level order",
      "Trees: LCA",
      "Heaps: heapq basics",
      "Heaps: top K elements",
    ],
    cyber: [
      "Web: how the web works",
      "OWASP: broken access control",
      "OWASP: injection & SQLi",
      "OWASP: XSS",
      "OWASP: CSRF & SSRF",
      "Burp Suite basics",
      "TryHackMe: OWASP Top 10 room",
      "Auth & session flaws",
    ],
    csf: [
      "OS: processes & threads",
      "OS: CPU scheduling",
      "OS: synchronization",
      "OS: deadlocks",
      "OS: memory & paging",
    ],
    apt: ["Logic: seating arrangement", "Quant: probability"],
  },
  {
    dsa: [
      "Graphs: representation",
      "Graphs: BFS",
      "Graphs: DFS",
      "Graphs: topological sort",
      "Graphs: shortest path",
      "DP: memoization intro",
      "DP: 1D problems",
    ],
    cyber: [
      "SOC roles & workflow",
      "SIEM concepts",
      "Splunk: first searches",
      "Log analysis practice",
      "Incident response lifecycle",
      "Windows event logs",
      "Active Directory basics",
      "MITRE ATT&CK",
    ],
    csf: [
      "Networks: TCP vs UDP",
      "Networks: routing basics",
      "SQL: joins practice",
      "SQL: transactions & indexing",
      "Networks: network security",
    ],
    apt: ["Logic: syllogisms", "Verbal: grammar"],
  },
  {
    dsa: [
      "DP: knapsack",
      "DP: LCS",
      "DP: grid DP",
      "Backtracking: permutations",
      "Backtracking: N-Queens",
      "Backtracking: word search",
      "Mixed problems set",
    ],
    cyber: [
      "Pentest: methodology",
      "Recon & OSINT",
      "Nmap scanning",
      "Enumeration",
      "Metasploit basics",
      "HackTheBox: easy box",
      "Cloud: IAM & misconfigs",
      "Python: port scanner script",
      "Python: log parser script",
    ],
    csf: ["DBMS revision", "OS revision"],
    apt: ["Quant: permutations", "Logic: puzzles"],
    extra: {
      key: "proj",
      items: [
        "SDE project: build MVP",
        "Security project: build tool",
        "Resume: SDE version",
        "GitHub cleanup",
      ],
    },
  },
  {
    dsa: [
      "Mock test: DSA",
      "Revision: arrays & hashing",
      "Revision: trees & graphs",
      "Revision: DP",
      "Company-wise questions",
    ],
    cyber: [
      "Security interview Q&A",
      "Scenario: incident walkthrough",
      "Scenario: web app assessment",
      "Mock: security interview",
    ],
    csf: ["CS fundamentals full revision"],
    apt: ["Aptitude mock test"],
    extra: {
      key: "hr",
      items: [
        "Self-introduction practice",
        "STAR stories",
        "Common HR questions",
        "Mock HR interview",
        "Final resume polish",
      ],
    },
  },
];

export type PlannedTask = {
  date: string;
  subject: SubjectKey | null;
  title: string;
  detail: string;
  est_minutes: number;
  sort_order: number;
};

export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function fromISO(s: string) {
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}
export function addDays(s: string, n: number) {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
export function dayDiff(a: string, b: string) {
  return Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);
}

export const PLAN_DAYS = 182;

export function generatePlan(startDate: string, selectedSubjects: SubjectKey[]): PlannedTask[] {
  const out: PlannedTask[] = [];
  const counters: Record<string, number> = {};
  const next = (month: number, key: string, list: string[]) => {
    const k = `${month}-${key}`;
    const i = counters[k] ?? 0;
    counters[k] = i + 1;
    return list[i % list.length]!;
  };
  let weekday = 0;
  for (let day = 0; day < PLAN_DAYS; day++) {
    const date = addDays(startDate, day);
    const month = Math.min(5, Math.floor(day / 30.34));
    const plan = MONTHS[month]!;
    const isSunday = fromISO(date).getDay() === 0;
    let o = 0;
    if (isSunday) {
      // One mock per selected subject, so Sundays test what the user studies.
      const MOCK_MINUTES: Partial<Record<SubjectKey, number>> = {
        dsa: 60,
        cyber: 60,
        csf: 45,
        apt: 45,
        proj: 45,
        hr: 30,
      };
      for (const key of selectedSubjects) {
        const meta = CURRICULUM.find((s) => s.key === key);
        if (!meta) continue;
        out.push({
          date,
          subject: key,
          title: `${meta.name} Mock Test`,
          detail: `Full-length mock test covering this week's ${meta.name.toLowerCase()} topics`,
          est_minutes: MOCK_MINUTES[key] ?? 45,
          sort_order: o++,
        });
      }
      out.push({
        date,
        subject: null,
        title: "Weekly review",
        detail: "Review mock test results, identify weak areas",
        est_minutes: 30,
        sort_order: o++,
      });
      continue;
    }
    if (selectedSubjects.includes("dsa") && plan.dsa.length > 0) {
      const dsa = next(month, "dsa", plan.dsa);
      out.push({
        date,
        subject: "dsa",
        title: dsa.split(":")[0]!,
        detail: dsa,
        est_minutes: 80,
        sort_order: o++,
      });
    }
    if (selectedSubjects.includes("cyber") && plan.cyber.length > 0) {
      const cy = next(month, "cyber", plan.cyber);
      out.push({
        date,
        subject: "cyber",
        title: cy.split(":")[0]!,
        detail: cy,
        est_minutes: 75,
        sort_order: o++,
      });
    }
    // For the third subject slot, check based on selected subjects
    const useExtra = plan.extra && weekday % 3 === 2 && selectedSubjects.includes(plan.extra.key);
    const useCsf = plan.csf.length > 0 && weekday % 2 === 0 && selectedSubjects.includes("csf");
    const useApt = selectedSubjects.includes("apt");

    if (useExtra && plan.extra) {
      const it = next(month, plan.extra.key, plan.extra.items);
      out.push({
        date,
        subject: plan.extra.key,
        title: it.split(":")[0]!,
        detail: it,
        est_minutes: 35,
        sort_order: o++,
      });
    } else if (useCsf) {
      const it = next(month, "csf", plan.csf);
      out.push({
        date,
        subject: "csf",
        title: it.split(":")[0]!,
        detail: it,
        est_minutes: 35,
        sort_order: o++,
      });
    } else if (useApt && plan.apt.length > 0) {
      const it = next(month, "apt", plan.apt);
      out.push({
        date,
        subject: "apt",
        title: it.split(":")[0]!,
        detail: it,
        est_minutes: 35,
        sort_order: o++,
      });
    }
    out.push({
      date,
      subject: null,
      title: "Review & daily log",
      detail: "Skim today's notes, write one line",
      est_minutes: 15,
      sort_order: o++,
    });
    weekday++;
  }
  return out;
}

export const videos = [
  {
    id: 1,
    title: "The Art of Product Design: Creating Intuitive Interfaces",
    author: "Design Matters",
    duration: "24:36",
    progress: 65,
    thumbnail: null,
    status: "in_progress",
    url: "https://youtube.com/watch?v=abc123",
    tags: ["Design", "UX", "Product"],
    snipsCount: 4,
    addedAt: "2024-03-15",
  },
  {
    id: 2,
    title: "Building a Second Brain: Digital Note-Taking Systems",
    author: "Tiago Forte",
    duration: "42:18",
    progress: 100,
    thumbnail: null,
    status: "completed",
    url: "https://youtube.com/watch?v=def456",
    tags: ["Productivity", "Notes", "PKM"],
    snipsCount: 7,
    addedAt: "2024-03-10",
  },
  {
    id: 3,
    title: "Why Great Design Feels Invisible",
    author: "The Futur",
    duration: "18:52",
    progress: 30,
    thumbnail: null,
    status: "in_progress",
    url: "https://youtube.com/watch?v=ghi789",
    tags: ["Design", "Tutorial"],
    snipsCount: 2,
    addedAt: "2024-03-18",
  },
];

export const tags = [
  { id: 1, name: "Design", color: "#059669", count: 2 },
  { id: 2, name: "UX", color: "#0891B2", count: 1 },
  { id: 3, name: "Product", color: "#7C3AED", count: 1 },
  { id: 4, name: "Productivity", color: "#EA580C", count: 1 },
  { id: 5, name: "Notes", color: "#DB2777", count: 1 },
  { id: 6, name: "PKM", color: "#4F46E5", count: 1 },
  { id: 7, name: "Tutorial", color: "#059669", count: 1 },
];

export const snips = [
  {
    id: 1,
    videoId: 1,
    title: "The 3-second rule for interface decisions",
    timestamp: "4:32",
    aiGenerated: true,
    starred: true,
    bullets: [
      "Users should understand an interface within 3 seconds",
      "Cognitive load directly impacts user retention",
      "Simplicity beats feature density every time",
    ],
  },
  {
    id: 2,
    videoId: 1,
    title: "Progressive disclosure pattern",
    timestamp: "8:15",
    aiGenerated: true,
    starred: false,
    bullets: [
      "Show only what's necessary at each step",
      "Advanced options should be hidden but accessible",
      "Reduces overwhelm for new users",
    ],
  },
  {
    id: 3,
    videoId: 1,
    title: "The importance of whitespace",
    timestamp: "12:47",
    aiGenerated: true,
    starred: false,
    bullets: [
      "Whitespace is not wasted space",
      "Creates visual hierarchy and breathing room",
      "Premium products use generous spacing",
    ],
  },
  {
    id: 4,
    videoId: 1,
    title: "Micro-interactions and delight",
    timestamp: "18:03",
    aiGenerated: true,
    starred: true,
    bullets: [
      "Small animations provide feedback and personality",
      "Should be subtle, not distracting",
      "Reinforces the brand experience",
    ],
  },
];

export const currentVideo = {
  id: 1,
  title: "The Art of Product Design: Creating Intuitive Interfaces",
  author: "Design Matters",
  duration: "24:36",
  progress: 65,
  url: "https://youtube.com/watch?v=abc123",
  description: "A deep dive into the principles that make digital products feel natural and easy to use. Learn from top designers about creating interfaces that users love.",
};

export const summaries = [
  {
    videoId: 1,
    mainPoint: "Great design is invisible—the best interfaces feel so natural that users never have to think about how to use them. By reducing cognitive load and embracing simplicity, designers create products that people genuinely love to use.",
    keyTakeaways: [
      "Users should understand an interface within 3 seconds; cognitive load directly impacts retention and satisfaction",
      "Progressive disclosure and generous whitespace create visual hierarchy that guides users naturally through complex workflows",
      "Micro-interactions and subtle animations provide feedback and personality without becoming distracting"
    ]
  },
  {
    videoId: 2,
    mainPoint: "A second brain is an external system for capturing, organizing, and retrieving information, freeing your mind to focus on creative thinking rather than remembering details.",
    keyTakeaways: [
      "Capture everything that resonates with you—don't rely on your biological brain to remember important ideas",
      "Organize notes by actionability, not just topic, using the PARA method (Projects, Areas, Resources, Archives)",
      "Regularly review and resurface old notes to create unexpected connections between ideas"
    ]
  },
  {
    videoId: 3,
    mainPoint: "The best design solutions are the ones users never notice because they work exactly as expected—invisibility is the hallmark of truly great design.",
    keyTakeaways: [
      "When design calls attention to itself, it's often a sign that something isn't working as it should",
      "Study everyday objects that 'just work' to understand the principles of invisible design",
      "Test designs with real users to identify moments where the interface breaks their flow"
    ]
  }
];

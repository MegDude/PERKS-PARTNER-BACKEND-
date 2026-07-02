export type FAQItem = {
  id: string;
  question: string;
  answer: string;
  linkLabel?: string;
  linkHref?: string;
};

export const FAQ_HOME: FAQItem[] = [
  {
    id: "h1",
    question: "What is Downtown Perks?",
    answer: "Downtown Perks is a live downtown map for residents, buildings, partners, and local places.",
  },
  {
    id: "h2",
    question: "Do I need to download an app?",
    answer: "No. Residents can join through a QR code or text flow and use the experience without another app.",
  },
  {
    id: "h3",
    question: "How do partners know it is working?",
    answer: "Partners can track scans, saves, RSVPs, redemptions, and other activity tied to real use.",
  },
];

export const FAQ_PROPERTY: FAQItem[] = [
  {
    id: "pr1",
    question: "Why is this better than a static amenity list?",
    answer: "Residents need a live experience that reflects what is useful nearby right now, not an outdated PDF.",
  },
  {
    id: "pr2",
    question: "How does a building offer access?",
    answer: "Buildings can onboard residents through QR, text, or building-linked access paths.",
  },
  {
    id: "pr3",
    question: "Can buildings see proof of use?",
    answer: "Yes. Buildings can see scans, saves, redemptions, RSVPs, and other resident activity.",
  },
];

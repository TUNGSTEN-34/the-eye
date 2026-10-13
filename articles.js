// Sample longer articles — anyone can later add more
const articles = [
  {
    id: "welcome-to-analyst",
    title: "Welcome to the Analyst Information Portal",
    summary: "An introduction to how this public portal works and how you can contribute longer articles for everyone to read.",
    author: "Analyst Team",
    date: "2026-10-04",
    content: `Analyst is a public information portal designed so that anyone with the link can access useful information quickly.\n\nThis platform supports longer articles written by different people. Recent articles appear on the homepage so visitors immediately see the latest updates.\n\n### How it works\n\n1. Visit the homepage and browse the recent news.\n2. Click into any article to read the full version.\n3. Use the “Submit Article” page if you want to contribute your own longer piece.\n\n### Why longer articles?\n\nShort announcements are useful, but deeper explanations, analysis, guides, and reports need more space. That is why the News section is built for full articles rather than one-line updates.\n\nWe look forward to seeing contributions from many different voices.`
  },
  {
    id: "how-to-share-information",
    title: "How to Effectively Share Information with a Wide Audience",
    summary: "Practical tips for writing clear, useful articles that help people understand important topics quickly.",
    author: "Community Contributor",
    date: "2026-10-03",
    content: `Sharing information publicly works best when the writing is clear, structured, and focused on the reader.\n\n### Start with the key point\n\nPut the most important information near the top. Many readers scan first and only read deeper if the opening is useful.\n\n### Use short paragraphs and headings\n\nLong blocks of text are harder to read on phones. Break ideas into short paragraphs and add simple headings so people can navigate.\n\n### Explain why it matters\n\nDon’t only state facts. Briefly explain why the reader should care and what they can do with the information.\n\n### Keep a consistent tone\n\nFriendly and direct language usually works better than overly formal or technical writing, unless the topic truly requires precision.\n\nFollowing these habits makes your articles more helpful to everyone who visits the portal.`
  },
  {
    id: "future-of-live-data",
    title: "The Future of Live Data on Public Dashboards",
    summary: "A look at how real-time information can be combined with longer analysis articles to give people both speed and depth.",
    author: "Analyst Team",
    date: "2026-10-02",
    content: `Live data and longer articles serve different needs, but they work especially well together.\n\n### Speed vs depth\n\nA dashboard gives instant numbers and status. An article gives context, history, and interpretation. When both are available in the same place, visitors can choose the level of detail they need.\n\n### What comes next\n\nIn the coming updates we plan to connect real data sources to the Live Data section. At the same time, the News section will continue to host longer explanatory pieces written by different contributors.\n\n### Open contribution\n\nBecause the portal is public, the quality of information improves when more people contribute careful, well-written articles. We encourage thoughtful submissions on topics that help the community stay informed.`
  }
];

// Helper: format date nicely
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Helper: get article by id
function getArticleById(id) {
  return articles.find(a => a.id === id);
}

// Helper: get most recent N articles
function getRecentArticles(n = 3) {
  return [...articles].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, n);
}

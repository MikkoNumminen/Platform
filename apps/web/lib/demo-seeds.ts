// ---------------------------------------------------------------------------
// Demo seed data – realistic content for showcasing the community platform.
// All arrays are plain objects; no Prisma types are re-exported here.
// ---------------------------------------------------------------------------

export const DEMO_USERS = [
  {
    name: "Alice Korhonen",
    alias: "alice_k",
    email: "alice@demo.platform",
    role: "vuohi",
    wantsToDevelop: true,
    developerTag: "lead",
    developmentSkills: ["Coding (frontend)", "UI/UX design"],
  },
  {
    name: "Bob Virtanen",
    alias: "bob_v",
    email: "bob@demo.platform",
    role: "admin",
    wantsToDevelop: true,
    developerTag: "developer",
    developmentSkills: ["Coding (backend)", "Testing / QA"],
  },
  {
    name: "Carol Mäkinen",
    alias: "carol_m",
    email: "carol@demo.platform",
    role: "user",
    wantsToDevelop: false,
    developerTag: null,
    developmentSkills: [],
  },
  {
    name: "Dave Nieminen",
    alias: "dave_n",
    email: "dave@demo.platform",
    role: "user",
    wantsToDevelop: false,
    developerTag: null,
    developmentSkills: [],
  },
  {
    name: "Eve Järvinen",
    alias: "eve_j",
    email: "eve@demo.platform",
    role: "pending",
    wantsToDevelop: false,
    developerTag: null,
    developmentSkills: [],
  },
  {
    name: "Frank Laine",
    alias: "frank_l",
    email: "frank@demo.platform",
    role: "pending",
    wantsToDevelop: true,
    developerTag: null,
    developmentSkills: ["Ideas / product feedback"],
  },
] as const;

export const DEMO_BOARDS = [
  {
    name: "General Discussion",
    slug: "demo-general",
    description: "A place for community conversations",
  },
  {
    name: "Feedback & Ideas",
    slug: "demo-feedback",
    description: "Share your ideas for improving the platform",
  },
] as const;

export const DEMO_POSTS = [
  {
    boardIndex: 0,
    authorIndex: 0,
    title: "Welcome to the community platform!",
    slug: "demo-welcome",
    body: "Hey everyone! This is our new home for discussions, events, and collaboration. Take a look around, introduce yourself, and don't hesitate to ask questions. We're building this together.",
    pinned: true,
  },
  {
    boardIndex: 0,
    authorIndex: 2,
    title: "Introduce yourself here",
    slug: "demo-introductions",
    body: "I'll go first — I'm Carol, been part of the community for about a year now. I mostly lurk but trying to be more active. What about you?",
    pinned: false,
  },
  {
    boardIndex: 1,
    authorIndex: 1,
    title: "Feature request: dark mode",
    slug: "demo-dark-mode",
    body: "Would love to see a dark mode option. I often browse late in the evening and the bright theme is a bit harsh. Anyone else interested?",
    pinned: false,
  },
  {
    boardIndex: 1,
    authorIndex: 3,
    title: "Idea: weekly community highlights",
    slug: "demo-weekly-highlights",
    body: "What if we had a weekly summary of the best posts, upcoming events, and new members? Could be a pinned post or even an email digest.",
    pinned: false,
  },
  {
    boardIndex: 0,
    authorIndex: 1,
    title: "Tips for getting the most out of the platform",
    slug: "demo-tips",
    body: "A few things I've found useful: 1) Check the calendar regularly for events, 2) Use the shoutbox for quick questions, 3) Browse the Feedback board if you want to shape what gets built next.",
    pinned: false,
  },
] as const;

export const DEMO_THREADS = [
  {
    postIndex: 0,
    authorIndex: 1,
    body: "Great to see this live! The setup looks really clean.",
    parentType: "POST" as const,
    replyToIndex: null,
  },
  {
    postIndex: 0,
    authorIndex: 2,
    body: "Welcome post bookmarked. Excited to be here!",
    parentType: "POST" as const,
    replyToIndex: null,
  },
  {
    postIndex: 0,
    authorIndex: 3,
    body: "Thanks for putting this together, Alice. Quick question — is there a way to get notifications for new posts?",
    parentType: "POST" as const,
    replyToIndex: null,
  },
  {
    postIndex: 0,
    authorIndex: 0,
    body: "Not yet, but it's on the roadmap! For now, check the board regularly.",
    parentType: "POST" as const,
    replyToIndex: 2,
  },
  {
    postIndex: 1,
    authorIndex: 3,
    body: "Hey Carol! I'm Dave, joined recently. Mostly interested in the events side of things.",
    parentType: "POST" as const,
    replyToIndex: null,
  },
  {
    postIndex: 1,
    authorIndex: 1,
    body: "Bob here — backend developer. Happy to help if anyone runs into technical issues.",
    parentType: "POST" as const,
    replyToIndex: null,
  },
  {
    postIndex: 2,
    authorIndex: 0,
    body: "Dark mode is definitely planned. We're looking at a theme switcher that remembers your preference.",
    parentType: "POST" as const,
    replyToIndex: null,
  },
  {
    postIndex: 2,
    authorIndex: 3,
    body: "+1 for dark mode. My eyes would thank you.",
    parentType: "POST" as const,
    replyToIndex: null,
  },
  {
    postIndex: 2,
    authorIndex: 2,
    body: "Same here. Would also love an auto-switch based on system settings.",
    parentType: "POST" as const,
    replyToIndex: 7,
  },
  {
    postIndex: 3,
    authorIndex: 0,
    body: "Love this idea! A weekly digest would help people who can't check in every day.",
    parentType: "POST" as const,
    replyToIndex: null,
  },
  {
    postIndex: 3,
    authorIndex: 1,
    body: "I could help automate that. Maybe pull top-voted posts and upcoming events into a template.",
    parentType: "POST" as const,
    replyToIndex: 9,
  },
  {
    postIndex: 4,
    authorIndex: 2,
    body: "The shoutbox tip is great — I didn't even notice it at first.",
    parentType: "POST" as const,
    replyToIndex: null,
  },
] as const;

export const DEMO_SHOUTS = [
  { authorIndex: 0, message: "Good morning everyone! ☀️" },
  {
    authorIndex: 1,
    message: "Just deployed a fix for the calendar layout — should look better on mobile now.",
  },
  { authorIndex: 2, message: "Has anyone tried the new board search? It's really fast." },
  { authorIndex: 3, message: "Heading to the meetup on Saturday, who else is coming?" },
  {
    authorIndex: 0,
    message: "Reminder: feedback survey is still open, would love more responses!",
  },
  { authorIndex: 1, message: "Happy Friday 🎉 What's everyone working on this weekend?" },
  {
    authorIndex: 3,
    message: "Found a great article on community building, will share in the forum.",
  },
  {
    authorIndex: 2,
    message: "The event calendar is a lifesaver, I almost forgot about tomorrow's session.",
  },
  { authorIndex: 0, message: "New members: don't forget to fill out your profile!" },
  { authorIndex: 1, message: "Shoutbox is my favorite feature. Quick and to the point." },
] as const;

export const DEMO_EVENTS = [
  {
    authorIndex: 0,
    title: "Community kick-off meetup",
    description:
      "Casual get-together to meet fellow community members, discuss plans, and share ideas for the platform.",
    location: "Helsinki city center",
    daysFromNow: 3,
    durationHours: 2,
    allDay: false,
  },
  {
    authorIndex: 1,
    title: "Platform dev session",
    description:
      "Open hacking session — bring your laptop and work on platform features together. All skill levels welcome.",
    location: null,
    daysFromNow: 7,
    durationHours: 3,
    allDay: false,
  },
  {
    authorIndex: 0,
    title: "Monthly planning call",
    description: "Review what we accomplished this month and set priorities for the next one.",
    location: "Online (link shared in shoutbox)",
    daysFromNow: 14,
    durationHours: 1,
    allDay: false,
  },
  {
    authorIndex: 3,
    title: "Board game evening",
    description: "Relaxed evening of board games and good company. Bring snacks!",
    location: "Dave's place",
    daysFromNow: 10,
    durationHours: 4,
    allDay: false,
  },
  {
    authorIndex: 2,
    title: "Photography walk",
    description:
      "Explore the city with cameras (or phones). We'll share the best shots on the forum afterwards.",
    location: "Suomenlinna ferry terminal",
    daysFromNow: 18,
    durationHours: 3,
    allDay: false,
  },
  {
    authorIndex: 0,
    title: "Mid-summer celebration",
    description: "All-day celebration with activities, food, and good vibes. Details TBA.",
    location: null,
    daysFromNow: 25,
    durationHours: 0,
    allDay: true,
  },
] as const;

export const DEMO_ISSUES = [
  {
    authorIndex: 1,
    title: "Calendar events overlap on mobile view",
    description:
      "When two events are on the same day, the cards overlap instead of stacking. Tested on iPhone 14 and Pixel 7.",
    url: null,
    resolved: true,
  },
  {
    authorIndex: 2,
    title: "Broken link in the footer",
    description: "The 'About' link in the footer leads to a 404 page.",
    url: "/about",
    resolved: true,
  },
  {
    authorIndex: 3,
    title: "Shoutbox doesn't scroll to latest message",
    description:
      "After sending a new shout, the list doesn't auto-scroll to the bottom. You have to scroll manually to see your own message.",
    url: null,
    resolved: false,
  },
  {
    authorIndex: 0,
    title: "Profile page shows raw HTML in bio",
    description:
      "If you paste formatted text into the bio field, it renders the HTML tags as plain text instead of formatting them.",
    url: "/profile",
    resolved: false,
  },
] as const;

export const DEMO_SURVEY_RESPONSES = [
  {
    authorIndex: 0,
    conversationStyle: "Both",
    features: ["Shared calendar", "Polls & voting", "Member profiles", "Notifications"],
    mustHave: "A shared calendar so we can coordinate events without relying on external tools.",
    dealbreaker: null,
    otherFeedback: "Really excited about this project. Let me know how I can help!",
    wantsToDevelop: true,
    developmentSkills: ["Coding (frontend)", "UI/UX design"],
  },
  {
    authorIndex: 1,
    conversationStyle: "Real-time threads (Slack/Discord style)",
    features: [
      "Shared calendar",
      "File sharing / resource library",
      "Notifications",
      "Wiki / knowledge base",
    ],
    mustHave:
      "Real-time communication. Async forums are fine but we also need quick back-and-forth.",
    dealbreaker: "If there's no mobile-friendly experience, people won't use it.",
    otherFeedback: null,
    wantsToDevelop: true,
    developmentSkills: ["Coding (backend)", "Testing / QA"],
  },
  {
    authorIndex: 2,
    conversationStyle: "Forum posts (Reddit style — searchable, organized)",
    features: ["Shared calendar", "Member profiles", "Subgroups / topic channels"],
    mustHave: "Good search so I can find old discussions easily.",
    dealbreaker: null,
    otherFeedback: "Keep it simple — too many features at once can be overwhelming.",
    wantsToDevelop: false,
    developmentSkills: [],
  },
  {
    authorIndex: 3,
    conversationStyle: "Both",
    features: [
      "Shared calendar",
      "Polls & voting",
      "Direct messages / private chat",
      "Member profiles",
    ],
    mustHave: "Events and calendar. That's the main reason I'd use the platform.",
    dealbreaker: "If I need to create yet another account with a new password.",
    otherFeedback: null,
    wantsToDevelop: false,
    developmentSkills: [],
  },
  {
    authorIndex: null,
    conversationStyle: "Forum posts (Reddit style — searchable, organized)",
    features: ["File sharing / resource library", "Wiki / knowledge base"],
    mustHave: "A knowledge base where we can document things for new members.",
    dealbreaker: null,
    otherFeedback: "Submitted anonymously — I'd prefer not to be identified for now.",
    wantsToDevelop: false,
    developmentSkills: [],
  },
] as const;

export const DEMO_XP_PROFILES = [
  { userIndex: 0, totalXp: 1200, level: 5 },
  { userIndex: 1, totalXp: 800, level: 4 },
  { userIndex: 2, totalXp: 400, level: 3 },
  { userIndex: 3, totalXp: 150, level: 2 },
] as const;

export const DEMO_CUSTOM_QUESTS = [
  {
    title: "Review the privacy policy",
    description: "Check that the privacy policy is up to date and covers all data we collect.",
    xpReward: 150,
    status: "completed",
    priority: "high",
    assigneeIndex: 1,
    creatorIndex: 0,
    completed: true,
  },
  {
    title: "Write a welcome guide for new members",
    description: "Create a short guide that helps new members find their way around the platform.",
    xpReward: 200,
    status: "in_progress",
    priority: "normal",
    assigneeIndex: 2,
    creatorIndex: 0,
    completed: false,
  },
  {
    title: "Test the calendar on mobile devices",
    description: "Verify that calendar events display correctly on phones and tablets.",
    xpReward: 100,
    status: "open",
    priority: "normal",
    assigneeIndex: 3,
    creatorIndex: 0,
    completed: false,
  },
  {
    title: "Organize the community kick-off meetup",
    description: "Coordinate venue, send invites, and prepare the agenda for the first meetup.",
    xpReward: 300,
    status: "open",
    priority: "urgent",
    assigneeIndex: 0,
    creatorIndex: 1,
    completed: false,
  },
] as const;

export const DEMO_ACHIEVEMENT_UNLOCKS = [
  {
    userIndex: 0,
    achievementKeys: [
      "welcome",
      "surveyor",
      "shouter_bronze",
      "bug_hunter_bronze",
      "streak_bronze",
    ],
  },
  {
    userIndex: 1,
    achievementKeys: ["welcome", "surveyor", "bug_hunter_bronze"],
  },
  { userIndex: 2, achievementKeys: ["welcome", "surveyor", "shouter_bronze"] },
  { userIndex: 3, achievementKeys: ["welcome", "surveyor"] },
] as const;

export const DEMO_QUEST_PROGRESS = [
  { userIndex: 0, questKey: "onboarding_alias", progress: 1, completed: true },
  { userIndex: 0, questKey: "onboarding_survey", progress: 1, completed: true },
  { userIndex: 0, questKey: "onboarding_first_shout", progress: 1, completed: true },
  { userIndex: 0, questKey: "daily_login", progress: 1, completed: true },
  { userIndex: 0, questKey: "daily_shout", progress: 2, completed: false },
  { userIndex: 1, questKey: "onboarding_alias", progress: 1, completed: true },
  { userIndex: 1, questKey: "onboarding_survey", progress: 1, completed: true },
  { userIndex: 1, questKey: "daily_login", progress: 1, completed: true },
  { userIndex: 2, questKey: "onboarding_alias", progress: 1, completed: true },
  { userIndex: 2, questKey: "onboarding_survey", progress: 1, completed: true },
  { userIndex: 2, questKey: "daily_login", progress: 1, completed: true },
  { userIndex: 3, questKey: "onboarding_alias", progress: 1, completed: true },
  { userIndex: 3, questKey: "onboarding_survey", progress: 1, completed: true },
] as const;

export const DEMO_DM_CONVERSATIONS = [
  {
    participantAIndex: 0, // alice (vuohi)
    participantBIndex: 2, // carol (user)
    messages: [
      { senderIndex: 2, message: "Hi Alice, is the meetup still on for Saturday?" },
      { senderIndex: 0, message: "Yes! 10am at the usual spot. Bringing coffee." },
      { senderIndex: 2, message: "Perfect, see you there!" },
    ],
  },
  {
    participantAIndex: 1, // bob (admin)
    participantBIndex: 3, // dave (user)
    messages: [
      { senderIndex: 3, message: "Hey Bob, I found another calendar bug on Android." },
      { senderIndex: 1, message: "Can you file an issue report? I'll take a look today." },
      { senderIndex: 3, message: "Done, check the issues board." },
      { senderIndex: 1, message: "Thanks, I see it. Fix incoming!" },
    ],
  },
] as const;

export const DEMO_SURVEY_ROUND = {
  number: 1,
  title: "Spring 2026 Community Feedback",
  description: "Help us shape the next features for the platform.",
  status: "active",
  xpReward: 100,
  creatorIndex: 0,
} as const;

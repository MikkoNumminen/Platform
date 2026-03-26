import { ThreadData } from "../types/thread";

export function getMockThreads(): ThreadData[] {
  return [
    {
      id: "t1",
      body: "Has anyone tried running Next.js 15 with the new App Router in production yet? We migrated last week and the initial load times improved noticeably, but I'm curious about other people's experiences with caching behavior.",
      authorName: "Mika Virtanen",
      createdAt: "2026-03-24T09:15:00Z",
      replies: [
        {
          id: "t1-r1",
          body: "We've been running it for about a month now. The caching story is definitely different from Pages Router — you need to be more explicit about what gets cached and for how long. Once we got that dialed in, performance has been great.",
          authorName: "Laura Korhonen",
          createdAt: "2026-03-24T10:02:00Z",
          replies: [
            {
              id: "t1-r1-r1",
              body: "Agreed. The revalidation API is much cleaner though. We use revalidateTag extensively and it works really well for our use case.",
              authorName: "Mika Virtanen",
              createdAt: "2026-03-24T10:30:00Z",
              replies: [],
            },
          ],
        },
        {
          id: "t1-r2",
          body: "Still on Next 14 here. Waiting for a few more minor releases before we commit to the migration. Good to hear it's working out for others.",
          authorName: "Antti Heikkinen",
          createdAt: "2026-03-24T11:45:00Z",
          replies: [],
        },
      ],
    },
    {
      id: "t2",
      body: "Quick tip: if you're using MUI with server components, make sure you wrap things properly with AppRouterCacheProvider. Took me an embarrassing amount of time to figure out why styles were flickering on navigation.",
      authorName: "Sanna Laine",
      createdAt: "2026-03-25T14:20:00Z",
      replies: [
        {
          id: "t2-r1",
          body: "This saved me today — I was about to open an issue on GitHub thinking it was a bug. Thanks for sharing!",
          authorName: "Joonas Mäkelä",
          createdAt: "2026-03-25T15:10:00Z",
          replies: [],
        },
      ],
    },
    {
      id: "t3",
      body: "What's everyone using for form validation these days? We've been on Formik but it feels heavy for what we need. Thinking about switching to React Hook Form or just using native form actions with server-side validation.",
      authorName: "Antti Heikkinen",
      createdAt: "2026-03-25T16:00:00Z",
      replies: [
        {
          id: "t3-r1",
          body: "React Hook Form + Zod is a solid combo. Lightweight, great TypeScript support, and the resolver pattern keeps validation schemas reusable between client and server.",
          authorName: "Laura Korhonen",
          createdAt: "2026-03-25T16:45:00Z",
          replies: [
            {
              id: "t3-r1-r1",
              body: "Seconding this. We share Zod schemas between our API routes and forms — single source of truth for validation rules.",
              authorName: "Sanna Laine",
              createdAt: "2026-03-25T17:20:00Z",
              replies: [],
            },
          ],
        },
      ],
    },
    {
      id: "t4",
      body: "Just published a write-up on our team's approach to structuring large Next.js projects with feature-based folders. Happy to share the link if anyone's interested — feedback welcome.",
      authorName: "Joonas Mäkelä",
      createdAt: "2026-03-26T08:00:00Z",
      replies: [],
    },
  ];
}

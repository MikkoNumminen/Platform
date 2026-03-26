export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  authorId: string;
}

/**
 * Returns mock calendar events anchored to the current month
 * so they always render regardless of when the app is viewed.
 */
export function getMockEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return [
    {
      id: "evt-1",
      title: "Community Meetup",
      description:
        "Monthly get-together for platform members. Open discussion, demos, and networking.",
      location: "Helsinki Hub, Kamppi",
      startTime: new Date(year, month, 5, 18, 0),
      endTime: new Date(year, month, 5, 20, 0),
      allDay: false,
      authorId: "user-1",
    },
    {
      id: "evt-2",
      title: "Platform Maintenance Window",
      description:
        "Scheduled downtime for database migration and infrastructure updates.",
      location: null,
      startTime: new Date(year, month, 12),
      endTime: new Date(year, month, 12),
      allDay: true,
      authorId: "user-2",
    },
    {
      id: "evt-3",
      title: "TypeScript Workshop",
      description:
        "Hands-on workshop covering advanced TypeScript patterns: generics, conditional types, and template literals.",
      location: "Online (Discord)",
      startTime: new Date(year, month, 15, 14, 0),
      endTime: new Date(year, month, 15, 16, 30),
      allDay: false,
      authorId: "user-3",
    },
    {
      id: "evt-4",
      title: "Open Source Sprint",
      description:
        "Full-day contribution sprint. Pick an issue, pair up, and ship code together.",
      location: "Maria 01, Helsinki",
      startTime: new Date(year, month, 20),
      endTime: new Date(year, month, 20),
      allDay: true,
      authorId: "user-1",
    },
    {
      id: "evt-5",
      title: "Board Game Night",
      description:
        "Casual evening of board games and snacks. All skill levels welcome.",
      location: "Cafe Picnic, Kallio",
      startTime: new Date(year, month, 22, 17, 30),
      endTime: new Date(year, month, 22, 21, 0),
      allDay: false,
      authorId: "user-4",
    },
    {
      id: "evt-6",
      title: "Deadline: Project Proposals",
      description:
        "Last day to submit project proposals for the spring batch.",
      location: null,
      startTime: new Date(year, month, 28),
      endTime: new Date(year, month, 28),
      allDay: true,
      authorId: "user-2",
    },
  ];
}

export type ErrorCode =
  // Board
  | "invalidBoardName"
  | "boardNameTooLong"
  | "boardNotFound"
  | "boardSlugExists"
  // Post
  | "invalidPostTitle"
  | "postTitleTooLong"
  | "postBodyRequired"
  | "postNotFound"
  // Forum
  | "invalidForumName"
  | "forumNameTooLong"
  | "forumNotFound"
  | "forumSlugExists"
  // Topic
  | "invalidTopicTitle"
  | "topicTitleTooLong"
  | "topicBodyRequired"
  | "topicNotFound"
  | "topicLocked"
  // Thread
  | "threadBodyRequired"
  | "threadNotFound"
  // Calendar Event
  | "invalidEventTitle"
  | "eventTitleTooLong"
  | "eventNotFound"
  | "eventEndBeforeStart"
  // Custom Quest
  | "questNotFound"
  | "questTitleRequired"
  | "questTitleTooLong"
  | "questDescriptionRequired"
  | "questAlreadyCompleted"
  | "invalidQuestStatus"
  // Alias
  | "invalidInput"
  | "conflict"
  // General
  | "notFound"
  | "invalidId"
  | "permissionDenied"
  | "rateLimited"
  | "unexpectedError";

export class ActionError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ActionError";
  }
}

export class RateLimitError extends Error {
  constructor(message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

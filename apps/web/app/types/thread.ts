export interface ThreadData {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  replies: ThreadData[];
}

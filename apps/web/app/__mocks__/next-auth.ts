export default function NextAuth() {
  return {
    handlers: { GET: () => {}, POST: () => {} },
    auth: () => null,
    signIn: () => {},
    signOut: () => {},
  };
}

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center" role="status" aria-label="Laster">
      <span className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
    </main>
  );
}

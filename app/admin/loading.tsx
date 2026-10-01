// Vises inne i admin-rammen mens en side lastes, så menyen står stille.
export default function AdminLoading() {
  return (
    <div className="space-y-3" role="status" aria-label="Laster">
      <div className="h-32 animate-pulse rounded-3xl bg-secondary" />
      <div className="h-24 animate-pulse rounded-3xl bg-secondary" />
      <div className="h-24 animate-pulse rounded-3xl bg-secondary" />
    </div>
  );
}

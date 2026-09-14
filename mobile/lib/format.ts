export function formatKr(ore: number) {
  const kr = ore / 100;
  const decimals = Number.isInteger(kr) ? 0 : 2;
  return `${kr.toLocaleString("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} kr`;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

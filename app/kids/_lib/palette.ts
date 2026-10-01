// Lekne pastellfarger for profiler og oppgavekort. Mørk "ink" på lys
// bakgrunn holder kontrasten god nok for små lesere.
export const KID_PALETTE = [
  { bg: "oklch(0.9 0.07 35)", ink: "oklch(0.36 0.1 35)" }, // korall
  { bg: "oklch(0.9 0.06 230)", ink: "oklch(0.34 0.09 240)" }, // himmel
  { bg: "oklch(0.93 0.1 92)", ink: "oklch(0.38 0.09 75)" }, // sol
  { bg: "oklch(0.9 0.06 300)", ink: "oklch(0.36 0.1 300)" }, // drue
  { bg: "oklch(0.92 0.07 160)", ink: "oklch(0.34 0.08 160)" }, // mynte
  { bg: "oklch(0.91 0.06 5)", ink: "oklch(0.38 0.11 10)" }, // rosa
] as const;

export function kidColor(index: number) {
  return KID_PALETTE[index % KID_PALETTE.length];
}

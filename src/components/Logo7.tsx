export function Logo7({ size = 28 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl font-black"
      style={{
        width: size * 1.5,
        height: size * 1.5,
        background: "var(--color-brand)",
        color: "var(--color-brand-ink)",
        fontSize: size,
        lineHeight: 1,
      }}
      aria-hidden
    >
      7
    </div>
  );
}

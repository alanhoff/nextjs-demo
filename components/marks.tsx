export function Compass({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="15.8" stroke="currentColor" strokeWidth="1" />
      <path
        d="m24 0 3.5 17.7L37 11l-6.7 9.5L48 24l-17.7 3.5L37 37l-9.5-6.7L24 48l-3.5-17.7L11 37l6.7-9.5L0 24l17.7-3.5L11 11l9.5 6.7z"
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="3.3" fill="var(--paper)" />
    </svg>
  );
}

const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  down: "M12 4v15m-6-6 6 6 6-6",
  diagonal: "M5 18 18 5M6 5h12v12",
  bookmark: "M6 4h12v17l-6-4-6 4z",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 1 1 14 0z",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0zM14 10a2 2 0 1 1-4 0 2 2 0 1 1 4 0z",
};

export function Mark({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

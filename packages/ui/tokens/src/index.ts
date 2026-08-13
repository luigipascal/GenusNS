export const tokens = {
  color: {
    bg: "#070708",
    bgElevated: "#101014",
    fg: "#e8e6e1",
    fgMuted: "#8a8780",
  },
  motion: {
    dormant: "28s",
    active: "12s",
    quick: "280ms",
  },
  visualVersion: "genusns.visual.v1",
} as const;

export type Tokens = typeof tokens;

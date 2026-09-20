export const motion = {
  tap: 90,
  quick: 130,
  standard: 220,
  deliberate: 360,
  cinematic: 520,
  spring: {
    damping: 17,
    stiffness: 220,
    mass: 0.72,
  },
  springSoft: {
    damping: 20,
    stiffness: 150,
    mass: 0.9,
  },
  springSnappy: {
    damping: 15,
    stiffness: 280,
    mass: 0.62,
  },
} as const;

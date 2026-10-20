// Who he is at each age: clothes, build and proportions. Shared by the page and the sculpting worker.
export const SKIN = 0xA8693F, HAIR = 0x14110F;

export type Beard = 'none' | 'stubble' | 'short' | 'full';
export interface Look {
  H: number; head: number; shoulder: number; build: number;
  top: number; topShade?: number; short: boolean; bottom: number; shorts?: boolean; shoe: number;
  beard: Beard; hairVol: number; phone?: 'keypad' | 'early' | 'today';
  extra?: 'schoolbag' | 'sling' | 'laptop' | 'blazer' | 'turtleneck' | 'hoodie' | 'tee';
  cap?: boolean;
}

export const LOOKS: Look[] = [
  { H: 1.18, head: 0.135, shoulder: 0.15, build: 0.85, top: 0xF2EFE8, short: true, bottom: 0x22325A, shorts: true, shoe: 0x16181B, beard: 'none', hairVol: 0.6, extra: 'schoolbag' },
  { H: 1.6, head: 0.126, shoulder: 0.19, build: 0.88, top: 0x3E7CB1, short: true, bottom: 0x2F3B48, shoe: 0xECE8DE, beard: 'none', hairVol: 0.85, phone: 'keypad', extra: 'tee' },
  { H: 1.7, head: 0.128, shoulder: 0.23, build: 0.95, top: 0x5B7F4E, short: true, bottom: 0x34404C, shoe: 0xECE8DE, beard: 'stubble', hairVol: 1, phone: 'early', extra: 'sling' },
  { H: 1.74, head: 0.13, shoulder: 0.25, build: 1, top: 0x3A4A5C, topShade: 0x2C3948, short: false, bottom: 0x2A3138, shoe: 0xECE8DE, beard: 'short', hairVol: 1, extra: 'laptop' },
  { H: 1.74, head: 0.13, shoulder: 0.26, build: 1, top: 0x2C3E6B, short: false, bottom: 0x1F2B4A, shoe: 0x8A5A34, beard: 'full', hairVol: 1, extra: 'blazer', cap: true },
  { H: 1.74, head: 0.13, shoulder: 0.26, build: 1, top: 0xF2EFE8, short: false, bottom: 0x16181B, shoe: 0x8A5A34, beard: 'full', hairVol: 1, phone: 'today', extra: 'turtleneck' },
];

// Proportions get closer to an adult's with age: the head shrinks relative to the body, legs lengthen.
export const HEAD_R = [0.1, 0.104, 0.108, 0.11, 0.11, 0.11];

/** Joint heights and widths for one age. The skeleton and the sculpted body both come from these. */
export function dims(stage: number) {
  const L = LOOKS[stage];
  const H = L.H, b = L.build, S = L.shoulder, r = HEAD_R[stage];
  const legLen = H * (stage === 0 ? 0.43 : 0.47), torsoLen = H * 0.29;
  const hipY = legLen, shY = hipY + torsoLen;
  const shJY = shY - 0.04, elbowY = shJY - torsoLen * 0.5;
  return {
    L, H, b, S, r, legLen, torsoLen, hipY, shY, shJY, elbowY,
    zL: 0.072 * H, shZ: S * 1.0,
    // Arms hang slightly away from the body (elbows and wrists further out), the way people actually stand.
    elbowOut: 0.03 * H, wristOut: 0.06 * H,
    kneeY: hipY - legLen * 0.5, ankleY: hipY - legLen * 0.96,
    wristY: elbowY - torsoLen * 0.4,
    headY: shY + 0.06 + r * 1.05,
    armR: 0.036 * H * b,
  };
}

import { sculptStage } from './figure';

// Sculpts each age off the main thread and hands the arrays back without copying them.
self.onmessage = (e: MessageEvent<number>) => {
  const stage = e.data;
  const out = sculptStage(stage);
  const buffers = [out.body, out.hair, out.beard].flatMap((a) => a ? [a.position, a.normal, a.index, a.color, a.skinIndex, a.skinWeight].filter(Boolean).map((t) => t!.buffer) : []);
  (self as unknown as Worker).postMessage({ stage, out }, buffers as ArrayBuffer[]);
};

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "motion/react";

// The 1–10 answer on the booth page as a drag bar. A transparent native
// range input sits on top and does the real work (mouse, touch, keyboard,
// screen readers); everything under it is drawn and animated from its value.
// Styles are the fna-slider-* rules in BoothAnalysisPage's STYLES.

const MIN = 1;
const MAX = 10;
const TICKS = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);
// The native thumb is 28px wide, so its centre runs from 14px to width−14px;
// the drawn rail uses the same inset so the two line up.
const at = (f: number) => `calc(14px + (100% - 28px) * ${f})`;
const frac = (n: number) => (n - MIN) / (MAX - MIN);

export function ScaleSlider({ value, onChange, label }: { value: number | null; onChange: (n: number) => void; label: string }) {
  const reduce = useReducedMotion();
  const [dragging, setDragging] = useState(false);
  // Unanswered, the thumb waits in the middle.
  const shown = value ?? 5;

  const pos = useSpring(frac(shown), { stiffness: 420, damping: 32 });
  useEffect(() => {
    if (reduce) pos.jump(frac(shown));
    else pos.set(frac(shown));
  }, [shown, reduce, pos]);
  const left = useTransform(pos, f => at(f));
  const fill = useTransform(pos, f => `calc((100% - 28px) * ${f})`);

  // Which way the bubble's number rolls: up when it grows, down when it shrinks.
  const prev = useRef(shown);
  const dir = shown >= prev.current ? 1 : -1;
  useEffect(() => { prev.current = shown; }, [shown]);

  const answered = value != null;
  const t = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 500, damping: 30 };

  return (
    <div className={"fna-slider" + (answered ? " answered" : "")}>
      <div className="fna-slider-rail">
        <div className="fna-slider-track" />
        <motion.div className="fna-slider-fill" style={{ width: fill }} animate={{ opacity: answered ? 1 : 0.3 }} transition={t} />
        {TICKS.map(n => (
          <motion.span
            key={n}
            className="fna-slider-tick"
            style={{ left: at(frac(n)) }}
            animate={{ scale: answered && n === shown ? 0 : 1, backgroundColor: answered && n < shown ? "#ffffff" : "#d4d4e6" }}
            transition={t}
          />
        ))}

        <motion.div className="fna-slider-thumb" style={{ left }} animate={{ scale: dragging ? 1.18 : 1 }} transition={t}>
          {!answered && !reduce && (
            <motion.span
              className="fna-slider-pulse"
              initial={{ scale: 1, opacity: 0.55 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <motion.div className="fna-slider-bubble" style={{ x: "-50%" }} animate={{ y: dragging ? -6 : 0, scale: dragging ? 1.12 : 1 }} transition={t}>
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.span
                key={answered ? shown : "?"}
                custom={dir}
                variants={{ enter: (d: number) => ({ y: 16 * d, opacity: 0 }), center: { y: 0, opacity: 1 }, exit: (d: number) => ({ y: -16 * d, opacity: 0 }) }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={t}
              >
                {answered ? shown : "?"}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Every number shows in a light tone; the chosen one grows and turns
            purple. Tapping a number also picks it (the input handles keys). */}
        {TICKS.map(n => (
          <motion.button
            key={n}
            type="button"
            tabIndex={-1}
            aria-hidden
            className="fna-slider-num"
            style={{ left: at(frac(n)), x: "-50%" }}
            animate={{
              scale: answered && n === shown ? 1.35 : 1,
              y: answered && n === shown ? 2 : 0,
              color: answered && n === shown ? "#5b54f0" : answered && n < shown ? "#8e8bd9" : "#b4b6c6",
            }}
            whileHover={reduce ? undefined : { scale: answered && n === shown ? 1.35 : 1.15 }}
            transition={t}
            onClick={() => onChange(n)}
          >
            {n}
          </motion.button>
        ))}

        <input
          type="range"
          min={MIN}
          max={MAX}
          step={1}
          value={shown}
          aria-label={label}
          aria-valuetext={answered ? `${shown} out of ${MAX}` : "Not answered"}
          onChange={e => onChange(Number(e.target.value))}
          // A tap on the waiting thumb doesn't move it, so it wouldn't fire onChange.
          onClick={() => { if (!answered) onChange(shown); }}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onBlur={() => setDragging(false)}
        />
      </div>

      <div className="fna-slider-ends" aria-hidden>
        <span>Not important</span>
        <span>Very important</span>
      </div>
    </div>
  );
}

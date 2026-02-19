import { useEffect, useRef } from "react";

type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vr: number;
  color: string;
  life: number;
  maxLife: number;
};

export function ConfettiCanvas({ active }: { active: boolean }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = ["#f97316", "#22c55e", "#06b6d4", "#a855f7", "#f43f5e", "#eab308", "#60a5fa"];

    const resize = (): void => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    const spawn = (count: number): void => {
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < count; i += 1) {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? rect.width * 0.2 : rect.width * 0.8;
        const y = rect.height * 0.15;
        const angle = (fromLeft ? 1 : -1) * (Math.random() * 0.9 + 0.35);
        const speed = Math.random() * 6 + 6;
        const size = Math.random() * 6 + 6;
        const maxLife = Math.random() * 40 + 70;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 4 + 6),
          size,
          rotation: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.25,
          color: colors[Math.floor(Math.random() * colors.length)] ?? "#ffffff",
          life: 0,
          maxLife
        });
      }
    };

    let last = performance.now();
    const tick = (now: number): void => {
      const dt = Math.min(32, now - last);
      last = now;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const gravity = 0.22 * (dt / 16.67);
      const drag = Math.pow(0.985, dt / 16.67);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += 1;
        p.vx *= drag;
        p.vy = p.vy * drag + gravity * 18;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr * dt;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();

        return p.life < p.maxLife && p.y < rect.height + 40;
      });

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    if (active) {
      spawn(160);
      window.setTimeout(() => spawn(120), 240);
      window.setTimeout(() => spawn(90), 520);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}


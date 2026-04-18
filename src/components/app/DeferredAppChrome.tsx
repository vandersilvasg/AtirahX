import { lazy, Suspense, useEffect, useState } from "react";

const Galaxy = lazy(() => import("@/components/backgrounds/Galaxy"));
const Toaster = lazy(() =>
  import("@/components/ui/toaster").then((module) => ({
    default: module.Toaster,
  })),
);
const Sonner = lazy(() =>
  import("@/components/ui/sonner").then((module) => ({
    default: module.Toaster,
  })),
);

export default function DeferredAppChrome() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Galaxy opacity={0.12} maxStars={80} driftSpeed={1.5} />
      <Toaster />
      <Sonner />
    </Suspense>
  );
}

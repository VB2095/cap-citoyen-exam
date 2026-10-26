import { useEffect, useState } from "react";

import { engine } from "../data";
import type { GlossaryData } from "../types";

export function useGlossary() {
  const [data, setData] = useState<GlossaryData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    engine.loadGlossaryData()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, []);

  return { data, error };
}

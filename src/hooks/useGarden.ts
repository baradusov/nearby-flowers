import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Seed } from "../types";
import { STORAGE_KEY, SEEDS_KEY, getSeedProgress } from "../utils";

export function useGarden(connectedPeersRef: React.RefObject<number>) {
  const [bouquetCount, setBouquetCount] = useState(1);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(SEEDS_KEY),
    ]).then(([countStr, seedsStr]) => {
      if (countStr !== null) {
        setBouquetCount(parseInt(countStr, 10));
      }

      if (seedsStr !== null) {
        const stored: Seed[] = JSON.parse(seedsStr);
        let matured = 0;
        const remaining = stored.filter((s) => {
          if (getSeedProgress(s) >= 1) {
            matured++;
            return false;
          }
          return true;
        });
        setSeeds(remaining);
        if (matured > 0) {
          setBouquetCount((c) => {
            const next = c + matured;
            AsyncStorage.setItem(STORAGE_KEY, String(next));
            return next;
          });
          AsyncStorage.setItem(SEEDS_KEY, JSON.stringify(remaining));
        }
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const interval = setInterval(() => {
      setSeeds((current) => {
        if (current.length === 0) return current;

        const nearbyCount = connectedPeersRef.current;
        const bonusPerTick = nearbyCount * 0.5;

        let maturedCount = 0;
        const updated = current
          .map((s) =>
            bonusPerTick > 0
              ? { ...s, bonusSeconds: s.bonusSeconds + bonusPerTick }
              : s,
          )
          .filter((s) => {
            if (getSeedProgress(s) >= 1) {
              maturedCount++;
              return false;
            }
            return true;
          });

        if (maturedCount > 0) {
          setBouquetCount((c) => {
            const next = c + maturedCount;
            AsyncStorage.setItem(STORAGE_KEY, String(next));
            return next;
          });
        }

        if (bonusPerTick > 0 || maturedCount > 0) {
          AsyncStorage.setItem(SEEDS_KEY, JSON.stringify(updated));
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loaded]);

  const giveBouquet = () => {
    setBouquetCount((c) => {
      const next = c - 1;
      AsyncStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
    setSeeds((s) => {
      const next = [
        ...s,
        { id: `s-${Date.now()}`, plantedAt: Date.now(), bonusSeconds: 0 },
      ];
      AsyncStorage.setItem(SEEDS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const receiveBouquet = () => {
    setBouquetCount((c) => {
      const next = c + 1;
      AsyncStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  const reset = () => {
    setBouquetCount(1);
    setSeeds([]);
    AsyncStorage.setItem(STORAGE_KEY, "1");
    AsyncStorage.setItem(SEEDS_KEY, "[]");
  };

  return { bouquetCount, seeds, loaded, giveBouquet, receiveBouquet, reset };
}

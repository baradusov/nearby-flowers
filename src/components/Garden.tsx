import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { AnimatedStyle } from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import type { GestureType } from "react-native-gesture-handler";

import { PulsingSeed } from "./PulsingSeed";
import { getSeedProgress, getSeedEmoji, stableOffset } from "../utils";
import type { Seed } from "../types";

interface GardenProps {
  bouquetCount: number;
  seeds: Seed[];
  panGesture: GestureType;
  animatedBouquetStyle: AnimatedStyle<ViewStyle>;
  pulseRingStyle: AnimatedStyle<ViewStyle>;
}

export function Garden({
  bouquetCount,
  seeds,
  panGesture,
  animatedBouquetStyle,
  pulseRingStyle,
}: GardenProps) {
  const gardenItems: {
    key: string;
    emoji: string;
    isSeed: boolean;
    isFirst: boolean;
  }[] = [];

  for (let i = 0; i < bouquetCount - 1; i++) {
    gardenItems.push({
      key: `b-${i}`,
      emoji: "💐",
      isSeed: false,
      isFirst: false,
    });
  }

  let firstSeedMarked = false;
  for (const seed of seeds) {
    const isFirst = !firstSeedMarked && bouquetCount === 0;
    if (isFirst) firstSeedMarked = true;
    gardenItems.push({
      key: seed.id,
      emoji: getSeedEmoji(getSeedProgress(seed)),
      isSeed: true,
      isFirst,
    });
  }

  return (
    <View style={styles.bouquetArea}>
      <Animated.View style={[styles.pulseRing, pulseRingStyle]} />

      {gardenItems.map((item, i) => {
        const isFirstSeed = item.isSeed && item.isFirst;
        const offset = isFirstSeed
          ? { x: 0, y: 0, rotate: "0deg" }
          : stableOffset(item.key);

        if (item.isSeed) {
          return (
            <PulsingSeed
              key={item.key}
              emoji={item.emoji}
              offset={offset}
              delay={(i * 400) % 1600}
              isFirst={isFirstSeed}
            />
          );
        }

        return (
          <Text
            key={item.key}
            style={[
              styles.bouquetEmoji,
              styles.backgroundItem,
              {
                transform: [
                  { translateX: offset.x },
                  { translateY: offset.y },
                  { rotate: offset.rotate },
                ],
              },
            ]}
          >
            {item.emoji}
          </Text>
        );
      })}

      {bouquetCount > 0 && (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[styles.activeBouquet, animatedBouquetStyle]}
          >
            <Text style={styles.bouquetEmoji}>💐</Text>
          </Animated.View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bouquetArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FFD6E0",
  },
  backgroundItem: {
    position: "absolute",
    opacity: 0.7,
  },
  activeBouquet: {
    zIndex: 10,
  },
  bouquetEmoji: {
    fontSize: 120,
  },
});

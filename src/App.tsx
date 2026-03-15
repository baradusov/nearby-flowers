import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

import { useGarden } from "./hooks/useGarden";
import { useMultipeer } from "./hooks/useMultipeer";
import { useBouquetGesture } from "./hooks/useBouquetGesture";
import { useConnectionAnimation } from "./hooks/useConnectionAnimation";
import { Garden } from "./components/Garden";
import { DebugPanel } from "./components/DebugPanel";
import type { PeerInfo } from "./types";

export default function App() {
  const connectedPeersRef = useRef(0);
  const peerDirectionsRef = useRef<Map<string, PeerInfo>>(new Map());

  const garden = useGarden(connectedPeersRef);
  const gesture = useBouquetGesture({
    bouquetCount: garden.bouquetCount,
    connectedPeersRef,
    peerDirectionsRef,
    giveBouquet: garden.giveBouquet,
  });
  const multipeer = useMultipeer({
    connectedPeersRef,
    peerDirectionsRef,
    onBouquetReceived(fromPeer) {
      garden.receiveBouquet();
      gesture.flyIn(peerDirectionsRef.current.get(fromPeer));
    },
  });
  const { pulseRingStyle, searchDotStyle } = useConnectionAnimation(
    multipeer.connectedPeers,
  );

  const hasAnything = garden.bouquetCount > 0 || garden.seeds.length > 0;

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Animated.View
          style={[
            styles.statusDot,
            multipeer.connectedPeers > 0 ? styles.connected : styles.searching,
            multipeer.connectedPeers === 0 && searchDotStyle,
          ]}
        />
      </View>

      <View style={styles.center}>
        {hasAnything ? (
          <Garden
            bouquetCount={garden.bouquetCount}
            seeds={garden.seeds}
            panGesture={gesture.panGesture}
            animatedBouquetStyle={gesture.animatedBouquetStyle}
            pulseRingStyle={pulseRingStyle}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🌱</Text>
          </View>
        )}
      </View>

      {__DEV__ && (
        <DebugPanel
          bouquetCount={garden.bouquetCount}
          seedCount={garden.seeds.length}
          onAddBouquet={() => {
            garden.receiveBouquet();
            gesture.flyIn();
          }}
          onReset={garden.reset}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  header: {
    paddingTop: 64,
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connected: {
    backgroundColor: "#4CAF50",
  },
  searching: {
    backgroundColor: "#FF9800",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
  },
  emptyEmoji: {
    fontSize: 60,
  },
});

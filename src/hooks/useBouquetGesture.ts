import { useEffect } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import MultipeerConnectivity from "../../modules/multipeer-connectivity";
import type { PeerInfo } from "../types";
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SWIPE_THRESHOLD,
  MAX_SEND_DISTANCE,
  ANGLE_TOLERANCE,
  angleToEdgePosition,
} from "../utils";

interface UseBouquetGestureParams {
  bouquetCount: number;
  connectedPeersRef: React.RefObject<number>;
  peerDirectionsRef: React.RefObject<Map<string, PeerInfo>>;
  giveBouquet: () => void;
}

export function useBouquetGesture({
  bouquetCount,
  connectedPeersRef,
  peerDirectionsRef,
  giveBouquet,
}: UseBouquetGestureParams) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const bouquetScale = useSharedValue(1);
  const bouquetOpacity = useSharedValue(1);
  const bouquetCountShared = useSharedValue(bouquetCount);
  const connectedPeersShared = useSharedValue(0);

  useEffect(() => {
    bouquetCountShared.value = bouquetCount;
  }, [bouquetCount]);

  useEffect(() => {
    connectedPeersShared.value = connectedPeersRef.current;
  });

  const onBouquetSent = (swipeAngle: number) => {
    const directions = peerDirectionsRef.current;

    let closestPeer: string | null = null;
    let closestAngleDiff = Infinity;

    directions.forEach((info, peerId) => {
      if (info.distance > 0 && info.distance > MAX_SEND_DISTANCE) return;
      let diff = Math.abs(swipeAngle - info.angle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < closestAngleDiff) {
        closestAngleDiff = diff;
        closestPeer = peerId;
      }
    });

    let sent = false;
    if (closestPeer && closestAngleDiff < ANGLE_TOLERANCE) {
      sent = MultipeerConnectivity.sendBouquetToPeer(closestPeer);
    } else if (connectedPeersRef.current > 0) {
      sent = MultipeerConnectivity.sendBouquet();
    } else if (__DEV__) {
      sent = true;
    }

    if (sent) {
      giveBouquet();
    }

    translateX.value = 0;
    translateY.value = 0;
    bouquetScale.value = 1;
    bouquetOpacity.value = 0;
    bouquetOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (bouquetCountShared.value <= 0) return;
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      const distance = Math.sqrt(
        event.translationX ** 2 + event.translationY ** 2,
      );
      bouquetScale.value = Math.max(0.8, 1 - distance / 1000);
    })
    .onEnd((event) => {
      if (bouquetCountShared.value <= 0) return;

      const distance = Math.sqrt(
        event.translationX ** 2 + event.translationY ** 2,
      );

      if (
        distance > SWIPE_THRESHOLD &&
        (connectedPeersShared.value > 0 || __DEV__)
      ) {
        const swipeAngle = Math.atan2(
          event.translationX,
          -event.translationY,
        );
        const angle = Math.atan2(event.translationY, event.translationX);
        const flyDistance = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT);

        translateX.value = withTiming(Math.cos(angle) * flyDistance, {
          duration: 350,
        });
        translateY.value = withTiming(Math.sin(angle) * flyDistance, {
          duration: 350,
        });
        bouquetScale.value = withTiming(0.3, { duration: 350 });
        bouquetOpacity.value = withTiming(0, { duration: 350 }, () => {
          runOnJS(onBouquetSent)(swipeAngle);
        });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        bouquetScale.value = withSpring(1);
      }
    });

  const animatedBouquetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: bouquetScale.value },
    ],
    opacity: bouquetOpacity.value,
  }));

  const flyIn = (peerInfo?: PeerInfo) => {
    if (peerInfo) {
      const startPos = angleToEdgePosition(
        peerInfo.angle,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        0,
      );
      translateX.value = startPos.x - SCREEN_WIDTH / 2;
      translateY.value = startPos.y - SCREEN_HEIGHT / 2;
      bouquetScale.value = 0.4;
      bouquetOpacity.value = 0.5;
      translateX.value = withSpring(0, { damping: 12, stiffness: 80 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 80 });
      bouquetScale.value = withSpring(1, { damping: 8, stiffness: 100 });
      bouquetOpacity.value = withTiming(1, { duration: 300 });
    } else {
      bouquetScale.value = 0.1;
      bouquetOpacity.value = 0;
      bouquetScale.value = withSpring(1, { damping: 8, stiffness: 100 });
      bouquetOpacity.value = withTiming(1, { duration: 400 });
    }
  };

  return { panGesture, animatedBouquetStyle, flyIn };
}

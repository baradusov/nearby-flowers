import { useEffect, useState, useRef } from "react";
import MultipeerConnectivity from "../../modules/multipeer-connectivity";
import type {
  PeerInfo,
  PeerConnectedEvent,
  PeerDisconnectedEvent,
  BouquetReceivedEvent,
  PeerDirectionEvent,
} from "../types";

interface UseMultipeerParams {
  connectedPeersRef: React.RefObject<number>;
  peerDirectionsRef: React.RefObject<Map<string, PeerInfo>>;
  onBouquetReceived: (fromPeer: string) => void;
}

export function useMultipeer({
  connectedPeersRef,
  peerDirectionsRef,
  onBouquetReceived,
}: UseMultipeerParams) {
  const [connectedPeers, setConnectedPeers] = useState(0);
  const onBouquetReceivedRef = useRef(onBouquetReceived);
  onBouquetReceivedRef.current = onBouquetReceived;

  useEffect(() => {
    const name = `user-${Math.random().toString(36).substring(2, 7)}`;
    MultipeerConnectivity.start(name);

    const subs = [
      MultipeerConnectivity.addListener(
        "onPeerConnected",
        (event: PeerConnectedEvent) => {
          setConnectedPeers(event.connectedPeers);
          connectedPeersRef.current = event.connectedPeers;
        },
      ),
      MultipeerConnectivity.addListener(
        "onPeerDisconnected",
        (event: PeerDisconnectedEvent) => {
          setConnectedPeers(event.connectedPeers);
          connectedPeersRef.current = event.connectedPeers;
          peerDirectionsRef.current.delete(event.peerId);
        },
      ),
      MultipeerConnectivity.addListener(
        "onBouquetReceived",
        (event: BouquetReceivedEvent) => {
          onBouquetReceivedRef.current(event.fromPeer);
        },
      ),
      MultipeerConnectivity.addListener(
        "onPeerDirection",
        (event: PeerDirectionEvent) => {
          peerDirectionsRef.current.set(event.peerId, {
            angle: event.angle,
            distance: event.distance,
          });
        },
      ),
    ];

    return () => {
      subs.forEach((s) => s.remove());
      MultipeerConnectivity.stop();
    };
  }, []);

  return { connectedPeers };
}

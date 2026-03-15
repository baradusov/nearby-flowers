import { requireNativeModule } from "expo-modules-core";

export interface MultipeerConnectivityInterface {
  start(displayName: string): void;
  stop(): void;
  sendBouquet(): boolean;
  sendBouquetToPeer(peerId: string): boolean;
  getConnectedPeersCount(): number;
  addListener(
    eventName: string,
    listener: (event: any) => void
  ): { remove(): void };
}

export default requireNativeModule(
  "MultipeerConnectivity"
) as MultipeerConnectivityInterface;

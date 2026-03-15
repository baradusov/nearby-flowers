export interface Seed {
  id: string;
  plantedAt: number;
  bonusSeconds: number;
}

export interface PeerInfo {
  angle: number;
  distance: number;
}

export interface PeerConnectedEvent {
  connectedPeers: number;
}

export interface PeerDisconnectedEvent {
  peerId: string;
  connectedPeers: number;
}

export interface BouquetReceivedEvent {
  fromPeer: string;
}

export interface PeerDirectionEvent {
  peerId: string;
  angle: number;
  distance: number;
}

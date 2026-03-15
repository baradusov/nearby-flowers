import ExpoModulesCore
import MultipeerConnectivity
import NearbyInteraction

public class MultipeerConnectivityModule: Module {
  var peerID: MCPeerID?
  var session: MCSession?
  private var advertiser: MCNearbyServiceAdvertiser?
  private var browser: MCNearbyServiceBrowser?
  private var delegateWrapper: MCDelegateWrapper?
  private let serviceType = "nearby-flw"

  // Nearby Interaction: one session per connected peer
  private var niSessions: [String: NISession] = [:]
  private var niDelegates: [String: NIDelegateWrapper] = [:]

  public func definition() -> ModuleDefinition {
    Name("MultipeerConnectivity")

    Events("onPeerConnected", "onPeerDisconnected", "onBouquetReceived", "onConnecting", "onPeerDirection")

    Function("start") { (displayName: String) in
      self.startSession(displayName: displayName)
    }

    Function("stop") {
      self.stopSession()
    }

    Function("sendBouquet") { () -> Bool in
      return self.sendBouquetToAll()
    }

    Function("sendBouquetToPeer") { (peerId: String) -> Bool in
      return self.sendBouquetTo(peerId: peerId)
    }

    Function("getConnectedPeersCount") { () -> Int in
      return self.session?.connectedPeers.count ?? 0
    }

    OnDestroy {
      self.stopSession()
    }
  }

  // MARK: - Multipeer Connectivity

  private func startSession(displayName: String) {
    stopSession()

    peerID = MCPeerID(displayName: displayName)
    session = MCSession(peer: peerID!, securityIdentity: nil, encryptionPreference: .none)

    delegateWrapper = MCDelegateWrapper(module: self)
    session!.delegate = delegateWrapper

    advertiser = MCNearbyServiceAdvertiser(peer: peerID!, discoveryInfo: nil, serviceType: serviceType)
    advertiser!.delegate = delegateWrapper
    advertiser!.startAdvertisingPeer()

    browser = MCNearbyServiceBrowser(peer: peerID!, serviceType: serviceType)
    browser!.delegate = delegateWrapper
    browser!.startBrowsingForPeers()
  }

  private func stopSession() {
    advertiser?.stopAdvertisingPeer()
    browser?.stopBrowsingForPeers()
    session?.disconnect()
    advertiser = nil
    browser = nil
    session = nil
    delegateWrapper = nil

    for (_, niSession) in niSessions {
      niSession.invalidate()
    }
    niSessions.removeAll()
    niDelegates.removeAll()
  }

  private func sendBouquetToAll() -> Bool {
    guard let session = session, !session.connectedPeers.isEmpty else { return false }
    guard let data = "bouquet".data(using: .utf8) else { return false }
    do {
      try session.send(data, toPeers: session.connectedPeers, with: .reliable)
      return true
    } catch { return false }
  }

  private func sendBouquetTo(peerId: String) -> Bool {
    guard let session = session else { return false }
    guard let peer = session.connectedPeers.first(where: { $0.displayName == peerId }) else { return false }
    guard let data = "bouquet".data(using: .utf8) else { return false }
    do {
      try session.send(data, toPeers: [peer], with: .reliable)
      return true
    } catch { return false }
  }

  // MARK: - Nearby Interaction

  func startNISession(for peer: MCPeerID) {
    guard NISession.isSupported else { return }

    let niSession = NISession()
    let delegate = NIDelegateWrapper(module: self, peerId: peer.displayName)
    niSession.delegate = delegate
    niSessions[peer.displayName] = niSession
    niDelegates[peer.displayName] = delegate

    if let token = niSession.discoveryToken {
      sendDiscoveryToken(token, to: peer)
    }
  }

  func stopNISession(for peerDisplayName: String) {
    niSessions[peerDisplayName]?.invalidate()
    niSessions.removeValue(forKey: peerDisplayName)
    niDelegates.removeValue(forKey: peerDisplayName)
  }

  func onReceivedDiscoveryToken(_ token: NIDiscoveryToken, from peerDisplayName: String) {
    guard let niSession = niSessions[peerDisplayName] else { return }
    let config = NINearbyPeerConfiguration(peerToken: token)
    niSession.run(config)
  }

  private func sendDiscoveryToken(_ token: NIDiscoveryToken, to peer: MCPeerID) {
    guard let session = session else { return }
    do {
      let tokenData = try NSKeyedArchiver.archivedData(withRootObject: token, requiringSecureCoding: true)
      var message = Data("nitoken:".utf8)
      message.append(tokenData)
      try session.send(message, toPeers: [peer], with: .reliable)
    } catch {}
  }
}

// MARK: - Nearby Interaction Delegate

class NIDelegateWrapper: NSObject, NISessionDelegate {
  private weak var module: MultipeerConnectivityModule?
  private let peerId: String

  init(module: MultipeerConnectivityModule, peerId: String) {
    self.module = module
    self.peerId = peerId
    super.init()
  }

  func session(_ session: NISession, didUpdate nearbyObjects: [NINearbyObject]) {
    guard let object = nearbyObjects.first else { return }
    guard let direction = object.direction else { return }

    // direction in device local coords: x=right, y=up, z=out of screen
    // atan2(x, y) -> angle on screen plane, 0=up, positive=clockwise
    let angle = atan2(direction.x, direction.y)

    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }
      self.module?.sendEvent("onPeerDirection", [
        "peerId": self.peerId,
        "angle": Double(angle),
        "distance": Double(object.distance ?? -1)
      ])
    }
  }

  func session(_ session: NISession, didRemove nearbyObjects: [NINearbyObject], reason: NINearbyObject.RemovalReason) {}
  func sessionWasSuspended(_ session: NISession) {}
  func sessionSuspensionEnded(_ session: NISession) {}
  func session(_ session: NISession, didInvalidateWith error: Error) {}
}

// MARK: - Multipeer Connectivity Delegate

class MCDelegateWrapper: NSObject, MCSessionDelegate, MCNearbyServiceAdvertiserDelegate, MCNearbyServiceBrowserDelegate {
  private weak var module: MultipeerConnectivityModule?
  private let tokenPrefix = Data("nitoken:".utf8)

  init(module: MultipeerConnectivityModule) {
    self.module = module
    super.init()
  }

  func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
    DispatchQueue.main.async { [weak self] in
      guard let module = self?.module else { return }
      switch state {
      case .connected:
        module.sendEvent("onPeerConnected", [
          "peerId": peerID.displayName,
          "connectedPeers": session.connectedPeers.count
        ])
        module.startNISession(for: peerID)
      case .notConnected:
        module.sendEvent("onPeerDisconnected", [
          "peerId": peerID.displayName,
          "connectedPeers": session.connectedPeers.count
        ])
        module.stopNISession(for: peerID.displayName)
      case .connecting:
        module.sendEvent("onConnecting", [
          "peerId": peerID.displayName
        ])
      @unknown default:
        break
      }
    }
  }

  func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
    if data.starts(with: tokenPrefix) {
      let tokenData = Data(data.dropFirst(tokenPrefix.count))
      if let token = try? NSKeyedUnarchiver.unarchivedObject(ofClass: NIDiscoveryToken.self, from: tokenData) {
        DispatchQueue.main.async { [weak self] in
          self?.module?.onReceivedDiscoveryToken(token, from: peerID.displayName)
        }
      }
    } else if let message = String(data: data, encoding: .utf8), message == "bouquet" {
      DispatchQueue.main.async { [weak self] in
        self?.module?.sendEvent("onBouquetReceived", [
          "fromPeer": peerID.displayName
        ])
      }
    }
  }

  func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
  func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
  func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}

  func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
    invitationHandler(true, module?.session)
  }

  func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
    guard let session = module?.session else { return }
    browser.invitePeer(peerID, to: session, withContext: nil, timeout: 30)
  }

  func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {}
}

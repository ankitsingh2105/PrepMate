class PeerService {
  constructor() {
    this.peer = null;
  }

  createPeerConnection() {
    this.peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    return this.peer;
  }

  async getOffer() {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDesc(desc) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(desc));
  }

  async addIceCandidate(candidate) {
    if (this.peer && candidate) {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  close() {
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
  }
}

export default new PeerService();
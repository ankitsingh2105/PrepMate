class PeerService {
  constructor() {
    this.peer = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    });

    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate?.(event.candidate);
      }
    };
  }

  setOnIceCandidate(cb) {
    this.onIceCandidate = cb;
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

  async setRemoteDesc(ans) {
    await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
  }

  async addIceCandidate(candidate) {
    await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

export default new PeerService();
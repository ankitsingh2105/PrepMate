class PeerService {
    constructor() {
        this.peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                // Optional: Add a TURN server if NAT issues persist
                // {
                //     urls: "turn:openrelay.metered.ca:80",
                //     username: "openrelayproject",
                //     credential: "openrelayproject"
                // }
            ]
        });
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
        await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
}

export default new PeerService();
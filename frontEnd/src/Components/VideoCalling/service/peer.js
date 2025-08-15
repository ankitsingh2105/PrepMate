class PeerService {
    constructor() {
        this.webRTCPeer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:global.stun.twilio.com:3478",
                    ],
                },
            ],
        });
        this.webRTCPeer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New ICE candidate:", event.candidate);
                this.onIceCandidate?.(event.candidate);
            }
        };
    }

    setOnIceCandidate(callback) {
        this.onIceCandidate = callback;
    }

    async getOffer() {
        const offer = await this.webRTCPeer.createOffer();
        await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(offer));
        return offer;
    }

    async getAnswer(offer) {
        await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await this.webRTCPeer.createAnswer();
        await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(ans));
        return ans;
    }

    async setRemoteDescription(ans) {
        await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(ans));
    }

    async addIceCandidate(candidate) {
        try {
            await this.webRTCPeer.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("Added ICE candidate:", candidate);
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
        }
    }

    resetConnection() {
        if (this.webRTCPeer) {
            this.webRTCPeer.close();
        }
        this.webRTCPeer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:global.stun.twilio.com:3478",
                    ],
                },
            ],
        });
        this.webRTCPeer.onicecandidate = (event) => {
            if (event.candidate) {
                this.onIceCandidate?.(event.candidate);
            }
        };
    }
}

export default new PeerService();
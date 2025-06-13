class PeerService {
    constructor() {
        // Creates a WebRTC peer connection.
        // Google and Twilio’s STUN servers to get public IPs for NAT traversal.
        // Listens for .onicecandidate, and when a new candidate is found, it calls a callback you set  via setOnIceCandidate().
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

    setOnIceCandidate(callback) {
        this.onIceCandidate = callback;
    }

    async makeOffer() {
        const offer = await this.webRTCPeer.createOffer();
        // this localDescription of the one calling
        await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(offer));
        // i will send this using web-sockets
        return offer;
    }

    async getAnswer(offer) {
        // offer i made above 
        await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(offer));
        // making an SDP
        const ans = await this.webRTCPeer.createAnswer();
        // this localDescription of the the one picking up the call
        await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(ans));
        return ans;
    }

    // used for negotiation : when we switch camera, on/off microphonee
    async setRemoteDescription(ans) {
        await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(ans));
    }

    async addIceCandidate(candidate) {
        try {
            await this.webRTCPeer.addIceCandidate(new RTCIceCandidate(candidate));
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


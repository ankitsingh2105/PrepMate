class PeerService {
    constructor() {
        this.peer = new RTCPeerConnection({
            iceServers: [
                { urls: ["stun:stun.l.google.com:19302"] },
                { urls: ["stun:stun1.l.google.com:19302"] } // Added extra STUN server
            ]
        });

        this.peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("New ICE candidate:", event.candidate);
                this.onIceCandidate?.(event.candidate);
            }
        };

        this.peer.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", this.peer.iceConnectionState);
        };

        this.peer.onconnectionstatechange = () => {
            console.log("Connection state:", this.peer.connectionState);
        };
    }

    setOnIceCandidate(cb) {
        this.onIceCandidate = cb;
    }

    async getOffer() {
        try {
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(offer);
            console.log("Offer created:", offer);
            return offer;
        } catch (error) {
            console.error("Error creating offer:", error);
            throw error;
        }
    }

    async getAnswer(offer) {
        try {
            await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peer.createAnswer();
            await this.peer.setLocalDescription(answer);
            console.log("Answer created:", answer);
            return answer;
        } catch (error) {
            console.error("Error creating answer:", error);
            throw error;
        }
    }

    async setRemoteDesc(ans) {
        try {
            await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
            console.log("Remote description set:", ans);
        } catch (error) {
            console.error("Error setting remote description:", error);
            throw error;
        }
    }

    async addIceCandidate(candidate) {
        try {
            await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
            console.log("ICE candidate added:", candidate);
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
            throw error;
        }
    }
}

export default new PeerService();
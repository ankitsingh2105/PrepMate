class PeerService {
    constructor() {
        this.createConnection();
        this.onIceCandidate = null;
        this.onConnectionStateChange = null;
        this.onTrack = null;
        this.onIceError = null;

        // 🧠 Track if remote description has been set
        this.remoteDescriptionSet = false;

        // ⏳ Store ICE candidates that arrive early
        this.pendingCandidates = [];

        // 🔄 Track connection attempts
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
    }

    createConnection() {
        // Close existing connection if any
        if (this.webRTCPeer) {
            this.webRTCPeer.close();
        }

        this.webRTCPeer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302",
                    ],
                },
                // Add TURN servers for better connectivity
                {
                    urls: [
                        "turn:openrelay.meter.ca:80",
                        "turn:openrelay.meter.ca:443",
                        "turn:openrelay.meter.ca:443?transport=tcp"
                    ],
                    username: "openrelayproject",
                    credential: "openrelayproject"
                }
            ],
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        });

        this.webRTCPeer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("ICE candidate generated:", event.candidate);
                this.onIceCandidate?.(event.candidate);
            }
        };

        this.webRTCPeer.onconnectionstatechange = () => {
            console.log("Connection state changed:", this.webRTCPeer.connectionState);
            this.onConnectionStateChange?.(this.webRTCPeer.connectionState);
        };

        this.webRTCPeer.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", this.webRTCPeer.iceConnectionState);
        };

        this.webRTCPeer.onicegatheringstatechange = () => {
            console.log("ICE gathering state:", this.webRTCPeer.iceGatheringState);
        };

        this.webRTCPeer.onsignalingstatechange = () => {
            console.log("Signaling state:", this.webRTCPeer.signalingState);
        };

        // Reset flags
        this.remoteDescriptionSet = false;
        this.pendingCandidates = [];
    }

    setOnIceCandidate(callback) {
        this.onIceCandidate = callback;
    }

    setOnConnectionStateChange(callback) {
        this.onConnectionStateChange = callback;
    }

    setOnTrack(callback) {
        this.onTrack = callback;
        if (this.webRTCPeer) {
            this.webRTCPeer.ontrack = callback;
        }
    }

    setOnIceError(callback) {
        this.onIceError = callback;
        if (this.webRTCPeer) {
            this.webRTCPeer.onicecandidateerror = (event) => {
                console.error("ICE candidate error:", event);
                this.onIceError?.(event);
            };
        }
    }

    async makeOffer() {
        try {
            console.log("Creating offer...");
            const offer = await this.webRTCPeer.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await this.webRTCPeer.setLocalDescription(offer);
            console.log("Offer created and set as local description");
            return offer;
        } catch (error) {
            console.error("Error creating offer:", error);
            throw error;
        }
    }

    async getAnswer(offer) {
        try {
            console.log("Setting remote description from offer...");
            await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(offer));
            this.remoteDescriptionSet = true;
            await this.flushPendingCandidates();
            
            console.log("Creating answer...");
            const ans = await this.webRTCPeer.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await this.webRTCPeer.setLocalDescription(ans);
            console.log("Answer created and set as local description");
            return ans;
        } catch (error) {
            console.error("Error creating answer:", error);
            throw error;
        }
    }

    async setRemoteDescription(ans) {
        try {
            console.log("Setting remote description from answer...");
            await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(ans));
            this.remoteDescriptionSet = true;
            await this.flushPendingCandidates();
            console.log("Remote description set successfully");
        } catch (error) {
            console.error("Error setting remote description:", error);
            throw error;
        }
    }

    async addIceCandidate(candidate) {
        try {
            if (this.remoteDescriptionSet) {
                await this.webRTCPeer.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("ICE candidate added successfully");
            } else {
                console.log("Queuing ICE candidate (remoteDescription not set yet):", candidate);
                this.pendingCandidates.push(candidate);
            }
        } catch (error) {
            console.error("Error adding ICE candidate:", error);
            // Don't throw - just log the error
        }
    }

    async flushPendingCandidates() {
        if (this.pendingCandidates.length === 0) return;
        
        console.log(`Flushing ${this.pendingCandidates.length} pending ICE candidates`);
        for (const candidate of this.pendingCandidates) {
            try {
                await this.webRTCPeer.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("Pending ICE candidate added successfully");
            } catch (err) {
                console.error("Error adding queued ICE candidate:", err);
            }
        }
        this.pendingCandidates = [];
    }

    resetConnection() {
        console.log("Resetting WebRTC connection...");
        if (this.webRTCPeer) {
            this.webRTCPeer.close();
        }
        this.remoteDescriptionSet = false;
        this.pendingCandidates = [];
        this.connectionAttempts = 0;
        this.createConnection();
    }

    // Add method to check if connection is healthy
    isConnectionHealthy() {
        return this.webRTCPeer && 
               this.webRTCPeer.connectionState === 'connected' &&
               this.webRTCPeer.iceConnectionState === 'connected';
    }

    // Add method to get connection stats
    getConnectionStats() {
        if (!this.webRTCPeer) return null;
        
        return {
            connectionState: this.webRTCPeer.connectionState,
            iceConnectionState: this.webRTCPeer.iceConnectionState,
            signalingState: this.webRTCPeer.signalingState,
            iceGatheringState: this.webRTCPeer.iceGatheringState
        };
    }
}

export default new PeerService();

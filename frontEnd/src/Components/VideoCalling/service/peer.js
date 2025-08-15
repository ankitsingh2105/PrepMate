import 'webrtc-adapter';

class PeerService {
    constructor() {
        // Initialize properties first
        this.onIceCandidate = null;
        this.onConnectionStateChange = null;
        this.onTrack = null;
        this.onIceError = null;
        this.onIceConnectionStateChange = null;
        this.onSignalingStateChange = null;

        // Track connection state
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        
        // ICE candidate handling
        this.pendingCandidates = [];
        this.remoteDescriptionSet = false;
        
        // Track management - initialize these before calling createConnection
        this.localTracks = new Set();
        this.remoteTracks = new Set();
        
        // Now create the connection
        this.createConnection();
    }

    createConnection() {
        // Close existing connection if any
        if (this.webRTCPeer) {
            this.webRTCPeer.close();
        }

        // Create new RTCPeerConnection with better configuration
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
                // TURN servers for better connectivity
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
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all',
            sdpSemantics: 'unified-plan'
        });

        // Set up event handlers
        this.setupEventHandlers();
        
        // Reset flags
        this.remoteDescriptionSet = false;
        this.pendingCandidates = [];
        this.isConnected = false;
        this.localTracks.clear();
        this.remoteTracks.clear();
    }

    setupEventHandlers() {
        if (!this.webRTCPeer) return;

        this.webRTCPeer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log("ICE candidate generated:", event.candidate);
                this.onIceCandidate?.(event.candidate);
            }
        };

        this.webRTCPeer.onconnectionstatechange = () => {
            const state = this.webRTCPeer.connectionState;
            console.log("Connection state changed:", state);
            this.isConnected = state === 'connected';
            this.onConnectionStateChange?.(state);
        };

        this.webRTCPeer.oniceconnectionstatechange = () => {
            const state = this.webRTCPeer.iceConnectionState;
            console.log("ICE connection state:", state);
            this.onIceConnectionStateChange?.(state);
        };

        this.webRTCPeer.onicegatheringstatechange = () => {
            console.log("ICE gathering state:", this.webRTCPeer.iceGatheringState);
        };

        this.webRTCPeer.onsignalingstatechange = () => {
            const state = this.webRTCPeer.signalingState;
            console.log("Signaling state:", state);
            this.onSignalingStateChange?.(state);
        };

        this.webRTCPeer.ontrack = (event) => {
            console.log("Track received:", event);
            this.onTrack?.(event);
        };

        this.webRTCPeer.onicecandidateerror = (event) => {
            console.error("ICE candidate error:", event);
            this.onIceError?.(event);
        };
    }

    setOnIceCandidate(callback) {
        this.onIceCandidate = callback;
    }

    setOnConnectionStateChange(callback) {
        this.onConnectionStateChange = callback;
    }

    setOnTrack(callback) {
        this.onTrack = callback;
    }

    setOnIceError(callback) {
        this.onIceError = callback;
    }

    setOnIceConnectionStateChange(callback) {
        this.onIceConnectionStateChange = callback;
    }

    setOnSignalingStateChange(callback) {
        this.onSignalingStateChange = callback;
    }

    // Add local tracks to the peer connection
    addLocalTracks(stream) {
        if (!this.webRTCPeer || !stream) return;

        try {
            const tracks = stream.getTracks();
            console.log("Adding local tracks:", tracks.map(t => ({ kind: t.kind, enabled: t.enabled })));
            
            for (const track of tracks) {
                this.webRTCPeer.addTrack(track, stream);
                this.localTracks.add(track);
                console.log(`Added ${track.kind} track:`, track.label);
            }

            return true;
        } catch (error) {
            console.error("Error adding local tracks:", error);
            return false;
        }
    }

    // Remove local tracks
    removeLocalTracks() {
        if (!this.webRTCPeer) return;

        this.localTracks.forEach(track => {
            try {
                const senders = this.webRTCPeer.getSenders();
                const sender = senders.find(s => s.track === track);
                if (sender) {
                    this.webRTCPeer.removeTrack(sender);
                    console.log(`Removed ${track.kind} track`);
                }
            } catch (error) {
                console.error("Error removing track:", error);
            }
        });

        this.localTracks.clear();
    }

    async makeOffer() {
        try {
            console.log("Creating offer...");
            
            // Ensure we have tracks before creating offer
            if (this.localTracks.size === 0) {
                throw new Error("No local tracks available for offer");
            }

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
            
            // Flush any pending ICE candidates
            await this.flushPendingCandidates();
            
            console.log("Creating answer...");
            const answer = await this.webRTCPeer.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await this.webRTCPeer.setLocalDescription(answer);
            console.log("Answer created and set as local description");
            return answer;
        } catch (error) {
            console.error("Error creating answer:", error);
            throw error;
        }
    }

    async setRemoteDescription(description) {
        try {
            console.log("Setting remote description:", description.type);
            await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(description));
            this.remoteDescriptionSet = true;
            
            // Flush any pending ICE candidates
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
                console.log("Queuing ICE candidate (remote description not set yet)");
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

    // Reset the entire connection
    resetConnection() {
        console.log("Resetting WebRTC connection...");
        
        // Stop all local tracks
        this.localTracks.forEach(track => {
            track.stop();
        });
        
        // Close the peer connection
        if (this.webRTCPeer) {
            this.webRTCPeer.close();
        }
        
        // Reset all state
        this.remoteDescriptionSet = false;
        this.pendingCandidates = [];
        this.connectionAttempts = 0;
        this.isConnected = false;
        this.localTracks.clear();
        this.remoteTracks.clear();
        
        // Create new connection
        this.createConnection();
    }

    // Check if connection is healthy
    isConnectionHealthy() {
        return this.webRTCPeer && 
               this.webRTCPeer.connectionState === 'connected' &&
               this.webRTCPeer.iceConnectionState === 'connected';
    }

    // Get connection statistics
    getConnectionStats() {
        if (!this.webRTCPeer) return null;
        
        return {
            connectionState: this.webRTCPeer.connectionState,
            iceConnectionState: this.webRTCPeer.iceConnectionState,
            signalingState: this.webRTCPeer.signalingState,
            iceGatheringState: this.webRTCPeer.iceGatheringState,
            localTracks: this.localTracks.size,
            remoteTracks: this.remoteTracks.size
        };
    }

    // Get ICE candidates info
    getIceCandidatesInfo() {
        if (!this.webRTCPeer) return null;
        
        return {
            iceGatheringState: this.webRTCPeer.iceGatheringState,
            pendingCandidates: this.pendingCandidates.length,
            remoteDescriptionSet: this.remoteDescriptionSet
        };
    }
}

export default new PeerService();

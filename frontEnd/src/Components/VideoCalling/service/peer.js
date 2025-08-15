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
          {
            urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
            username: "openrelay",
            credential: "openrelay",
          },
        ],
      });
      this.webRTCPeer.onicecandidate = (event) => {
        if (event.candidate && this.onIceCandidate) {
          console.log("📡 New ICE candidate:", event.candidate);
          this.onIceCandidate(event.candidate);
        }
      };
      this.onConnectionStateChange = null;
      this.onTrack = null;
      this.onIceError = null;
      this.onIceConnectionStateChange = null;
    }
  
    setOnConnectionStateChange(callback) {
      this.onConnectionStateChange = callback;
      this.webRTCPeer.onconnectionstatechange = () => {
        const state = this.webRTCPeer.connectionState;
        console.log("🔗 Connection state:", state);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(state);
        }
      };
    }
  
    setOnTrack(callback) {
      this.onTrack = callback;
      this.webRTCPeer.ontrack = (event) => {
        console.log("📹 Track event:", event);
        if (this.onTrack) {
          this.onTrack(event);
        }
      };
    }
  
    setOnIceCandidate(callback) {
      this.onIceCandidate = callback;
    }
  
    setOnIceError(callback) {
      this.onIceError = callback;
      this.webRTCPeer.onicecandidateerror = (event) => {
        console.error("❌ ICE candidate error:", event);
        if (this.onIceError) {
          this.onIceError(event);
        }
      };
    }
  
    setOnIceConnectionStateChange(callback) {
      this.onIceConnectionStateChange = callback;
      this.webRTCPeer.oniceconnectionstatechange = () => {
        const state = this.webRTCPeer.iceConnectionState;
        console.log("🧊 ICE connection state:", state);
        if (this.onIceConnectionStateChange) {
          this.onIceConnectionStateChange(state);
        }
      };
    }
  
    addLocalTracks(stream) {
      try {
        for (const track of stream.getTracks()) {
          this.webRTCPeer.addTrack(track, stream);
        }
        console.log("✅ Added local tracks:", stream.getTracks());
        return true;
      } catch (error) {
        console.error("❌ Error adding local tracks:", error);
        return false;
      }
    }
  
    isConnectionHealthy() {
      return (
        this.webRTCPeer &&
        ["connected", "completed"].includes(this.webRTCPeer.iceConnectionState) &&
        this.webRTCPeer.connectionState === "connected"
      );
    }
  
    getConnectionStats() {
      return {
        iceConnectionState: this.webRTCPeer.iceConnectionState,
        signalingState: this.webRTCPeer.signalingState,
        localTracks: this.webRTCPeer.getLocalStreams?.()?.length || 0,
        remoteTracks: this.webRTCPeer.getRemoteStreams?.()?.length || 0,
      };
    }
  
    async getOffer() {
      try {
        const offer = await this.webRTCPeer.createOffer();
        await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(offer));
        console.log("📤 Offer created:", offer);
        return offer;
      } catch (error) {
        console.error("❌ Error creating offer:", error);
        throw error;
      }
    }
  
    async getAnswer(offer) {
      try {
        await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.webRTCPeer.createAnswer();
        await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(answer));
        console.log("📤 Answer created:", answer);
        return answer;
      } catch (error) {
        console.error("❌ Error creating answer:", error);
        throw error;
      }
    }
  
    async setRemoteDescription(description) {
      try {
        await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(description));
        console.log("✅ Remote description set:", description);
      } catch (error) {
        console.error("❌ Error setting remote description:", error);
        throw error;
      }
    }
  
    async addIceCandidate(candidate) {
      try {
        await this.webRTCPeer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("✅ Added ICE candidate:", candidate);
      } catch (error) {
        console.error("❌ Error adding ICE candidate:", error);
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
          {
            urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
            username: "openrelay",
            credential: "openrelay",
          },
        ],
      });
      this.webRTCPeer.onicecandidate = (event) => {
        if (event.candidate && this.onIceCandidate) {
          this.onIceCandidate(event.candidate);
        }
      };
      console.log("🔄 Peer connection reset");
    }
  }
  
  export default new PeerService();
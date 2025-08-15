class PeerService {
    constructor() {
      this.webRTCPeer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:global.stun.twilio.com:3478',
            ],
          },
          {
            urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
        ],
      });
      this.webRTCPeer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
          this.onIceCandidate?.(event.candidate);
        }
      };
    }
  
    setOnIceCandidate(callback) {
      this.onIceCandidate = callback;
    }
  
    async getOffer() {
      try {
        const offer = await this.webRTCPeer.createOffer();
        await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(offer));
        console.log('Offer created and set as local description:', offer);
        return offer;
      } catch (error) {
        console.error('Error creating offer:', error);
        throw error;
      }
    }
  
    async getAnswer(offer) {
      try {
        await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.webRTCPeer.createAnswer();
        await this.webRTCPeer.setLocalDescription(new RTCSessionDescription(answer));
        console.log('Answer created and set as local description:', answer);
        return answer;
      } catch (error) {
        console.error('Error creating answer:', error);
        throw error;
      }
    }
  
    async setRemoteDescription(description) {
      try {
        await this.webRTCPeer.setRemoteDescription(new RTCSessionDescription(description));
        console.log('Remote description set:', description.type);
      } catch (error) {
        console.error('Error setting remote description:', error);
        throw error;
      }
    }
  
    async addIceCandidate(candidate) {
      try {
        await this.webRTCPeer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Added ICE candidate:', candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
        throw error;
      }
    }
  
    resetConnection() {
      if (this.webRTCPeer) {
        this.webRTCPeer.close();
        console.log('WebRTC peer connection closed');
      }
      this.webRTCPeer = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              'stun:stun.l.google.com:19302',
              'stun:stun1.l.google.com:19302',
              'stun:stun2.l.google.com:19302',
              'stun:global.stun.twilio.com:3478',
            ],
          },
          {
            urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443'],
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
        ],
      });
      this.webRTCPeer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('New ICE candidate:', event.candidate);
          this.onIceCandidate?.(event.candidate);
        }
      };
      console.log('New WebRTC peer connection created');
    }
  }
  
  export default new PeerService();
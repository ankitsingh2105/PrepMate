import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";

const Room = ({ email, name, room }) => {
  const myVideoRef = useRef();
  const otherVideoRef = useRef();
  const pcRef = useRef(null);
  const socket = useSocket(); // Use provider socket
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!socket) return;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      myVideoRef.current.srcObject = stream;

      socket.emit("room:join", { email, room, name });

      socket.on("room:joined", ({ users }) => {
        console.log("Joined room:", users);
        setJoined(true);

        // If 2 users already, caller initiates
        if (users.length === 2) {
          createPeerConnection(stream, true, users.find(id => id !== socket.id));
        }
      });

      socket.on("user:joined", ({ socketID }) => {
        console.log("Other user joined:", socketID);
        createPeerConnection(stream, false, socketID);
      });

      socket.on("incoming:call", async ({ from, offer }) => {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("call:accepted", { to: from, answer });
      });

      socket.on("call:accepted", async ({ answer }) => {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("ice:candidate", ({ candidate }) => {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      });
    };

    init();

    return () => {
      if (pcRef.current) pcRef.current.close();
      if (socket) socket.off(); // Remove listeners
    };
  }, [socket]);

  const createPeerConnection = (stream, isCaller, remoteID) => {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Handle remote tracks
    pc.ontrack = (event) => {
      otherVideoRef.current.srcObject = event.streams[0];
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && remoteID) {
        socket.emit("ice:candidate", { to: remoteID, candidate: event.candidate });
      }
    };

    if (isCaller) {
      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("user:call", { to: remoteID, offer });
      };
    }
  };

  return (
    <div>
      <video ref={myVideoRef} autoPlay muted style={{ width: "300px" }} />
      <video ref={otherVideoRef} autoPlay style={{ width: "300px" }} />
    </div>
  );
};

export default Room;

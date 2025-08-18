import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const Room = ({ email, name, room }) => {
  const myVideoRef = useRef();
  const otherVideoRef = useRef();
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const init = async () => {
      socketRef.current = io("/interview");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      myVideoRef.current.srcObject = stream;

      socketRef.current.emit("room:join", { email, room, name });

      socketRef.current.on("room:joined", ({ users }) => {
        console.log("Joined room:", users);
        setJoined(true);

        if (users.length === 2) {
          createPeerConnection(stream, true); // caller
        }
      });

      socketRef.current.on("user:joined", ({ socketID }) => {
        console.log("Other user joined:", socketID);
        createPeerConnection(stream, false, socketID); // receiver
      });

      socketRef.current.on("incoming:call", async ({ from, offer }) => {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socketRef.current.emit("call:accepted", { to: from, answer });
      });

      socketRef.current.on("call:accepted", async ({ answer }) => {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socketRef.current.on("ice:candidate", ({ candidate }) => {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      });
    };

    init();

    return () => {
      if (pcRef.current) pcRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const createPeerConnection = (stream, isCaller, remoteID = null) => {
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
        socketRef.current.emit("ice:candidate", { to: remoteID, candidate: event.candidate });
      }
    };

    if (isCaller) {
      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const targetID = Array.from(pcRef.current ? pcRef.current.remoteDescription : []) // simplified
        socketRef.current.emit("user:call", { to: remoteID, offer });
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

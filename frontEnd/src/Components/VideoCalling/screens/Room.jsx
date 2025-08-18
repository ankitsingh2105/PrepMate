import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import PeerService from "../service/peer";

const Room = ({ email, name, room }) => {
    const myVideoRef = useRef();
    const otherVideoRef = useRef();
    const socket = useSocket();
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!socket) return;

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            myVideoRef.current.srcObject = stream;

            socket.emit("room:join", { email, room, name });

            socket.on("room:joined", ({ users }) => {
                setJoined(true);
                if (users.length === 2) {
                    createPeerConnection(stream, true, users.find(id => id !== socket.id));
                }
            });

            socket.on("user:joined", ({ socketID }) => {
                createPeerConnection(stream, false, socketID);
            });

            socket.on("incoming:call", async ({ from, offer }) => {
                await PeerService.setRemoteDesc(offer);
                const answer = await PeerService.getAnswer(offer);
                socket.emit("call:accepted", { to: from, answer });
            });

            socket.on("call:accepted", async ({ answer }) => {
                await PeerService.setRemoteDesc(answer);
            });

            socket.on("ice:candidate", async ({ candidate }) => {
                await PeerService.addIceCandidate(candidate);
            });
        };

        init().catch(err => console.error("Init error:", err));

        return () => {
            if (PeerService.peer) PeerService.peer.close();
            if (myVideoRef.current?.srcObject) {
                myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            socket?.off();
        };
    }, [socket, email, name, room]);

    const createPeerConnection = (stream, isCaller, remoteID) => {
        const pc = PeerService.peer;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = event => {
            otherVideoRef.current.srcObject = event.streams[0];
        };

        pc.onicecandidate = event => {
            if (event.candidate && remoteID) {
                socket.emit("ice:candidate", { to: remoteID, candidate: event.candidate });
            }
        };

        if (isCaller) {
            pc.onnegotiationneeded = async () => {
                const offer = await PeerService.getOffer();
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
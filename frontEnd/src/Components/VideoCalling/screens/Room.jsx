import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import PeerService from "../peer";

const Room = ({ email, name, room }) => {
    const myVideoRef = useRef();
    const otherVideoRef = useRef();
    const pcRef = useRef(null);
    const socket = useSocket();
    const [joined, setJoined] = useState(false);

    useEffect(() => {
        const init = async () => {
            if (!socket) {
                console.error("Socket not available");
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                console.log("Local stream acquired:", stream.getTracks());
                myVideoRef.current.srcObject = stream;

                socket.emit("room:join", { email, room, name });

                socket.on("room:joined", ({ users }) => {
                    console.log("Joined room:", users);
                    setJoined(true);
                    if (users.length === 2) {
                        const remoteID = users.find(id => id !== socket.id);
                        console.log("Initiating call as caller, remoteID:", remoteID);
                        createPeerConnection(stream, true, remoteID);
                    }
                });

                socket.on("user:joined", ({ socketID, email, name }) => {
                    console.log("Other user joined:", { socketID, email, name });
                    createPeerConnection(stream, false, socketID);
                });

                socket.on("incoming:call", async ({ from, offer }) => {
                    console.log("Incoming call from:", from, "offer:", offer);
                    try {
                        await PeerService.setRemoteDesc(offer);
                        const answer = await PeerService.getAnswer(offer);
                        socket.emit("call:accepted", { to: from, answer });
                    } catch (error) {
                        console.error("Error handling incoming call:", error);
                    }
                });

                socket.on("call:accepted", async ({ answer }) => {
                    console.log("Call accepted, answer:", answer);
                    try {
                        await PeerService.setRemoteDesc(answer);
                    } catch (error) {
                        console.error("Error setting answer:", error);
                    }
                });

                socket.on("ice:candidate", async ({ candidate }) => {
                    console.log("Received ICE candidate:", candidate);
                    try {
                        await PeerService.addIceCandidate(candidate);
                    } catch (error) {
                        console.error("Error adding ICE candidate:", error);
                    }
                });

                socket.on("room:full", ({ message }) => {
                    console.error("Room full:", message);
                });

                socket.on("room:error", ({ message }) => {
                    console.error("Room error:", message);
                });
            } catch (error) {
                console.error("Error initializing media stream:", error);
            }
        };

        init();

        return () => {
            console.log("Cleaning up Room component");
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (myVideoRef.current && myVideoRef.current.srcObject) {
                myVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
            if (socket) {
                socket.off("room:joined");
                socket.off("user:joined");
                socket.off("incoming:call");
                socket.off("call:accepted");
                socket.off("ice:candidate");
                socket.off("room:full");
                socket.off("room:error");
            }
        };
    }, [socket, email, name, room]);

    const createPeerConnection = (stream, isCaller, remoteID) => {
        console.log("Creating peer connection, isCaller:", isCaller, "remoteID:", remoteID);
        pcRef.current = PeerService.peer;

        // Add local tracks
        stream.getTracks().forEach(track => {
            console.log("Adding track:", track);
            pcRef.current.addTrack(track, stream);
        });

        // Handle remote stream
        pcRef.current.ontrack = (event) => {
            console.log("ontrack event:", event);
            console.log("Remote stream received:", event.streams[0]);
            otherVideoRef.current.srcObject = event.streams[0];
        };

        // Handle ICE candidates
        PeerService.setOnIceCandidate((candidate) => {
            if (remoteID) {
                console.log("Sending ICE candidate to:", remoteID);
                socket.emit("ice:candidate", { to: remoteID, candidate });
            }
        });

        if (isCaller) {
            pcRef.current.onnegotiationneeded = async () => {
                try {
                    const offer = await PeerService.getOffer();
                    socket.emit("user:call", { to: remoteID, offer });
                } catch (error) {
                    console.error("Error during negotiation:", error);
                }
            };
        }
    };

    return (
        <div>
            <h2>Room: {room}</h2>
            <div style={{ display: "flex", gap: "10px" }}>
                <div>
                    <h3>My Video</h3>
                    <video ref={myVideoRef} autoPlay muted style={{ width: "300px", border: "1px solid black" }} />
                </div>
                <div>
                    <h3>Other User</h3>
                    <video ref={otherVideoRef} autoPlay style={{ width: "300px", border: "1px solid black" }} />
                </div>
            </div>
            {joined ? <p>Joined room successfully!</p> : <p>Connecting to room...</p>}
        </div>
    );
};

export default Room;
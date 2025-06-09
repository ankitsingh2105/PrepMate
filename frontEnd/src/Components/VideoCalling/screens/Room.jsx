import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketProvider';
import ReactPlayer from "react-player";
import peer from '../service/peer';
import { useLocation } from 'react-router-dom';
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Room({ windowWidth, roomWidth = 640, roomHeight = 360, direction = 'row' }) {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState("");
    const [myStream, setMyStream] = useState(null);
    const [loading, setLoading] = useState(false);
    const [remoteStream, setRemoteStream] = useState(null);
    const [inComingCall, setInComingCall] = useState(false);
    const [otherUsername, setOtherUsername] = useState("");
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const tracksAddedRef = useRef(false);
    const pendingCallRef = useRef(null);

    const location = useLocation();
    const currentPageUrl = `https://prep-mate-one.vercel.app${location.pathname}`;
    const currentRoom = location.pathname.split("/")[2]; // Extract room ID from URL

    useEffect(() => {
        toast.info("Copy the link and send to a friend", { autoClose: 1500 });
    }, []);

    const userInfo = useSelector((state) => state.userInfo);
    const { userDetails } = userInfo;
    const url = useLocation();

    const initializeStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            });
            const audioTracks = stream.getAudioTracks();
            const videoTracks = stream.getVideoTracks();
            console.log("Initialized stream for room", currentRoom, ":", {
                audioTracks: audioTracks.map(t => ({ enabled: t.enabled, label: t.label })),
                videoTracks: videoTracks.map(t => ({ enabled: t.enabled, label: t.label }))
            });
            if (audioTracks.length === 0) {
                toast.warn("No audio track available in stream", { autoClose: 1500 });
            }
            setMyStream(stream);
            toast.success("Local stream initialized", { autoClose: 1500 });
            return stream;
        } catch (error) {
            console.error("Error accessing media devices in room", currentRoom, ":", error);
            toast.error(`Failed to access media devices: ${error.message}`, { autoClose: 1500 });
            return null;
        }
    }, [currentRoom]);

    const handleSubmit = useCallback(() => {
        const room = url.pathname.split("/")[2];
        if (userDetails && userDetails.email) {
            const email = userDetails.email;
            setLoading(true);
            console.log("Joining room:", room, "with email:", email);
            socket.emit("room:join", { email, room });
        } else {
            toast.error("User details not available", { autoClose: 1500 });
            console.error("User details not available");
        }
    }, [userDetails, socket, url]);

    useEffect(() => {
        if (!userDetails || !userDetails.email) return;

        let isMounted = true;
        initializeStream().then((stream) => {
            if (isMounted && stream) {
                handleSubmit();
            }
        });

        return () => {
            isMounted = false;
            if (myStream) {
                myStream.getTracks().forEach(track => track.stop());
                console.log("Stopped myStream tracks in room", currentRoom);
            }
        };
    }, [userDetails, initializeStream, handleSubmit, currentRoom]);

    const handleToggleAudio = useCallback(() => {
        if (!myStream) {
            toast.error("No stream available to mute/unmute", { autoClose: 1500 });
            return;
        }
        const audioTrack = myStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioMuted(!audioTrack.enabled);
            toast.info(audioTrack.enabled ? "Microphone unmuted" : "Microphone muted", { autoClose: 1500 });
            console.log("Audio track toggled in room", currentRoom, ":", { enabled: audioTrack.enabled });
        } else {
            toast.warn("No audio track available", { autoClose: 1500 });
        }
    }, [myStream, currentRoom]);

    const handleToggleVideo = useCallback(() => {
        if (!myStream) {
            toast.error("No stream available to turn video on/off", { autoClose: 1500 });
            return;
        }
        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
            toast.info(videoTrack.enabled ? "Video turned on" : "Video turned off", { autoClose: 1500 });
            console.log("Video track toggled in room", currentRoom, ":", { enabled: videoTrack.enabled });
        } else {
            toast.warn("No video track available", { autoClose: 1500 });
        }
    }, [myStream, currentRoom]);

    const handleUserJoined = useCallback((data) => {
        const { email, socketID, room } = data;
        if (socketID === socket.id) {
            console.log("Ignoring self in user:joined for room", room);
            return;
        }
        if (room !== currentRoom) {
            console.log("Ignoring user:joined from different room:", room, "Current room:", currentRoom);
            return;
        }
        console.log("New user joined room", room, ":", data);
        setRemoteSocketId(socketID);
        toast.info(`User ${email} joined the room`, { autoClose: 1500 });
    }, [socket.id, currentRoom]);

    const sendStreams = useCallback(() => {
        if (!myStream || !myStream.getTracks() || myStream.getTracks().length === 0) {
            console.warn("sendStreams: No stream or no valid tracks in room", currentRoom);
            toast.error("No valid stream to send", { autoClose: 1500 });
            return;
        }
        if (tracksAddedRef.current) {
            console.warn("sendStreams: Tracks already added in room", currentRoom);
            return;
        }
        const tracks = myStream.getTracks();
        console.log("Adding tracks in room", currentRoom, ":", tracks.map(t => ({ kind: t.kind, enabled: t.enabled, label: t.label })));
        for (const track of tracks) {
            if (track.kind === 'audio' && !track.enabled) {
                console.warn("Audio track is disabled in room", currentRoom, ":", track);
                toast.warn("Audio track is disabled", { autoClose: 1500 });
            }
            peer.webRTCPeer.addTrack(track, myStream);
        }
        tracksAddedRef.current = true;
    }, [myStream, currentRoom]);

    const initiateCall = useCallback(async () => {
        if (!myStream) {
            toast.error("Local stream not available", { autoClose: 1500 });
            console.error("initiateCall: Local stream not available in room", currentRoom);
            return;
        }
        console.log("Initiating call to", remoteSocketId, "in room", currentRoom);
        try {
            const offer = await peer.getOffer();
            console.log("Offer SDP in room", currentRoom, ":", offer.sdp);
            const name = userDetails.name;
            socket.emit("user:call", { sendername: name, to: remoteSocketId, offer, room: currentRoom });
            sendStreams();
            toast.info("Initiating call...", { autoClose: 1500 });
        } catch (error) {
            console.error("Error initiating call in room", currentRoom, ":", error);
            toast.error("Failed to initiate call", { autoClose: 1500 });
        }
    }, [remoteSocketId, socket, userDetails, myStream, sendStreams, currentRoom]);

    const handleIncomingCall = useCallback(async ({ sendername, from, offer, room }) => {
        if (room !== currentRoom) {
            console.log("Ignoring incoming:call from different room:", room, "Current room:", currentRoom);
            return;
        }
        if (!myStream) {
            console.warn("handleIncomingCall: Local stream not available, queuing call in room", currentRoom);
            pendingCallRef.current = { sendername, from, offer, room };
            return;
        }
        setOtherUsername(sendername);
        setInComingCall(true);
        setRemoteSocketId(from);
        console.log("Incoming call from", sendername, from, "in room", room, "Offer SDP:", offer.sdp);
        toast.info(`Incoming call from ${sendername}`, { autoClose: 1500 });
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const ans = await peer.getAnswer(offer);
            console.log("Answer SDP in room", room, ":", ans.sdp);
            socket.emit("call:accepted", { to: from, ans, room: currentRoom });
            sendStreams();
        } catch (error) {
            console.error("Error accepting call in room", room, ":", error);
            toast.error("Failed to accept call", { autoClose: 1500 });
        }
    }, [socket, myStream, sendStreams, currentRoom]);

    const handleAcceptCall = useCallback(async ({ from, ans, room }) => {
        if (room !== currentRoom) {
            console.log("Ignoring call:accepted from different room:", room, "Current room:", currentRoom);
            return;
        }
        console.log("Call accepted from", from, "in room", room, "Answer:", ans);
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(ans));
            toast.success("Call accepted", { autoClose: 1500 });
        } catch (error) {
            console.error("Error accepting call in room", room, ":", error);
            toast.error("Failed to accept call", { autoClose: 1500 });
        }
    }, [currentRoom]);

    const handleNegoNeeded = useCallback(async () => {
        try {
            const offer = await peer.getOffer();
            socket.emit("peer:nego:needed", { to: remoteSocketId, offer, room: currentRoom });
            console.log("Negotiation needed, offer sent to", remoteSocketId, "in room", currentRoom);
        } catch (error) {
            console.error("Error in negotiation in room", currentRoom, ":", error);
            toast.error("Negotiation failed", { autoClose: 1500 });
        }
    }, [socket, remoteSocketId, currentRoom]);

    const handleNegoNeededIncoming = useCallback(async ({ from, offer, room }) => {
        if (room !== currentRoom) {
            console.log("Ignoring peer:nego:needed from different room:", room, "Current room:", currentRoom);
            return;
        }
        try {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans, room: currentRoom });
            console.log("Negotiation answer sent to", from, "in room", room);
        } catch (error) {
            console.error("Error in negotiation incoming in room", room, ":", error);
            toast.error("Negotiation failed", { autoClose: 1500 });
        }
    }, [socket, currentRoom]);

    const handleNegoFinal = useCallback(async ({ ans, room }) => {
        if (room !== currentRoom) {
            console.log("Ignoring peer:nego:final from different room:", room, "Current room:", currentRoom);
            return;
        }
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(ans));
            console.log("Negotiation finalized in room", room);
        } catch (error) {
            console.error("Error in negotiation final in room", room, ":", error);
            toast.error("Negotiation failed", { autoClose: 1500 });
        }
    }, [currentRoom]);

    useEffect(() => {
        if (myStream && pendingCallRef.current && pendingCallRef.current.room === currentRoom) {
            console.log("Processing queued incoming call in room", currentRoom);
            const { sendername, from, offer, room } = pendingCallRef.current;
            handleIncomingCall({ sendername, from, offer, room });
            pendingCallRef.current = null;
        }
    }, [myStream, handleIncomingCall, currentRoom]);

    useEffect(() => {
        peer.webRTCPeer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.webRTCPeer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    useEffect(() => {
        peer.webRTCPeer.addEventListener("track", async (e) => {
            const remoteStreams = e.streams;
            console.log("Received remote streams in room", currentRoom, ":", remoteStreams);
            if (remoteStreams && remoteStreams[0]) {
                const audioTracks = remoteStreams[0].getAudioTracks();
                console.log("Remote audio tracks in room", currentRoom, ":", audioTracks.map(t => ({ enabled: t.enabled, label: t.label })));
                if (audioTracks.length === 0) {
                    toast.warn("No audio track in remote stream", { autoClose: 1500 });
                }
                setRemoteStream(remoteStreams[0]);
                toast.success("Remote stream received", { autoClose: 1500 });
            } else {
                console.warn("No remote stream received in room", currentRoom);
                toast.warn("No remote stream available", { autoClose: 1500 });
            }
        });

        peer.webRTCPeer.addEventListener("connectionstatechange", () => {
            console.log("Connection state in room", currentRoom, ":", peer.webRTCPeer.connectionState);
            if (peer.webRTCPeer.connectionState === "connected") {
                toast.success("WebRTC connection established", { autoClose: 1500 });
            } else if (peer.webRTCPeer.connectionState === "failed") {
                toast.error("WebRTC connection failed", { autoClose: 1500 });
                peer.resetConnection();
                tracksAddedRef.current = false;
            }
        });

        peer.webRTCPeer.addEventListener("iceconnectionstatechange", () => {
            console.log("ICE connection state in room", currentRoom, ":", peer.webRTCPeer.iceConnectionState);
        });

        return () => {
            peer.webRTCPeer.removeEventListener("track", () => {});
            peer.webRTCPeer.removeEventListener("connectionstatechange", () => {});
            peer.webRTCPeer.removeEventListener("iceconnectionstatechange", () => {});
        };
    }, [currentRoom]);

    useEffect(() => {
        if (!peer) {
            console.error("Peer service is not available in room", currentRoom);
            return;
        }
        peer.setOnIceCandidate((candidate) => {
            if (remoteSocketId) {
                console.log("Emitting ICE candidate to", remoteSocketId, "in room", currentRoom);
                socket.emit("ice:candidate", { to: remoteSocketId, candidate, room: currentRoom });
            }
        });

        socket.on("user:joined", handleUserJoined);
        socket.on("incoming:call", handleIncomingCall);
        socket.on("call:accepted", handleAcceptCall);
        socket.on("peer:nego:needed", handleNegoNeededIncoming);
        socket.on("peer:nego:final", handleNegoFinal);
        socket.on("ice:candidate", async ({ candidate, room }) => {
            if (room !== currentRoom) {
                console.log("Ignoring ice:candidate from different room:", room, "Current room:", currentRoom);
                return;
            }
            console.log("Received ICE candidate in room", room, ":", candidate);
            try {
                await peer.addIceCandidate(candidate);
            } catch (error) {
                console.error("Error adding ICE candidate in room", room, ":", error);
                toast.error("Failed to add ICE candidate", { autoClose: 1500 });
            }
        });
        socket.on("user:left", ({ socketID, room }) => {
            if (room !== currentRoom) {
                console.log("Ignoring user:left from different room:", room, "Current room:", currentRoom);
                return;
            }
            if (socketID === remoteSocketId) {
                console.log("User left room", room, ":", socketID);
                setRemoteSocketId("");
                setRemoteStream(null);
                setOtherUsername("");
                tracksAddedRef.current = false;
                peer.resetConnection();
                toast.info("User left the room", { autoClose: 1500 });
            }
        });

        return () => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incoming:call", handleIncomingCall);
            socket.off("call:accepted", handleAcceptCall);
            socket.off("peer:nego:needed", handleNegoNeededIncoming);
            socket.off("peer:nego:final", handleNegoFinal);
            socket.off("ice:candidate");
            socket.off("user:left");
        };
    }, [socket, handleUserJoined, handleIncomingCall, handleAcceptCall, handleNegoNeededIncoming, handleNegoFinal, remoteSocketId, currentRoom]);

    useEffect(() => {
        if (remoteSocketId && myStream && remoteSocketId !== socket.id) {
            console.log("Triggering initiateCall for remoteSocketId:", remoteSocketId, "in room", currentRoom);
            initiateCall();
        }
    }, [remoteSocketId, myStream, initiateCall, socket.id, currentRoom]);

    const handleCopy = (textToCopy) => {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                toast.success('Invite link copied to clipboard!', { autoClose: 1500 });
            })
            .catch((error) => {
                console.error('Failed to copy text:', error);
                toast.error('Failed to copy text.', { autoClose: 1500 });
            });
    };

    return (
        <div className="w-full text-center">
            <ToastContainer />
            {loading ? (
                <div className="flex flex-col items-center">
                    <div className="bg-purple-50 text-gray-700 py-2 px-4 rounded-lg shadow-sm mb-4 flex items-center justify-center space-x-2 w-auto max-w-md mx-auto">
                        <span className="text-sm font-medium">Share this link:</span>
                        <div className="flex items-center bg-white px-3 py-1 rounded border border-purple-200">
                            <span className="text-xs text-gray-600 truncate max-w-[200px]">
                                {currentPageUrl}
                            </span>
                            <button
                                onClick={() => handleCopy(currentPageUrl)}
                                className="ml-2 text-purple-600 hover:text-purple-800 transition-colors"
                                aria-label="Copy link"
                            >
                                <i className="bi bi-clipboard"></i>
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        {otherUsername && remoteSocketId ? (
                            <div className="bg-green-500 text-white px-4 py-1 rounded-full inline-flex items-center">
                                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                                <span className="font-medium">Connected</span>
                            </div>
                        ) : (
                            <div className="bg-red-500 text-white px-4 py-1 rounded-full inline-flex items-center">
                                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                                <span className="font-medium">Disconnected</span>
                            </div>
                        )}
                    </div>

                    <main className={`flex items-center justify-center ${direction === 'column' ? 'flex-col' : 'flex-row'} gap-4`}>
                        {myStream && (
                            <div className="relative rounded-xl overflow-hidden shadow-lg border-2">
                                <ReactPlayer
                                    width={roomWidth}
                                    height={roomHeight}
                                    url={myStream}
                                    playing
                                    muted
                                    onError={(e) => console.error("Local ReactPlayer error:", e)}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white py-1 px-3 text-sm font-semibold flex flex-col items-center">
                                    <span>You</span>
                                    <div className="flex space-x-4 mt-1">
                                        <button
                                            onClick={handleToggleAudio}
                                            className={`p-1 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:bg-opacity-80 transition-colors`}
                                            aria-label={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
                                        >
                                            <span>{isAudioMuted ? '🔇' : '🎤'}</span>
                                        </button>
                                        <button
                                            onClick={handleToggleVideo}
                                            className={`p-1 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white hover:bg-opacity-80 transition-colors`}
                                            aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
                                        >
                                            <span>{isVideoOff ? '📴' : '📹'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            {remoteStream ? (
                                <div className="rounded-xl overflow-hidden shadow-lg border-2 border-purple-200">
                                    <ReactPlayer
                                        width={roomWidth}
                                        height={roomHeight}
                                        url={remoteStream}
                                        playing={true}
                                        muted={false}
                                        onError={(e) => console.error("Remote ReactPlayer error:", e)}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white py-1 px-3 text-sm font-semibold">
                                        {otherUsername || 'Participant'}
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-6"
                                    style={{ width: roomWidth, height: roomHeight }}
                                >
                                    <div className="text-center">
                                        <div className="text-gray-500 mb-2">
                                            <i className="bi bi-person-plus-fill text-4xl"></i>
                                        </div>
                                        <p className="text-gray-600 font-medium">Waiting for someone to join...</p>
                                        <p className="text-gray-500 text-sm mt-2">Share the link to invite a participant</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            ) : (
                <div className="flex items-center justify-center h-screen">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600 font-medium">Loading video call...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

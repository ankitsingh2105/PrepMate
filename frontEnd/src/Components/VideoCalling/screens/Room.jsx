import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketProvider';
import ReactPlayer from "react-player";
import peer from '../service/peer';
import { useLocation } from 'react-router-dom';
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Copy
} from "lucide-react";

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
            console.log("Initialized stream:", {
                audioTracks: audioTracks.map(t => ({ enabled: t.enabled, label: t.label })),
                videoTracks: videoTracks.map(t => ({ enabled: t.enabled, label: t.label }))
            });
            if (audioTracks.length === 0) {
                // toast.warn("No audio track available in stream", { autoClose: 1500 });
            }
            setMyStream(stream);
            // toast.success("Local stream initialized", { autoClose: 1500 });
            return stream;
        } catch (error) {
            console.error("Error accessing media devices:", error);
            return null;
        }
    }, []);

    const handleSubmit = useCallback(() => {
        const room = url.pathname.split("/")[2];
        if (userDetails && userDetails.email) {
            const email = userDetails.email;
            setLoading(true);
            console.log("Joining room:", room, "with email:", email);
            socket.emit("room:join", { email, room });
        } else {
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
                console.log("Stopped myStream tracks");
            }
        };
    }, [userDetails, initializeStream, handleSubmit]);

    const handleToggleAudio = useCallback(() => {
        if (!myStream) {
            // toast.error("No stream available to mute/unmute", { autoClose: 1500 });
            return;
        }
        const audioTrack = myStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioMuted(!audioTrack.enabled);
            toast.info(audioTrack.enabled ? "Microphone unmuted" : "Microphone muted", { autoClose: 500 });
            console.log("Audio track toggled:", { enabled: audioTrack.enabled });
        } else {
            // toast.warn("No audio track available", { autoClose: 1500 });
        }
    }, [myStream]);

    const handleToggleVideo = useCallback(() => {
        if (!myStream) {
            // toast.error("No stream available to turn video on/off", { autoClose: 1500 });
            return;
        }
        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
            toast.info(videoTrack.enabled ? "Video turned on" : "Video turned off", { autoClose: 500 });
            console.log("Video track toggled:", { enabled: videoTrack.enabled });
        } else {
            // toast.warn("No video track available", { autoClose: 1500 });
        }
    }, [myStream]);

    const handleUserJoined = useCallback((data) => {
        const { email, socketID } = data;
        if (socketID === socket.id) {
            console.log("Ignoring self in user:joined");
            return;
        }
        console.log("New user joined:", data);
        setRemoteSocketId(socketID);
        toast.info(`User ${email} joined the room`, { autoClose: 1500 });
    }, [socket.id]);

    const sendStreams = useCallback(() => {
        if (!myStream || !myStream.getTracks() || myStream.getTracks().length === 0) {
            console.warn("sendStreams: No stream or no valid tracks");
            // toast.error("No valid stream to send", { autoClose: 1500 });
            return;
        }
        if (tracksAddedRef.current) {
            console.warn("sendStreams: Tracks already added");
            return;
        }
        const tracks = myStream.getTracks();
        console.log("Adding tracks:", tracks.map(t => ({ kind: t.kind, enabled: t.enabled, label: t.label })));
        for (const track of tracks) {
            if (track.kind === 'audio' && !track.enabled) {
                console.warn("Audio track is disabled:", track);
                // toast.warn("Audio track is disabled", { autoClose: 1500 });
            }
            peer.webRTCPeer.addTrack(track, myStream);
        }
        tracksAddedRef.current = true;
    }, [myStream]);

    const initiateCall = useCallback(async () => {
        if (!myStream) {
            // toast.error("Local stream not available", { autoClose: 1500 });
            console.error("initiateCall: Local stream not available");
            return;
        }
        console.log("Initiating call to", remoteSocketId);
        try {
            const offer = await peer.getOffer();
            console.log("Offer SDP:", offer.sdp);
            const name = userDetails.name;
            socket.emit("user:call", { sendername: name, to: remoteSocketId, offer });
            sendStreams();
            // toast.info("Initiating call...", { autoClose: 1500 });
        } catch (error) {
            console.error("Error initiating call:", error);
            // toast.error("Failed to initiate call", { autoClose: 1500 });
        }
    }, [remoteSocketId, socket, userDetails, myStream, sendStreams]);

    const handleIncomingCall = useCallback(async ({ sendername, from, offer }) => {
        if (!myStream) {
            console.warn("handleIncomingCall: Local stream not available, queuing call");
            pendingCallRef.current = { sendername, from, offer };
            return;
        }
        setOtherUsername(sendername);
        setInComingCall(true);
        setRemoteSocketId(from);
        console.log("Incoming call from", sendername, from, "Offer SDP:", offer.sdp);
        toast.info(`Incoming call from ${sendername}`, { autoClose: 1000 });
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const ans = await peer.getAnswer(offer);
            console.log("Answer SDP:", ans.sdp);
            socket.emit("call:accepted", { to: from, ans });
            sendStreams();
        } catch (error) {
            console.error("Error accepting call:", error);
            // toast.error("Failed to accept call", { autoClose: 1500 });
        }
    }, [socket, myStream, sendStreams]);

    useEffect(() => {
        if (myStream && pendingCallRef.current) {
            console.log("Processing queued incoming call");
            const { sendername, from, offer } = pendingCallRef.current;
            handleIncomingCall({ sendername, from, offer });
            pendingCallRef.current = null;
        }
    }, [myStream, handleIncomingCall]);

    const handleAcceptCall = useCallback(async ({ from, ans }) => {
        console.log("Call accepted from", from, "Answer:", ans);
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(ans));
            toast.success("Call accepted", { autoClose: 1500 });
        } catch (error) {
            console.error("Error accepting call:", error);
            // toast.error("Failed to accept call", { autoClose: 1500 });
        }
    }, []);

    const handleNegoNeeded = useCallback(async () => {
        try {
            const offer = await peer.getOffer();
            socket.emit("peer:nego:needed", { to: remoteSocketId, offer });
            console.log("Negotiation needed, offer sent to", remoteSocketId);
        } catch (error) {
            console.error("Error in negotiation:", error);
            // toast.error("Negotiation failed", { autoClose: 1500 });
        }
    }, [socket, remoteSocketId]);

    const handleNegoNeededIncoming = useCallback(async ({ from, offer }) => {
        try {
            const ans = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans });
            console.log("Negotiation answer sent to", from);
        } catch (error) {
            console.error("Error in negotiation incoming:", error);
            // toast.error("Negotiation failed", { autoClose: 1500 });
        }
    }, [socket]);

    const handleNegoFinal = useCallback(async ({ ans }) => {
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(ans));
            console.log("Negotiation finalized");
        } catch (error) {
            console.error("Error in negotiation final:", error);
            // toast.error("Negotiation failed", { autoClose: 1500 });
        }
    }, []);

    useEffect(() => {
        peer.webRTCPeer.addEventListener("negotiationneeded", handleNegoNeeded);
        return () => {
            peer.webRTCPeer.removeEventListener("negotiationneeded", handleNegoNeeded);
        };
    }, [handleNegoNeeded]);

    useEffect(() => {
        peer.webRTCPeer.addEventListener("track", async (e) => {
            const remoteStreams = e.streams;
            console.log("Received remote streams:", remoteStreams);
            if (remoteStreams && remoteStreams[0]) {
                const audioTracks = remoteStreams[0].getAudioTracks();
                console.log("Remote audio tracks:", audioTracks.map(t => ({ enabled: t.enabled, label: t.label })));
                if (audioTracks.length === 0) {
                    // toast.warn("No audio track in remote stream", { autoClose: 1500 });
                }
                setRemoteStream(remoteStreams[0]);
                // toast.success("Remote stream received", { autoClose: 1500 });
            } else {
                console.warn("No remote stream received");
                // toast.warn("No remote stream available", { autoClose: 1500 });
            }
        });

        peer.webRTCPeer.addEventListener("connectionstatechange", () => {
            console.log("Connection state:", peer.webRTCPeer.connectionState);
            if (peer.webRTCPeer.connectionState === "connected") {
                // toast.success("WebRTC connection established", { autoClose: 1500 });
            } else if (peer.webRTCPeer.connectionState === "failed") {
                // toast.error("WebRTC connection failed", { autoClose: 1500 });
                peer.resetConnection();
                tracksAddedRef.current = false;
            }
        });

        peer.webRTCPeer.addEventListener("iceconnectionstatechange", () => {
            console.log("ICE connection state:", peer.webRTCPeer.iceConnectionState);
        });

        return () => {
            peer.webRTCPeer.removeEventListener("track", () => { });
            peer.webRTCPeer.removeEventListener("connectionstatechange", () => { });
            peer.webRTCPeer.removeEventListener("iceconnectionstatechange", () => { });
        };
    }, []);

    useEffect(() => {
        if (!peer) {
            console.error("Peer service is not available");
            return;
        }
        peer.setOnIceCandidate((candidate) => {
            if (remoteSocketId) {
                console.log("Emitting ICE candidate to", remoteSocketId);
                socket.emit("ice:candidate", { to: remoteSocketId, candidate });
            }
        });

        socket.on("user:joined", handleUserJoined);
        socket.on("incoming:call", handleIncomingCall);
        socket.on("call:accepted", handleAcceptCall);
        socket.on("peer:nego:needed", handleNegoNeededIncoming);
        socket.on("peer:nego:final", handleNegoFinal);
        socket.on("ice:candidate", async ({ candidate }) => {
            console.log("Received ICE candidate:", candidate);
            try {
                await peer.addIceCandidate(candidate);
            } catch (error) {
                console.error("Error adding ICE candidate:", error);
                // toast.error("Failed to add ICE candidate", { autoClose: 1500 });
            }
        });
        socket.on("user:left", ({ socketID }) => {
            if (socketID === remoteSocketId) {
                console.log("User left:", socketID);
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
    }, [socket, handleUserJoined, handleIncomingCall, handleAcceptCall, handleNegoNeededIncoming, handleNegoFinal, remoteSocketId]);

    useEffect(() => {
        if (remoteSocketId && myStream && remoteSocketId !== socket.id) {
            console.log("Triggering initiateCall for remoteSocketId:", remoteSocketId);
            initiateCall();
        }
    }, [remoteSocketId, myStream, initiateCall, socket.id]);

    const handleCopy = (textToCopy) => {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                toast.success('Invite link copied to clipboard!', { autoClose: 1500 });
            })
            .catch((error) => {
                console.error('Failed to copy text:', error);
                // toast.error('Failed to copy text.', { autoClose: 1500 });
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
                        </div>
                            <button
                                onClick={() => handleCopy(currentPageUrl)}
                                className="ml-2 text-green-500 hover:text-purple-800 transition-colors"
                                aria-label="Copy link"
                            >
                                <Copy/>
                            </button>
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
                                <br />
                                <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white bg-opacity-100 py-1 px-3 text-sm font-semibold flex justify-between items-center">
                                    <span>You</span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleToggleAudio}
                                            className={`p-1 rounded-full ${isAudioMuted ? 'bg-red-500' : 'bg-green-500'} text-white hover:bg-opacity-80 transition-colors`}
                                            aria-label={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
                                        >
                                            {!isAudioMuted ? <Mic size={20} /> : <MicOff size={20} />}
                                        </button>
                                        <button
                                            onClick={handleToggleVideo}
                                            className={`p-1 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-green-500'} text-white hover:bg-opacity-80 transition-colors`}
                                            aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
                                        >
                                            {!isVideoOff ? (
                                                <Video size={20} />
                                            ) : (
                                                <VideoOff size={20} />
                                            )}

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
                                    <div className="absolute bottom-0 left-0 right-0 bg-purple-600 bg-opacity-100 text-white py-1 px-3 text-sm font-semibold">
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

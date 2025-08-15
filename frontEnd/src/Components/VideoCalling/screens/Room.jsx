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
    Copy,
    RefreshCw
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
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [connectionStats, setConnectionStats] = useState(null);
    
    const tracksAddedRef = useRef(false);
    const pendingCallRef = useRef(null);
    const isInitiatorRef = useRef(false);
    const remoteVideoRef = useRef(null);
    const isMountedRef = useRef(true);
    const connectionCheckInterval = useRef(null);

    const location = useLocation();
    const currentPageUrl = `https://prepmatee.vercel.app${location.pathname}`;
    
    useEffect(() => {
        toast.info("Copy the link and send to a friend", { autoClose: 1500 });
        
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const userInfo = useSelector((state) => state.userInfo);
    const { userDetails } = userInfo;
    const url = useLocation();

    const initializeStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: {
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                }
            });
            
            console.log("✅ Stream initialized successfully:", {
                audioTracks: stream.getAudioTracks().map(t => ({ enabled: t.enabled, label: t.label })),
                videoTracks: stream.getVideoTracks().map(t => ({ enabled: t.enabled, label: t.label }))
            });
            
            setMyStream(stream);
            return stream;
        } catch (error) {
            console.error("❌ Error accessing media devices:", error);
            toast.error("Failed to access camera/microphone. Please check permissions and try again.");
            return null;
        }
    }, []);

    const handleSubmit = useCallback(() => {
        const room = url.pathname.split("/")[3];
        if (userDetails && userDetails.email) {
            console.log("🚀 Joining room:", room, "with email:", userDetails.email);
            const email = userDetails.email;
            const name = userDetails.name;
            setLoading(true);
            socket.emit("room:join", { email, room, name });
        } else {
            console.error("❌ User details not available");
            toast.error("User details not available. Please log in again.");
        }
    }, [userDetails, socket, url]);

    useEffect(() => {
        if (!userDetails || !userDetails.email) return;

        let isMounted = true;
        initializeStream().then((stream) => {
            if (isMounted && stream && isMountedRef.current) {
                handleSubmit();
            }
        });

        return () => {
            isMounted = false;
        };
    }, [userDetails, initializeStream, handleSubmit]);

    const handleToggleAudio = useCallback(() => {
        if (!myStream) return;
        const audioTrack = myStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioMuted(!audioTrack.enabled);
            toast.info(audioTrack.enabled ? "🎤 Microphone unmuted" : "🔇 Microphone muted", { autoClose: 1000 });
        }
    }, [myStream]);

    const handleToggleVideo = useCallback(() => {
        if (!myStream) return;
        const videoTrack = myStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsVideoOff(!videoTrack.enabled);
            toast.info(videoTrack.enabled ? "📹 Video turned on" : "🚫 Video turned off", { autoClose: 1000 });
        }
    }, [myStream]);

    const handleUserJoined = useCallback((data) => {
        const { name, email, socketID } = data;
        if (socketID === socket.id) {
            return;
        }
        console.log("👥 New user joined:", data);
        setRemoteSocketId(socketID);
        setOtherUsername(name);
        setConnectionStatus("connected");
        isInitiatorRef.current = true;
        toast.success(`User ${name} joined the room`, { autoClose: 1500 });
    }, [socket.id]);

    const sendStreams = useCallback(() => {
        if (!myStream) {
            console.warn("⚠️ sendStreams: No local stream available");
            return false;
        }
        
        if (tracksAddedRef.current) {
            console.log("ℹ️ sendStreams: Tracks already added");
            return true;
        }
        
        try {
            const success = peer.addLocalTracks(myStream);
            if (success) {
                tracksAddedRef.current = true;
                console.log("✅ Local tracks added successfully");
                return true;
            } else {
                console.error("❌ Failed to add local tracks");
                return false;
            }
        } catch (error) {
            console.error("❌ Error adding local tracks:", error);
            tracksAddedRef.current = false;
            return false;
        }
    }, [myStream]);

    const initiateCall = useCallback(async () => {
        if (!myStream || !isInitiatorRef.current || !remoteSocketId) {
            console.error("❌ initiateCall: Missing requirements", { 
                hasStream: !!myStream, 
                isInitiator: isInitiatorRef.current, 
                remoteSocketId 
            });
            return;
        }
        
        console.log("📞 Initiating call to", remoteSocketId);
        
        try {
            // First add tracks, then create offer
            if (!sendStreams()) {
                throw new Error("Failed to add local tracks");
            }
            
            const offer = await peer.makeOffer();
            const name = userDetails.name;
            socket.emit("user:call", { sendername: name, to: remoteSocketId, offer });
            console.log("📤 Call offer sent");
            
        } catch (error) {
            console.error("❌ Error initiating call:", error);
            toast.error("Failed to initiate call. Please try again.");
            tracksAddedRef.current = false;
        }
    }, [remoteSocketId, socket, userDetails, myStream, sendStreams]);

    const handleIncomingCall = useCallback(async ({ sendername, from, offer }) => {
        if (!myStream) {
            console.warn("⚠️ handleIncomingCall: Local stream not available, queuing call");
            pendingCallRef.current = { sendername, from, offer };
            return;
        }
        
        setOtherUsername(sendername);
        setInComingCall(true);
        setRemoteSocketId(from);
        setConnectionStatus("connected");
        console.log("📥 Incoming call from", sendername, from);
        toast.info(`📞 Incoming call from ${sendername}`, { autoClose: 2000 });
        
        try {
            // Add local tracks first
            if (!sendStreams()) {
                throw new Error("Failed to add local tracks");
            }
            
            await peer.setRemoteDescription(offer);
            const answer = await peer.getAnswer(offer);
            console.log("📤 Sending answer SDP");
            socket.emit("call:accepted", { to: from, ans: answer });
            isInitiatorRef.current = false;
            
        } catch (error) {
            console.error("❌ Error accepting call:", error);
            toast.error("Failed to accept call. Please try again.");
            tracksAddedRef.current = false;
        }
    }, [socket, myStream, sendStreams]);

    useEffect(() => {
        if (myStream && pendingCallRef.current) {
            console.log("🔄 Processing queued incoming call");
            const { sendername, from, offer } = pendingCallRef.current;
            handleIncomingCall({ sendername, from, offer });
            pendingCallRef.current = null;
        }
    }, [myStream, handleIncomingCall]);

    const handleAcceptCall = useCallback(async ({ from, ans }) => {
        console.log("✅ Call accepted, setting remote description");
        try {
            await peer.setRemoteDescription(ans);
            toast.success("Call connected!", { autoClose: 1500 });
        } catch (error) {
            console.error("❌ Error accepting call:", error);
            toast.error("Failed to accept call");
        }
    }, []);

    const handleNegoNeeded = useCallback(async () => {
        try {
            console.log("🔄 Renegotiation needed");
            const offer = await peer.makeOffer();
            socket.emit("peer:nego:needed", { to: remoteSocketId, offer });
        } catch (error) {
            console.error("❌ Error in negotiation:", error);
        }
    }, [socket, remoteSocketId]);

    const handleNegoNeededIncoming = useCallback(async ({ from, offer }) => {
        try {
            console.log("🔄 Processing incoming renegotiation");
            const answer = await peer.getAnswer(offer);
            socket.emit("peer:nego:done", { to: from, ans: answer });
        } catch (error) {
            console.error("❌ Error in negotiation incoming:", error);
        }
    }, [socket]);

    const handleNegoFinal = useCallback(async ({ ans }) => {
        try {
            const state = peer.webRTCPeer.signalingState;
            console.log("📊 Signaling state before applying answer:", state);

            if (state === "have-local-offer") {
                await peer.setRemoteDescription(ans);
                console.log("✅ Renegotiation finalized");
            } else {
                console.warn("⚠️ Skipped applying answer. Unexpected signaling state:", state);
            }
        } catch (error) {
            console.error("❌ Error in negotiation final:", error);
        }
    }, []);

    // Handle connection state changes
    const handleConnectionStateChange = useCallback((state) => {
        console.log("🔗 Connection state changed to:", state);
        if (state === 'connected') {
            setConnectionStatus("connected");
            toast.success("🎉 Call connected successfully!", { autoClose: 2000 });
        } else if (state === 'failed' || state === 'disconnected') {
            setConnectionStatus("disconnected");
            toast.error("❌ Call disconnected", { autoClose: 3000 });
            // Reset connection after a delay
            setTimeout(() => {
                if (isMountedRef.current) {
                    peer.resetConnection();
                    tracksAddedRef.current = false;
                }
            }, 2000);
        } else if (state === 'connecting') {
            setConnectionStatus("connecting");
        }
    }, []);

    // Handle ICE connection state changes
    const handleIceConnectionStateChange = useCallback((state) => {
        console.log("🧊 ICE connection state:", state);
        if (state === 'connected') {
            setConnectionStatus("connected");
        } else if (state === 'failed' || state === 'disconnected') {
            setConnectionStatus("disconnected");
        }
    }, []);

    // Handle incoming tracks
    const handleTrack = useCallback((event) => {
        console.log("📹 Track received:", event);
        const remoteStreams = event.streams;
        if (remoteStreams && remoteStreams[0]) {
            console.log("✅ Setting remote stream:", remoteStreams[0]);
            setRemoteStream(remoteStreams[0]);
            
            // Ensure video element is properly set up
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStreams[0];
                remoteVideoRef.current.play().catch(e => {
                    console.error("❌ Error playing remote video:", e);
                });
            }
        } else {
            console.warn("⚠️ No remote stream received");
        }
    }, []);

    // Retry connection if it fails
    const retryConnection = useCallback(() => {
        if (!isMountedRef.current) return;
        
        console.log("🔄 Retrying connection...");
        setConnectionStatus("connecting");
        
        // Reset peer connection
        peer.resetConnection();
        tracksAddedRef.current = false;
        
        // Re-initialize if we have a remote user
        if (remoteSocketId && myStream) {
            setTimeout(() => {
                if (isMountedRef.current) {
                    initiateCall();
                }
            }, 2000);
        }
    }, [remoteSocketId, myStream, initiateCall]);

    // Handle connection errors
    const handleConnectionError = useCallback((error) => {
        console.error("❌ Connection error:", error);
        setConnectionStatus("error");
        toast.error("Connection failed. Click to retry.", {
            autoClose: 5000,
            onClick: retryConnection
        });
    }, [retryConnection]);

    // Update connection stats periodically
    const updateConnectionStats = useCallback(() => {
        if (peer && peer.isConnectionHealthy()) {
            const stats = peer.getConnectionStats();
            setConnectionStats(stats);
        }
    }, []);

    useEffect(() => {
        if (!peer) return;

        // Set up peer event handlers
        peer.setOnConnectionStateChange(handleConnectionStateChange);
        peer.setOnTrack(handleTrack);
        peer.setOnIceCandidate((candidate) => {
            if (remoteSocketId) {
                socket.emit("ice:candidate", { to: remoteSocketId, candidate });
            }
        });
        peer.setOnIceError(handleConnectionError);
        peer.setOnIceConnectionStateChange(handleIceConnectionStateChange);

        // Set up periodic connection stats update
        connectionCheckInterval.current = setInterval(updateConnectionStats, 5000);

        return () => {
            peer.setOnConnectionStateChange(null);
            peer.setOnTrack(null);
            peer.setOnIceCandidate(null);
            peer.setOnIceError(null);
            peer.setOnIceConnectionStateChange(null);
            
            if (connectionCheckInterval.current) {
                clearInterval(connectionCheckInterval.current);
            }
        };
    }, [handleConnectionStateChange, handleTrack, handleConnectionError, handleIceConnectionStateChange, remoteSocketId, socket, peer, updateConnectionStats]);

    useEffect(() => {
        if (!peer) return;

        socket.on("user:joined", handleUserJoined);
        socket.on("incoming:call", handleIncomingCall);
        socket.on("call:accepted", handleAcceptCall);
        socket.on("peer:nego:needed", handleNegoNeededIncoming);
        socket.on("peer:nego:final", handleNegoFinal);
        socket.on("ice:candidate", async ({ candidate }) => {
            try {
                await peer.addIceCandidate(candidate);
            } catch (error) {
                console.error("❌ Error adding ICE candidate:", error);
            }
        });
        
        socket.on("user:left", ({ socketID }) => {
            if (socketID === remoteSocketId) {
                console.log("👋 User left:", socketID);
                setRemoteSocketId("");
                setRemoteStream(null);
                setOtherUsername("");
                setConnectionStatus("disconnected");
                tracksAddedRef.current = false;
                peer.resetConnection();
                toast.info("User left the room", { autoClose: 2000 });
            }
        });

        // Handle heartbeat
        socket.on("heartbeat", () => {
            socket.emit("heartbeat:ack");
        });

        // Handle room full
        socket.on("room:full", ({ message }) => {
            toast.error(message);
            setConnectionStatus("error");
        });

        return () => {
            socket.off("user:joined", handleUserJoined);
            socket.off("incoming:call", handleIncomingCall);
            socket.off("call:accepted", handleAcceptCall);
            socket.off("peer:nego:needed", handleNegoNeededIncoming);
            socket.off("peer:nego:final", handleNegoFinal);
            socket.off("ice:candidate");
            socket.off("user:left");
            socket.off("heartbeat");
            socket.off("room:full");
        };
    }, [socket, handleUserJoined, handleIncomingCall, handleAcceptCall, handleNegoNeededIncoming, handleNegoFinal, remoteSocketId]);

    useEffect(() => {
        if (remoteSocketId && myStream && remoteSocketId !== socket.id && isInitiatorRef.current) {
            // Add a small delay to ensure everything is ready
            const timer = setTimeout(() => {
                if (isMountedRef.current) {
                    initiateCall();
                }
            }, 1500);
            
            return () => clearTimeout(timer);
        }
    }, [remoteSocketId, myStream, initiateCall, socket.id]);

    const handleCopy = (textToCopy) => {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                toast.success('📋 Invite link copied to clipboard!', { autoClose: 1500 });
            })
            .catch((error) => {
                console.error('❌ Failed to copy text:', error);
                toast.error('Failed to copy link');
            });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (myStream) {
                myStream.getTracks().forEach(track => track.stop());
                console.log("🛑 Stopped local stream tracks");
            }
            if (remoteStream) {
                remoteStream.getTracks().forEach(track => track.stop());
                console.log("🛑 Stopped remote stream tracks");
            }
            
            peer.resetConnection();
            
            // Notify server that we're leaving
            if (socket && remoteSocketId) {
                socket.emit("room:leave");
            }
            
            if (connectionCheckInterval.current) {
                clearInterval(connectionCheckInterval.current);
            }
        };
    }, [myStream, remoteStream, socket, remoteSocketId]);

    // Handle page refresh/visibility change
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (socket && remoteSocketId) {
                socket.emit("room:leave");
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && socket && remoteSocketId) {
                console.log("📱 Page hidden, notifying server");
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [socket, remoteSocketId]);

    // Update remote video when stream changes
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            console.log("✅ Remote video stream attached:", remoteStream);
        }
    }, [remoteStream]);

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
                            <Copy />
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className={`px-4 py-1 rounded-full inline-flex items-center ${
                            connectionStatus === "connected" 
                                ? "bg-green-500 text-white" 
                                : connectionStatus === "connecting"
                                ? "bg-yellow-500 text-white"
                                : connectionStatus === "error"
                                ? "bg-red-600 text-white"
                                : "bg-red-500 text-white"
                        }`}>
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                connectionStatus === "connected" ? "animate-pulse" : 
                                connectionStatus === "connecting" ? "animate-spin" : ""
                            }`}></div>
                            <span className="font-medium capitalize">{connectionStatus}</span>
                        </div>
                        
                        {connectionStatus === "error" && (
                            <button 
                                onClick={retryConnection}
                                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm flex items-center mx-auto"
                            >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Retry Connection
                            </button>
                        )}
                    </div>

                    {connectionStats && (
                        <div className="mb-4 text-xs text-gray-600 bg-gray-100 px-3 py-2 rounded">
                            <div>ICE: {connectionStats.iceConnectionState}</div>
                            <div>Signaling: {connectionStats.signalingState}</div>
                            <div>Tracks: {connectionStats.localTracks} local, {connectionStats.remoteTracks} remote</div>
                        </div>
                    )}

                    <main className={`flex items-center justify-center ${direction === 'column' ? 'flex-col' : 'flex-row'} gap-4`}>
                        {myStream && (
                            <div className="relative rounded-xl overflow-hidden shadow-lg border-2">
                                <ReactPlayer
                                    width={roomWidth}
                                    height={roomHeight}
                                    url={myStream}
                                    playing
                                    muted
                                    onError={(e) => console.error("❌ Local ReactPlayer error:", e)}
                                />
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
                                            {!isVideoOff ? <Video size={20} /> : <VideoOff size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            {remoteStream ? (
                                <div className="rounded-xl overflow-hidden shadow-lg border-2 border-purple-200">
                                    <video
                                        width={roomWidth}
                                        height={roomHeight}
                                        autoPlay
                                        playsInline
                                        muted={false}
                                        ref={remoteVideoRef}
                                        onError={(e) => console.error("❌ Remote video error:", e)}
                                        style={{ backgroundColor: '#000' }}
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
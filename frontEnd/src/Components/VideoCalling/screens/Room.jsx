import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "../context/SocketProvider";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Mic, MicOff, Video, VideoOff, Copy, RefreshCw } from "lucide-react";
import peer from "../service/peer";

export default function Room({
  windowWidth,
  roomWidth = 640,
  roomHeight = 360,
  direction = "row",
}) {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState("");
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inComingCall, setInComingCall] = useState(false);
  const [otherUsername, setOtherUsername] = useState("");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [connectionStats, setConnectionStats] = useState(null);
  const [showStartCallButton, setShowStartCallButton] = useState(false);

  const tracksAddedRef = useRef(false);
  const pendingCallRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const myVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const isMountedRef = useRef(true);
  const connectionCheckInterval = useRef(null);

  const location = useLocation();
  const currentPageUrl = window.location.href;
  const roomId = window.location.pathname.split("/").filter(Boolean).pop() || "";

  const userInfo = useSelector((state) => state.userInfo);
  const { userDetails } = userInfo;

  useEffect(() => {
    toast.info("Copy the link and send to a friend", { autoClose: 1500 });
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const initializeStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
      });
      console.log("✅ Stream initialized:", {
        audioTracks: stream.getAudioTracks().map((t) => ({
          enabled: t.enabled,
          label: t.label,
        })),
        videoTracks: stream.getVideoTracks().map((t) => ({
          enabled: t.enabled,
          label: t.label,
        })),
      });
      setMyStream(stream);
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
        myVideoRef.current.play().catch((e) => console.error("❌ Error playing local video:", e));
      }
      return stream;
    } catch (error) {
      console.error("❌ Error accessing media devices:", error.name, error.message);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        toast.error("Camera/microphone permissions denied. Please grant access in browser settings and reload.");
      } else if (error.name === "NotFoundError") {
        toast.error("No camera/microphone found. Check your devices.");
      } else {
        toast.error("Failed to access camera/microphone. Check browser console for details.");
      }
      setLoading(false);
      return null;
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!roomId) {
      console.error("❌ No room ID in URL");
      toast.error("No room ID provided. Please use /room/yourRoomId");
      setLoading(false);
      return;
    }
    if (!userDetails || !userDetails.email) {
      console.error("❌ User details not available");
      toast.error("User details not available. Please log in again.");
      setLoading(false);
      return;
    }
    console.log("🚀 Joining room:", roomId, "with email:", userDetails.email);
    socket.emit("room:join", {
      email: userDetails.email,
      room: roomId,
      name: userDetails.name,
    });
  }, [userDetails, socket, roomId]);

  useEffect(() => {
    if (!userDetails || !userDetails.email) {
      setLoading(false);
      return;
    }
    initializeStream().then((stream) => {
      if (isMountedRef.current && stream) {
        handleSubmit();
      } else {
        setLoading(false);
      }
    });
  }, [userDetails, initializeStream, handleSubmit]);

  const handleToggleAudio = useCallback(() => {
    if (!myStream) return;
    const audioTrack = myStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
      toast.info(audioTrack.enabled ? "🎤 Microphone unmuted" : "🔇 Microphone muted", {
        autoClose: 1000,
      });
    }
  }, [myStream]);

  const handleToggleVideo = useCallback(() => {
    if (!myStream) return;
    const videoTrack = myStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
      toast.info(videoTrack.enabled ? "📹 Video on" : "🚫 Video off", { autoClose: 1000 });
    }
  }, [myStream]);

  const handleUserJoined = useCallback(
    (data) => {
      const { name, email, socketID } = data;
      if (socketID === socket.id) return;
      console.log("👥 User joined:", data);
      setRemoteSocketId(socketID);
      setOtherUsername(name);
      setConnectionStatus("connected");
      isInitiatorRef.current = true;
      toast.success(`User ${name} joined the room`, { autoClose: 1500 });
      setShowStartCallButton(true); // Show manual call button as fallback
    },
    [socket.id]
  );

  const sendStreams = useCallback(() => {
    if (!myStream) {
      console.warn("⚠️ sendStreams: No local stream");
      return false;
    }
    if (tracksAddedRef.current) {
      console.log("ℹ️ sendStreams: Tracks already added");
      return true;
    }
    try {
      for (const track of myStream.getTracks()) {
        peer.webRTCPeer.addTrack(track, myStream);
      }
      tracksAddedRef.current = true;
      console.log("✅ Local tracks added");
      return true;
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
        remoteSocketId,
      });
      toast.error("Cannot start call. Ensure a user has joined and camera is active.");
      return;
    }
    console.log("📞 Initiating call to", remoteSocketId);
    try {
      if (!sendStreams()) {
        throw new Error("Failed to add local tracks");
      }
      const offer = await peer.getOffer();
      socket.emit("user:call", {
        sendername: userDetails.name,
        to: remoteSocketId,
        offer,
      });
      console.log("📤 Call offer sent");
    } catch (error) {
      console.error("❌ Error initiating call:", error);
      toast.error("Failed to initiate call. Please try again.");
      tracksAddedRef.current = false;
    }
  }, [remoteSocketId, socket, userDetails, myStream, sendStreams]);

  const handleIncomingCall = useCallback(
    async ({ sendername, from, offer }) => {
      if (!myStream) {
        console.warn("⚠️ handleIncomingCall: No local stream, queuing call");
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
        if (!sendStreams()) {
          throw new Error("Failed to add local tracks");
        }
        await peer.setRemoteDescription(offer);
        const answer = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans: answer });
        console.log("📤 Answer sent");
      } catch (error) {
        console.error("❌ Error accepting call:", error);
        toast.error("Failed to accept call");
        tracksAddedRef.current = false;
      }
    },
    [socket, myStream, sendStreams]
  );

  useEffect(() => {
    if (myStream && pendingCallRef.current) {
      console.log("🔄 Processing queued call");
      handleIncomingCall(pendingCallRef.current);
      pendingCallRef.current = null;
    }
  }, [myStream, handleIncomingCall]);

  const handleAcceptCall = useCallback(
    async ({ from, ans }) => {
      console.log("✅ Call accepted, setting remote description");
      try {
        await peer.setRemoteDescription(ans);
        toast.success("Call connected!", { autoClose: 1500 });
      } catch (error) {
        console.error("❌ Error accepting call:", error);
        toast.error("Failed to accept call");
      }
    },
    []
  );

  const handleNegoNeeded = useCallback(async () => {
    try {
      console.log("🔄 Negotiation needed");
      const offer = await peer.getOffer();
      socket.emit("peer:nego:needed", { to: remoteSocketId, offer });
    } catch (error) {
      console.error("❌ Error in negotiation:", error);
    }
  }, [socket, remoteSocketId]);

  const handleNegoNeededIncoming = useCallback(
    async ({ from, offer }) => {
      try {
        console.log("🔄 Incoming negotiation");
        const answer = await peer.getAnswer(offer);
        socket.emit("peer:nego:done", { to: from, ans: answer });
      } catch (error) {
        console.error("❌ Error in negotiation:", error);
      }
    },
    [socket]
  );

  const handleNegoFinal = useCallback(async ({ ans }) => {
    try {
      console.log("✅ Finalizing negotiation");
      await peer.setRemoteDescription(ans);
    } catch (error) {
      console.error("❌ Error in negotiation final:", error);
    }
  }, []);

  const handleConnectionStateChange = useCallback((state) => {
    console.log("🔗 Connection state:", state);
    setConnectionStatus(state);
    if (state === "connected") {
      toast.success("🎉 Call connected!", { autoClose: 2000 });
      setShowStartCallButton(false);
    } else if (state === "failed" || state === "disconnected") {
      toast.error("❌ Call disconnected", { autoClose: 3000 });
      tracksAddedRef.current = false;
      setShowStartCallButton(!!remoteSocketId);
    }
  }, []);

  const handleTrack = useCallback(
    (event) => {
      console.log("📹 Track received:", event);
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch((e) => console.error("❌ Error playing remote video:", e));
        }
      } else {
        console.warn("⚠️ No remote stream received");
      }
    },
    []
  );

  const retryConnection = useCallback(() => {
    console.log("🔄 Retrying connection...");
    setConnectionStatus("connecting");
    peer.resetConnection();
    tracksAddedRef.current = false;
    if (remoteSocketId && myStream) {
      setTimeout(() => {
        if (isMountedRef.current) {
          initiateCall();
        }
      }, 1000);
    }
  }, [remoteSocketId, myStream, initiateCall]);

  useEffect(() => {
    peer.webRTCPeer.ontrack = handleTrack;
    peer.webRTCPeer.onnegotiationneeded = handleNegoNeeded;
    peer.webRTCPeer.onconnectionstatechange = () =>
      handleConnectionStateChange(peer.webRTCPeer.connectionState);
    peer.webRTCPeer.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state:", peer.webRTCPeer.iceConnectionState);
      setConnectionStats({
        iceConnectionState: peer.webRTCPeer.iceConnectionState,
        signalingState: peer.webRTCPeer.signalingState,
        localTracks: myStream ? myStream.getTracks().length : 0,
        remoteTracks: remoteStream ? remoteStream.getTracks().length : 0,
      });
    };
    return () => {
      peer.webRTCPeer.ontrack = null;
      peer.webRTCPeer.onnegotiationneeded = null;
      peer.webRTCPeer.onconnectionstatechange = null;
      peer.webRTCPeer.oniceconnectionstatechange = null;
    };
  }, [handleTrack, handleNegoNeeded, handleConnectionStateChange, myStream, remoteStream]);

  useEffect(() => {
    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      toast.error("Failed to connect to server. Check backend URL.");
      setLoading(false);
    });
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
    socket.on("room:full", ({ message }) => {
      toast.error(message);
      setConnectionStatus("error");
      setLoading(false);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("user:joined");
      socket.off("incoming:call");
      socket.off("call:accepted");
      socket.off("peer:nego:needed");
      socket.off("peer:nego:final");
      socket.off("ice:candidate");
      socket.off("user:left");
      socket.off("room:full");
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleAcceptCall,
    handleNegoNeededIncoming,
    handleNegoFinal,
    remoteSocketId,
  ]);

  useEffect(() => {
    if (remoteSocketId && myStream && isInitiatorRef.current) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          initiateCall();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [remoteSocketId, myStream, initiateCall]);

  useEffect(() => {
    if (remoteSocketId && connectionStatus === "disconnected") {
      const timer = setTimeout(() => {
        if (isMountedRef.current && connectionStatus === "disconnected") {
          setShowStartCallButton(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [remoteSocketId, connectionStatus]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPageUrl).then(() => {
      toast.success("📋 Invite link copied!", { autoClose: 1500 });
    }).catch((error) => {
      console.error("❌ Failed to copy link:", error);
      toast.error("Failed to copy link");
    });
  };

  useEffect(() => {
    return () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
        console.log("🛑 Stopped local stream tracks");
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
        console.log("🛑 Stopped remote stream tracks");
      }
      peer.resetConnection();
      if (socket && remoteSocketId) {
        socket.emit("room:leave");
      }
      if (connectionCheckInterval.current) {
        clearInterval(connectionCheckInterval.current);
      }
    };
  }, [myStream, remoteStream, socket, remoteSocketId]);

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
              onClick={handleCopy}
              className="ml-2 text-green-500 hover:text-purple-800 transition-colors"
              aria-label="Copy link"
            >
              <Copy />
            </button>
          </div>

          <div className="mb-4">
            <div
              className={`px-4 py-1 rounded-full inline-flex items-center ${
                connectionStatus === "connected"
                  ? "bg-green-500 text-white"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500 text-white"
                  : connectionStatus === "error"
                  ? "bg-red-600 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === "connected"
                    ? "animate-pulse"
                    : connectionStatus === "connecting"
                    ? "animate-spin"
                    : ""
                }`}
              ></div>
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
            {showStartCallButton && (
              <button
                onClick={initiateCall}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm flex items-center mx-auto"
              >
                <Video className="w-4 h-4 mr-1" />
                Start Call
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

          <main className={`flex items-center justify-center ${direction === "column" ? "flex-col" : "flex-row"} gap-4`}>
            {myStream ? (
              <div className="relative rounded-xl overflow-hidden shadow-lg border-2">
                <video
                  width={roomWidth}
                  height={roomHeight}
                  autoPlay
                  playsInline
                  muted
                  ref={myVideoRef}
                  onError={(e) => console.error("❌ Local video error:", e)}
                  style={{ backgroundColor: "#000" }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white bg-opacity-100 py-1 px-3 text-sm font-semibold flex justify-between items-center">
                  <span>You</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleToggleAudio}
                      className={`p-1 rounded-full ${isAudioMuted ? "bg-red-500" : "bg-green-500"} text-white hover:bg-opacity-80 transition-colors`}
                      aria-label={isAudioMuted ? "Unmute microphone" : "Mute microphone"}
                    >
                      {isAudioMuted ? <MicOff size={20} /> : <Mic size={20}/>}
                    </button>
                    <button
                      onClick={handleToggleVideo}
                      className={`p-1 rounded-full ${isVideoOff ? "bg-red-500" : "bg-green-500"} text-white hover:bg-opacity-80 transition-colors`}
                      aria-label={isVideoOff ? "Turn video on" : "Turn video off"}
                    >
                      {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-6"
                style={{ width: roomWidth, height: roomHeight }}
              >
                <p className="text-gray-600 font-medium">No local video (check permissions)</p>
              </div>
            )}

            {remoteStream ? (
              <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-purple-200">
                <video
                  width={roomWidth}
                  height={roomHeight}
                  autoPlay
                  playsInline
                  muted={false}
                  ref={remoteVideoRef}
                  onError={(e) => console.error("❌ Remote video error:", e)}
                  style={{ backgroundColor: "#000" }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-purple-600 bg-opacity-100 text-white py-1 px-3 text-sm font-semibold">
                  {otherUsername || "Participant"}
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

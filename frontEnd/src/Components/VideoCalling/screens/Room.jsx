import React, { useState, useCallback, useEffect, useRef, Fragment } from "react";
import { useSocket } from "../context/SocketProvider";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Loader, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import peer from "../service/peer";

const Room = ({ windowWidth = 1200, roomHeight, direction }) => {
  const socket = useSocket();
  const location = useLocation();
  const currentPageUrl = `https://prep-mate-one.vercel.app${location.pathname}`;

  // States
  const [remoteSocketId, setRemoteSocketId] = useState("");
  const [myStream, setMyStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(false);
  const [otherUsername, setOtherUsername] = useState("");
  const [mySocketId, setMySocketId] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const tracksAddedRef = useRef(false);

  // Redux user info with fallback
  const userInfo = useSelector((state) => state.userInfo || {});
  const userDetails = userInfo.userDetails || {};

  // Show toast to copy URL
  useEffect(() => {
    toast.info("Copy the URL and send to a friend", { autoClose: 1500 });
  }, []);

  // Initialize local stream
  useEffect(() => {
    const initializeStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setMyStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        if (error.name === "NotAllowedError") {
          toast.error("Camera/Mic Permission Denied.", { autoClose: 1500 });
        } else if (error.name === "NotFoundError") {
          toast.error("No Camera/Mic Found.", { autoClose: 1500 });
        }
      }
    };
    initializeStream();
    return () => {
      if (myStream) {
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Join room
  useEffect(() => {
    const room = location.pathname.split("/")[2];
    if (userDetails.email) {
      setLoading(true);
      socket.emit("room:join", { email: userDetails.email, room });
      toast.success("Joining room...", { autoClose: 1500 });
    } else {
      toast.error("User details not found. Please log in.", { autoClose: 1500 });
      setLoading(false);
    }
  }, [userDetails.email, socket, location]);

  // Auto-connect WebRTC on user join
  const handleUserJoined = useCallback(
    (data) => {
      const { email, room, socketID } = data;
      setRemoteSocketId(socketID);
      setOtherUserId(socketID);
      setMySocketId(socket.id);
      setOtherUsername(userDetails.name || "Participant");

      // Automatically initiate WebRTC connection
      if (myStream && socket.id < socketID) {
        const initiateCall = async () => {
          const offer = await peer.getOffer();
          socket.emit("user:call", {
            sendername: userDetails.name,
            to: socketID,
            offer,
          });
          sendStreams();
        };
        initiateCall();
      }
    },
    [myStream, socket, userDetails]
  );

  // WebRTC event handlers
  const handleIncomingCall = useCallback(
    async ({ sendername, from, offer }) => {
      if (!myStream) {
        toast.error("Local stream not available", { autoClose: 1500 });
        return;
      }
      setOtherUsername(sendername);
      setIncomingCall(true);
      setRemoteSocketId(from);
      setOtherUserId(from);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
      sendStreams();
    },
    [socket, myStream]
  );

  const sendStreams = useCallback(() => {
    if (!myStream || !myStream.getTracks() || tracksAddedRef.current) return;
    for (const track of myStream.getTracks()) {
      peer.webRTCPeer.addTrack(track, myStream);
    }
    tracksAddedRef.current = true;
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setRemoteDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [socket, remoteSocketId]);

  const handleNegoNeededIncoming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await peer.setRemoteDescription(ans);
  }, []);

  useEffect(() => {
    peer.webRTCPeer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.webRTCPeer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  useEffect(() => {
    const handleTrack = (e) => {
      const remoteStreams = e.streams;
      if (remoteStreams) {
        setRemoteStream(remoteStreams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreams[0];
        }
      }
    };
    peer.webRTCPeer.addEventListener("track", handleTrack);
    return () => {
      peer.webRTCPeer.removeEventListener("track", handleTrack);
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeededIncoming);
    socket.on("peer:nego:final", handleNegoFinal);
    socket.on("user:left", () => {
      toast.success("User Left.", { autoClose: 1500 });
      setRemoteStream(null);
      setRemoteSocketId("");
      setOtherUserId("");
      peer.webRTCPeer.close();
      tracksAddedRef.current = false;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    return () => {
      socket.off("user:joined");
      socket.off("incoming:call");
      socket.off("call:accepted");
      socket.off("peer:nego:needed");
      socket.off("peer:nego:final");
      socket.off("user:left");
    };
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleNegoNeededIncoming,
    handleNegoFinal,
  ]);

  // Copy link
  const handleCopy = (textToCopy) => {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        toast.success("Invite link copied to clipboard!", { autoClose: 1500 });
      })
      .catch((error) => {
        console.error("Failed to copy text:", error);
        toast.error("Failed to copy text.", { autoClose: 1500 });
      });
  };

  // Toggle audio
  const toggleAudio = () => {
    if (myStream) {
      const audioTrack = myStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        toast.success(
          audioTrack.enabled ? "Microphone Unmuted." : "Microphone Muted.",
          { autoClose: 1500 }
        );
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (myStream) {
      const videoTrack = myStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        toast.success(videoTrack.enabled ? "Camera On." : "Camera Off.", {
          autoClose: 1500,
        });
      }
    }
  };

  return (
    <section
      className="-z-20 min-h-dvh bg-gray-50"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20' fill='none' stroke-width='2' stroke='%23E0E0E0'%3e%3cpath d='M0 .5H19.5V20'/%3e%3c/svg%3e")`,
      }}
    >
      <ToastContainer />
      {/* Share link */}
      <div className="fixed top-2 right-2 z-10 inline-flex w-fit items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5">
        <span className="text-xs font-medium text-gray-700">Share this link:</span>
        <div className="flex items-center bg-white px-2 py-1 rounded border border-purple-200">
          <span className="text-xs text-gray-600 truncate max-w-[150px]">
            {currentPageUrl}
          </span>
          <button
            onClick={() => handleCopy(currentPageUrl)}
            className="ml-2 text-purple-600 hover:text-purple-800 transition-colors"
            aria-label="Copy link"
          >
            <i className="fa-regular fa-copy"></i>
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {loading ? (
          <div className={`grid gap-4 md:gap-6 ${direction === "column" ? "flex flex-col" : "lg:grid-cols-2"} xl:gap-8`}>
            {/* Local Video */}
            <div
              className="relative flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 object-contain shadow-xl md:shadow-2xl"
              style={{ width: windowWidth / 2 - 50, height: roomHeight - 110 }}
            >
              {myStream ? (
                <Fragment>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full rotate-y-180 object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white py-1 px-3 text-sm font-semibold">
                    You
                  </div>
                  <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
                    <button
                      onClick={toggleAudio}
                      className={`rounded-full p-2 ${audioEnabled ? "bg-green-500" : "bg-red-500"} cursor-pointer text-white`}
                    >
                      {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                    </button>
                    <button
                      onClick={toggleVideo}
                      className={`rounded-full p-2 ${videoEnabled ? "bg-green-500" : "bg-red-500"} cursor-pointer text-white`}
                    >
                      {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                    </button>
                  </div>
                </Fragment>
              ) : (
                <div className="flex flex-col items-center gap-4 p-5">
                  <Loader className="size-12 animate-spin [animation-duration:2s] md:size-20" />
                  <p className="text-center text-lg md:text-2xl">Loading your video...</p>
                </div>
              )}
            </div>

            {/* Remote Video */}
            <div
              className="flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 object-contain shadow-xl md:shadow-2xl"
              style={{ width: windowWidth / 2 - 50, height: roomHeight - 110 }}
            >
              {remoteSocketId && remoteStream ? (
                <Fragment>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-purple-500 text-white py-1 px-3 text-sm font-semibold">
                    {otherUsername || "Participant"}
                  </div>
                </Fragment>
              ) : (
                <div className="flex flex-col items-center gap-4 p-5">
                  <Loader className="size-12 animate-spin [animation-duration:2s] md:size-20" />
                  <p className="text-center text-lg md:text-2xl">Waiting for another user...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center">
              <Loader className="size-12 animate-spin [animation-duration:2s] md:size-20" />
              <p className="mt-4 text-gray-600 font-medium">Loading video call...</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Room;
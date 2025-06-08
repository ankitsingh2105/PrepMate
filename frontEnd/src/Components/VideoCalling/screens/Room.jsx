import { useState, useCallback, useEffect, useRef, Fragment } from "react";
import { useSocket } from "../context/SocketProvider";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Loader } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import peer from "../service/peer";

const Room = ({ windowWidth = 1200, roomHeight = 500, direction }) => {
  const socket = useSocket();
  const location = useLocation();
  const currentPageUrl = `https://prep-mate-one.vercel.app${location.pathname}`;

  // States
  const [remoteSocketId, setRemoteSocketId] = useState("");
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [otherUsername, setOtherUsername] = useState("");
  const [streamError, setStreamError] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const tracksAddedRef = useRef(false);

  // Redux user info with fallback
  const userInfo = useSelector((state) => state.userInfo || {});
  const userDetails = userInfo.userDetails || {};

  // Initialize stream and join room on mount
  useEffect(() => {
    if (!userDetails.email) {
      console.error("No user email found in userDetails:", userDetails);
      toast.error("Please log in to join the call.", { autoClose: 1500 });
      return;
    }

    const room = location.pathname.split("/")[2];

    const initializeStream = async () => {
      if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        console.error("WebRTC requires HTTPS. Current protocol:", window.location.protocol);
        toast.error("Video calls require HTTPS.", { autoClose: 3000 });
        setStreamError("HTTPS required");
        return;
      }

      try {
        console.log("WebRTC: Requesting media devices...");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        console.log("WebRTC: Stream acquired:", stream.getTracks());
        setMyStream(stream);
        setStreamError(null);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        } else {
          console.warn("WebRTC: localVideoRef not set yet");
        }

        // Join room after stream is ready
        socket.emit("room:join", { email: userDetails.email, room });
        toast.info("Copy the URL and send to a friend", { autoClose: 1500 });
      } catch (error) {
        console.error("WebRTC: Error accessing media devices:", error);
        setStreamError(error.name || "Unknown error");
        switch (error.name) {
          case "NotAllowedError":
            toast.error("Camera/Mic Permission Denied. Please allow access.", { autoClose: 3000 });
            break;
          case "NotFoundError":
            toast.error("No Camera/Mic Found. Please connect a device.", { autoClose: 3000 });
            break;
          case "NotReadableError":
            toast.error("Camera/Mic in use by another application.", { autoClose: 3000 });
            break;
          default:
            toast.error(`Failed to access media: ${error.message}`, { autoClose: 3000 });
        }
      }
    };

    initializeStream();

    return () => {
      if (myStream) {
        console.log("WebRTC: Cleaning up stream tracks");
        myStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [userDetails.email, socket, location]);

  // Handle user joined
  const handleUserJoined = useCallback(
    (data) => {
      console.log("WebRTC: User joined:", data);
      const { email, socketID } = data;
      setRemoteSocketId(socketID);
      setOtherUsername(userDetails.name || "Participant");

      // Automatically initiate WebRTC connection if this client has a lower socket ID
      if (myStream && socket.id < socketID) {
        const initiateCall = async () => {
          console.log("WebRTC: Initiating call to", socketID);
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
        console.warn("WebRTC: No local stream for incoming call");
        toast.error("Local stream not available", { autoClose: 1500 });
        return;
      }
      console.log("WebRTC: Incoming call from", sendername, from);
      setOtherUsername(sendername);
      setRemoteSocketId(from);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
      sendStreams();
    },
    [socket, myStream]
  );

  const sendStreams = useCallback(() => {
    if (!myStream || !myStream.getTracks() || tracksAddedRef.current) return;
    console.log("WebRTC: Sending streams:", myStream.getTracks());
    for (const track of myStream.getTracks()) {
      peer.webRTCPeer.addTrack(track, myStream);
    }
    tracksAddedRef.current = true;
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      console.log("WebRTC: Call accepted from", from);
      peer.setRemoteDescription(ans);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    console.log("WebRTC: Negotiation needed");
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [socket, remoteSocketId]);

  const handleNegoNeededIncoming = useCallback(
    async ({ from, offer }) => {
      console.log("WebRTC: Incoming negotiation from", from);
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoFinal = useCallback(async ({ ans }) => {
    console.log("WebRTC: Finalizing negotiation");
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
      console.log("WebRTC: Received remote streams:", remoteStreams);
      if (remoteStreams && remoteStreams[0]) {
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
      console.log("WebRTC: User left");
      toast.success("User Left.", { autoClose: 1500 });
      setRemoteStream(null);
      setRemoteSocketId("");
      setOtherUsername("");
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-0">
        <div
          className={`grid gap-4 md:gap-6 ${
            direction === "column" ? "flex flex-col" : "lg:grid-cols-2"
          } xl:gap-8`}
        >
          {/* Local Video */}
          <div
            className="relative flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 object-contain shadow-xl md:shadow-2xl"
            style={{ width: windowWidth / 2 - 4, height: roomHeight - 2 }}
          >
            {myStream ? (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full rotate-y-180 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white py-1 px-3 text-sm font-semibold">
                  You
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 p-5">
                <Loader className="size-12 animate-spin [animation-duration:2s] md:size-20" />
                <p className="text-center text-lg md:text-2xl">
                  {streamError ? `Stream unavailable: ${streamError}` : "Loading your video..."}
                </p>
              </div>
            )}
          </div>

          {/* Remote Video */}
          <div
            className="flex items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-100 object-contain shadow-xl md:shadow-2xl"
            style={{ width: windowWidth / 2 - 4, height: roomHeight - 2 }}
          >
            {remoteSocketId && remoteStream ? (
              <>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-purple-500 text-white py-1 px-3 text-sm font-semibold">
                  {otherUsername || "Participant"}
                </div>
              </>
            )
            : (
              <div className="flex flex-col items-center gap-4 p-5">
                <Loader className="size-12 animate-spin [animation-duration:2s] md:size-20" />
                <p className="text-center text-lg md:text-2xl">Waiting for another user...</p>
              </div>
            )
          }
          </div>
        </div>
      </div>
    </section>
  );
};

export default Room;
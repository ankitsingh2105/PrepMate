import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import PeerService from "../service/peer";
import { useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
const isLoggedIn = sessionStorage.getItem("isLoggedIn");
const Room = ({}) => {
  const myVideoRef = useRef();
  const otherVideoRef = useRef();
  const socket = useSocket();
  const [joined, setJoined] = useState(false);
  const userInfo = useSelector((state) => state.userInfo);
  const { userDetails } = userInfo;
  const { name, email } = userDetails || {};
  const { room } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const roomWidth = parseInt(queryParams.get("roomWidth"));
  const roomHeight = parseInt(queryParams.get("roomHeight"));
  const direction = queryParams.get("direction");

  console.log(room, roomWidth, roomHeight, direction);

  useEffect(() => {
    const init = async () => {
      if (!socket || !isLoggedIn) {
        console.error("Socket not initialized");
        return;
      }

      if (!email || !name || !room) {
        console.error("Missing user data or room:", { email, name, room });
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("Local stream obtained:", stream);
        myVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("getUserMedia error:", err);
        alert("Failed to access camera/microphone. Please allow permissions.");
        return;
      }

      socket.emit("room:join", { email, room, name });
      console.log("Emitted room:join", { email, room, name });

      socket.on("room:joined", ({ users }) => {
        console.log("Room joined, users:", users);
        setJoined(true);
        if (users.length === 2) {
          const remoteID = users.find((id) => id !== socket.id);
          console.log("Initiating call with:", remoteID);
          createPeerConnection(stream, true, remoteID);
        }
      });

      socket.on("user:joined", ({ socketID }) => {
        console.log("New user joined:", socketID);
        createPeerConnection(stream, false, socketID);
      });

      socket.on("incoming:call", async ({ from, offer }) => {
        console.log("Incoming call from:", from, offer);
        try {
          await PeerService.setRemoteDesc(offer);
          const answer = await PeerService.getAnswer(offer);
          socket.emit("call:accepted", { to: from, answer });
        } catch (err) {
          console.error("Error handling incoming call:", err);
        }
      });

      socket.on("call:accepted", async ({ answer }) => {
        console.log("Call accepted, answer:", answer);
        try {
          await PeerService.setRemoteDesc(answer);
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      });

      socket.on("ice:candidate", async ({ candidate }) => {
        console.log("Received ICE candidate:", candidate);
        try {
          await PeerService.addIceCandidate(candidate);
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      });

      return () => {
        console.log("Cleaning up...");
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        PeerService.close();
        socket?.off();
      };
    };

    init().catch((err) => console.error("Init error:", err));
  }, [socket, email, name, room]);

  const createPeerConnection = (stream, isCaller, remoteID) => {
    if (!isLoggedIn) return;
    const pc = PeerService.createPeerConnection();
    try {
      stream.getTracks().forEach((track) => {
        console.log("Adding track:", track);
        pc.addTrack(track, stream);
      });
    } catch (err) {
      console.error("Error adding tracks:", err);
      return;
    }

    pc.ontrack = (event) => {
      otherVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteID) {
        console.log("Sending ICE candidate:", event.candidate);
        socket.emit("ice:candidate", {
          to: remoteID,
          candidate: event.candidate,
        });
      }
    };

    if (isCaller) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await PeerService.getOffer();
          console.log("Sending offer:", offer);
          socket.emit("user:call", { to: remoteID, offer });
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      };
    }
  };

  return (
    <>
      {isLoggedIn === "true" ? (
        <center>
          <ToastContainer />
          <center className="text-lg">
            {joined ? (
              <b className="text-green-500">Live Now</b>
            ) : (
              <b className="text-red-500">Connecting...</b>
            )}
          </center>
          <small className="flex items-center justify-center font-bold space-x-2 mt-3 ">
            <section className="p-3 bg-gray-200 rounded-md">
              Share this url to other user
            </section>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied", {
                  autoClose: 1000,
                  position: "bottom-right",
                });
              }}
            >
              COPY
            </button>
          </small>

          <div
            className={`flex ${
              direction === "row" ? "flex-row" : "flex-col"
            } items-center justify-center m-3 ${
              direction === "row" ? "space-x-4" : "space-y-4"
            }`}
          >
            {/* My video */}
            <section className={`flex ${direction === "row" ? "mr-12" : ""}`}>
              <video
                ref={myVideoRef}
                autoPlay
                playsInline
                style={{ height: roomHeight, width: roomWidth }}
                className="rounded-md bg-black"
              />
            </section>

            {/* Other user video or waiting message */}
            <section>
              {otherVideoRef ? (
                <video
                  ref={otherVideoRef}
                  autoPlay
                  playsInline
                  style={{ height: roomHeight, width: roomWidth }}
                  className="rounded-md bg-black"
                />
              ) : (
                <div
                  style={{ width: roomWidth, height: roomHeight }}
                  className="font-bold bg-blue-200 text-yellow-500 flex items-center justify-center rounded-md"
                >
                  Waiting for other user.....
                </div>
              )}
            </section>
          </div>
        </center>
      ) : (
        <center>
          <br />
          <b>Please login to use this service</b>
        </center>
      )}
    </>
  );
};

export default Room;

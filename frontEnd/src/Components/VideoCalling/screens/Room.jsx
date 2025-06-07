import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketProvider';
import ReactPlayer from "react-player";
import peer from '../service/peer';
import { useLocation } from 'react-router-dom';
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Room({ windowWidth, roomWidth, roomHeight, direction }) {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState("");
  const [myStream, setMyStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [inComingCall, setInComingCall] = useState(false);
  const [otherUsername, setOtherUsername] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const mixedStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const tracksAddedRef = useRef(false);

  const location = useLocation();
  console.log("path is :: ", location);
  const currentPageUrl = `https://prep-mate-one.vercel.app${location.pathname}`;
  useEffect(() => {
    toast("Copy the url and send to a friend", { autoClose: 1500 });
  }, []);

  const userInfo = useSelector((state) => state.userInfo);
  const { userDetails } = userInfo;
  const url = useLocation();
  const handleSubmit = useCallback(() => {
    const room = url.pathname.split("/")[2];
    if (userDetails && userDetails.email) {
      const email = userDetails.email;
      setLoading(true);
      socket.emit("room:join", { email, room });
    }
  }, [userDetails, socket]);

  useEffect(() => {
    if (userDetails && userDetails.email) {
      handleSubmit();
    }
  }, [userDetails, handleSubmit]);

  useEffect(() => {
    const initializeStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        setMyStream(stream);
        console.log("Initialized myStream with tracks:", stream.getTracks());
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Failed to access media devices", { autoClose: 1500 });
      }
    };

    initializeStream();

    return () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleUserJoined = useCallback((data) => {
    const { email, room, socketID } = data;
    console.log("New user joined with remote id:", data);
    setRemoteSocketId(socketID);
  }, []);

  const handleCall = useCallback(async () => {
    if (!myStream) {
      toast.error("Local stream not available", { autoClose: 1500 });
      return;
    }
    console.log("Calling ...");
    const offer = await peer.getOffer();
    const name = userDetails.name;
    socket.emit("user:call", { sendername: name, to: remoteSocketId, offer });
  }, [remoteSocketId, socket, userDetails, myStream]);

  const handleIncomingCall = useCallback(async ({ sendername, from, offer }) => {
    if (!myStream) {
      toast.error("Local stream not available", { autoClose: 1500 });
      return;
    }
    setOtherUsername(sendername);
    console.log("Incoming call from", sendername, from);
    setInComingCall(true);
    setRemoteSocketId(from);
    const ans = await peer.getAnswer(offer);
    socket.emit("call:accepted", { to: from, ans });
  }, [socket, myStream]);

  const sendStreams = useCallback(() => {
    if (!myStream || !myStream.getTracks() || tracksAddedRef.current) return;
    console.log("Adding tracks from myStream:", myStream.getTracks());
    for (const track of myStream.getTracks()) {
      peer.webRTCPeer.addTrack(track, myStream);
    }
    tracksAddedRef.current = true;
  }, [myStream]);

  const handleAcceptCall = useCallback(({ from, ans }) => {
    peer.setRemoteDescription(ans);
    console.log("Call accepted from", from);
    sendStreams();
  }, [sendStreams]);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [socket, remoteSocketId]);

  const handleNegoNeededIncoming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket]);

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
    peer.webRTCPeer.addEventListener("track", async (e) => {
      const remoteStreams = e.streams;
      console.log("Received remote streams:", remoteStreams);
      if (remoteStreams) {
        setRemoteStream(remoteStreams[0]);
      }
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleAcceptCall);
    socket.on("peer:nego:needed", handleNegoNeededIncoming);
    socket.on("peer:nego:final", handleNegoFinal);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleAcceptCall);
      socket.off("peer:nego:needed", handleNegoNeededIncoming);
      socket.off("peer:nego:final", handleNegoFinal);
    };
  }, [socket, handleUserJoined, handleIncomingCall, handleAcceptCall, handleNegoNeededIncoming, handleNegoFinal]);

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

  const placeCall = useCallback(() => {
    toast.success("Calling the other user", { autoClose: 5000 });
    handleCall();
    sendStreams();
  }, [handleCall, sendStreams]);

  const startRecording = useCallback(() => {
    if (!myStream || !remoteStream) {
      toast.error("Both streams are required to start recording", { autoClose: 1500 });
      return;
    }

    try {
      // Initialize AudioContext
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const mixedStream = new MediaStream();

      // Add local audio track
      const localAudioTracks = myStream.getAudioTracks();
      if (localAudioTracks.length > 0) {
        const localSource = audioContextRef.current.createMediaStreamSource(myStream);
        const localDest = audioContextRef.current.createMediaStreamDestination();
        localSource.connect(localDest);
        const localTrack = localDest.stream.getAudioTracks()[0];
        if (localTrack) {
          mixedStream.addTrack(localTrack);
          console.log("Added local audio track:", localTrack);
        }
      } else {
        console.warn("No audio tracks in myStream");
        toast.warn("No local audio available", { autoClose: 1500 });
      }

      // Add remote audio track
      const remoteAudioTracks = remoteStream.getAudioTracks();
      if (remoteAudioTracks.length > 0) {
        const remoteSource = audioContextRef.current.createMediaStreamSource(remoteStream);
        const remoteDest = audioContextRef.current.createMediaStreamDestination();
        remoteSource.connect(remoteDest);
        const remoteTrack = remoteDest.stream.getAudioTracks()[0];
        if (remoteTrack) {
          mixedStream.addTrack(remoteTrack);
          console.log("Added remote audio track:", remoteTrack);
        }
      } else {
        console.warn("No audio tracks in remoteStream");
        toast.warn("No remote audio available", { autoClose: 1500 });
      }

      // Verify mixed stream
      const mixedTracks = mixedStream.getTracks();
      console.log("Mixed stream tracks:", mixedTracks);
      if (mixedTracks.length === 0) {
        throw new Error("No audio tracks in mixed stream");
      }

      // Start MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(mixedStream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("MediaRecorder data available, size:", event.data.size);
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        } else {
          console.warn("Received empty data chunk");
        }
      };
      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        toast.error("Recording error: " + event.error, { autoClose: 1500 });
      };
      mediaRecorderRef.current.start(1000); // Capture data every 1s
      mixedStreamRef.current = mixedStream;
      console.log("MediaRecorder started");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording: " + error.message, { autoClose: 1500 });
      return;
    }

    // Start speech recognition for local audio
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        setTranscript((prev) => prev + finalTranscript);
        console.log("Transcription update:", finalTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error(`Speech recognition error: ${event.error}`, { autoClose: 1500 });
      };

      recognitionRef.current.onend = () => {
        if (isRecording) {
          try {
            recognitionRef.current.start();
            console.log("Speech recognition restarted");
          } catch (error) {
            console.error("Error restarting speech recognition:", error);
          }
        }
      };

      try {
        recognitionRef.current.start();
        console.log("Speech recognition started");
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        toast.error("Speech recognition failed: " + error.message, { autoClose: 1500 });
      }
    } else {
      console.warn("Speech recognition not supported");
      toast.warn("Speech recognition not supported in this browser", { autoClose: 1500 });
    }

    setIsRecording(true);
    toast.success("Recording started", { autoClose: 1500 });
  }, [myStream, remoteStream]);



  return (
    <div className="w-full text-center">
      <ToastContainer />
      {loading ? (
        <div className="flex flex-col items-center">
          {/* Share link section */}
          <div className="bg-purple-50 text-gray-700 py-2 px-4 rounded-lg shadow-sm mb-4 flex items-center justify-center space-x-2 w-auto max-w-md mx-auto">
            <span className="text-sm font-medium">Share this link:</span>
            <div className="flex items-center bg-white px-3 py-1 rounded border border-purple-200">
              <span className="text-xs text-gray-600 truncate max-w-[200px]">
                http://prep-mate-one.vercel.app{location.pathname}
              </span>
              {/* https://prep-mate-one.vercel.app/dsaMock/room/Rn0eIrr3US */}
              <button
                onClick={() => handleCopy(currentPageUrl)}
                className="ml-2 text-purple-600 hover:text-purple-800 transition-colors"
                aria-label="Copy link"
              >
                <i className="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>

          {/* Connection status */}
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

          {/* Call controls */}
          {(!otherUsername || remoteSocketId) && (
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={placeCall}
                className="bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 rounded-full p-3 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
              >
                <i className="fa-solid fa-phone text-xl"></i>
              </button>
            </div>
          )}

          {/* Video streams */}
          <main className={`flex items-center justify-center ${direction === 'column' ? 'flex-col' : 'flex-row'} gap-4`}>
            {/* My video stream */}
            {myStream && (
              <div className="relative rounded-xl overflow-hidden shadow-lg border-2">
                <ReactPlayer
                  width={roomWidth}
                  height={roomHeight}
                  url={myStream}
                  playing
                  muted
                />
                <div className="absolute bottom-0 left-0 right-0 bg-red text-red py-1 px-3 text-sm font-semibold">
                  You
                </div>
              </div>
            )}

            {/* Remote video stream */}
            <div className="relative">
              {inComingCall && remoteStream ? (
                <div className="rounded-xl overflow-hidden shadow-lg border-2 border-purple-200">
                  <ReactPlayer
                    width={roomWidth}
                    height={roomHeight}
                    url={remoteStream}
                    playing
                  />
                  <div className="absolute bottom-0 left-0 right-0 text-black py-1 px-3 text-sm font-semibold">
                    {otherUsername || 'Participant'}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 p-6"
                  style={{
                    width: roomWidth - 50,
                    height: roomHeight - 110,
                  }}
                >
                  <div className="text-center">
                    <div className="text-gray-500 mb-2">
                      <i className="fa-solid fa-user-plus text-4xl"></i>
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
import React, { useState, useCallback, useEffect } from 'react';
import SocketProvider, { useSocket } from '../context/SocketProvider';
import ReactPlayer from "react-player";
import peer from '../service/peer';
import { useLocation } from 'react-router-dom';
import { useSelector } from "react-redux";
import "./Room.css"

export default function Room({ roomWidth, roomHeight }) {
  const socket = useSocket();
  const [remoteSocketId, setremoteSocketId] = useState("")
  const [myStream, setmyStream] = useState(null);
  const [loading, setLoding] = useState(false);
  const [remoteStream, setremoteStream] = useState(null);
  const [inComingCall, setInComingCall] = useState(false);
  const [otherUsername, setOtherUserName] = useState("");

  const userInfo = useSelector((state) => state.userInfo);
  const { userDetails } = userInfo;
  const url = useLocation();
  const handleSubmit = useCallback(() => {
    const room = url.pathname.split("/")[2];
    if (userDetails && userDetails.email) {
      const email = userDetails.email;
      setLoding(true);
      socket.emit("room:join", { email, room });
    }
  }, [userDetails, socket]);

  useEffect(() => {
    if (userDetails && userDetails.email) {
      handleSubmit();
    }
  }, [userDetails, handleSubmit]);


  useEffect(() => {
    // Define an asynchronous function to initialize the media stream
    const initializeStream = async () => {
      try {
        // Request access to audio and video devices from the user
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        // If access is granted, save the stream to state using setmyStream
        setmyStream(stream);
      }
      catch (error) {
        // Log an error if there was an issue accessing the media devices
        console.error("Error accessing media devices.", error);
      }
    };

    // Call the function to initialize the stream when the component mounts
    initializeStream();

    // Cleanup function to stop all media tracks when the component unmounts
    return () => {
      if (myStream) {
        // Stop each track (audio/video) in the stream to free up resources
        // The stop() method releases the audio and video tracks, freeing up resources. This is important because it ensures that the browser is no longer using the camera and microphone after the component is unmounted. Without stopping the tracks, the media devices would keep running in the background, which can cause resource leaks.
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array means this effect runs only once, when the component mounts


  // TODO : useCallback is a React hook that memoizes a function. This means it saves the function so that React doesn’t create a new version of it on every render.

  const handleUserJoined = useCallback((data) => {
    const { email, room, socketID } = data;
    console.log("New user joined with remote id::", data);
    setremoteSocketId(socketID);
  }, []);


  // todo :: calling the other user
  const handleCall = useCallback(async () => {
    console.log("Calling ...");

    // Capture local media stream (audio and video)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    // Create an SDP offer
    const offer = await peer.getOffer();

    // Emit the offer to the remote user
    // remoteSocketId - other new user in the room after i joined
    const name = userDetails.name;
    socket.emit("user:call", { sendername: name, to: remoteSocketId, offer });

    // Set the local media stream to state
    setmyStream(stream);
  }, [remoteSocketId, socket]);



  // todo : incoming calls
  const handleIncomingCall = useCallback(async ({ sendername, from, offer }) => {
    setOtherUserName(sendername);
    console.log("and the oter user is ,  ::  ", sendername);
    console.log("Incoming call from", from, offer);
    setInComingCall(true);
    // Capture local media stream (audio and video)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    // Set remote socket ID and local media stream
    setremoteSocketId(from);
    setmyStream(stream);

    // Create an SDP answer
    const ans = await peer.getAnswer(offer);

    // Emit the answer to the caller
    socket.emit("call:accepted", { to: from, ans });
  }, []);

  const sendStreams = useCallback(() => {
    // This loop iterates over all tracks in the myStream MediaStream, which can include
    // audio, video, data channels, or any other custom media tracks. Each track is added
    // to the RTCPeerConnection to be sent to the remote peer.
    console.log("my stream is :: ", myStream);
    if (!myStream || !myStream.getTracks()) return;
    for (const track of myStream.getTracks()) {
      console.log("All the tracks:", track);
      // Add each track to the RTCPeerConnection
      peer.webRTCPeer.addTrack(track, myStream);
    }

    console.log("peer is :: ", peer);
    console.log("peer.webRTCPeer is ::", peer.webRTCPeer)
  }, [myStream]);



  const handleAcceptCall = useCallback(({ from, ans }) => {
    // todo ::  I am using setRemoteDescription because I'm receiving an answer from the other peer, which represents the remote session data for my peer connection
    peer.setRemoteDescription(ans);
    console.log("Call accepted from", from);
    sendStreams();
  }, [sendStreams]);


  // todo :  In WebRTC, negotiation handles updates to the connection while it's active, like adding new streams or adjusting settings.

  //todo:: Initial Setup: You create an offer and receive an answer to start the connection.

  //todo :: Ongoing Changes: When changes are needed (e.g., adding a new stream), you need to renegotiate by creating a new offer and getting an answer again.

  // todo ::This separation ensures that both initial setup and any dynamic updates are handled properly.

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId })
  }, [socket])

  const handleNegoNeededIncoming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket])

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  })

  useEffect(() => {
    peer.webRTCPeer.addEventListener("negotiationneeded", handleNegoNeeded)
    return () => {
      peer.webRTCPeer.removeEventListener("negotiationneeded", handleNegoNeeded);
    }
  }, [])

  useEffect(() => {
    console.log(remoteStream);
    peer.webRTCPeer.addEventListener("track", async (e) => {
      const remoteStreams = e.streams;
      console.log("remote streams :: ", remoteStreams);
      if (!remoteStreams) return;
      setremoteStream(remoteStreams[0])
    })
  }, [])

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incoming:call", handleIncomingCall);
    socket.on("call:accepted", handleAcceptCall);
    socket.on("peer:nego:needed", handleNegoNeededIncoming);
    socket.on("peer:nego:final", handleNegoFinal)

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleAcceptCall);
      socket.off("peer:nego:needed", handleNegoNeededIncoming);
      socket.off("peer:nego:final", handleNegoFinal)
    };
  }, [socket, handleUserJoined, handleIncomingCall]);

  return (
    <center>
      {
        loading ?
          <>
            <h3 className='isConnected' >{otherUsername && remoteSocketId.length != 0 ?
            <>
              <h1 style={{backgroundColor : "rgb(76, 255, 76"}}>Connected</h1>
            </>  
            :
            <>
              <h1 style={{backgroundColor : "red", color:"white"}}>Disconnected</h1>
            </>
          }</h3>
            {
              otherUsername && remoteSocketId.length === 0 ? (
                <></>
              ) : (
                <center>
                  <button onClick={() => {
                    handleCall();
                    sendStreams();
                  }}>
                    <i style={{color : "#6b46c1"}} class="fa-solid fa-phone"></i>
                    <br />
                    <b style={{color : "#6b46c1"}} >Call</b>
                  </button>
                </center>
              )
            }

            {
              myStream ?
                <>
                  <ReactPlayer width={roomWidth} height={roomHeight} playing={true} url={myStream} />

                  <div style={{ marginTop: "-27px", fontWeight: "bolder" }} >You</div>
                </>
                :
                <>
                </>
            }
            {
              inComingCall && remoteStream ?
                <>
                  <ReactPlayer width={roomWidth} height={roomHeight} playing={true} url={remoteStream} />
                  <h1 style={{ marginTop: "-27px", fontWeight: "bolder" }}>{otherUsername}</h1>
                </>
                 :
                <>
                  <div className='remoteUser' style={{ width: roomWidth, height: roomWidth, marginTop : "30px" }} >
                    Please wait for someone to enter the room
                  </div>
                </>
            }
          </>
          :
          <>
            <center>
              <div style={{ marginTop: "50px" }} className="loader"></div>
            </center>

          </>
      }
    </center>
  );
}


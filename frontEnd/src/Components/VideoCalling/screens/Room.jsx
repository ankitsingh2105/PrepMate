import React, { useEffect, useRef, useState } from "react";

const Room = ({
  displayName,
  roomWidth = 640,
  roomHeight = 360,
  direction = "row",
}) => {
  const roomId = window.location.pathname.split("/").pop();
  const containerRef = useRef(null);
  const scriptLoadedRef = useRef(false);
  const [size, setSize] = useState({ width: roomWidth, height: roomHeight });
  const [error, setError] = useState(null);

  // Handle resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      const w = Math.min(window.innerWidth - 40, roomWidth);
      const h = Math.min(window.innerHeight - 40, roomHeight);
      setSize({ width: w, height: h });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [roomWidth, roomHeight]);

  // Load Jitsi script and initialize
  useEffect(() => {
    if (!roomId) {
      setError("No room ID provided in URL. Please use /room/yourRoomId");
      console.error("Room ID is missing or empty");
      return;
    }

    // Validate roomId to ensure it's safe for Jitsi
    if (!/^[a-zA-Z0-9-_]+$/.test(roomId)) {
      setError("Invalid room ID. Use alphanumeric characters, hyphens, or underscores.");
      console.error("Invalid room ID:", roomId);
      return;
    }

    const loadJitsiScript = () => {
      if (scriptLoadedRef.current || window.JitsiMeetExternalAPI) {
        console.log("Jitsi script already loaded or API available");
        initJitsi();
        return;
      }

      // Remove any existing Jitsi script to prevent duplicates
      const existingScript = document.getElementById("jitsi-script");
      if (existingScript) {
        existingScript.remove();
        console.log("Removed existing Jitsi script to avoid conflicts");
      }

      const script = document.createElement("script");
      script.id = "jitsi-script";
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        console.log("Jitsi script loaded successfully");
        initJitsi();
      };
      script.onerror = () => {
        setError("Failed to load Jitsi script. Check network or CORS settings.");
        console.error("Jitsi script failed to load");
      };
      document.body.appendChild(script);
    };

    const initJitsi = () => {
      if (!window.JitsiMeetExternalAPI) {
        setError("JitsiMeetExternalAPI is not available. Ensure the script loaded correctly.");
        console.error("JitsiMeetExternalAPI is undefined");
        return;
      }

      if (containerRef.current) {
        try {
          const domain = "meet.jit.si";
          const options = {
            roomName: roomId,
            parentNode: containerRef.current,
            width: size.width,
            height: size.height,
            interfaceConfigOverwrite: {
              DEFAULT_REMOTE_DISPLAY_NAME: "Guest",
            },
            userInfo: {
              displayName: displayName || "Anonymous",
            },
          };

          const jitsi = new window.JitsiMeetExternalAPI(domain, options);
          console.log("Jitsi initialized successfully for room:", roomId);

          // Debug Jitsi events
          jitsi.addEventListener("videoConferenceJoined", () => {
            console.log("Joined Jitsi video conference:", roomId);
          });
          jitsi.addEventListener("videoConferenceLeft", () => {
            console.log("Left Jitsi video conference:", roomId);
          });
          jitsi.addEventListener("participantJoined", () => {
            console.log("Participant joined room:", roomId);
          });
          jitsi.addEventListener("videoAvailabilityChanged", (data) => {
            console.log("Video availability changed:", data);
          });
        } catch (err) {
          setError(`Failed to initialize Jitsi: ${err.message}`);
          console.error("Jitsi initialization error:", err);
        }
      }
    };

    loadJitsiScript();

    // Cleanup on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        console.log("Cleared Jitsi container");
      }
      const script = document.getElementById("jitsi-script");
      if (script) {
        script.remove();
        console.log("Removed Jitsi script on cleanup");
      }
    };
  }, [roomId, displayName, size]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "10px",
        width: "100%",
        height: "100%",
      }}
    >
      {error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : !roomId ? (
        <p>No room ID in URL...</p>
      ) : (
        <div
          ref={containerRef}
          style={{ width: size.width, height: size.height }}
        ></div>
      )}
    </div>
  );
};

export default Room;
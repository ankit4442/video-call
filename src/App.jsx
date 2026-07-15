// import { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";

// const socket = io("https://video-call-server-h95a.onrender.com", {
//   transports: ["websocket"],
// });

// function App() {
//   const [roomId, setRoomId] = useState("");

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const peerRef = useRef(null);
//   const localStreamRef = useRef(null);

//   const joinRoom = () => {
//     if (!roomId.trim()) {
//       alert("Enter Room ID");
//       return;
//     }

//     socket.emit("join-room", roomId);
//     console.log("Joined Room:", roomId);
//   };
//   const disconnectCall = () => {
//   if (roomId) {
//     socket.emit("leave-room", roomId);
//   }

//   peerRef.current?.close();
//   peerRef.current = null;

//   if (remoteVideoRef.current) {
//     remoteVideoRef.current.srcObject = null;
//   }

//   console.log("Disconnected");
// };

//   useEffect(() => {
//     socket.on("connect", () => {
//       console.log("Connected:", socket.id);
//     });

//     socket.on("disconnect", () => {
//       console.log("Disconnected");
//     });

//     return () => {
//       socket.off("connect");
//       socket.off("disconnect");
//     };
//   }, []);

//   useEffect(() => {
//     startCamera();
//   }, []);

//   const startCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       localStreamRef.current = stream;

//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       peerRef.current = new RTCPeerConnection({
//         iceServers: [
//           {
//             urls: "stun:stun.l.google.com:19302",
//           },
//         ],
//       });

//       const remoteStream = new MediaStream();

//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = remoteStream;
//       }

//       peerRef.current.ontrack = (event) => {
//         event.streams[0].getTracks().forEach((track) => {
//           remoteStream.addTrack(track);
//         });
//       };

//       stream.getTracks().forEach((track) => {
//         peerRef.current.addTrack(track, stream);
//       });

//       console.log("Peer Ready");
//     } catch (err) {
//       console.log(err);
//     }
//   };
//     const createOffer = async () => {
//     try {
//       const offer = await peerRef.current.createOffer();

//       await peerRef.current.setLocalDescription(offer);

//       socket.emit("offer", {
//         roomId,
//         offer,
//       });

//       console.log("Offer Sent");
//     } catch (err) {
//       console.log(err);
//     }
//   };

//  useEffect(() => {
//   socket.on("user-joined", async () => {
//     console.log("User Joined");

//     if (!peerRef.current) {
//       console.log("Peer not ready");
//       return;
//     }

//     await createOffer();
//   });

//   socket.on("offer", async ({ offer }) => {
//     try {
//       console.log("Offer Received");

//       if (!peerRef.current) {
//         console.log("Peer not ready");
//         return;
//       }

//       await peerRef.current.setRemoteDescription(
//         new RTCSessionDescription(offer)
//       );

//       const answer = await peerRef.current.createAnswer();

//       await peerRef.current.setLocalDescription(answer);

//       socket.emit("answer", {
//         roomId,
//         answer,
//       });

//       console.log("Answer Sent");
//     } catch (err) {
//       console.error("Offer Error:", err);
//     }
//   });

//   socket.on("answer", async ({ answer }) => {
//     try {
//       console.log("Answer Received");

//       if (!peerRef.current) {
//         console.log("Peer not ready");
//         return;
//       }

//       await peerRef.current.setRemoteDescription(
//         new RTCSessionDescription(answer)
//       );
//     } catch (err) {
//       console.error("Answer Error:", err);
//     }
//   });

//   return () => {
//     socket.off("user-joined");
//     socket.off("offer");
//     socket.off("answer");
//   };
// }, [roomId]);
//     useEffect(() => {
//     if (!peerRef.current) return;

//     peerRef.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("ice-candidate", {
//           roomId,
//           candidate: event.candidate,
//         });

//         console.log("ICE Candidate Sent");
//       }
//     };
//   }, [roomId]);

//   useEffect(() => {
//     socket.on("ice-candidate", async ({ candidate }) => {
//       try {
//         if (candidate && peerRef.current) {
//           await peerRef.current.addIceCandidate(
//             new RTCIceCandidate(candidate)
//           );

//           console.log("ICE Candidate Received");
//         }
//       } catch (err) {
//         console.log(err);
//       }
//     });

//     return () => {
//       socket.off("ice-candidate");
//     };
//   }, []);
//    return (
//   <div
//     style={{
//       minHeight: "100vh",
//       background: "#f5f5f5",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       padding: "20px",
//       boxSizing: "border-box",
//     }}
//   >
//     <h1 style={{ marginBottom: "20px" }}>2 Person Video Call</h1>

//     <div
//       style={{
//         display: "flex",
//         flexWrap: "wrap",
//         justifyContent: "center",
//         gap: "10px",
//         width: "100%",
//         maxWidth: "600px",
//         marginBottom: "20px",
//       }}
//     >
//       <input
//         type="text"
//         placeholder="Enter Room ID"
//         value={roomId}
//         onChange={(e) => setRoomId(e.target.value)}
//         style={{
//           flex: 1,
//           minWidth: "180px",
//           padding: "12px",
//           borderRadius: "8px",
//           border: "1px solid #ccc",
//           fontSize: "16px",
//         }}
//       />

//       <button
//         onClick={joinRoom}
//         style={{
//           padding: "12px 20px",
//           background: "#2563eb",
//           color: "#fff",
//           border: "none",
//           borderRadius: "8px",
//           cursor: "pointer",
//         }}
//       >
//         Join
//       </button>

//       <button
//         onClick={disconnectCall}
//         style={{
//           padding: "12px 20px",
//           background: "#dc2626",
//           color: "#fff",
//           border: "none",
//           borderRadius: "8px",
//           cursor: "pointer",
//         }}
//       >
//         Disconnect
//       </button>
//     </div>

//     <div
//       style={{
//         display: "flex",
//         flexWrap: "wrap",
//         justifyContent: "center",
//         gap: "20px",
//         width: "100%",
//       }}
//     >
//       <div style={{ textAlign: "center" }}>
//         <h3>Local Video</h3>

//         <video
//           ref={localVideoRef}
//           autoPlay
//           muted
//           playsInline
//           style={{
//             width: "100%",
//             maxWidth: "450px",
//             background: "#000",
//             borderRadius: "10px",
//             border: "2px solid #222",
//           }}
//         />
//       </div>

//       <div style={{ textAlign: "center" }}>
//         <h3>Remote Video</h3>

//         <video
//           ref={remoteVideoRef}
//           autoPlay
//           playsInline
//           style={{
//             width: "100%",
//             maxWidth: "450px",
//             background: "#000",
//             borderRadius: "10px",
//             border: "2px solid red",
//           }}
//         />
//       </div>
//     </div>
//   </div>
// );
// }

// export default App;


import { useEffect, useRef, useState } from "react";
import socket from "./socket";
import { createPeerConnection } from "./peer";

function App() {
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    startCamera();

    socket.on("connect", () => {
      console.log("Connected :", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerRef.current = createPeerConnection(
        stream,
        remoteVideoRef,
        socket,
        roomId
      );

      console.log("Peer Ready");
    } catch (err) {
      console.log(err);
    }
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      alert("Enter Room ID");
      return;
    }

    socket.emit("join-room", roomId);

    setConnected(true);

    console.log("Joined Room :", roomId);
  };

  const disconnectCall = () => {
    socket.emit("leave-room", roomId);

    peerRef.current?.close();

    peerRef.current = createPeerConnection(
      localStreamRef.current,
      remoteVideoRef,
      socket,
      roomId
    );

    setConnected(false);

    console.log("Disconnected");
  };
    const createOffer = async () => {
    try {
      const offer = await peerRef.current.createOffer();

      await peerRef.current.setLocalDescription(offer);

      socket.emit("offer", {
        roomId,
        offer,
      });

      console.log("Offer Sent");
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    socket.on("user-joined", async () => {
      console.log("User Joined");

      if (!peerRef.current) return;

      await createOffer();
    });

    socket.on("offer", async ({ offer }) => {
      try {
        console.log("Offer Received");

        if (!peerRef.current) return;

        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerRef.current.createAnswer();

        await peerRef.current.setLocalDescription(answer);

        socket.emit("answer", {
          roomId,
          answer,
        });

        console.log("Answer Sent");
      } catch (err) {
        console.log(err);
      }
    });

    socket.on("answer", async ({ answer }) => {
      try {
        console.log("Answer Received");

        if (!peerRef.current) return;

        await peerRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (err) {
        console.log(err);
      }
    });

    peerRef.current &&
      (peerRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
          });

          console.log("ICE Candidate Sent");
        }
      });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (candidate && peerRef.current) {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );

          console.log("ICE Candidate Added");
        }
      } catch (err) {
        console.log(err);
      }
    });

    return () => {
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, [roomId]);
    const toggleMic = () => {
    const audioTrack = localStreamRef.current
      ?.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;

    setIsMuted(!audioTrack.enabled);

    console.log(audioTrack.enabled ? "Mic ON" : "Mic OFF");
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()[0];

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;

    setCameraOn(videoTrack.enabled);

    console.log(videoTrack.enabled ? "Camera ON" : "Camera OFF");
  };

  const shareScreen = async () => {
    try {
      const screenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

      screenStreamRef.current = screenStream;

      const screenTrack =
        screenStream.getVideoTracks()[0];

      const sender = peerRef.current
        .getSenders()
        .find(
          (s) =>
            s.track &&
            s.track.kind === "video"
        );

      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          screenStream;
      }

      setScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };

      console.log("Screen Sharing Started");
    } catch (err) {
      console.log(err);
    }
  };

  const stopScreenShare = async () => {
    try {
      if (!screenStreamRef.current) return;

      screenStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      const cameraTrack =
        localStreamRef.current
          .getVideoTracks()[0];

      const sender = peerRef.current
        .getSenders()
        .find(
          (s) =>
            s.track &&
            s.track.kind === "video"
        );

      if (sender) {
        await sender.replaceTrack(cameraTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          localStreamRef.current;
      }

      screenStreamRef.current = null;

      setScreenSharing(false);

      console.log("Screen Sharing Stopped");
    } catch (err) {
      console.log(err);
    }
  };
    useEffect(() => {
    if (!peerRef.current) return;

    peerRef.current.onconnectionstatechange = () => {
      const state = peerRef.current.connectionState;

      console.log("Connection State:", state);

      if (state === "connected") {
        setConnected(true);
      }

      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        setConnected(false);
      }
    };
  }, [peerRef.current]);

  const reconnect = () => {
    if (!localStreamRef.current) return;

    try {
      peerRef.current?.close();

      peerRef.current = createPeerConnection(
        localStreamRef.current,
        remoteVideoRef,
        socket,
        roomId
      );

      socket.emit("join-room", roomId);

      console.log("Reconnected");
    } catch (err) {
      console.log(err);
    }
  };

  const leaveRoom = () => {
    try {
      if (roomId) {
        socket.emit("leave-room", roomId);
      }

      peerRef.current?.close();

      peerRef.current = createPeerConnection(
        localStreamRef.current,
        remoteVideoRef,
        socket,
        roomId
      );

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      setConnected(false);

      console.log("Room Left");
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    return () => {
      localStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      screenStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());

      peerRef.current?.close();

      socket.disconnect();
    };
  }, []);
    return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
      }}
    >
      <h1>WebRTC Video Call</h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "20px",
          width: "100%",
          maxWidth: "700px",
        }}
      >
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
          style={{
            padding: "12px",
            flex: 1,
            minWidth: "180px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />

        <button onClick={joinRoom}>
          Join
        </button>

        <button onClick={leaveRoom}>
          Leave
        </button>

        <button onClick={reconnect}>
          Reconnect
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <button onClick={toggleMic}>
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <button onClick={toggleCamera}>
          {cameraOn ? "Camera Off" : "Camera On"}
        </button>

        {!screenSharing ? (
          <button onClick={shareScreen}>
            Share Screen
          </button>
        ) : (
          <button onClick={stopScreenShare}>
            Stop Share
          </button>
        )}
      </div>

      <h3>
        Status :
        {connected ? (
          <span style={{ color: "green" }}> Connected</span>
        ) : (
          <span style={{ color: "red" }}> Disconnected</span>
        )}
      </h3>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "20px",
          width: "100%",
        }}
      >
        <div>
          <h3>Local Video</h3>

          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              maxWidth: "450px",
              background: "#000",
              borderRadius: "10px",
            }}
          />
        </div>

        <div>
          <h3>Remote Video</h3>

          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxWidth: "450px",
              background: "#000",
              borderRadius: "10px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

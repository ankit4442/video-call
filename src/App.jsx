// import { useEffect, useRef, useState } from "react";
// import socket from "./socket";
// import { createPeerConnection } from "./peer";

// function App() {
//   const [roomId, setRoomId] = useState("");
//   const [connected, setConnected] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [cameraOn, setCameraOn] = useState(true);
//   const [screenSharing, setScreenSharing] = useState(false);

//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const peerRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const screenStreamRef = useRef(null);

//   useEffect(() => {
//     startCamera();

//     socket.on("connect", () => {
//       console.log("Connected :", socket.id);
//     });

//     socket.on("disconnect", () => {
//       console.log("Disconnected");
//     });

//     return () => {
//       socket.off("connect");
//       socket.off("disconnect");
//     };
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

//       peerRef.current = createPeerConnection(
//         stream,
//         remoteVideoRef,
//         socket,
//         roomId
//       );

//       console.log("Peer Ready");
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const joinRoom = () => {
//     if (!roomId.trim()) {
//       alert("Enter Room ID");
//       return;
//     }

//     socket.emit("join-room", roomId);

//     setConnected(true);

//     console.log("Joined Room :", roomId);
//   };

//   const disconnectCall = () => {
//     socket.emit("leave-room", roomId);

//     peerRef.current?.close();

//     peerRef.current = createPeerConnection(
//       localStreamRef.current,
//       remoteVideoRef,
//       socket,
//       roomId
//     );

//     setConnected(false);

//     console.log("Disconnected");
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

//   useEffect(() => {
//     socket.on("user-joined", async () => {
//       console.log("User Joined");

//       if (!peerRef.current) return;

//       await createOffer();
//     });

//     socket.on("offer", async ({ offer }) => {
//       try {
//         console.log("Offer Received");

//         if (!peerRef.current) return;

//         await peerRef.current.setRemoteDescription(
//           new RTCSessionDescription(offer)
//         );

//         const answer = await peerRef.current.createAnswer();

//         await peerRef.current.setLocalDescription(answer);

//         socket.emit("answer", {
//           roomId,
//           answer,
//         });

//         console.log("Answer Sent");
//       } catch (err) {
//         console.log(err);
//       }
//     });

//     socket.on("answer", async ({ answer }) => {
//       try {
//         console.log("Answer Received");

//         if (!peerRef.current) return;

//         await peerRef.current.setRemoteDescription(
//           new RTCSessionDescription(answer)
//         );
//       } catch (err) {
//         console.log(err);
//       }
//     });

//     peerRef.current &&
//       (peerRef.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("ice-candidate", {
//             roomId,
//             candidate: event.candidate,
//           });

//           console.log("ICE Candidate Sent");
//         }
//       });

//     socket.on("ice-candidate", async ({ candidate }) => {
//       try {
//         if (candidate && peerRef.current) {
//           await peerRef.current.addIceCandidate(
//             new RTCIceCandidate(candidate)
//           );

//           console.log("ICE Candidate Added");
//         }
//       } catch (err) {
//         console.log(err);
//       }
//     });

//     return () => {
//       socket.off("user-joined");
//       socket.off("offer");
//       socket.off("answer");
//       socket.off("ice-candidate");
//     };
//   }, [roomId]);
//     const toggleMic = () => {
//     const audioTrack = localStreamRef.current
//       ?.getAudioTracks()[0];

//     if (!audioTrack) return;

//     audioTrack.enabled = !audioTrack.enabled;

//     setIsMuted(!audioTrack.enabled);

//     console.log(audioTrack.enabled ? "Mic ON" : "Mic OFF");
//   };

//   const toggleCamera = () => {
//     const videoTrack = localStreamRef.current
//       ?.getVideoTracks()[0];

//     if (!videoTrack) return;

//     videoTrack.enabled = !videoTrack.enabled;

//     setCameraOn(videoTrack.enabled);

//     console.log(videoTrack.enabled ? "Camera ON" : "Camera OFF");
//   };

//   const shareScreen = async () => {
//     try {
//       const screenStream =
//         await navigator.mediaDevices.getDisplayMedia({
//           video: true,
//         });

//       screenStreamRef.current = screenStream;

//       const screenTrack =
//         screenStream.getVideoTracks()[0];

//       const sender = peerRef.current
//         .getSenders()
//         .find(
//           (s) =>
//             s.track &&
//             s.track.kind === "video"
//         );

//       if (sender) {
//         await sender.replaceTrack(screenTrack);
//       }

//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject =
//           screenStream;
//       }

//       setScreenSharing(true);

//       screenTrack.onended = () => {
//         stopScreenShare();
//       };

//       console.log("Screen Sharing Started");
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const stopScreenShare = async () => {
//     try {
//       if (!screenStreamRef.current) return;

//       screenStreamRef.current
//         .getTracks()
//         .forEach((track) => track.stop());

//       const cameraTrack =
//         localStreamRef.current
//           .getVideoTracks()[0];

//       const sender = peerRef.current
//         .getSenders()
//         .find(
//           (s) =>
//             s.track &&
//             s.track.kind === "video"
//         );

//       if (sender) {
//         await sender.replaceTrack(cameraTrack);
//       }

//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject =
//           localStreamRef.current;
//       }

//       screenStreamRef.current = null;

//       setScreenSharing(false);

//       console.log("Screen Sharing Stopped");
//     } catch (err) {
//       console.log(err);
//     }
//   };
//     useEffect(() => {
//     if (!peerRef.current) return;

//     peerRef.current.onconnectionstatechange = () => {
//       const state = peerRef.current.connectionState;

//       console.log("Connection State:", state);

//       if (state === "connected") {
//         setConnected(true);
//       }

//       if (
//         state === "disconnected" ||
//         state === "failed" ||
//         state === "closed"
//       ) {
//         setConnected(false);
//       }
//     };
//   }, [peerRef.current]);

//   const reconnect = () => {
//     if (!localStreamRef.current) return;

//     try {
//       peerRef.current?.close();

//       peerRef.current = createPeerConnection(
//         localStreamRef.current,
//         remoteVideoRef,
//         socket,
//         roomId
//       );

//       socket.emit("join-room", roomId);

//       console.log("Reconnected");
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   const leaveRoom = () => {
//     try {
//       if (roomId) {
//         socket.emit("leave-room", roomId);
//       }

//       peerRef.current?.close();

//       peerRef.current = createPeerConnection(
//         localStreamRef.current,
//         remoteVideoRef,
//         socket,
//         roomId
//       );

//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = null;
//       }

//       setConnected(false);

//       console.log("Room Left");
//     } catch (err) {
//       console.log(err);
//     }
//   };

//   useEffect(() => {
//     return () => {
//       localStreamRef.current
//         ?.getTracks()
//         .forEach((track) => track.stop());

//       screenStreamRef.current
//         ?.getTracks()
//         .forEach((track) => track.stop());

//       peerRef.current?.close();

//       socket.disconnect();
//     };
//   }, []);
//     return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#f3f4f6",
//         padding: "20px",
//         display: "flex",
//         flexDirection: "column",
//         alignItems: "center",
//         boxSizing: "border-box",
//       }}
//     >
//       <h1>WebRTC Video Call</h1>

//       <div
//         style={{
//           display: "flex",
//           gap: "10px",
//           flexWrap: "wrap",
//           justifyContent: "center",
//           marginBottom: "20px",
//           width: "100%",
//           maxWidth: "700px",
//         }}
//       >
//         <input
//           value={roomId}
//           onChange={(e) => setRoomId(e.target.value)}
//           placeholder="Room ID"
//           style={{
//             padding: "12px",
//             flex: 1,
//             minWidth: "180px",
//             borderRadius: "8px",
//             border: "1px solid #ccc",
//           }}
//         />

//         <button onClick={joinRoom}>
//           Join
//         </button>

//         <button onClick={leaveRoom}>
//           Leave
//         </button>

//         <button onClick={reconnect}>
//           Reconnect
//         </button>
//       </div>

//       <div
//         style={{
//           display: "flex",
//           gap: "10px",
//           flexWrap: "wrap",
//           justifyContent: "center",
//           marginBottom: "20px",
//         }}
//       >
//         <button onClick={toggleMic}>
//           {isMuted ? "Unmute" : "Mute"}
//         </button>

//         <button onClick={toggleCamera}>
//           {cameraOn ? "Camera Off" : "Camera On"}
//         </button>

//         {!screenSharing ? (
//           <button onClick={shareScreen}>
//             Share Screen
//           </button>
//         ) : (
//           <button onClick={stopScreenShare}>
//             Stop Share
//           </button>
//         )}
//       </div>

//       <h3>
//         Status :
//         {connected ? (
//           <span style={{ color: "green" }}> Connected</span>
//         ) : (
//           <span style={{ color: "red" }}> Disconnected</span>
//         )}
//       </h3>

//       <div
//         style={{
//           display: "flex",
//           flexWrap: "wrap",
//           justifyContent: "center",
//           gap: "20px",
//           width: "100%",
//         }}
//       >
//         <div>
//           <h3>Local Video</h3>

//           <video
//             ref={localVideoRef}
//             autoPlay
//             playsInline
//             muted
//             style={{
//               width: "100%",
//               maxWidth: "450px",
//               background: "#000",
//               borderRadius: "10px",
//             }}
//           />
//         </div>

//         <div>
//           <h3>Remote Video</h3>

//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             style={{
//               width: "100%",
//               maxWidth: "450px",
//               background: "#000",
//               borderRadius: "10px",
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
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
   const [fullScreen,setFullScreen] = useState(false);

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


const btn={
 width:"55px",
 height:"55px",
 borderRadius:"50%",
 border:"none",
 background:"#3c4043",
 color:"white",
 fontSize:"22px",
 cursor:"pointer"
};

return (
  
  <div
    style={{
      height:"100vh",
      width:"100%",
      background:"#202124",
      color:"white",
      display:"flex",
      flexDirection:"column",
      overflow:"hidden"
    }}
  >

    {/* TOP BAR */}
    <div
      style={{
        height:"60px",
        background:"#18191a",
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        padding:"0 20px"
      }}
    >

      <h3>
        🎥 Room: {roomId || "No Room"}
      </h3>


      {!connected && (

        <div
          style={{
            display:"flex",
            gap:"8px"
          }}
        >

       

        </div>

      )}



      <span
        style={{
          color:connected ? "#34a853":"#ea4335"
        }}
      >
        ● {connected ? "Connected":"Offline"}
      </span>


    </div>





    {/* VIDEO SECTION */}

    <div
      style={{
        flex:1,
        position:"relative",
        display:fullScreen ? "block":"flex",
        gap:"10px",
        padding:"10px"
      }}
    >


      {/* REMOTE VIDEO */}

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{
          width:fullScreen ? "100%" : "70%",
          height:"100%",
          objectFit:"cover",
          background:"#000",
          borderRadius:"12px"
        }}
      />



      {/* LOCAL VIDEO */}

      <div
        style={{
          position:fullScreen ? "absolute":"relative",
          right:fullScreen ? "25px":"0",
          bottom:fullScreen ? "25px":"0",
          width:fullScreen ? "180px":"30%",
          height:fullScreen ? "120px":"100%",
          borderRadius:"12px",
          overflow:"hidden",
          border:"2px solid white",
          background:"#000"
        }}
      >

        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            width:"100%",
            height:"100%",
            objectFit:"cover"
          }}
        />

      </div>


    </div>






    {/* CONTROL BAR */}

    <div
      style={{
        height:"80px",
        background:"#18191a",
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
        gap:"15px"
      }}
    >
   <input
            value={roomId}
            onChange={(e)=>setRoomId(e.target.value)}
            placeholder="Room ID"
            style={{
              padding:"10px",
              borderRadius:"8px",
              border:"none",
              outline:"none"
            }}
          />


          <button
            onClick={joinRoom}
            style={btn}
          >
            Join
          </button>

      <button
        onClick={toggleMic}
        style={btn}
      >
        {isMuted ? "🔇":"🎤"}
      </button>



      <button
        onClick={toggleCamera}
        style={btn}
      >
        {cameraOn ? "📷":"🚫"}
      </button>



      {!screenSharing ?

      <button
        onClick={shareScreen}
        style={btn}
      >
        🖥️
      </button>

      :

      <button
        onClick={stopScreenShare}
        style={btn}
      >
        Stop
      </button>

      }



      <button
        onClick={()=>setFullScreen(!fullScreen)}
        style={btn}
      >
        {fullScreen ? "↙️":"↗️"}
      </button>



      <button
        onClick={leaveRoom}
        style={{
          ...btn,
          background:"#ea4335"
        }}
      >
        ☎
      </button>


    </div>


  </div>
);
}

export default App;

// import { useEffect, useRef, useState } from "react";
// import socket from "./socket";
// import { createPeerConnection } from "./peer";

// function App() {
//   const [roomId, setRoomId] = useState("");
//   const [connected, setConnected] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [cameraOn, setCameraOn] = useState(true);
//   const [screenSharing, setScreenSharing] = useState(false);
//    const [fullScreen,setFullScreen] = useState(false);
// const [chatOpen,setChatOpen] = useState(false);
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);

//   const peerRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const screenStreamRef = useRef(null);
//   const [message,setMessage] = useState("");
// const [messages,setMessages] = useState([]);

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

//  useEffect(() => {

//   socket.on("user-joined", async () => {
//     console.log("User Joined");

//     if (!peerRef.current) return;

//     await createOffer();
//   });


//   socket.on("offer", async ({ offer }) => {
//     try {
//       console.log("Offer Received");

//       if (!peerRef.current) return;

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
//       console.log(err);
//     }
//   });



//   socket.on("answer", async ({ answer }) => {
//     try {

//       console.log("Answer Received");

//       if (!peerRef.current) return;

//       await peerRef.current.setRemoteDescription(
//         new RTCSessionDescription(answer)
//       );

//     } catch(err){
//       console.log(err);
//     }
//   });



//   socket.on("ice-candidate", async ({ candidate }) => {

//     try {

//       if(candidate && peerRef.current){

//         await peerRef.current.addIceCandidate(
//           new RTCIceCandidate(candidate)
//         );

//         console.log("ICE Candidate Added");

//       }

//     } catch(err){
//       console.log(err);
//     }

//   });



//   // 💬 CHAT RECEIVE
//   socket.on("receive-message",(msg)=>{

//     setMessages((prev)=>[
//       ...prev,
//       msg
//     ]);

//   });



//   // CLEANUP
//   return () => {

//     socket.off("user-joined");
//     socket.off("offer");
//     socket.off("answer");
//     socket.off("ice-candidate");

//     // chat cleanup
//     socket.off("receive-message");

//   };


// }, [roomId]);


// const sendMessage = () => {

//   if(!message.trim()) return;

//   const msg = {
//     text: message,
//     sender: socket.id
//   };


//   socket.emit("send-message", {
//     roomId,
//     msg
//   });


//   setMessages((prev)=>[
//     ...prev,
//     msg
//   ]);


//   setMessage("");

// };
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

//  const leaveRoom = () => {
//   try {
//     if (roomId) {
//       socket.emit("leave-room", roomId);
//     }

//     peerRef.current?.close();

//     peerRef.current = createPeerConnection(
//       localStreamRef.current,
//       remoteVideoRef,
//       socket,
//       roomId
//     );

//     if (remoteVideoRef.current) {
//       remoteVideoRef.current.srcObject = null;
//     }

//     setConnected(false);

//     console.log("Room Left");

//     // Redirect to Google
//     window.location.href = "https://www.google.com";
//   } catch (err) {
//     console.log(err);
//   }
// };

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


// const controlBtn =
//   "h-14 w-14 rounded-full bg-[#3c4043] hover:bg-[#4b4f52] text-white text-xl flex items-center justify-center transition-all duration-200 active:scale-95";

// return (
//   <div className="h-screen w-full bg-[#202124] text-white flex flex-col overflow-hidden">

//     {/* TOP BAR */}
//     <div className="h-[60px] bg-[#18191a] flex items-center justify-between px-5">
//       <h3 className="text-lg font-semibold">
//         🎥 Room: {roomId || "No Room"}
//       </h3>

//       <span
//         className={`font-medium ${
//           connected ? "text-green-500" : "text-red-500"
//         }`}
//       >
//         ● {connected ? "Connected" : "Offline"}
//       </span>
//     </div>

//     {/* VIDEO SECTION */}
//     <div
//   className={`flex-1 relative gap-3 p-3 ${
//     fullScreen
//       ? "block"
//       : "flex flex-col lg:flex-row"
//   }`}
// >
//       {/* REMOTE VIDEO */}
//       <video
//         ref={remoteVideoRef}
//         autoPlay
//         playsInline
//         className={`bg-black rounded-xl object-cover
// ${
//   fullScreen
//     ? "w-full h-full"
//     : "w-full lg:w-[70%] h-[55vh] lg:h-full"
// }`}
//       />

//       {/* LOCAL VIDEO */}
//      <div
//   className={`overflow-hidden rounded-xl border-2 border-white bg-black
// ${
//   fullScreen
//     ? "absolute bottom-4 right-4 w-28 h-20 sm:w-40 sm:h-28"
//     : "relative w-full lg:w-[30%] h-52 lg:h-full"
// }`}
// >
//         <video
//           ref={localVideoRef}
//           autoPlay
//           muted
//           playsInline
//           className="h-full w-full object-cover"
//         />
//       </div>
//     </div>

//     {/* CHAT BOX */}
//     {chatOpen && (
// <div className="absolute right-0 top-0 z-20 flex h-full w-full sm:w-[350px] flex-col bg-[#303134] p-4 shadow-[-5px_0_15px_rgba(0,0,0,0.4)]">

//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <h3 className="text-lg font-semibold">
//             💬 Chat
//           </h3>

//           <button
//             onClick={() => setChatOpen(false)}
//             className="text-2xl hover:text-red-400"
//           >
//             ✕
//           </button>
//         </div>

//         {/* Messages */}
//         <div className="mt-3 flex-1 overflow-y-auto space-y-2">
//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               className="rounded-xl bg-[#3c4043] p-3"
//             >
//               {msg.text}
//             </div>
//           ))}
//         </div>

//         {/* Input */}
//         <div className="mt-3 flex gap-2">
//           <input
//             value={message}
//             onChange={(e) => setMessage(e.target.value)}
//             placeholder="Message..."
//             className="flex-1 rounded-lg border-none px-3 py-2 text-black outline-none"
//           />

//           <button
//             onClick={sendMessage}
//             className="rounded-lg bg-blue-600 px-4 hover:bg-blue-700"
//           >
//             ➤
//           </button>
//         </div>
//       </div>
//     )}
//         {/* CONTROL BAR */}
// <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-full px-2">
// <div
//   className="
//   mx-auto
//   flex
//   w-full
//   max-w-5xl
//   flex-wrap
//   items-center
//   justify-center
//   gap-2
//   rounded-3xl
//   border
//   border-gray-700
//   bg-[#202124]/95
//   px-3
//   py-3
//   backdrop-blur-md
//   shadow-2xl
// "
// >

//     {/* Room ID */}
//     <input
//       value={roomId}
//       onChange={(e) => setRoomId(e.target.value)}
//       placeholder="Room ID"
// className="w-28 sm:w-36 rounded-full bg-[#3c4043] px-4 py-2 text-sm text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
//     />

//     {/* Join */}
//     <button
//       onClick={joinRoom}
//       className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-600 text-xl transition hover:scale-105 hover:bg-green-700 cursor-pointer"
//       title="Join"
//     >
//       📞
//     </button>

//     {/* Mic */}
//     <button
//       onClick={toggleMic}
//       className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-xl transition hover:scale-105 cursor-pointer ${
//         isMuted
//           ? "bg-red-600 hover:bg-red-700"
//           : "bg-[#3c4043] hover:bg-[#4b4f52]"
//       }`}
//       title="Microphone"
//     >
//       {isMuted ? "🔇" : "🎤"}
//     </button>

//     {/* Camera */}
//     <button
//       onClick={toggleCamera}
//       className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-xl transition hover:scale-105 cursor-pointer ${
//         cameraOn
//           ? "bg-[#3c4043] hover:bg-[#4b4f52]"
//           : "bg-red-600 hover:bg-red-700"
//       }`}
//       title="Camera"
//     >
//       {cameraOn ? "📷" : "🚫"}
//     </button>

//     {/* Screen Share */}
//     {!screenSharing ? (
//       <button
//         onClick={shareScreen}
//         className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52] cursor-pointer"
//         title="Share Screen"
//       >
//         🖥️
//       </button>
//     ) : (
//       <button
//         onClick={stopScreenShare}
//         className="rounded-full bg-orange-500 px-5 py-2 font-medium transition hover:bg-orange-600 cursor-pointer"
//       >
//         Stop
//       </button>
//     )}

//     {/* Full Screen */}
//     <button
//       onClick={() => setFullScreen(!fullScreen)}
//       className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52]"
//       title="Fullscreen"
//     >
//       {fullScreen ? "↙️" : "↗️"}
//     </button>

//     {/* Chat */}
//     <button
//       onClick={() => setChatOpen(true)}
//       className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52] cursor-pointer"
//       title="Chat"
//     >
//       💬
//     </button>

//     {/* Leave */}
//     <button
//       onClick={leaveRoom}
//       className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-600 text-xl transition hover:scale-105 hover:bg-red-700 cursor-pointer"
//       title="Leave Call"
//     >
//       ☎
//     </button>

//   </div>
// </div>

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
   const [fullScreen,setFullScreen] = useState(false);
const [chatOpen,setChatOpen] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [message,setMessage] = useState("");
const [messages,setMessages] = useState([]);

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

 const joinRoom = (id = roomId) => {
  if (!id.trim()) {
    alert("Enter Room ID");
    return;
  }

  socket.emit("join-room", id);

  setConnected(true);

  console.log("Joined Room:", id);
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

    } catch(err){
      console.log(err);
    }
  });



  socket.on("ice-candidate", async ({ candidate }) => {

    try {

      if(candidate && peerRef.current){

        await peerRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log("ICE Candidate Added");

      }

    } catch(err){
      console.log(err);
    }

  });



  // 💬 CHAT RECEIVE
  socket.on("receive-message",(msg)=>{

    setMessages((prev)=>[
      ...prev,
      msg
    ]);

  });



  // CLEANUP
  return () => {

    socket.off("user-joined");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");

    // chat cleanup
    socket.off("receive-message");

  };


}, [roomId]);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  const room = params.get("room");

  if (room) {
    console.log("Room from URL:", room);

    setRoomId(room);

    joinRoom(room);
  }
}, []);

const sendMessage = () => {

  if(!message.trim()) return;

  const msg = {
    text: message,
    sender: socket.id
  };


  socket.emit("send-message", {
    roomId,
    msg
  });


  setMessages((prev)=>[
    ...prev,
    msg
  ]);


  setMessage("");

};
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

    // Redirect to Google
    window.location.href = "https://www.google.com";
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


const controlBtn =
  "h-14 w-14 rounded-full bg-[#3c4043] hover:bg-[#4b4f52] text-white text-xl flex items-center justify-center transition-all duration-200 active:scale-95";

return (
  <div className="h-screen w-full bg-[#202124] text-white flex flex-col overflow-hidden">

    {/* TOP BAR */}
    <div className="h-[60px] bg-[#18191a] flex items-center justify-between px-5">
      <h3 className="text-lg font-semibold">
        🎥 Room: {roomId || "No Room"}
      </h3>

      <span
        className={`font-medium ${
          connected ? "text-green-500" : "text-red-500"
        }`}
      >
        ● {connected ? "Connected" : "Offline"}
      </span>
    </div>

    {/* VIDEO SECTION */}
    <div
  className={`flex-1 relative gap-3 p-3 ${
    fullScreen
      ? "block"
      : "flex flex-col lg:flex-row"
  }`}
>
      {/* REMOTE VIDEO */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`bg-black rounded-xl object-cover
${
  fullScreen
    ? "w-full h-full"
    : "w-full lg:w-[70%] h-[55vh] lg:h-full"
}`}
      />

      {/* LOCAL VIDEO */}
     <div
  className={`overflow-hidden rounded-xl border-2 border-white bg-black
${
  fullScreen
    ? "absolute bottom-4 right-4 w-28 h-20 sm:w-40 sm:h-28"
    : "relative w-full lg:w-[30%] h-52 lg:h-full"
}`}
>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    </div>

    {/* CHAT BOX */}
    {chatOpen && (
<div className="absolute right-0 top-0 z-[60] flex h-[calc(100%-90px)] w-full sm:w-[350px] flex-col bg-[#303134] p-4 shadow-[-5px_0_15px_rgba(0,0,0,0.4)]">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            💬 Chat
          </h3>

          <button
            onClick={() => setChatOpen(false)}
            className="text-2xl hover:text-red-400"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className="rounded-xl bg-[#3c4043] p-3"
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <input
  type="text"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  placeholder="Message..."
  className="flex-1 rounded-lg px-3 py-2 bg-[#202124] text-white outline-none focus:ring-2 focus:ring-blue-500"
/>

          <button
            onClick={sendMessage}
            className="rounded-lg bg-blue-600 px-4 hover:bg-blue-700"
          >
            ➤
          </button>
        </div>
      </div>
    )}
        {/* CONTROL BAR */}
<div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-full px-2">
<div
  className="
  mx-auto
  flex
  w-full
  max-w-2xl
  flex-wrap
  items-center
  justify-center
  gap-2
  rounded-3xl
  border
  border-gray-700
  bg-[#202124]/95
  px-3
  py-3
  backdrop-blur-md
  shadow-2xl
"
>

    {/* Room ID */}
    <input
   
      value={roomId}
      type="number"
      onChange={(e) => setRoomId(e.target.value)}
      placeholder="Room ID"
className="w-28 sm:w-36 rounded-full bg-[#3c4043] px-4 py-2 text-sm text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
    />

    {/* Join */}
    <button
      onClick={()=>joinRoom(roomId)}
      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-600 text-xl transition hover:scale-105 hover:bg-green-700 cursor-pointer"
      title="Join"
    >
      📞
    </button>

    {/* Mic */}
    <button
      onClick={toggleMic}
      className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-xl transition hover:scale-105 cursor-pointer ${
        isMuted
          ? "bg-red-600 hover:bg-red-700"
          : "bg-[#3c4043] hover:bg-[#4b4f52]"
      }`}
      title="Microphone"
    >
      {isMuted ? "🔇" : "🎤"}
    </button>

    {/* Camera */}
    <button
      onClick={toggleCamera}
      className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full text-xl transition hover:scale-105 cursor-pointer ${
        cameraOn
          ? "bg-[#3c4043] hover:bg-[#4b4f52]"
          : "bg-red-600 hover:bg-red-700"
      }`}
      title="Camera"
    >
      {cameraOn ? "📷" : "🚫"}
    </button>

    {/* Screen Share */}
    {!screenSharing ? (
      <button
        onClick={shareScreen}
        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52] cursor-pointer"
        title="Share Screen"
      >
        🖥️
      </button>
    ) : (
      <button
        onClick={stopScreenShare}
        className="rounded-full bg-orange-500 px-5 py-2 font-medium transition hover:bg-orange-600 cursor-pointer"
      >
        Stop
      </button>
    )}

    {/* Full Screen */}
    <button
      onClick={() => setFullScreen(!fullScreen)}
      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52]"
      title="Fullscreen"
    >
      {fullScreen ? "↙️" : "↗️"}
    </button>

    {/* Chat */}
    <button
      onClick={() => setChatOpen(true)}
      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52] cursor-pointer"
      title="Chat"
    >
      💬
    </button>

    {/* Leave */}
    <button
      onClick={leaveRoom}
      className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-600 text-xl transition hover:scale-105 hover:bg-red-700 cursor-pointer"
      title="Leave Call"
    >
      ☎
    </button>

  </div>
</div>

  </div>
  
);
}

export default App;

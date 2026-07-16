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

//  const joinRoom = (id = roomId) => {
//   if (!id.trim()) {
//     alert("Enter Room ID");
//     return;
//   }

//   socket.emit("join-room", id);

//   setConnected(true);

//   console.log("Joined Room:", id);
// };

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

// useEffect(() => {
//   const params = new URLSearchParams(window.location.search);

//   const room = params.get("room");

//   if (room) {
//     console.log("Room from URL:", room);

//     setRoomId(room);

//     joinRoom(room);
//   }
// }, []);

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
//     window.close()
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
// <div className="absolute right-0 top-0 z-[60] flex h-[calc(100%-90px)] w-full sm:w-[350px] flex-col bg-[#303134] p-4 shadow-[-5px_0_15px_rgba(0,0,0,0.4)]">

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
//   type="text"
//   value={message}
//   onChange={(e) => setMessage(e.target.value)}
//   placeholder="Message..."
//   className="flex-1 rounded-lg px-3 py-2 bg-[#202124] text-white outline-none focus:ring-2 focus:ring-blue-500"
// />

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
//   max-w-2xl
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
//       type="number"
//       onChange={(e) => setRoomId(e.target.value)}
//       placeholder="Room ID"
// className="w-28 sm:w-36 rounded-full bg-[#3c4043] px-4 py-2 text-sm text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
//     />

//     {/* Join */}
//     <button
//       onClick={()=>joinRoom(roomId)}
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
//     {/* <button
//       onClick={() => setChatOpen(true)}
//       className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52] cursor-pointer"
//       title="Chat"
//     >
//       💬
//     </button> */}

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






​import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "./socket";
import { createPeerConnection } from "./peer";

function App() {
  const [roomId, setRoomId] = useState("");

  const [joinedRoom, setJoinedRoom] = useState(false);
  const [connected, setConnected] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] =
    useState(false);

  const [fullScreen, setFullScreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  /*
   * Latest values ko socket callbacks me access karne ke liye refs.
   */
  const roomIdRef = useRef("");
  const joinedRoomRef = useRef(false);
  const cameraReadyRef = useRef(false);
  const joiningRoomRef = useRef(false);
  const creatingOfferRef = useRef(false);

  /*
   * Remote description se pehle receive hone wale ICE candidates.
   */
  const pendingIceCandidatesRef = useRef([]);

  /*
   * URL room ko camera ready hone tak temporarily store karenge.
   */
  const pendingRoomJoinRef = useRef("");

  /*
  |--------------------------------------------------------------------------
  | Keep state refs synchronized
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    joinedRoomRef.current = joinedRoom;
  }, [joinedRoom]);

  /*
  |--------------------------------------------------------------------------
  | Peer state handlers
  |--------------------------------------------------------------------------
  */

  const handleConnectionStateChange = useCallback(
    (state) => {
      if (state === "connected") {
        setConnected(true);
        return;
      }

      if (
        state === "disconnected" ||
        state === "failed" ||
        state === "closed"
      ) {
        setConnected(false);
      }
    },
    [],
  );

  const handleIceConnectionStateChange = useCallback(
    (state) => {
      if (
        state === "connected" ||
        state === "completed"
      ) {
        setConnected(true);
      }

      if (
        state === "failed" ||
        state === "closed"
      ) {
        setConnected(false);
      }
    },
    [],
  );

  /*
  |--------------------------------------------------------------------------
  | Clear remote video
  |--------------------------------------------------------------------------
  */

  const clearRemoteVideo = useCallback(() => {
    if (!remoteVideoRef.current) return;

    const remoteStream =
      remoteVideoRef.current.srcObject;

    if (remoteStream instanceof MediaStream) {
      remoteStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    remoteVideoRef.current.srcObject = null;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Close current peer
  |--------------------------------------------------------------------------
  */

  const closePeerConnection = useCallback(() => {
    if (!peerRef.current) return;

    peerRef.current.ontrack = null;
    peerRef.current.onicecandidate = null;
    peerRef.current.onconnectionstatechange = null;
    peerRef.current.oniceconnectionstatechange = null;
    peerRef.current.onicegatheringstatechange = null;
    peerRef.current.onsignalingstatechange = null;
    peerRef.current.onnegotiationneeded = null;

    peerRef.current.close();
    peerRef.current = null;

    pendingIceCandidatesRef.current = [];
    creatingOfferRef.current = false;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Create a fresh peer connection
  |--------------------------------------------------------------------------
  */

  const initializePeerConnection = useCallback(
    (targetRoomId) => {
      const normalizedRoomId = String(
        targetRoomId || roomIdRef.current || "",
      ).trim();

      if (!localStreamRef.current) {
        console.warn(
          "Peer connection not created because camera is not ready",
        );

        return null;
      }

      if (!normalizedRoomId) {
        console.warn(
          "Peer connection not created because Room ID is missing",
        );

        return null;
      }

      closePeerConnection();
      clearRemoteVideo();

      try {
        const peer = createPeerConnection({
          localStream: localStreamRef.current,
          remoteVideoRef,
          socket,
          roomId: normalizedRoomId,
          onConnectionStateChange:
            handleConnectionStateChange,
          onIceConnectionStateChange:
            handleIceConnectionStateChange,
        });

        peerRef.current = peer;

        console.log(
          "New peer connection created for room:",
          normalizedRoomId,
        );

        return peer;
      } catch (error) {
        console.error(
          "Peer connection creation failed:",
          error,
        );

        return null;
      }
    },
    [
      clearRemoteVideo,
      closePeerConnection,
      handleConnectionStateChange,
      handleIceConnectionStateChange,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | Add queued ICE candidates
  |--------------------------------------------------------------------------
  */

  const addPendingIceCandidates =
    useCallback(async () => {
      const peer = peerRef.current;

      if (!peer || !peer.remoteDescription) {
        return;
      }

      const candidates = [
        ...pendingIceCandidatesRef.current,
      ];

      pendingIceCandidatesRef.current = [];

      for (const candidate of candidates) {
        try {
          await peer.addIceCandidate(
            new RTCIceCandidate(candidate),
          );

          console.log(
            "Queued ICE candidate added successfully",
          );
        } catch (error) {
          console.error(
            "Failed to add queued ICE candidate:",
            error,
          );
        }
      }
    }, []);

  /*
  |--------------------------------------------------------------------------
  | Start camera
  |--------------------------------------------------------------------------
  */

  const startCamera = useCallback(async () => {
    try {
      if (localStreamRef.current) {
        return localStreamRef.current;
      }

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera and microphone are not supported by this browser",
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      localStreamRef.current = stream;
      cameraReadyRef.current = true;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;

        localVideoRef.current
          .play()
          .catch((error) => {
            console.warn(
              "Local video autoplay failed:",
              error,
            );
          });
      }

      setCameraOn(
        stream.getVideoTracks().some(
          (track) => track.enabled,
        ),
      );

      setIsMuted(
        !stream.getAudioTracks().some(
          (track) => track.enabled,
        ),
      );

      console.log("Camera and microphone are ready");

      /*
       * URL room pehle mil gaya tha to camera ready hone ke
       * baad room join karenge.
       */
      if (pendingRoomJoinRef.current) {
        const pendingRoom =
          pendingRoomJoinRef.current;

        pendingRoomJoinRef.current = "";

        setTimeout(() => {
          joinRoom(pendingRoom);
        }, 0);
      }

      return stream;
    } catch (error) {
      cameraReadyRef.current = false;

      console.error(
        "Camera/microphone permission error:",
        error,
      );

      alert(
        "Camera and microphone access allow karein. Permission ke bina video call connect nahi hogi.",
      );

      return null;
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Join room
  |--------------------------------------------------------------------------
  */

  const joinRoom = useCallback(
    async (requestedRoomId = roomIdRef.current) => {
      const normalizedRoomId = String(
        requestedRoomId || "",
      ).trim();

      if (!normalizedRoomId) {
        alert("Enter Room ID");
        return;
      }

      if (joiningRoomRef.current) {
        console.log(
          "Room join request already in progress",
        );
        return;
      }

      setRoomId(normalizedRoomId);
      roomIdRef.current = normalizedRoomId;

      /*
       * Camera ready nahi hai to room join ko postpone karo.
       */
      if (
        !cameraReadyRef.current ||
        !localStreamRef.current
      ) {
        pendingRoomJoinRef.current =
          normalizedRoomId;

        console.log(
          "Waiting for camera before joining room:",
          normalizedRoomId,
        );

        await startCamera();
        return;
      }

      if (!socket.connected) {
        console.log(
          "Socket disconnected. Connecting socket...",
        );

        pendingRoomJoinRef.current =
          normalizedRoomId;

        socket.connect();
        return;
      }

      /*
       * Same room already joined hai.
       */
      if (
        joinedRoomRef.current &&
        roomIdRef.current === normalizedRoomId
      ) {
        console.log(
          "Already joined room:",
          normalizedRoomId,
        );

        return;
      }

      joiningRoomRef.current = true;

      /*
       * Room join se pehle peer ko correct roomId ke saath
       * create karna zaroori hai.
       */
      const peer =
        initializePeerConnection(normalizedRoomId);

      if (!peer) {
        joiningRoomRef.current = false;
        return;
      }

      socket.emit(
        "join-room",
        normalizedRoomId,
        (response) => {
          joiningRoomRef.current = false;

          if (!response) {
            console.warn(
              "No acknowledgement received from server",
            );

            return;
          }

          if (!response.success) {
            console.error(
              "Unable to join room:",
              response.message,
            );

            setJoinedRoom(false);
            joinedRoomRef.current = false;
            setConnected(false);

            alert(
              response.message ||
                "Unable to join room",
            );

            return;
          }

          setJoinedRoom(true);
          joinedRoomRef.current = true;

          console.log(
            "Room joined successfully:",
            response,
          );
        },
      );
    },
    [initializePeerConnection, startCamera],
  );

  /*
  |--------------------------------------------------------------------------
  | Create offer
  |--------------------------------------------------------------------------
  */

  const createOffer = useCallback(async () => {
    const peer = peerRef.current;
    const currentRoomId =
      roomIdRef.current.trim();

    if (!peer) {
      console.warn(
        "Offer cannot be created because peer is missing",
      );

      return;
    }

    if (!currentRoomId) {
      console.warn(
        "Offer cannot be created because Room ID is missing",
      );

      return;
    }

    if (creatingOfferRef.current) {
      console.log(
        "Offer creation already in progress",
      );
      return;
    }

    /*
     * Duplicate negotiation se bachne ke liye.
     */
    if (peer.signalingState !== "stable") {
      console.warn(
        "Offer skipped. Signaling state:",
        peer.signalingState,
      );

      return;
    }

    try {
      creatingOfferRef.current = true;

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peer.setLocalDescription(offer);

      socket.emit(
        "offer",
        {
          roomId: currentRoomId,
          offer: peer.localDescription,
        },
        (response) => {
          if (
            response &&
            response.success === false
          ) {
            console.error(
              "Offer server error:",
              response.message,
            );
          }
        },
      );

      console.log("Offer sent");
    } catch (error) {
      console.error(
        "Offer creation failed:",
        error,
      );
    } finally {
      creatingOfferRef.current = false;
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Socket event listeners
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);

      /*
       * Socket reconnect ke baad room membership lost hoti hai,
       * isliye room dubara join karna padega.
       */
      const currentRoomId =
        roomIdRef.current.trim();

      if (
        pendingRoomJoinRef.current &&
        cameraReadyRef.current
      ) {
        const pendingRoom =
          pendingRoomJoinRef.current;

        pendingRoomJoinRef.current = "";

        joinRoom(pendingRoom);
        return;
      }

      if (
        joinedRoomRef.current &&
        currentRoomId &&
        cameraReadyRef.current
      ) {
        joinedRoomRef.current = false;
        setJoinedRoom(false);

        joinRoom(currentRoomId);
      }
    };

    const handleDisconnect = (reason) => {
      console.log(
        "Socket disconnected:",
        reason,
      );

      setConnected(false);
    };

    const handleRoomCreated = (data) => {
      console.log("Room created:", data);

      setJoinedRoom(true);
      joinedRoomRef.current = true;
    };

    const handleRoomJoined = (data) => {
      console.log("Room joined:", data);

      setJoinedRoom(true);
      joinedRoomRef.current = true;
    };

    const handleRoomAlreadyJoined = (data) => {
      console.log("Room already joined:", data);

      setJoinedRoom(true);
      joinedRoomRef.current = true;
    };

    const handleRoomFull = (data) => {
      console.error("Room full:", data);

      setJoinedRoom(false);
      joinedRoomRef.current = false;
      setConnected(false);

      alert(
        data?.message ||
          "This room already has two users",
      );
    };

    const handleUserJoined = async (data) => {
      console.log("Second user joined:", data);

      /*
       * Backend flow ke according existing/first user
       * hi offer create karega.
       */
      await createOffer();
    };

    const handleOffer = async ({
      offer,
      roomId: receivedRoomId,
      sender,
    }) => {
      console.log(
        "Offer received from:",
        sender,
      );

      try {
        const currentRoomId =
          roomIdRef.current.trim();

        if (
          receivedRoomId &&
          String(receivedRoomId).trim() !==
            currentRoomId
        ) {
          console.warn(
            "Offer ignored because room does not match",
          );

          return;
        }

        let peer = peerRef.current;

        if (
          !peer ||
          peer.connectionState === "closed"
        ) {
          peer =
            initializePeerConnection(
              currentRoomId,
            );
        }

        if (!peer) {
          throw new Error(
            "Peer connection is not available",
          );
        }

        /*
         * Unexpected old negotiation ko reset karne ke liye.
         */
        if (peer.signalingState !== "stable") {
          console.warn(
            "Peer signaling state before offer:",
            peer.signalingState,
          );

          if (
            peer.signalingState ===
            "have-local-offer"
          ) {
            await peer.setLocalDescription({
              type: "rollback",
            });
          }
        }

        await peer.setRemoteDescription(
          new RTCSessionDescription(offer),
        );

        /*
         * Remote description set hone ke baad queued candidates add karo.
         */
        await addPendingIceCandidates();

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit(
          "answer",
          {
            roomId: currentRoomId,
            answer: peer.localDescription,
          },
          (response) => {
            if (
              response &&
              response.success === false
            ) {
              console.error(
                "Answer server error:",
                response.message,
              );
            }
          },
        );

        console.log("Answer sent");
      } catch (error) {
        console.error(
          "Offer handling failed:",
          error,
        );
      }
    };

    const handleAnswer = async ({
      answer,
      roomId: receivedRoomId,
      sender,
    }) => {
      console.log(
        "Answer received from:",
        sender,
      );

      try {
        const peer = peerRef.current;
        const currentRoomId =
          roomIdRef.current.trim();

        if (!peer) {
          throw new Error(
            "Peer connection is not available",
          );
        }

        if (
          receivedRoomId &&
          String(receivedRoomId).trim() !==
            currentRoomId
        ) {
          console.warn(
            "Answer ignored because room does not match",
          );

          return;
        }

        if (
          peer.signalingState !==
          "have-local-offer"
        ) {
          console.warn(
            "Answer ignored. Current signaling state:",
            peer.signalingState,
          );

          return;
        }

        await peer.setRemoteDescription(
          new RTCSessionDescription(answer),
        );

        await addPendingIceCandidates();

        console.log(
          "Remote answer applied successfully",
        );
      } catch (error) {
        console.error(
          "Answer handling failed:",
          error,
        );
      }
    };

    const handleIceCandidate = async ({
      candidate,
      roomId: receivedRoomId,
      sender,
    }) => {
      if (!candidate) return;

      const currentRoomId =
        roomIdRef.current.trim();

      if (
        receivedRoomId &&
        String(receivedRoomId).trim() !==
          currentRoomId
      ) {
        console.warn(
          "ICE candidate ignored because room does not match",
        );

        return;
      }

      const peer = peerRef.current;

      if (!peer) {
        console.log(
          "Peer missing. ICE candidate queued",
        );

        pendingIceCandidatesRef.current.push(
          candidate,
        );

        return;
      }

      /*
       * Remote description set nahi hui hai to candidate queue hoga.
       */
      if (!peer.remoteDescription) {
        console.log(
          "Remote description not ready. ICE candidate queued",
        );

        pendingIceCandidatesRef.current.push(
          candidate,
        );

        return;
      }

      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(candidate),
        );

        console.log(
          "ICE candidate added from:",
          sender,
        );
      } catch (error) {
        console.error(
          "ICE candidate add failed:",
          error,
        );
      }
    };

    const handleUserLeft = (data) => {
      console.log("Other user left:", data);

      setConnected(false);
      clearRemoteVideo();

      /*
       * Current user room me wait karega, isliye fresh peer
       * create karenge. Next user aane par offer create hoga.
       */
      if (
        joinedRoomRef.current &&
        roomIdRef.current &&
        localStreamRef.current
      ) {
        initializePeerConnection(
          roomIdRef.current,
        );
      }
    };

    const handleCallEnded = (data) => {
      console.log("Call ended:", data);

      setConnected(false);
      clearRemoteVideo();

      if (
        joinedRoomRef.current &&
        roomIdRef.current &&
        localStreamRef.current
      ) {
        initializePeerConnection(
          roomIdRef.current,
        );
      }
    };

    const handleServerError = (data) => {
      console.error("Server error:", data);

      if (data?.message) {
        alert(data.message);
      }
    };

    const handleReceiveMessage = (msg) => {
      setMessages((previousMessages) => [
        ...previousMessages,
        msg,
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.on(
      "room-created",
      handleRoomCreated,
    );

    socket.on("room-joined", handleRoomJoined);

    socket.on(
      "room-already-joined",
      handleRoomAlreadyJoined,
    );

    socket.on("room-full", handleRoomFull);
    socket.on("user-joined", handleUserJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);

    socket.on(
      "ice-candidate",
      handleIceCandidate,
    );

    socket.on("user-left", handleUserLeft);
    socket.on("call-ended", handleCallEnded);
    socket.on("server-error", handleServerError);

    socket.on(
      "receive-message",
      handleReceiveMessage,
    );

    return () => {
      socket.off("connect", handleConnect);
      socket.off(
        "disconnect",
        handleDisconnect,
      );

      socket.off(
        "room-created",
        handleRoomCreated,
      );

      socket.off(
        "room-joined",
        handleRoomJoined,
      );

      socket.off(
        "room-already-joined",
        handleRoomAlreadyJoined,
      );

      socket.off("room-full", handleRoomFull);

      socket.off(
        "user-joined",
        handleUserJoined,
      );

      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);

      socket.off(
        "ice-candidate",
        handleIceCandidate,
      );

      socket.off("user-left", handleUserLeft);
      socket.off(
        "call-ended",
        handleCallEnded,
      );

      socket.off(
        "server-error",
        handleServerError,
      );

      socket.off(
        "receive-message",
        handleReceiveMessage,
      );
    };
  }, [
    addPendingIceCandidates,
    clearRemoteVideo,
    createOffer,
    initializePeerConnection,
    joinRoom,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Initial camera and URL room
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const initializeCall = async () => {
      const params = new URLSearchParams(
        window.location.search,
      );

      const roomFromUrl = String(
        params.get("room") || "",
      ).trim();

      if (roomFromUrl) {
        console.log(
          "Room received from URL:",
          roomFromUrl,
        );

        setRoomId(roomFromUrl);
        roomIdRef.current = roomFromUrl;

        pendingRoomJoinRef.current =
          roomFromUrl;
      }

      await startCamera();

      /*
       * startCamera pending room ko join kar dega.
       */
    };

    initializeCall();
  }, [startCamera]);

  /*
  |--------------------------------------------------------------------------
  | Disconnect call but remain on page
  |--------------------------------------------------------------------------
  */

  const disconnectCall = useCallback(() => {
    const currentRoomId =
      roomIdRef.current.trim();

    if (currentRoomId) {
      socket.emit(
        "leave-room",
        currentRoomId,
      );
    }

    joinedRoomRef.current = false;
    setJoinedRoom(false);
    setConnected(false);

    closePeerConnection();
    clearRemoteVideo();

    console.log("Call disconnected");
  }, [clearRemoteVideo, closePeerConnection]);

  /*
  |--------------------------------------------------------------------------
  | Manual reconnect
  |--------------------------------------------------------------------------
  */

  const reconnect = useCallback(async () => {
    const currentRoomId =
      roomIdRef.current.trim();

    if (!currentRoomId) {
      alert("Room ID is required");
      return;
    }

    if (!localStreamRef.current) {
      const stream = await startCamera();

      if (!stream) return;
    }

    joinedRoomRef.current = false;
    setJoinedRoom(false);
    setConnected(false);

    closePeerConnection();
    clearRemoteVideo();

    await joinRoom(currentRoomId);

    console.log("Manual reconnect initiated");
  }, [
    clearRemoteVideo,
    closePeerConnection,
    joinRoom,
    startCamera,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Send message
  |--------------------------------------------------------------------------
  |
  | Note:
  | Backend me send-message handler hona chahiye.
  |
  */

  const sendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    if (!joinedRoomRef.current) {
      alert("Please join the room first");
      return;
    }

    const msg = {
      id: `${Date.now()}-${socket.id}`,
      text: trimmedMessage,
      sender: socket.id,
      createdAt: new Date().toISOString(),
    };

    socket.emit("send-message", {
      roomId: roomIdRef.current,
      msg,
    });

    setMessages((previousMessages) => [
      ...previousMessages,
      msg,
    ]);

    setMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle microphone
  |--------------------------------------------------------------------------
  */

  const toggleMic = () => {
    const audioTrack =
      localStreamRef.current?.getAudioTracks()[0];

    if (!audioTrack) {
      alert("Microphone track is not available");
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;

    setIsMuted(!audioTrack.enabled);

    console.log(
      audioTrack.enabled ? "Mic ON" : "Mic OFF",
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle camera
  |--------------------------------------------------------------------------
  */

  const toggleCamera = () => {
    const videoTrack =
      localStreamRef.current?.getVideoTracks()[0];

    if (!videoTrack) {
      alert("Camera track is not available");
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;

    setCameraOn(videoTrack.enabled);

    console.log(
      videoTrack.enabled
        ? "Camera ON"
        : "Camera OFF",
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Start screen sharing
  |--------------------------------------------------------------------------
  */

  const shareScreen = async () => {
    try {
      if (!peerRef.current) {
        alert("Please join the room first");
        return;
      }

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
          },
          audio: false,
        });

      const screenTrack =
        screenStream.getVideoTracks()[0];

      if (!screenTrack) {
        throw new Error(
          "Screen video track not found",
        );
      }

      screenStreamRef.current = screenStream;

      const videoSender =
        peerRef.current
          .getSenders()
          .find(
            (sender) =>
              sender.track?.kind === "video",
          );

      if (!videoSender) {
        throw new Error(
          "Video sender not found",
        );
      }

      await videoSender.replaceTrack(screenTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          screenStream;

        localVideoRef.current
          .play()
          .catch(() => {});
      }

      setScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };

      console.log("Screen sharing started");
    } catch (error) {
      console.error(
        "Screen sharing failed:",
        error,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Stop screen sharing
  |--------------------------------------------------------------------------
  */

  const stopScreenShare = async () => {
    try {
      const screenStream =
        screenStreamRef.current;

      if (!screenStream) return;

      const cameraTrack =
        localStreamRef.current?.getVideoTracks()[0];

      const videoSender =
        peerRef.current
          ?.getSenders()
          .find(
            (sender) =>
              sender.track?.kind === "video",
          );

      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }

      screenStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });

      screenStreamRef.current = null;

      if (
        localVideoRef.current &&
        localStreamRef.current
      ) {
        localVideoRef.current.srcObject =
          localStreamRef.current;

        localVideoRef.current
          .play()
          .catch(() => {});
      }

      setScreenSharing(false);

      console.log("Screen sharing stopped");
    } catch (error) {
      console.error(
        "Stopping screen sharing failed:",
        error,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Leave room
  |--------------------------------------------------------------------------
  */

  const leaveRoom = () => {
    try {
      const currentRoomId =
        roomIdRef.current.trim();

      if (currentRoomId) {
        socket.emit(
          "leave-room",
          currentRoomId,
          (response) => {
            console.log(
              "Leave room response:",
              response,
            );
          },
        );
      }

      joinedRoomRef.current = false;

      setJoinedRoom(false);
      setConnected(false);

      closePeerConnection();
      clearRemoteVideo();

      localStreamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      localStreamRef.current = null;
      cameraReadyRef.current = false;

      screenStreamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.onended = null;
          track.stop();
        });

      screenStreamRef.current = null;

      console.log("Room left");

      /*
       * Window script se open hui hai to close ho jayegi.
       * Otherwise browser close ko block kar sakta hai.
       */
      window.close();
    } catch (error) {
      console.error("Leave room failed:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Final component cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      const currentRoomId =
        roomIdRef.current.trim();

      if (
        joinedRoomRef.current &&
        currentRoomId
      ) {
        socket.emit(
          "leave-room",
          currentRoomId,
        );
      }

      localStreamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      screenStreamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.onended = null;
          track.stop();
        });

      closePeerConnection();
      clearRemoteVideo();

      /*
       * Shared socket ko component unmount par disconnect mat karo.
       * Warna React StrictMode/dev remount me connection issue ho sakta hai.
       */
    };
  }, [clearRemoteVideo, closePeerConnection]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#202124] text-white">
      {/* TOP BAR */}

      <div className="flex h-[60px] items-center justify-between bg-[#18191a] px-5">
        <h3 className="text-lg font-semibold">
          🎥 Room: {roomId || "No Room"}
        </h3>

        <div className="flex items-center gap-4">
          <span
            className={`font-medium ${
              joinedRoom
                ? "text-blue-400"
                : "text-gray-400"
            }`}
          >
            {joinedRoom
              ? "Room Joined"
              : "Not Joined"}
          </span>

          <span
            className={`font-medium ${
              connected
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            ●{" "}
            {connected
              ? "Connected"
              : "Waiting"}
          </span>
        </div>
      </div>

      {/* VIDEO SECTION */}

      <div
        className={`relative flex-1 gap-3 p-3 ${
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
          className={`rounded-xl bg-black object-cover ${
            fullScreen
              ? "h-full w-full"
              : "h-[55vh] w-full lg:h-full lg:w-[70%]"
          }`}
        />

        {/* LOCAL VIDEO */}

        <div
          className={`overflow-hidden rounded-xl border-2 border-white bg-black ${
            fullScreen
              ? "absolute bottom-4 right-4 h-20 w-28 sm:h-28 sm:w-40"
              : "relative h-52 w-full lg:h-full lg:w-[30%]"
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />

          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#202124] text-lg">
              Camera Off
            </div>
          )}
        </div>
      </div>

      {/* CHAT BOX */}

      {chatOpen && (
        <div className="absolute right-0 top-0 z-[60] flex h-[calc(100%-90px)] w-full flex-col bg-[#303134] p-4 shadow-[-5px_0_15px_rgba(0,0,0,0.4)] sm:w-[350px]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              💬 Chat
            </h3>

            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="text-2xl hover:text-red-400"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`rounded-xl p-3 ${
                  msg.sender === socket.id
                    ? "ml-8 bg-blue-600"
                    : "mr-8 bg-[#3c4043]"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Message..."
              className="flex-1 rounded-lg bg-[#202124] px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={sendMessage}
              className="rounded-lg bg-blue-600 px-4 hover:bg-blue-700"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* CONTROL BAR */}

      <div className="fixed bottom-3 left-1/2 z-50 w-full -translate-x-1/2 px-2">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 rounded-3xl border border-gray-700 bg-[#202124]/95 px-3 py-3 shadow-2xl backdrop-blur-md">
          <input
            value={roomId}
            type="text"
            disabled={joinedRoom}
            onChange={(event) => {
              const value = event.target.value;

              setRoomId(value);
              roomIdRef.current = value;
            }}
            placeholder="Room ID"
            className="w-28 rounded-full bg-[#3c4043] px-4 py-2 text-sm text-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-36"
          />

          {!joinedRoom ? (
            <button
              type="button"
              onClick={() => joinRoom(roomId)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-green-600 text-xl transition hover:scale-105 hover:bg-green-700 sm:h-12 sm:w-12"
              title="Join"
            >
              📞
            </button>
          ) : (
            <button
              type="button"
              onClick={disconnectCall}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-orange-500 text-xl transition hover:scale-105 hover:bg-orange-600 sm:h-12 sm:w-12"
              title="Disconnect"
            >
              ⏸
            </button>
          )}

          <button
            type="button"
            onClick={toggleMic}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl transition hover:scale-105 sm:h-12 sm:w-12 ${
              isMuted
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#3c4043] hover:bg-[#4b4f52]"
            }`}
            title="Microphone"
          >
            {isMuted ? "🔇" : "🎤"}
          </button>

          <button
            type="button"
            onClick={toggleCamera}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-xl transition hover:scale-105 sm:h-12 sm:w-12 ${
              cameraOn
                ? "bg-[#3c4043] hover:bg-[#4b4f52]"
                : "bg-red-600 hover:bg-red-700"
            }`}
            title="Camera"
          >
            {cameraOn ? "📷" : "🚫"}
          </button>

          {!screenSharing ? (
            <button
              type="button"
              onClick={shareScreen}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52] sm:h-12 sm:w-12"
              title="Share Screen"
            >
              🖥️
            </button>
          ) : (
            <button
              type="button"
              onClick={stopScreenShare}
              className="cursor-pointer rounded-full bg-orange-500 px-5 py-2 font-medium transition hover:bg-orange-600"
            >
              Stop
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              setFullScreen(
                (previousValue) =>
                  !previousValue,
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52] sm:h-12 sm:w-12"
            title="Fullscreen"
          >
            {fullScreen ? "↙️" : "↗️"}
          </button>

          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#3c4043] text-xl transition hover:scale-105 hover:bg-[#4b4f52] sm:h-12 sm:w-12"
            title="Chat"
          >
            💬
          </button>

          <button
            type="button"
            onClick={reconnect}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-xl transition hover:scale-105 hover:bg-blue-700 sm:h-12 sm:w-12"
            title="Reconnect"
          >
            🔄
          </button>

          <button
            type="button"
            onClick={leaveRoom}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-red-600 text-xl transition hover:scale-105 hover:bg-red-700 sm:h-12 sm:w-12"
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

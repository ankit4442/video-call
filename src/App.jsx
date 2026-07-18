import { useCallback, useEffect, useRef, useState } from "react";

import {
  Phone,
  PhoneOff,
  Pause,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Maximize2,
  Minimize2,
  MessageSquare,
  RefreshCw,
  Send,
  X,
  User,
  Wifi,
  WifiOff,
  Copy,
  Check,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCircle2,
} from "lucide-react";

import socket from "./socket";
import { createPeerConnection } from "./peer";
import avtar from "./assets/avtar.png"

/*
|--------------------------------------------------------------------------
| Control bar button
|--------------------------------------------------------------------------
| Small reusable round button with a hover tooltip and active state.
| Colors come from the theme tokens in index.css.
*/

const VARIANT_CLASSES = {
  control: "bg-control hover:bg-control-hover",
  accent: "bg-accent hover:bg-accent-hover",
  success: "bg-success hover:bg-success-hover",
  warning: "bg-warning hover:bg-warning-hover",
  danger: "bg-danger hover:bg-danger-hover",
};

function ControlButton({
  onClick,
  label,
  variant = "control",
  active = false,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`group relative flex h-11 w-11 items-center justify-center rounded-full text-white transition-all duration-200 hover:scale-105 active:scale-95 sm:h-12 sm:w-12 ${VARIANT_CLASSES[variant]}`}
    >
      {children}

      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Toast notification
|--------------------------------------------------------------------------
| Custom, non-blocking replacement for the browser's alert()/prompt().
| Colors + icon depend on the toast type and use the theme tokens.
*/

const TOAST_META = {
  info: { Icon: Info, iconColor: "text-accent", border: "border-l-accent" },
  success: {
    Icon: CheckCircle2,
    iconColor: "text-success",
    border: "border-l-success",
  },
  error: {
    Icon: XCircle,
    iconColor: "text-danger",
    border: "border-l-danger",
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: "text-warning",
    border: "border-l-warning",
  },
};

function Toast({ toast, onClose }) {
  const meta = TOAST_META[toast.type] || TOAST_META.info;
  const { Icon } = meta;

  return (
    <div
      role="status"
      className={`pointer-events-auto flex animate-fade-in-down items-start gap-3 rounded-xl border border-line border-l-4 ${meta.border} bg-panel px-4 py-3 shadow-2xl`}
    >
      <span className={`mt-0.5 shrink-0 ${meta.iconColor}`}>
        <Icon className="h-5 w-5" />
      </span>

      <p className="flex-1 break-words text-sm leading-snug">
        {toast.message}
      </p>

      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-0.5 text-gray-400 transition hover:bg-control hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function App() {
  const [roomId, setRoomId] = useState("");

  const [joinedRoom, setJoinedRoom] = useState(false);
  const [connected, setConnected] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const [fullScreen, setFullScreen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toastIdRef = useRef(0);
  const rootRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);

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
  | Toast notifications
  |--------------------------------------------------------------------------
  */

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (messageText, type = "info", duration = 3500) => {
      toastIdRef.current += 1;
      const id = toastIdRef.current;

      setToasts((current) => [
        ...current,
        { id, type, message: messageText },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts((current) =>
            current.filter((toast) => toast.id !== id),
          );
        }, duration);
      }
    },
    [],
  );

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
   * Naye message aane par chat ko neeche scroll karo.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, chatOpen]);

  /*
   * Browser fullscreen ke saath state ko sync rakho (ESC etc.).
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Peer state handlers
  |--------------------------------------------------------------------------
  */

  const handleConnectionStateChange = useCallback((state) => {
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
  }, []);

  const handleIceConnectionStateChange = useCallback((state) => {
    if (state === "connected" || state === "completed") {
      setConnected(true);
    }

    if (state === "failed" || state === "closed") {
      setConnected(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Clear remote video
  |--------------------------------------------------------------------------
  */

  const clearRemoteVideo = useCallback(() => {
    if (!remoteVideoRef.current) return;

    const remoteStream = remoteVideoRef.current.srcObject;

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
          onConnectionStateChange: handleConnectionStateChange,
          onIceConnectionStateChange: handleIceConnectionStateChange,
        });

        peerRef.current = peer;

        console.log(
          "New peer connection created for room:",
          normalizedRoomId,
        );

        return peer;
      } catch (error) {
        console.error("Peer connection creation failed:", error);

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

  const addPendingIceCandidates = useCallback(async () => {
    const peer = peerRef.current;

    if (!peer || !peer.remoteDescription) {
      return;
    }

    const candidates = [...pendingIceCandidatesRef.current];

    pendingIceCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));

        console.log("Queued ICE candidate added successfully");
      } catch (error) {
        console.error("Failed to add queued ICE candidate:", error);
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

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
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

        localVideoRef.current.play().catch((error) => {
          console.warn("Local video autoplay failed:", error);
        });
      }

      setCameraOn(
        stream.getVideoTracks().some((track) => track.enabled),
      );

      setIsMuted(
        !stream.getAudioTracks().some((track) => track.enabled),
      );

      console.log("Camera and microphone are ready");

      /*
       * URL room pehle mil gaya tha to camera ready hone ke
       * baad room join karenge.
       */
      if (pendingRoomJoinRef.current) {
        const pendingRoom = pendingRoomJoinRef.current;

        pendingRoomJoinRef.current = "";

        setTimeout(() => {
          joinRoom(pendingRoom);
        }, 0);
      }

      return stream;
    } catch (error) {
      cameraReadyRef.current = false;

      console.error("Camera/microphone permission error:", error);

      showToast(
  "Camera and microphone access is required to join the video call.",
  "error",
  6000,
);

      return null;
    }
  }, [showToast]);

  /*
  |--------------------------------------------------------------------------
  | Join room
  |--------------------------------------------------------------------------
  */

  const joinRoom = useCallback(
    async (requestedRoomId = roomIdRef.current) => {
      const normalizedRoomId = String(requestedRoomId || "").trim();

      if (!normalizedRoomId) {
        showToast("Please enter a Room ID", "warning");
        return;
      }

      if (joiningRoomRef.current) {
        console.log("Room join request already in progress");
        return;
      }

      setRoomId(normalizedRoomId);
      roomIdRef.current = normalizedRoomId;

      /*
       * Camera ready nahi hai to room join ko postpone karo.
       */
      if (!cameraReadyRef.current || !localStreamRef.current) {
        pendingRoomJoinRef.current = normalizedRoomId;

        console.log(
          "Waiting for camera before joining room:",
          normalizedRoomId,
        );

        await startCamera();
        return;
      }

      if (!socket.connected) {
        console.log("Socket disconnected. Connecting socket...");

        pendingRoomJoinRef.current = normalizedRoomId;

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
        console.log("Already joined room:", normalizedRoomId);

        return;
      }

      joiningRoomRef.current = true;

      /*
       * Room join se pehle peer ko correct roomId ke saath
       * create karna zaroori hai.
       */
      const peer = initializePeerConnection(normalizedRoomId);

      if (!peer) {
        joiningRoomRef.current = false;
        return;
      }

      socket.emit("join-room", normalizedRoomId, (response) => {
        joiningRoomRef.current = false;

        if (!response) {
          console.warn("No acknowledgement received from server");

          return;
        }

        if (!response.success) {
          console.error("Unable to join room:", response.message);

          setJoinedRoom(false);
          joinedRoomRef.current = false;
          setConnected(false);

          showToast(response.message || "Unable to join room", "error");

          return;
        }

        setJoinedRoom(true);
        joinedRoomRef.current = true;

        showToast(`Joined room ${normalizedRoomId}`, "success");

        console.log("Room joined successfully:", response);
      });
    },
    [initializePeerConnection, startCamera, showToast],
  );

  /*
  |--------------------------------------------------------------------------
  | Create offer
  |--------------------------------------------------------------------------
  */

  const createOffer = useCallback(async () => {
    const peer = peerRef.current;
    const currentRoomId = roomIdRef.current.trim();

    if (!peer) {
      console.warn("Offer cannot be created because peer is missing");

      return;
    }

    if (!currentRoomId) {
      console.warn(
        "Offer cannot be created because Room ID is missing",
      );

      return;
    }

    if (creatingOfferRef.current) {
      console.log("Offer creation already in progress");
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
          if (response && response.success === false) {
            console.error("Offer server error:", response.message);
          }
        },
      );

      console.log("Offer sent");
    } catch (error) {
      console.error("Offer creation failed:", error);
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
      const currentRoomId = roomIdRef.current.trim();

      if (pendingRoomJoinRef.current && cameraReadyRef.current) {
        const pendingRoom = pendingRoomJoinRef.current;

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
      console.log("Socket disconnected:", reason);

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

      showToast(
        data?.message || "This room already has two users",
        "error",
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
      console.log("Offer received from:", sender);

      try {
        const currentRoomId = roomIdRef.current.trim();

        if (
          receivedRoomId &&
          String(receivedRoomId).trim() !== currentRoomId
        ) {
          console.warn("Offer ignored because room does not match");

          return;
        }

        let peer = peerRef.current;

        if (!peer || peer.connectionState === "closed") {
          peer = initializePeerConnection(currentRoomId);
        }

        if (!peer) {
          throw new Error("Peer connection is not available");
        }

        /*
         * Unexpected old negotiation ko reset karne ke liye.
         */
        if (peer.signalingState !== "stable") {
          console.warn(
            "Peer signaling state before offer:",
            peer.signalingState,
          );

          if (peer.signalingState === "have-local-offer") {
            await peer.setLocalDescription({ type: "rollback" });
          }
        }

        await peer.setRemoteDescription(
          new RTCSessionDescription(offer),
        );

        /*
         * Remote description set hone ke baad queued candidates add karo.
         */
        await addPendingIceCandidates();

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit(
          "answer",
          {
            roomId: currentRoomId,
            answer: peer.localDescription,
          },
          (response) => {
            if (response && response.success === false) {
              console.error("Answer server error:", response.message);
            }
          },
        );

        console.log("Answer sent");
      } catch (error) {
        console.error("Offer handling failed:", error);
      }
    };

    const handleAnswer = async ({
      answer,
      roomId: receivedRoomId,
      sender,
    }) => {
      console.log("Answer received from:", sender);

      try {
        const peer = peerRef.current;
        const currentRoomId = roomIdRef.current.trim();

        if (!peer) {
          throw new Error("Peer connection is not available");
        }

        if (
          receivedRoomId &&
          String(receivedRoomId).trim() !== currentRoomId
        ) {
          console.warn("Answer ignored because room does not match");

          return;
        }

        if (peer.signalingState !== "have-local-offer") {
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

        console.log("Remote answer applied successfully");
      } catch (error) {
        console.error("Answer handling failed:", error);
      }
    };

    const handleIceCandidate = async ({
      candidate,
      roomId: receivedRoomId,
      sender,
    }) => {
      if (!candidate) return;

      const currentRoomId = roomIdRef.current.trim();

      if (
        receivedRoomId &&
        String(receivedRoomId).trim() !== currentRoomId
      ) {
        console.warn(
          "ICE candidate ignored because room does not match",
        );

        return;
      }

      const peer = peerRef.current;

      if (!peer) {
        console.log("Peer missing. ICE candidate queued");

        pendingIceCandidatesRef.current.push(candidate);

        return;
      }

      /*
       * Remote description set nahi hui hai to candidate queue hoga.
       */
      if (!peer.remoteDescription) {
        console.log(
          "Remote description not ready. ICE candidate queued",
        );

        pendingIceCandidatesRef.current.push(candidate);

        return;
      }

      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));

        console.log("ICE candidate added from:", sender);
      } catch (error) {
        console.error("ICE candidate add failed:", error);
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
        initializePeerConnection(roomIdRef.current);
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
        initializePeerConnection(roomIdRef.current);
      }
    };

    const handleServerError = (data) => {
      console.error("Server error:", data);

      if (data?.message) {
        showToast(data.message, "error");
      }
    };

    const handleReceiveMessage = (msg) => {
      setMessages((previousMessages) => [...previousMessages, msg]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room-created", handleRoomCreated);
    socket.on("room-joined", handleRoomJoined);
    socket.on("room-already-joined", handleRoomAlreadyJoined);
    socket.on("room-full", handleRoomFull);
    socket.on("user-joined", handleUserJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("user-left", handleUserLeft);
    socket.on("call-ended", handleCallEnded);
    socket.on("server-error", handleServerError);
    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room-created", handleRoomCreated);
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-already-joined", handleRoomAlreadyJoined);
      socket.off("room-full", handleRoomFull);
      socket.off("user-joined", handleUserJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);
      socket.off("call-ended", handleCallEnded);
      socket.off("server-error", handleServerError);
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [
    addPendingIceCandidates,
    clearRemoteVideo,
    createOffer,
    initializePeerConnection,
    joinRoom,
    showToast,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Initial camera and URL room
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const initializeCall = async () => {
      const params = new URLSearchParams(window.location.search);

      const roomFromUrl = String(params.get("room") || "").trim();

      if (roomFromUrl) {
        console.log("Room received from URL:", roomFromUrl);

        setRoomId(roomFromUrl);
        roomIdRef.current = roomFromUrl;

        pendingRoomJoinRef.current = roomFromUrl;
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
    const currentRoomId = roomIdRef.current.trim();

    if (currentRoomId) {
      socket.emit("leave-room", currentRoomId);
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
    const currentRoomId = roomIdRef.current.trim();

    if (!currentRoomId) {
      showToast("Room ID is required", "warning");
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

    showToast("Reconnecting…", "info");

    console.log("Manual reconnect initiated");
  }, [
    clearRemoteVideo,
    closePeerConnection,
    joinRoom,
    startCamera,
    showToast,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Copy shareable invite link
  |--------------------------------------------------------------------------
  */

  const copyRoomLink = useCallback(async () => {
    const currentRoomId = roomIdRef.current.trim();

    if (!currentRoomId) {
      showToast("Enter a Room ID first", "warning");
      return;
    }

    const link = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
      currentRoomId,
    )}`;

    try {
      await navigator.clipboard.writeText(link);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      showToast("Invite link copied to clipboard", "success");

      console.log("Invite link copied:", link);
    } catch (error) {
      console.error("Copy failed:", error);
      showToast(`Couldn't copy automatically. Link: ${link}`, "error", 8000);
    }
  }, [showToast]);

  /*
  |--------------------------------------------------------------------------
  | Toggle browser fullscreen
  |--------------------------------------------------------------------------
  */

  const toggleFullScreen = useCallback(() => {
    const element = rootRef.current;

    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen?.().catch((error) => {
        console.warn("Fullscreen request failed:", error);
      });
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

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
      showToast("Please join the room first", "warning");
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

    setMessages((previousMessages) => [...previousMessages, msg]);

    setMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle microphone
  |--------------------------------------------------------------------------
  */

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];

    if (!audioTrack) {
      showToast("Microphone track is not available", "error");
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;

    setIsMuted(!audioTrack.enabled);

    console.log(audioTrack.enabled ? "Mic ON" : "Mic OFF");
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle camera
  |--------------------------------------------------------------------------
  */

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];

    if (!videoTrack) {
      showToast("Camera track is not available", "error");
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;

    setCameraOn(videoTrack.enabled);

    console.log(videoTrack.enabled ? "Camera ON" : "Camera OFF");
  };

  /*
  |--------------------------------------------------------------------------
  | Start screen sharing
  |--------------------------------------------------------------------------
  */

  const shareScreen = async () => {
    try {
      if (!peerRef.current) {
        showToast("Please join the room first", "warning");
        return;
      }

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });

      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) {
        throw new Error("Screen video track not found");
      }

      screenStreamRef.current = screenStream;

      const videoSender = peerRef.current
        .getSenders()
        .find((sender) => sender.track?.kind === "video");

      if (!videoSender) {
        throw new Error("Video sender not found");
      }

      await videoSender.replaceTrack(screenTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;

        localVideoRef.current.play().catch(() => {});
      }

      setScreenSharing(true);

      screenTrack.onended = () => {
        stopScreenShare();
      };

      console.log("Screen sharing started");
    } catch (error) {
      console.error("Screen sharing failed:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Stop screen sharing
  |--------------------------------------------------------------------------
  */

  const stopScreenShare = async () => {
    try {
      const screenStream = screenStreamRef.current;

      if (!screenStream) return;

      const cameraTrack =
        localStreamRef.current?.getVideoTracks()[0];

      const videoSender = peerRef.current
        ?.getSenders()
        .find((sender) => sender.track?.kind === "video");

      if (videoSender && cameraTrack) {
        await videoSender.replaceTrack(cameraTrack);
      }

      screenStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });

      screenStreamRef.current = null;

      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;

        localVideoRef.current.play().catch(() => {});
      }

      setScreenSharing(false);

      console.log("Screen sharing stopped");
    } catch (error) {
      console.error("Stopping screen sharing failed:", error);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Leave room
  |--------------------------------------------------------------------------
  */

  const leaveRoom = () => {
    try {
      const currentRoomId = roomIdRef.current.trim();

      if (currentRoomId) {
        socket.emit("leave-room", currentRoomId, (response) => {
          console.log("Leave room response:", response);
        });
      }

      joinedRoomRef.current = false;

      setJoinedRoom(false);
      setConnected(false);

      closePeerConnection();
      clearRemoteVideo();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
      cameraReadyRef.current = false;

      screenStreamRef.current?.getTracks().forEach((track) => {
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
      const currentRoomId = roomIdRef.current.trim();

      if (joinedRoomRef.current && currentRoomId) {
        socket.emit("leave-room", currentRoomId);
      }

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      screenStreamRef.current?.getTracks().forEach((track) => {
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
    <div
      ref={rootRef}
      className="flex h-screen w-full flex-col overflow-hidden bg-surface text-white"
    >
      {/* TOAST NOTIFICATIONS */}
      <div className="pointer-events-none fixed left-1/2 top-4 z-[100] flex w-[92%] max-w-sm -translate-x-1/2 flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={dismissToast} />
        ))}
      </div>

      {/* TOP BAR */}
      <header className="flex h-16 shrink-0 animate-fade-in-down items-center justify-between gap-3 bg-header px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
            <Video className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold sm:text-base">
              {roomId ? `Room ${roomId}` : "No room"}
            </p>
            <p className="text-xs text-gray-400">
              {joinedRoom ? "You're in the call" : "Not joined yet"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              connected
                ? "bg-success/15 text-success"
                : "bg-danger/15 text-danger"
            }`}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {connected ? "Connected" : "Waiting"}
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                connected
                  ? "animate-pulse bg-success"
                  : "bg-danger"
              }`}
            />
          </span>

          <button
            type="button"
            onClick={copyRoomLink}
            title="Copy invite link"
            className="inline-flex items-center gap-1.5 rounded-full bg-control px-3 py-1.5 text-xs font-medium transition hover:bg-control-hover active:scale-95"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 animate-pop text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">
              {copied ? "Copied" : "Invite"}
            </span>
          </button>
        </div>
      </header>

      {/* BODY: video stage + chat */}
      <div className="relative flex min-h-0 flex-1">
        {/* VIDEO STAGE */}
        <main className="relative flex-1 animate-fade-in p-3 sm:p-4">
          {/* Remote video (main stage) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`h-full w-full rounded-2xl bg-black object-cover transition-opacity duration-700 ${
              connected ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Placeholder while nobody is connected */}
          {!connected && (
            <div className="pointer-events-none absolute inset-3 flex animate-fade-in flex-col items-center justify-center rounded-2xl bg-black/40 text-center sm:inset-4">
              <div className="flex h-20 w-20 animate-float items-center justify-center rounded-full bg-control">
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <p className="mt-4 text-sm text-gray-200">
                {joinedRoom
                  ? "Waiting for someone to join…"
                  : "Join a room to start the call"}
              </p>
              {joinedRoom && (
                <p className="mt-1 text-xs text-gray-500">
                  Share the invite link to bring someone in
                </p>
              )}
            </div>
          )}

          {/* Self view (small floating tile) */}
          <div className="group absolute bottom-5 left-5 h-28 w-40 animate-pop overflow-hidden rounded-xl border-2 border-white/80 bg-black shadow-2xl transition-transform duration-200 hover:scale-105 sm:h-36 sm:w-56">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />

            {!cameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface">
                <VideoOff className="h-6 w-6 text-gray-400" />
                <span className="mt-1 text-xs text-gray-400">
                  Camera off
                </span>
              </div>
            )}

            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium">
              You
              {isMuted && <MicOff className="h-3 w-3 text-danger" />}
            </span>
          </div>
        </main>

        {/* CHAT PANEL */}
        {chatOpen && (
          <aside className="absolute inset-0 z-40 flex animate-slide-in-right flex-col bg-panel sm:relative sm:inset-auto sm:z-auto sm:w-[340px] sm:border-l sm:border-line">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" />
                Chat
              </h3>

              <button
                type="button"
                onClick={() => setChatOpen(false)}
                title="Close chat"
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-control hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

<div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
  {messages.length === 0 ? (
    <div className="flex h-full animate-fade-in flex-col items-center justify-center text-center text-gray-500">
      <MessageSquare className="h-8 w-8" />
      <p className="mt-2 text-sm">No messages yet</p>
      <p className="text-xs">Say hi 👋</p>
    </div>
  ) : (
    messages.map((msg, index) => {
      const mine = msg.sender === socket.id;

      return (
        <div
          key={msg.id || index}
          className={`flex items-end gap-2 animate-fade-in-up ${
            mine ? "justify-end" : "justify-start"
          }`}
        >
          {/* Other user's icon */}
          {!mine && (
           
             <img  
            src={avtar}
                      alt="user"
                  className="h-12 w-12 shrink-0 text-gray-400" 
                    />
           
          )}

          <div
            className={`max-w-[80%] break-words rounded-2xl px-3 py-2 text-sm ${
              mine
                ? "rounded-br-md bg-accent"
                : "rounded-bl-md bg-control"
            }`}
          >
            {msg.text}
          </div>

          {/* My icon */}
          {mine && (
          <img  
            src={avtar}
                      alt="user"
                  className="h-12 w-12 shrink-0 text-gray-400" 
                    />
          )}
        </div>
      );
    })
  )}

  <div ref={messagesEndRef} />
</div>

            <div className="flex items-center gap-2 border-t border-line p-3">
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Type a message…"
                className="flex-1 rounded-full bg-surface px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
              />

              <button
                type="button"
                onClick={sendMessage}
                title="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent transition hover:bg-accent-hover active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* CONTROL BAR */}
      <div className="flex shrink-0 justify-center px-3 pb-4 pt-2">
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-line bg-header/95 px-3 py-2.5 shadow-2xl backdrop-blur-md animate-fade-in-up sm:gap-3 sm:px-4">
          {!joinedRoom && (
            <input
              value={roomId}
              type="text"
              onChange={(event) => {
                setRoomId(event.target.value);
                roomIdRef.current = event.target.value;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  joinRoom(roomId);
                }
              }}
              placeholder="Room ID"
              className="w-24 rounded-full bg-control px-4 py-2 text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-accent sm:w-32"
            />
          )}

          {!joinedRoom ? (
            <ControlButton
              onClick={() => joinRoom(roomId)}
              label="Join"
              variant="success"
            >
              <Phone className="h-5 w-5" />
            </ControlButton>
          ) : (
            <ControlButton
              onClick={disconnectCall}
              label="Disconnect"
              variant="warning"
            >
              <Pause className="h-5 w-5" />
            </ControlButton>
          )}

          <ControlButton
            onClick={toggleMic}
            label={isMuted ? "Unmute" : "Mute"}
            variant={isMuted ? "danger" : "control"}
            active={isMuted}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </ControlButton>

          <ControlButton
            onClick={toggleCamera}
            label={cameraOn ? "Turn camera off" : "Turn camera on"}
            variant={cameraOn ? "control" : "danger"}
            active={!cameraOn}
          >
            {cameraOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </ControlButton>

          <ControlButton
            onClick={screenSharing ? stopScreenShare : shareScreen}
            label={screenSharing ? "Stop sharing" : "Share screen"}
            variant={screenSharing ? "warning" : "control"}
            active={screenSharing}
          >
            {screenSharing ? (
              <ScreenShareOff className="h-5 w-5" />
            ) : (
              <ScreenShare className="h-5 w-5" />
            )}
          </ControlButton>

          <ControlButton
            onClick={toggleFullScreen}
            label={fullScreen ? "Exit fullscreen" : "Fullscreen"}
            variant="control"
          >
            {fullScreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </ControlButton>

          <ControlButton
            onClick={() => setChatOpen((previous) => !previous)}
            label="Chat"
            variant="control"
            active={chatOpen}
          >
            <MessageSquare className="h-5 w-5" />
          </ControlButton>

          <ControlButton
            onClick={reconnect}
            label="Reconnect"
            variant="accent"
          >
            <RefreshCw className="h-5 w-5" />
          </ControlButton>

          <ControlButton
            onClick={leaveRoom}
            label="Leave call"
            variant="danger"
          >
            <PhoneOff className="h-5 w-5" />
          </ControlButton>
        </div>
      </div>
    </div>
  );
}

export default App;

export const createPeerConnection = ({
  localStream,
  remoteVideoRef,
  socket,
  roomId,
  onConnectionStateChange,
  onIceConnectionStateChange,
}) => {
  if (!localStream) {
    throw new Error("Local media stream is not available");
  }

  const normalizedRoomId = String(roomId || "").trim();

  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },

      /*
       * Production me TURN server zaroor add karna.
       *
       * Example:
       *
       * {
       *   urls: "turn:your-turn-server.com:3478",
       *   username: "username",
       *   credential: "password",
       * },
       */
    ],

    iceCandidatePoolSize: 10,
  });

  /*
  |--------------------------------------------------------------------------
  | Add local camera and microphone tracks
  |--------------------------------------------------------------------------
  */

  localStream.getTracks().forEach((track) => {
    peer.addTrack(track, localStream);
  });

  /*
  |--------------------------------------------------------------------------
  | Receive remote video/audio
  |--------------------------------------------------------------------------
  */

  peer.ontrack = (event) => {
    const [remoteStream] = event.streams;

    if (!remoteStream) {
      console.warn("Remote stream not found");
      return;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;

      remoteVideoRef.current.play().catch((error) => {
        console.warn("Remote video autoplay failed:", error);
      });
    }

    console.log("Remote track received:", event.track.kind);
  };

  /*
  |--------------------------------------------------------------------------
  | Send ICE candidates to the other user
  |--------------------------------------------------------------------------
  */

  peer.onicecandidate = (event) => {
    if (!event.candidate) {
      console.log("ICE candidate gathering completed");
      return;
    }

    if (!normalizedRoomId) {
      console.warn(
        "ICE candidate not sent because Room ID is missing",
      );
      return;
    }

    socket.emit(
      "ice-candidate",
      {
        roomId: normalizedRoomId,
        candidate: event.candidate.toJSON
          ? event.candidate.toJSON()
          : event.candidate,
      },
      (response) => {
        if (response && response.success === false) {
          console.error(
            "ICE candidate server error:",
            response.message,
          );
        }
      },
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Peer connection state
  |--------------------------------------------------------------------------
  */

  peer.onconnectionstatechange = () => {
    const state = peer.connectionState;

    console.log("Peer connection state:", state);

    if (typeof onConnectionStateChange === "function") {
      onConnectionStateChange(state);
    }
  };

  peer.oniceconnectionstatechange = () => {
    const state = peer.iceConnectionState;

    console.log("ICE connection state:", state);

    if (typeof onIceConnectionStateChange === "function") {
      onIceConnectionStateChange(state);
    }
  };

  peer.onicegatheringstatechange = () => {
    console.log(
      "ICE gathering state:",
      peer.iceGatheringState,
    );
  };

  peer.onsignalingstatechange = () => {
    console.log(
      "Signaling state:",
      peer.signalingState,
    );
  };

  peer.onnegotiationneeded = () => {
    console.log("Peer negotiation needed");
  };

  return peer;
};
 



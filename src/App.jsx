import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://video-call-server-h95a.onrender.com", {
  transports: ["websocket"],
});

function App() {
  const [roomId, setRoomId] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const joinRoom = () => {
    if (!roomId.trim()) {
      alert("Enter Room ID");
      return;
    }

    socket.emit("join-room", roomId);
    console.log("Joined Room:", roomId);
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  useEffect(() => {
    startCamera();
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

      peerRef.current = new RTCPeerConnection({
        iceServers: [
          {
            urls: "stun:stun.l.google.com:19302",
          },
        ],
      });

      const remoteStream = new MediaStream();

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      peerRef.current.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
      };

      stream.getTracks().forEach((track) => {
        peerRef.current.addTrack(track, stream);
      });

      console.log("Peer Ready");
    } catch (err) {
      console.log(err);
    }
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

    if (!peerRef.current) {
      console.log("Peer not ready");
      return;
    }

    await createOffer();
  });

  socket.on("offer", async ({ offer }) => {
    try {
      console.log("Offer Received");

      if (!peerRef.current) {
        console.log("Peer not ready");
        return;
      }

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
      console.error("Offer Error:", err);
    }
  });

  socket.on("answer", async ({ answer }) => {
    try {
      console.log("Answer Received");

      if (!peerRef.current) {
        console.log("Peer not ready");
        return;
      }

      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    } catch (err) {
      console.error("Answer Error:", err);
    }
  });

  return () => {
    socket.off("user-joined");
    socket.off("offer");
    socket.off("answer");
  };
}, [roomId]);
    useEffect(() => {
    if (!peerRef.current) return;

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });

        console.log("ICE Candidate Sent");
      }
    };
  }, [roomId]);

  useEffect(() => {
    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        if (candidate && peerRef.current) {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );

          console.log("ICE Candidate Received");
        }
      } catch (err) {
        console.log(err);
      }
    });

    return () => {
      socket.off("ice-candidate");
    };
  }, []);
    return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <h1>2 Person Video Call</h1>

      <div>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{
            padding: "10px",
            marginRight: "10px",
          }}
        />

        <button
          onClick={joinRoom}
          style={{
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Join Room
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "20px",
        }}
      >
        <div>
          <h3>Local Video</h3>

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "400px",
              border: "2px solid black",
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
              width: "400px",
              border: "2px solid red",
              borderRadius: "10px",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
export const createPeerConnection = (
  localStream,
  remoteVideoRef,
  socket,
  roomId
) => {
  const peer = new RTCPeerConnection({
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

  peer.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        roomId,
        candidate: event.candidate,
      });
    }
  };

  localStream.getTracks().forEach((track) => {
    peer.addTrack(track, localStream);
  });

  return peer;
};
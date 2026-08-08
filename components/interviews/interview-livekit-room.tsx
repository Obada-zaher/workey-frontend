"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { Button } from "@/components/ui/button";
import type { InterviewVideoSession } from "@/lib/interviews/types";

export function InterviewLiveKitRoom({ onError, onLeave, session }: { onError: (message: string) => void; onLeave: () => void; session: InterviewVideoSession }) {
  const roomRef = useRef<Room | null>(null); const localRef = useRef<HTMLDivElement>(null); const remoteRef = useRef<HTMLDivElement>(null); const [connecting, setConnecting] = useState(true); const [camera, setCamera] = useState(true); const [microphone, setMicrophone] = useState(true); const [participantCount, setParticipantCount] = useState(1);
  const clearMedia = useCallback(() => { localRef.current?.replaceChildren(); remoteRef.current?.replaceChildren(); }, []);
  const disconnect = useCallback(() => { const room = roomRef.current; roomRef.current = null; if (room) { room.removeAllListeners(); room.disconnect(); } clearMedia(); }, [clearMedia]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let active = true; const room = new Room({ adaptiveStream: true, dynacast: true }); roomRef.current = room;
      const attachRemote = (track: RemoteTrack) => { if (!active || !remoteRef.current) return; const element = track.attach(); element.autoplay = true; if (track.kind === Track.Kind.Video) { element.className = "interview-remote-video"; element.setAttribute("playsinline", "true"); } else { element.className = "interview-remote-audio"; } remoteRef.current.appendChild(element); };
      room.on(RoomEvent.TrackSubscribed, attachRemote).on(RoomEvent.TrackUnsubscribed, (track) => track.detach().forEach((element) => element.remove())).on(RoomEvent.ParticipantConnected, () => setParticipantCount(room.remoteParticipants.size + 1)).on(RoomEvent.ParticipantDisconnected, () => setParticipantCount(room.remoteParticipants.size + 1)).on(RoomEvent.Disconnected, () => { if (active) onLeave(); });
      void (async () => { try { await room.connect(session.server_url, session.participant_token); await Promise.all([room.localParticipant.setCameraEnabled(true), room.localParticipant.setMicrophoneEnabled(true)]); if (!active) return; const localPublication = room.localParticipant.getTrackPublication(Track.Source.Camera); const video = localPublication?.videoTrack?.attach(); if (video && localRef.current) { video.muted = true; video.autoplay = true; video.setAttribute("playsinline", "true"); video.className = "interview-local-video"; localRef.current.appendChild(video); } room.remoteParticipants.forEach((participant) => participant.trackPublications.forEach((publication) => { if (publication.track) attachRemote(publication.track); })); setParticipantCount(room.remoteParticipants.size + 1); setConnecting(false); } catch (reason) { disconnect(); if (active) { setConnecting(false); onError(reason instanceof Error ? reason.message : "Could not connect to the interview room."); } } })();
      return () => { active = false; };
    }, 0);
    return () => { window.clearTimeout(timer); disconnect(); };
  }, [disconnect, onError, onLeave, session]);

  async function toggleCamera() { const room = roomRef.current; if (!room) return; const next = !camera; try { await room.localParticipant.setCameraEnabled(next); setCamera(next); if (next && localRef.current && !localRef.current.querySelector("video")) { const video = room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack?.attach(); if (video) { video.muted = true; video.autoplay = true; video.setAttribute("playsinline", "true"); video.className = "interview-local-video"; localRef.current.appendChild(video); } } } catch { onError("Camera access could not be changed."); } }
  async function toggleMicrophone() { const room = roomRef.current; if (!room) return; const next = !microphone; try { await room.localParticipant.setMicrophoneEnabled(next); setMicrophone(next); } catch { onError("Microphone access could not be changed."); } }
  function leave() { disconnect(); onLeave(); }

  return <div className="interview-room"><div className="interview-room__remote" ref={remoteRef}>{connecting ? <div className="interview-room__waiting" role="status"><span className="interview-room__pulse" />Connecting securely…</div> : null}</div><div aria-label="Your camera" className="interview-room__local" ref={localRef}>{!camera ? <span>Camera off</span> : null}</div><div className="interview-room__meta"><span className="interview-live-dot" />LiveKit · {participantCount} {participantCount === 1 ? "participant" : "participants"}</div><div className="interview-room__controls" role="toolbar" aria-label="Interview media controls"><Button aria-label={camera ? "Turn camera off" : "Turn camera on"} disabled={connecting} onClick={() => void toggleCamera()} size="small" type="button" variant="secondary">{camera ? "Camera on" : "Camera off"}</Button><Button aria-label={microphone ? "Mute microphone" : "Unmute microphone"} disabled={connecting} onClick={() => void toggleMicrophone()} size="small" type="button" variant="secondary">{microphone ? "Mic on" : "Mic off"}</Button><Button onClick={leave} size="small" type="button" variant="danger">Leave interview</Button></div></div>;
}

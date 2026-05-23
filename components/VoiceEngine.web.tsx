/**
 * VoiceEngine.web.tsx — Native WebRTC voice engine for web
 *
 * Replaces the Agora SDK entirely. Uses browser RTCPeerConnection for audio and
 * a dedicated Supabase Realtime broadcast channel (`rtc:<convoyId>`) for
 * offer/answer/ICE signaling. No App ID or external service required.
 *
 * Architecture (mesh):
 *   - On join, broadcast a 'join' event so all existing peers create offers.
 *   - Each peer handles offer → answer → ICE via Supabase broadcast.
 *   - Audio tracks start muted; enabled/disabled in response to PTT state.
 */

import { useEffect, useRef } from 'react';
import { showToast } from './Toast';
import { useConvoy } from '../contexts/ConvoyContext';
import { supabase } from '../lib/supabase';

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
];

export default function VoiceEngine() {
    const { convoyId, myId, isTalkingLocally, setVoiceStatus } = useConvoy();

    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const audioElemsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
    const sigChannelRef = useRef<any>(null);
    const myIdRef = useRef(myId);

    useEffect(() => { myIdRef.current = myId; }, [myId]);

    // ─── Mic acquisition ────────────────────────────────────────────────────
    const ensureMic = async (): Promise<MediaStream | null> => {
        if (localStreamRef.current?.active) return localStreamRef.current;
        try {
            // Prefer the stream pre-acquired via PTT gesture handler (iOS Safari)
            const preStreamOrPromise = (window as any).__wf_mic_stream;
            if (preStreamOrPromise) {
                let stream: MediaStream | undefined;
                if (preStreamOrPromise instanceof Promise) {
                    stream = await preStreamOrPromise;
                } else {
                    stream = preStreamOrPromise;
                }
                if (stream && stream.active) {
                    localStreamRef.current = stream;
                    return stream;
                }
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            (window as any).__wf_mic_stream = stream;
            return stream;
        } catch (err: any) {
            const msg = (err?.message ?? '').toLowerCase();
            if (msg.includes('denied') || msg.includes('not allowed')) {
                showToast('Mic blocked — allow microphone access in your browser', '🎤', '#FF2D55');
            } else if (msg.includes('not found') || msg.includes('no device')) {
                showToast('No microphone found', '🎤', '#FF6A00');
            } else {
                showToast('Microphone error — check browser permissions', '🎤', '#FF6A00');
            }
            return null;
        }
    };

    // ─── Peer connection factory ─────────────────────────────────────────────
    const createPeer = (remoteId: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add local audio tracks (muted until PTT press)
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = false; // always start muted
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Play incoming audio
        pc.ontrack = (event) => {
            const stream = event.streams[0];
            if (!stream) return;

            let audio = audioElemsRef.current.get(remoteId);
            if (!audio) {
                audio = document.createElement('audio');
                audio.autoplay = true;
                audio.setAttribute('playsinline', '');
                document.body.appendChild(audio);
                audioElemsRef.current.set(remoteId, audio);
            }
            audio.srcObject = stream;
            audio.play().catch(() => {
                // Autoplay may be blocked — will resume on next user gesture
            });
        };

        // Send ICE candidates via signaling channel
        pc.onicecandidate = (event) => {
            if (event.candidate && sigChannelRef.current) {
                sigChannelRef.current.send({
                    type: 'broadcast',
                    event: 'ice',
                    payload: {
                        from: myIdRef.current,
                        to: remoteId,
                        candidate: event.candidate.toJSON(),
                    },
                });
            }
        };

        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            console.log(`[WebRTC] Peer ${remoteId}: ${state}`);
            if (state === 'failed' || state === 'closed') {
                cleanupPeer(remoteId);
            }
        };

        peersRef.current.set(remoteId, pc);
        return pc;
    };

    const cleanupPeer = (remoteId: string) => {
        peersRef.current.get(remoteId)?.close();
        peersRef.current.delete(remoteId);
        const audio = audioElemsRef.current.get(remoteId);
        if (audio) {
            audio.srcObject = null;
            audio.remove();
            audioElemsRef.current.delete(remoteId);
        }
    };

    // ─── Main effect: signaling channel lifecycle ────────────────────────────
    useEffect(() => {
        if (!convoyId || !myId) return;

        setVoiceStatus('connecting');

        // Acquire mic immediately so it's ready before any offer/answer
        ensureMic().then((stream) => {
            if (!stream) {
                // Non-fatal: user can still receive audio; they just can't transmit
                console.warn('[WebRTC] Mic not available on join; receive-only mode');
            }

            const sigChannel = supabase.channel(`rtc:${convoyId}`, {
                config: { broadcast: { self: false, ack: false } },
            });

            sigChannelRef.current = sigChannel;

            // ── Signaling handlers ───────────────────────────────────────────

            // Existing peer announced they're here → we create an offer to them
            sigChannel.on('broadcast', { event: 'join' }, async ({ payload }: any) => {
                const peerId: string = payload?.id;
                if (!peerId || peerId === myIdRef.current) return;
                if (peersRef.current.has(peerId)) return; // already connected

                const pc = createPeer(peerId);
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    sigChannel.send({
                        type: 'broadcast',
                        event: 'offer',
                        payload: { from: myIdRef.current, to: peerId, sdp: offer },
                    });
                } catch (e) {
                    console.error('[WebRTC] offer creation failed:', e);
                    cleanupPeer(peerId);
                }
            });

            // We received an offer → create answer
            sigChannel.on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
                if (payload?.to !== myIdRef.current) return;
                const peerId: string = payload.from;

                if (peersRef.current.has(peerId)) {
                    peersRef.current.get(peerId)?.close();
                    peersRef.current.delete(peerId);
                }

                const pc = createPeer(peerId);
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    sigChannel.send({
                        type: 'broadcast',
                        event: 'answer',
                        payload: { from: myIdRef.current, to: peerId, sdp: answer },
                    });
                } catch (e) {
                    console.error('[WebRTC] answer creation failed:', e);
                    cleanupPeer(peerId);
                }
            });

            // We received an answer to our offer
            sigChannel.on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
                if (payload?.to !== myIdRef.current) return;
                const pc = peersRef.current.get(payload.from);
                if (!pc) return;
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
                } catch (e) {
                    console.error('[WebRTC] setRemoteDescription (answer) failed:', e);
                }
            });

            // ICE candidate from remote peer
            sigChannel.on('broadcast', { event: 'ice' }, async ({ payload }: any) => {
                if (payload?.to !== myIdRef.current) return;
                const pc = peersRef.current.get(payload.from);
                if (!pc) return;
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch (e) {
                    // Can happen if remote description not set yet; usually safe to ignore
                }
            });

            // Peer left — clean up connection
            sigChannel.on('broadcast', { event: 'leave' }, ({ payload }: any) => {
                if (payload?.id) cleanupPeer(payload.id);
            });

            // ── Subscribe ────────────────────────────────────────────────────
            sigChannel.subscribe((status: string) => {
                if (status === 'SUBSCRIBED') {
                    setVoiceStatus('connected');
                    console.log('[WebRTC] Signaling channel subscribed — announcing presence');
                    // Announce to all peers that we joined (they'll send us offers)
                    sigChannel.send({
                        type: 'broadcast',
                        event: 'join',
                        payload: { id: myIdRef.current },
                    });
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('[WebRTC] Signaling channel error:', status);
                    setVoiceStatus('error');
                    showToast('Voice connection failed — check your internet', '🎤', '#FF2D55');
                }
            });
        });

        // Cleanup on unmount / convoyId change
        return () => {
            // Announce departure so peers can clean up
            if (sigChannelRef.current) {
                try {
                    sigChannelRef.current.send({
                        type: 'broadcast',
                        event: 'leave',
                        payload: { id: myIdRef.current },
                    });
                } catch (_) {}
                supabase.removeChannel(sigChannelRef.current);
                sigChannelRef.current = null;
            }

            peersRef.current.forEach((_, id) => cleanupPeer(id));
            peersRef.current.clear();

            localStreamRef.current?.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
            delete (window as any).__wf_mic_stream;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [convoyId, myId]);

    // ─── PTT: mute / unmute local tracks ────────────────────────────────────
    useEffect(() => {
        const toggleMic = async () => {
            if (isTalkingLocally) {
                // Resume any suspended audio contexts (Safari)
                audioElemsRef.current.forEach(audio => {
                    audio.play().catch(() => {});
                });

                // Ensure mic is acquired
                const stream = await ensureMic();
                if (!stream) return;

                const tracks = stream.getAudioTracks();

                // If we got a new stream but peers don't have its tracks yet, add them
                peersRef.current.forEach(pc => {
                    const senders = pc.getSenders().filter(s => s.track?.kind === 'audio');
                    if (senders.length === 0) {
                        tracks.forEach(track => pc.addTrack(track, stream));
                    } else {
                        // Re-use existing sender (no renegotiation needed for mute)
                        senders.forEach(s => { if (s.track) s.track.enabled = true; });
                    }
                });

                tracks.forEach(t => { t.enabled = true; });
                console.log('[WebRTC] Mic UNMUTED');
            } else {
                localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
                console.log('[WebRTC] Mic MUTED');
            }
        };

        toggleMic().catch(err => console.error('[WebRTC] PTT error:', err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTalkingLocally]);

    return null;
}

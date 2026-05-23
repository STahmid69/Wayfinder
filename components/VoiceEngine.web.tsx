import { useEffect, useRef } from 'react';
import { showToast } from './Toast';
import { useConvoy } from '../contexts/ConvoyContext';

const APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

export default function VoiceEngine() {
    const { convoyId, myId, isTalkingLocally, setVoiceStatus } = useConvoy();
    const clientRef = useRef<any>(null);
    const localAudioTrackRef = useRef<any>(null);
    const agoraRef = useRef<any>(null);
    const joinedRef = useRef(false);
    const remoteUsersRef = useRef<Map<any, any>>(new Map());

    useEffect(() => {
        if (!convoyId || !myId) return;
        if (!APP_ID) {
            console.error('[VoiceEngine] EXPO_PUBLIC_AGORA_APP_ID is not set — voice will not work');
            showToast('Voice Error: EXPO_PUBLIC_AGORA_APP_ID is missing', '🎤', '#FF2D55');
            setVoiceStatus('error');
            return;
        }
        setVoiceStatus('connecting');

        let audioObserver: MutationObserver | null = null;

        const resumeAudio = () => {
            remoteUsersRef.current.forEach((user) => {
                if (user.audioTrack && !user.audioTrack.isPlaying) {
                    console.log('[VoiceEngine] Resuming remote audio track for user:', user.uid);
                    user.audioTrack.play().catch((e: any) => console.error('[VoiceEngine] Autoplay resume error:', e));
                }
            });
        };

        const initAgora = async () => {
            try {
                const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
                agoraRef.current = AgoraRTC;
                AgoraRTC.setLogLevel(3);

                // Handle autoplay block events
                AgoraRTC.onAutoplayFailed = () => {
                    console.warn('[VoiceEngine] Autoplay blocked — user interaction required');
                };

                // Patch every <audio> Agora creates with playsinline so iOS Safari
                // routes audio to the speaker instead of the earpiece.
                audioObserver = new MutationObserver((mutations) => {
                    mutations.forEach(m => m.addedNodes.forEach(node => {
                        const el = node as HTMLElement;
                        if (el.tagName === 'AUDIO') {
                            el.setAttribute('playsinline', '');
                            el.setAttribute('webkit-playsinline', '');
                        }
                    }));
                });
                audioObserver.observe(document.body, { childList: true, subtree: true });

                // h264 is required for iOS Safari — vp8 is not supported there
                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
                clientRef.current = client;

                client.on('user-published', async (user: any, mediaType: any) => {
                    await client.subscribe(user, mediaType);
                    if (mediaType === 'audio') {
                        remoteUsersRef.current.set(user.uid, user);
                        user.audioTrack?.play();
                    }
                });

                client.on('user-unpublished', (user: any, mediaType: any) => {
                    if (mediaType === 'audio') {
                        remoteUsersRef.current.delete(user.uid);
                        user.audioTrack?.stop();
                    }
                });

                await client.join(APP_ID, convoyId, null, null);
                joinedRef.current = true;
                setVoiceStatus('connected');
                console.log('[VoiceEngine] Joined channel:', convoyId);

            } catch (err: any) {
                console.error('[VoiceEngine] Init error:', err);
                showToast(`Voice Init Error: ${err?.message || err?.toString()}`, '🎤', '#FF2D55');
                setVoiceStatus('error');
            }
        };

        initAgora();

        window.addEventListener('click', resumeAudio);
        window.addEventListener('touchstart', resumeAudio);

        return () => {
            window.removeEventListener('click', resumeAudio);
            window.removeEventListener('touchstart', resumeAudio);
            audioObserver?.disconnect();
            joinedRef.current = false;
            localAudioTrackRef.current?.stop();
            localAudioTrackRef.current?.close();
            localAudioTrackRef.current = null;
            clientRef.current?.leave();
            clientRef.current = null;
            remoteUsersRef.current.clear();
            delete (window as any).__wf_mic_stream;
        };
    }, [convoyId, myId]);

    const createMicTrack = async () => {
        if (localAudioTrackRef.current || !clientRef.current || !agoraRef.current) return;
        try {
            let track: any;

            // Prefer the stream pre-acquired in the PTT press handler (user gesture context).
            // This is critical on iOS Safari where getUserMedia must be in a gesture.
            const preStreamOrPromise = (window as any).__wf_mic_stream;
            let stream: MediaStream | undefined;
            if (preStreamOrPromise) {
                if (preStreamOrPromise instanceof Promise) {
                    try {
                        stream = await preStreamOrPromise;
                    } catch (e) {
                        console.error('[VoiceEngine] Error awaiting pre-acquired stream:', e);
                    }
                } else {
                    stream = preStreamOrPromise;
                }
            }

            if (stream) {
                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack) {
                    track = await agoraRef.current.createCustomAudioTrack({
                        mediaStreamTrack: audioTrack,
                        encoderConfig: 'music_standard',
                    });
                    console.log('[VoiceEngine] Using pre-acquired stream (createCustomAudioTrack)');
                }
            }

            // Fallback: let Agora call getUserMedia itself
            if (!track) {
                track = await agoraRef.current.createMicrophoneAudioTrack({
                    encoderConfig: 'music_standard',
                });
                console.log('[VoiceEngine] Using createMicrophoneAudioTrack (fallback)');
            }

            // Start muted, publish
            await track.setMuted(true);
            localAudioTrackRef.current = track;
            await clientRef.current.publish([track]);
            console.log('[VoiceEngine] Mic track published');
        } catch (err: any) {
            const code = (err?.code ?? err?.name ?? '').toLowerCase();
            const msg = (err?.message ?? err?.toString() ?? '').toLowerCase();
            const full = code + ' ' + msg;
            if (full.includes('not_allowed') || full.includes('notallowed') || full.includes('permission') || full.includes('denied')) {
                showToast('Mic blocked — tap the 🔒 in your browser bar and allow Microphone', '🎤', '#FF2D55');
            } else if (full.includes('not found') || full.includes('notfound') || full.includes('no device') || full.includes('devicenotfound')) {
                showToast('No microphone found', '🎤', '#FF6A00');
            } else if (full.includes('not_readable') || full.includes('notreadable') || full.includes('in use')) {
                showToast('Mic in use by another app — close it and try again', '🎤', '#FF6A00');
            } else {
                showToast(`Mic error [${err?.code ?? err?.name ?? 'unknown'}]`, '🎤', '#FF6A00');
            }
        }
    };

    useEffect(() => {
        const toggleMic = async () => {
            if (!joinedRef.current || !clientRef.current) return;

            if (isTalkingLocally) {
                // Re-play remote tracks (handles Safari autoplay suspension on receive side)
                remoteUsersRef.current.forEach((user) => {
                    try { user.audioTrack?.play(); } catch (_) {}
                });

                if (!localAudioTrackRef.current) {
                    await createMicTrack();
                }

                await localAudioTrackRef.current?.setMuted(false);
                console.log('[VoiceEngine] Mic UNMUTED');
            } else {
                await localAudioTrackRef.current?.setMuted(true);
                console.log('[VoiceEngine] Mic MUTED');
            }
        };

        toggleMic().catch(err => console.error('[VoiceEngine] PTT error:', err));
    }, [isTalkingLocally]);

    return null;
}

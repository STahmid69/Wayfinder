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
            setVoiceStatus('error');
            return;
        }
        setVoiceStatus('connecting');

        let audioObserver: MutationObserver | null = null;

        const initAgora = async () => {
            try {
                const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
                agoraRef.current = AgoraRTC;
                AgoraRTC.setLogLevel(3);

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

                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
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

            } catch (err) {
                console.error('[VoiceEngine] Init error:', err);
                setVoiceStatus('error');
            }
        };

        initAgora();

        return () => {
            audioObserver?.disconnect();
            joinedRef.current = false;
            localAudioTrackRef.current?.stop();
            localAudioTrackRef.current?.close();
            localAudioTrackRef.current = null;
            clientRef.current?.leave();
            clientRef.current = null;
            remoteUsersRef.current.clear();
        };
    }, [convoyId, myId]);

    const createMicTrack = async () => {
        if (localAudioTrackRef.current || !clientRef.current || !agoraRef.current) return;
        try {
            const track = await agoraRef.current.createMicrophoneAudioTrack({
                encoderConfig: 'music_standard',
                bypassWebAudio: true, // skip AudioContext on Safari — avoids suspended-context errors
            });
            await track.setEnabled(false);
            localAudioTrackRef.current = track;
            await clientRef.current.publish([track]);
            console.log('[VoiceEngine] Mic track ready');
        } catch (err: any) {
            console.error('[VoiceEngine] Mic create error:', err);
            const code = (err?.code ?? err?.name ?? '').toLowerCase();
            const msg = (err?.message ?? err?.toString() ?? '').toLowerCase();
            const full = code + ' ' + msg;
            if (full.includes('not_allowed') || full.includes('notallowed') || full.includes('permission') || full.includes('denied')) {
                showToast('Mic blocked — click the 🔒 in your address bar and allow Microphone', '🎤', '#FF2D55');
            } else if (full.includes('not found') || full.includes('notfound') || full.includes('no device') || full.includes('devicenotfound')) {
                showToast('No microphone found — plug one in and rejoin', '🎤', '#FF6A00');
            } else if (full.includes('not_supported') || full.includes('notsupported') || full.includes('audio context') || full.includes('not supported')) {
                showToast('Mic blocked at OS level — go to System Settings → Privacy → Microphone and enable Chrome', '🎤', '#FF2D55');
            } else if (full.includes('not_readable') || full.includes('notreadable') || full.includes('in use')) {
                showToast('Mic in use by another app — close other apps using the mic and rejoin', '🎤', '#FF6A00');
            } else {
                showToast(`Mic error [${err?.code ?? err?.name ?? 'unknown'}] — check browser permissions`, '🎤', '#FF6A00');
            }
        }
    };

    useEffect(() => {
        const toggleMic = async () => {
            if (!joinedRef.current || !clientRef.current) return;

            if (isTalkingLocally) {
                // Resume AudioContext — must happen on every PTT press to
                // counteract mobile browser auto-suspension.
                // resumeAudioContext() is the correct SDK method; getAudioContext() doesn't exist.
                try {
                    agoraRef.current?.resumeAudioContext?.();
                } catch (_) {}

                // Re-play remote tracks in case they stopped after suspension.
                remoteUsersRef.current.forEach((user) => {
                    try { user.audioTrack?.play(); } catch (_) {}
                });

                // First PTT press: create mic track here (= confirmed user gesture,
                // so iOS Safari will show the permission prompt and honour AudioContext).
                if (!localAudioTrackRef.current) {
                    await createMicTrack();
                }

                await localAudioTrackRef.current?.setEnabled(true);
                console.log('[VoiceEngine] Mic ENABLED');
            } else {
                await localAudioTrackRef.current?.setEnabled(false);
                console.log('[VoiceEngine] Mic DISABLED');
            }
        };

        toggleMic().catch(err => console.error('[VoiceEngine] PTT error:', err));
    }, [isTalkingLocally]);

    return null;
}

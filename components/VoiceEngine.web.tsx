import { useEffect, useRef } from 'react';
import { useConvoy } from '../contexts/ConvoyContext';

const APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

export default function VoiceEngine() {
    const { convoyId, myId, isTalkingLocally } = useConvoy();
    const clientRef = useRef<any>(null);
    const localAudioTrackRef = useRef<any>(null);
    const agoraRef = useRef<any>(null);
    const joinedRef = useRef(false);
    const remoteUsersRef = useRef<Map<any, any>>(new Map());

    useEffect(() => {
        if (!convoyId || !myId) return;
        if (!APP_ID) {
            console.error('[VoiceEngine] EXPO_PUBLIC_AGORA_APP_ID is not set — voice will not work');
            return;
        }

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
                console.log('[VoiceEngine] Joined channel:', convoyId);

                // If microphone permission is already granted, create the track now
                // so there's no delay on the first PTT press.
                try {
                    const perm = await navigator.permissions?.query({ name: 'microphone' as PermissionName });
                    if (perm?.state === 'granted') {
                        await createMicTrack();
                    }
                } catch (_) {}

            } catch (err) {
                console.error('[VoiceEngine] Init error:', err);
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
            });
            await track.setEnabled(false);
            localAudioTrackRef.current = track;
            await clientRef.current.publish([track]);
            console.log('[VoiceEngine] Mic track ready');
        } catch (err) {
            console.error('[VoiceEngine] Mic create error:', err);
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

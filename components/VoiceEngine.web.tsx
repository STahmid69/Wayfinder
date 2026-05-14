import { useEffect, useRef } from 'react';
import { useConvoy } from '../contexts/ConvoyContext';

const APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

export default function VoiceEngine() {
    const { convoyId, myId, isTalkingLocally } = useConvoy();
    const clientRef = useRef<any>(null);
    const localAudioTrackRef = useRef<any>(null);
    const agoraRef = useRef<any>(null);
    const joinedRef = useRef(false);

    useEffect(() => {
        if (!convoyId || !APP_ID) return;

        const initAgora = async () => {
            try {
                const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
                agoraRef.current = AgoraRTC;

                const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
                clientRef.current = client;

                client.on('user-published', async (user: any, mediaType: any) => {
                    await client.subscribe(user, mediaType);
                    if (mediaType === 'audio') {
                        user.audioTrack?.play();
                    }
                });

                client.on('user-unpublished', (user: any) => {
                    user.audioTrack?.stop();
                });

                await client.join(APP_ID, convoyId, null, myId);
                joinedRef.current = true;
                console.log('[VoiceEngine] Joined Agora channel:', convoyId);

                // Pre-create mic track but keep it disabled (muted)
                // This prevents the "3-second lag" or "unpublish crash"
                const track = await AgoraRTC.createMicrophoneAudioTrack();
                await track.setEnabled(false);
                localAudioTrackRef.current = track;
                await client.publish([track]);
                console.log('[VoiceEngine] Mic track published (disabled)');
            } catch (err) {
                console.error('[VoiceEngine] Init error:', err);
            }
        };

        initAgora();

        return () => {
            joinedRef.current = false;
            localAudioTrackRef.current?.stop();
            localAudioTrackRef.current?.close();
            clientRef.current?.leave();
            clientRef.current = null;
        };
    }, [convoyId]);

    useEffect(() => {
        const toggleMic = async () => {
            if (!localAudioTrackRef.current || !joinedRef.current) return;
            
            try {
                if (isTalkingLocally) {
                    console.log('[VoiceEngine] Mic ENABLED');
                    await localAudioTrackRef.current.setEnabled(true);
                } else {
                    console.log('[VoiceEngine] Mic DISABLED');
                    await localAudioTrackRef.current.setEnabled(false);
                }
            } catch (err) {
                console.error('[VoiceEngine] PTT Toggle Error:', err);
            }
        };

        toggleMic();
    }, [isTalkingLocally]);

    return null;
}

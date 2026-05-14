import { useEffect, useRef } from 'react';
import { useConvoy } from '../contexts/ConvoyContext';

const APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID || '';

export default function VoiceEngine() {
    const { convoyId, myId, isTalkingLocally } = useConvoy();
    const clientRef = useRef<any>(null);
    const localAudioTrackRef = useRef<any>(null);
    const agoraRef = useRef<any>(null);
    const joinedRef = useRef(false);
    const isPublishingRef = useRef(false);

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

                client.enableAudioVolumeIndicator();

                await client.join(APP_ID, convoyId, null, myId);
                joinedRef.current = true;
                console.log('[VoiceEngine] Joined Agora channel:', convoyId);
            } catch (err) {
                console.error('[VoiceEngine] Init error:', err);
            }
        };

        initAgora();

        return () => {
            joinedRef.current = false;
            localAudioTrackRef.current?.close();
            clientRef.current?.leave();
            clientRef.current = null;
        };
    }, [convoyId]);

    useEffect(() => {
        const AgoraRTC = agoraRef.current;
        if (!clientRef.current || !AgoraRTC || !joinedRef.current) return;

        const toggleMic = async () => {
            try {
                if (isTalkingLocally) {
                    if (!localAudioTrackRef.current && !isPublishingRef.current) {
                        isPublishingRef.current = true;
                        console.log('[VoiceEngine] PTT Active: Starting mic...');
                        try {
                            const track = await AgoraRTC.createMicrophoneAudioTrack();
                            localAudioTrackRef.current = track;
                            await clientRef.current?.publish([track]);
                        } finally {
                            isPublishingRef.current = false;
                        }
                    }
                } else {
                    // Check if we need to stop
                    if (localAudioTrackRef.current && !isPublishingRef.current) {
                        console.log('[VoiceEngine] PTT Inactive: Stopping mic...');
                        const trackToClose = localAudioTrackRef.current;
                        localAudioTrackRef.current = null;
                        
                        try {
                            await clientRef.current?.unpublish([trackToClose]);
                        } catch (e) {
                            console.warn('[VoiceEngine] Unpublish failed:', e);
                        } finally {
                            trackToClose.close();
                        }
                    }
                }
            } catch (err) {
                console.error('[VoiceEngine] PTT Stability Error:', err);
                isPublishingRef.current = false;
            }
        };

        toggleMic();
    }, [isTalkingLocally]);

    return null;
}

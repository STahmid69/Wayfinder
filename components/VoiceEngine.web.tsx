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

                client.enableAudioVolumeIndicator();
                client.on('volume-indicator', (volumes) => {
                    volumes.forEach((volume) => {
                        if (volume.level > 5) {
                            console.log(`[VoiceEngine] User ${volume.uid} is making noise: ${volume.level}`);
                        }
                    });
                });

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
                    if (!localAudioTrackRef.current) {
                        console.log('[VoiceEngine] PTT Active: Starting mic...');
                        const track = await AgoraRTC.createMicrophoneAudioTrack();
                        localAudioTrackRef.current = track;
                        await clientRef.current?.publish([track]);
                    }
                } else {
                    setTimeout(async () => {
                        if (!isTalkingLocally && localAudioTrackRef.current && joinedRef.current) {
                            console.log('[VoiceEngine] PTT Inactive: Stopping mic...');
                            try {
                                await clientRef.current?.unpublish([localAudioTrackRef.current]);
                            } catch (e) {
                                console.warn('[VoiceEngine] Unpublish failed:', e);
                            }
                            localAudioTrackRef.current.close();
                            localAudioTrackRef.current = null;
                        }
                    }, 100);
                }
            } catch (err) {
                console.error('[VoiceEngine] PTT Stability Error:', err);
            }
        };

        toggleMic();
    }, [isTalkingLocally]);

    return null;
}

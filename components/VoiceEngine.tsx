import { useEffect, useRef } from 'react';
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from '../lib/agora';
import { useConvoy } from '../contexts/ConvoyContext';

const AGORA_APP_ID = typeof process !== 'undefined'
    ? (process.env?.EXPO_PUBLIC_AGORA_APP_ID || '')
    : '';

export default function VoiceEngine() {
    const { convoyId, myId, isTalkingLocally } = useConvoy();
    const engineRef = useRef<any>(null);
    const currentChannelRef = useRef<string | null>(null);

    // Initialize once on mount, tear down on unmount
    useEffect(() => {
        if (!AGORA_APP_ID || !convoyId) {
            return;
        }

        try {
            const engine = createAgoraRtcEngine();
            engine.initialize({
                appId: AGORA_APP_ID,
                channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
            });
            engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
            engine.enableAudio();
            engine.muteLocalAudioStream(true); // always start muted until PTT pressed

            // Route audio through speaker (not earpiece) on both platforms
            try {
                engine.setDefaultAudioRouteToSpeakerphone(true);
                engine.setEnableSpeakerphone(true);
            } catch (_) {}

            engineRef.current = engine;
        } catch (e) {
            console.warn('[VoiceEngine] init error:', e);
        }

        return () => {
            try {
                engineRef.current?.leaveChannel();
                engineRef.current?.release();
            } catch (_) {}
            engineRef.current = null;
            currentChannelRef.current = null;
        };
    }, [convoyId]); // Re-init if convoy ID changes (rare but possible)

    // Join or switch Agora channel when convoyId changes
    useEffect(() => {
        if (!engineRef.current || !convoyId) return;

        // Prefix with 'wf_' to namespace channels
        const agoraChannel = `wf_${convoyId}`;
        if (currentChannelRef.current === agoraChannel) return;

        try {
            if (currentChannelRef.current) {
                engineRef.current.leaveChannel();
            }
            engineRef.current.joinChannel('', agoraChannel, 0, {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                autoSubscribeAudio: true,
            });
            currentChannelRef.current = agoraChannel;
        } catch (e) {
            console.warn('[VoiceEngine] channel join error:', e);
        }
    }, [convoyId]);

    // Mute / unmute in response to PTT button press
    useEffect(() => {
        try {
            engineRef.current?.muteLocalAudioStream(!isTalkingLocally);
        } catch (_) {}
    }, [isTalkingLocally]);

    return null;
}

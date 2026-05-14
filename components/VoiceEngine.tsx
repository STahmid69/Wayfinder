import { useEffect, useRef } from 'react';
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from '../lib/agora';

const AGORA_APP_ID = typeof process !== 'undefined'
    ? (process.env?.EXPO_PUBLIC_AGORA_APP_ID || '')
    : '';

interface Props {
    channelId: string;  // Agora channel base name (convoy code or sorted user-pair ID)
    isTalking: boolean; // true = unmute and transmit, false = mute
}

export default function VoiceEngine({ channelId, isTalking }: Props) {
    const engineRef = useRef<any>(null);
    const currentChannelRef = useRef<string | null>(null);

    // Initialize once on mount, tear down on unmount
    useEffect(() => {
        if (!AGORA_APP_ID) {
            console.warn('[VoiceEngine] EXPO_PUBLIC_AGORA_APP_ID is not set');
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
    }, []);

    // Join or switch Agora channel when channelId changes
    useEffect(() => {
        if (!engineRef.current || !channelId) return;

        // Prefix with 'wf_' to namespace channels away from any other Agora apps using the same App ID
        const agoraChannel = `wf_${channelId}`;
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
    }, [channelId]);

    // Mute / unmute in response to PTT button press
    useEffect(() => {
        try {
            engineRef.current?.muteLocalAudioStream(!isTalking);
        } catch (_) {}
    }, [isTalking]);

    return null;
}

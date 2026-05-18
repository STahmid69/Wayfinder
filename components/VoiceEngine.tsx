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

            // ─── DISCORD-QUALITY AUDIO CONFIGURATION ─────────────────────────
            // Audio Profile: 48kHz sample rate, stereo, 128kbps bitrate
            // This is the highest quality Agora offers — same tier as Discord/Zoom HD
            try {
                // AudioProfileType: 4 = MusicHighQualityStereo (48kHz, 128kbps, stereo)
                // AudioScenarioType: 3 = GameStreaming (optimized for voice + low latency)
                engine.setAudioProfile(4, 3);
            } catch (_) {
                // Fallback: try enum-based approach
                try {
                    engine.setAudioProfile(3, 3); // MusicHighQuality mono fallback
                } catch (__) {}
            }

            // ─── NOISE SUPPRESSION (AI-powered, like Discord Krisp) ───────────
            try {
                // Enable Agora AI noise suppression (aggressive mode)
                // 0 = off, 1 = mild, 2 = aggressive  
                engine.setParameters('{"che.audio.ains_mode": 2}');
                // Enable stationary noise suppression
                engine.setParameters('{"che.audio.ns.mode": 2}');
            } catch (_) {}

            // ─── ECHO CANCELLATION ───────────────────────────────────────────
            try {
                // Full-band AEC for speakerphone usage in cars
                engine.setParameters('{"che.audio.aec.splittingFilter": 1}');
                // Mobile AEC optimization
                engine.setParameters('{"che.audio.aec.mobile": 1}');
            } catch (_) {}

            // ─── AUTOMATIC GAIN CONTROL ──────────────────────────────────────
            try {
                // Target level for AGC — keeps volume consistent between speakers
                engine.setParameters('{"che.audio.agc.targetlevel": 3}');
                // Compression gain
                engine.setParameters('{"che.audio.agc.compgain": 12}');
            } catch (_) {}

            // ─── AUDIO ENCODING / CODEC ──────────────────────────────────────
            try {
                // Use OPUS codec at highest bitrate (Discord also uses OPUS)
                engine.setParameters('{"che.audio.opus.bitrate": 128000}');
                // Complexity: 10 = highest quality encoding
                engine.setParameters('{"che.audio.opus.complexity": 10}');
                // Enable FEC for packet loss resilience
                engine.setParameters('{"che.audio.opus.inbandfec": 1}');
                // DTX off — keep audio stream consistent (no choppy cutoffs)
                engine.setParameters('{"che.audio.opus.dtx": 0}');
            } catch (_) {}

            // ─── SIGNAL PROCESSING ───────────────────────────────────────────
            try {
                // Enable high-pass filter to remove low-frequency rumble (road/wind noise)
                engine.setParameters('{"che.audio.hp_filter": 1}');
                // Disable automatic volume adjustment by OS (we handle it via AGC)
                engine.setParameters('{"che.audio.input_sample_rate": 48000}');
            } catch (_) {}

            engine.enableAudio();
            engine.muteLocalAudioStream(true); // always start muted until PTT pressed

            // Route audio through speaker (not earpiece) on both platforms
            try {
                engine.setDefaultAudioRouteToSpeakerphone(true);
                engine.setEnableSpeakerphone(true);
            } catch (_) {}

            engineRef.current = engine;
            console.log('[VoiceEngine] Initialized with Discord-quality audio profile');
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

        const agoraChannel = convoyId;
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
            console.log('[VoiceEngine] Joined channel:', agoraChannel);
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

import { useEffect, useRef } from 'react';
import { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } from '../lib/agora';
import { useConvoy } from '../contexts/ConvoyContext';

const AGORA_APP_ID = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AGORA_APP_ID)
    ? process.env.EXPO_PUBLIC_AGORA_APP_ID
    : '9c7b5f9b2e8c4677a15b0a18d5d2a722';

/**
 * How long (ms) to stay in the Agora channel after voice activity stops.
 * Keeps the channel warm for quick back-and-forth without burning minutes
 * during long silent stretches.
 */
const IDLE_LEAVE_DELAY_MS = 30_000; // 30 seconds

export default function VoiceEngine() {
    const { convoyId, myId, isTalkingLocally, whoIsTalking } = useConvoy();
    const engineRef = useRef<any>(null);
    const inChannelRef = useRef(false);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── One-time engine init ────────────────────────────────────────────────
    useEffect(() => {
        if (!AGORA_APP_ID || !convoyId) return;

        try {
            const engine = createAgoraRtcEngine();
            engine.initialize({
                appId: AGORA_APP_ID,
                channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
            });
            engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

            // ─── DISCORD-QUALITY AUDIO CONFIGURATION ─────────────────────────
            // Audio Profile: 48kHz sample rate, stereo, 128kbps bitrate
            try {
                // AudioProfileType: 4 = MusicHighQualityStereo (48kHz, 128kbps, stereo)
                // AudioScenarioType: 3 = GameStreaming (optimized for voice + low latency)
                engine.setAudioProfile(4, 3);
            } catch (_) {
                try { engine.setAudioProfile(3, 3); } catch (__) {}
            }

            // ─── NOISE SUPPRESSION (AI-powered) ──────────────────────────────
            try {
                engine.setParameters('{"che.audio.ains_mode": 2}');
                engine.setParameters('{"che.audio.ns.mode": 2}');
            } catch (_) {}

            // ─── ECHO CANCELLATION ───────────────────────────────────────────
            try {
                engine.setParameters('{"che.audio.aec.splittingFilter": 1}');
                engine.setParameters('{"che.audio.aec.mobile": 1}');
            } catch (_) {}

            // ─── AUTOMATIC GAIN CONTROL ──────────────────────────────────────
            try {
                engine.setParameters('{"che.audio.agc.targetlevel": 3}');
                engine.setParameters('{"che.audio.agc.compgain": 12}');
            } catch (_) {}

            // ─── AUDIO ENCODING / CODEC ──────────────────────────────────────
            try {
                engine.setParameters('{"che.audio.opus.bitrate": 128000}');
                engine.setParameters('{"che.audio.opus.complexity": 10}');
                engine.setParameters('{"che.audio.opus.inbandfec": 1}');
                engine.setParameters('{"che.audio.opus.dtx": 0}');
            } catch (_) {}

            // ─── SIGNAL PROCESSING ───────────────────────────────────────────
            try {
                engine.setParameters('{"che.audio.hp_filter": 1}');
                engine.setParameters('{"che.audio.input_sample_rate": 48000}');
            } catch (_) {}

            engine.enableAudio();
            engine.muteLocalAudioStream(true); // always start muted

            try {
                engine.setDefaultAudioRouteToSpeakerphone(true);
                engine.setEnableSpeakerphone(true);
            } catch (_) {}

            engineRef.current = engine;
            console.log('[VoiceEngine] Engine initialized (not yet in channel — lazy join)');
        } catch (e) {
            console.warn('[VoiceEngine] init error:', e);
        }

        return () => {
            clearTimeout(idleTimerRef.current ?? undefined);
            try {
                if (inChannelRef.current) engineRef.current?.leaveChannel();
                engineRef.current?.release();
            } catch (_) {}
            engineRef.current = null;
            inChannelRef.current = false;
        };
    }, [convoyId]); // Re-init if convoy ID changes

    // ─── Lazy join helper ────────────────────────────────────────────────────
    const ensureJoined = () => {
        if (!engineRef.current || !convoyId || inChannelRef.current) return;
        try {
            engineRef.current.joinChannel('', convoyId, 0, {
                clientRoleType: ClientRoleType.ClientRoleBroadcaster,
                publishMicrophoneTrack: true,
                autoSubscribeAudio: true,
            });
            inChannelRef.current = true;
            console.log('[VoiceEngine] Lazy-joined channel:', convoyId);
        } catch (e) {
            console.warn('[VoiceEngine] channel join error:', e);
        }
    };

    const scheduleLeave = () => {
        // Cancel any existing timer first
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

        idleTimerRef.current = setTimeout(() => {
            if (!engineRef.current || !inChannelRef.current) return;
            try {
                engineRef.current.leaveChannel();
                inChannelRef.current = false;
                console.log('[VoiceEngine] Left channel after idle timeout (saving minutes)');
            } catch (_) {}
        }, IDLE_LEAVE_DELAY_MS);
    };

    // ─── PTT: mute/unmute + lazy join on press ───────────────────────────────
    useEffect(() => {
        if (isTalkingLocally) {
            // Cancel any pending leave — stay in channel while transmitting
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            // Join channel on first PTT press (lazy)
            ensureJoined();
            try { engineRef.current?.muteLocalAudioStream(false); } catch (_) {}
        } else {
            try { engineRef.current?.muteLocalAudioStream(true); } catch (_) {}
            // Only schedule leave if nobody else is talking either
            if (!whoIsTalking) scheduleLeave();
        }
    }, [isTalkingLocally]);

    // ─── Someone else started/stopped talking ───────────────────────────────
    useEffect(() => {
        if (whoIsTalking && whoIsTalking !== myId) {
            // A remote peer is transmitting — join so we can hear them
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            ensureJoined();
        } else if (!whoIsTalking && !isTalkingLocally) {
            // Nobody is talking — start the idle leave countdown
            scheduleLeave();
        }
    }, [whoIsTalking]);

    return null;
}

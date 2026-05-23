// Call this from a true user-gesture handler (pointer-down/touchstart) before
// any React state changes. iOS Safari requires getUserMedia to be called within
// the synchronous activation window of a user gesture.
// VoiceEngine.web reads window.__wf_mic_stream and uses createCustomAudioTrack.
export function acquireMicInGesture(): void {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    // If we already have an active stream, don't request a new one!
    const existing = (window as any).__wf_mic_stream;
    if (existing) {
        if (existing instanceof Promise) return; // already loading
        if (existing.active && existing.getAudioTracks().some((t: any) => t.readyState === 'live')) {
            return;
        }
    }

    (window as any).__wf_mic_stream = navigator.mediaDevices.getUserMedia({ audio: true });
}

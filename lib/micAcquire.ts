// Call this from a true user-gesture handler (pointer-down/touchstart) before
// any React state changes. iOS Safari requires getUserMedia to be called within
// the synchronous activation window of a user gesture.
// VoiceEngine.web reads window.__wf_mic_stream and uses createCustomAudioTrack.
export function acquireMicInGesture(): void {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            if (typeof window !== 'undefined') (window as any).__wf_mic_stream = stream;
        })
        .catch(() => { /* VoiceEngine will surface permission errors on first PTT */ });
}

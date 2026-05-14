export const createAgoraRtcEngine = () => ({
    initialize: () => { console.log("Mock: Initializing Agora on Web"); },
    setChannelProfile: () => {},
    setClientRole: () => {},
    enableAudio: () => {},
    joinChannel: () => { console.log("Mock: Joining Channel on Web"); },
    leaveChannel: () => { console.log("Mock: Leaving Channel on Web"); },
    release: () => {},
});

export const ChannelProfileType = { ChannelProfileLiveBroadcasting: 1 };
export const ClientRoleType = { ClientRoleBroadcaster: 1 };

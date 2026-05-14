let createAgoraRtcEngine: any;
let ChannelProfileType: any = { ChannelProfileLiveBroadcasting: 1 };
let ClientRoleType: any = { ClientRoleBroadcaster: 1 };

try {
    const Agora = require('react-native-agora');
    createAgoraRtcEngine = Agora.createAgoraRtcEngine;
    ChannelProfileType = Agora.ChannelProfileType;
    ClientRoleType = Agora.ClientRoleType;
} catch (e) {
    console.log("Agora native module not found, using mock for Expo Go.");
    createAgoraRtcEngine = () => ({
        initialize: () => { console.log("Mock: Initializing Agora"); },
        setChannelProfile: () => {},
        setClientRole: () => {},
        enableAudio: () => {},
        joinChannel: () => { console.log("Mock: Joining Channel"); },
        leaveChannel: () => { console.log("Mock: Leaving Channel"); },
        release: () => {},
    });
}

export { createAgoraRtcEngine, ChannelProfileType, ClientRoleType };

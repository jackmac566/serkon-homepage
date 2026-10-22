const sources: Resource[] = [
    {
        name: 'computerSetupModel',
        type: 'gltfModel',
        path: 'models/Computer/computer_setup.glb',
    },
    {
        name: 'computerSetupTexture',
        type: 'texture',
        path: 'models/Computer/baked_computer.jpg',
    },
    {
        name: 'environmentModel',
        type: 'gltfModel',
        path: 'models/World/environment.glb',
    },
    {
        name: 'environmentTexture',
        type: 'texture',
        path: 'models/World/baked_environment.jpg',
    },
    {
        name: 'decorModel',
        type: 'gltfModel',
        path: 'models/Decor/decor.glb',
    },
    {
        name: 'decorTexture',
        type: 'texture',
        path: 'models/Decor/baked_decor_modified.jpg',
    },
    {
        name: 'monitorSmudgeTexture',
        type: 'texture',
        path: 'textures/monitor/layers/compressed/smudges.jpg',
    },
    {
        name: 'monitorShadowTexture',
        type: 'texture',
        path: 'textures/monitor/layers/compressed/shadow-compressed.png',
    },
    {
        name: 'mouseDown',
        type: 'audio',
        path: 'audio/mouseDown.wav',
    },
    {
        name: 'mouseUp',
        type: 'audio',
        path: 'audio/mouseUp.wav',
    },
    {
        name: 'keyboardKeydown1',
        type: 'audio',
        path: 'audio/keyboardKeydown1.wav',
    },
    {
        name: 'keyboardKeydown2',
        type: 'audio',
        path: 'audio/keyboardKeydown2.wav',
    },
    {
        name: 'keyboardKeydown3',
        type: 'audio',
        path: 'audio/keyboardKeydown3.wav',
    },
    {
        name: 'keyboardKeydown4',
        type: 'audio',
        path: 'audio/keyboardKeydown4.wav',
    },
    {
        name: 'keyboardKeydown5',
        type: 'audio',
        path: 'audio/keyboardKeydown5.wav',
    },
    {
        name: 'keyboardKeydown6',
        type: 'audio',
        path: 'audio/keyboardKeydown6.wav',
    },
    {
        name: 'startup',
        type: 'audio',
        path: 'audio/startup.wav',
    },
    {
        name: 'office',
        type: 'audio',
        path: location.pathname.includes('/studio/dist/') ? '../../explorer/dist/sounds/musics/Baguira.mp3' : '../explorer/sounds/musics/Baguira.mp3',
    },
    {
        name: 'ccType',
        type: 'audio',
        path: 'audio/ccType.wav',
    },
];

export default sources;

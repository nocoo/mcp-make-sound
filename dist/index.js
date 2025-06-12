#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
const server = new Server({
    name: 'mcp-make-sound',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
async function playSound(soundType) {
    return new Promise((resolve, reject) => {
        let soundName;
        switch (soundType) {
            case 'info':
                soundName = 'Glass';
                break;
            case 'warning':
                soundName = 'Purr';
                break;
            case 'error':
                soundName = 'Sosumi';
                break;
            default:
                soundName = 'Glass';
        }
        const afplay = spawn('afplay', [`/System/Library/Sounds/${soundName}.aiff`]);
        afplay.on('close', (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`Sound playback failed with code ${code}`));
            }
        });
        afplay.on('error', (error) => {
            reject(error);
        });
    });
}
async function playCustomSound(type, options) {
    return new Promise((resolve, reject) => {
        let process;
        switch (type) {
            case 'system':
                const soundName = options.name;
                if (!soundName) {
                    reject(new Error('Sound name is required for system sounds'));
                    return;
                }
                process = spawn('afplay', [`/System/Library/Sounds/${soundName}.aiff`]);
                break;
            case 'tts':
                const voice = options.voice;
                const text = options.text;
                if (!text) {
                    reject(new Error('Text is required for text-to-speech'));
                    return;
                }
                const args = voice ? ['-v', voice, text] : [text];
                process = spawn('say', args);
                break;
            case 'file':
                const filePath = options.path;
                if (!filePath) {
                    reject(new Error('File path is required for file sounds'));
                    return;
                }
                process = spawn('afplay', [filePath]);
                break;
            default:
                reject(new Error(`Unknown sound type: ${type}`));
                return;
        }
        process.on('close', (code) => {
            if (code === 0) {
                resolve(`${type} sound played successfully`);
            }
            else {
                reject(new Error(`Sound playback failed with code ${code}`));
            }
        });
        process.on('error', (error) => {
            reject(error);
        });
    });
}
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'play_info_sound',
                description: 'Play an informational system sound',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'play_warning_sound',
                description: 'Play a warning system sound',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'play_error_sound',
                description: 'Play an error system sound',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'play_sound',
                description: 'Play various types of sounds with customizable parameters',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['system', 'tts', 'file'],
                            description: 'Type of sound to play'
                        },
                        name: {
                            type: 'string',
                            description: 'For system sounds: sound name (Basso, Blow, Bottle, Frog, Funk, Glass, Hero, Morse, Ping, Pop, Purr, Sosumi, Submarine, Tink)'
                        },
                        voice: {
                            type: 'string',
                            description: 'For TTS: voice name (Albert, Alice, Bad News, Bells, etc.)'
                        },
                        text: {
                            type: 'string',
                            description: 'For TTS: text to speak'
                        },
                        path: {
                            type: 'string',
                            description: 'For file sounds: absolute path to audio file'
                        }
                    },
                    required: ['type'],
                    additionalProperties: false
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'play_info_sound':
                await playSound('info');
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Info sound played successfully',
                        },
                    ],
                };
            case 'play_warning_sound':
                await playSound('warning');
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Warning sound played successfully',
                        },
                    ],
                };
            case 'play_error_sound':
                await playSound('error');
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Error sound played successfully',
                        },
                    ],
                };
            case 'play_sound':
                const { type, ...options } = args;
                const result = await playCustomSound(type, options);
                return {
                    content: [
                        {
                            type: 'text',
                            text: result,
                        },
                    ],
                };
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error playing sound: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Sound Server running on stdio');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import { stat } from 'node:fs/promises';
import { isAbsolute } from 'node:path';

type SystemSound = { type: 'system'; name: string };
type TTSSound = { type: 'tts'; text: string; voice?: string };
type FileSound = { type: 'file'; path: string };

type PlaySoundOptions = SystemSound | TTSSound | FileSound;

const ALLOWED_SYSTEM_SOUNDS = new Set([
  'Basso', 'Blow', 'Bottle', 'Frog', 'Funk', 'Glass', 'Hero', 'Morse',
  'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink'
]);

const ALLOWED_TTS_VOICES = new Set([
  // Popular English voices
  'Albert', 'Alice', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bruce', 'Bubbles',
  'Cellos', 'Daniel', 'Deranged', 'Fred', 'Good News', 'Hysterical', 'Junior',
  'Kathy', 'Pipe Organ', 'Princess', 'Ralph', 'Trinoids', 'Whisper', 'Zarvox',
  // International voices (commonly available)
  'Anna', 'Amélie', 'Daria', 'Eddy', 'Fiona', 'Jorge', 'Juan', 'Luca',
  'Marie', 'Moira', 'Nora', 'Rishi', 'Samantha', 'Serena', 'Tessa', 'Thomas',
  'Veena', 'Victoria', 'Xander', 'Yelda', 'Zosia'
]);

const MAX_TTS_TEXT_LENGTH = 1000;

const server = new Server(
  {
    name: 'mcp-make-sound',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

async function playSound(soundType: 'info' | 'warning' | 'error'): Promise<void> {
  return new Promise((resolve, reject) => {
    let soundName: string;
    
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
      } else {
        reject(new Error(`Sound playback failed with code ${code}`));
      }
    });
    
    afplay.on('error', (error) => {
      reject(error);
    });
  });
}

async function playCustomSound(options: PlaySoundOptions): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let child: ReturnType<typeof spawn>;
    
    switch (options.type) {
      case 'system': {
        const { name: soundName } = options;
        if (!ALLOWED_SYSTEM_SOUNDS.has(soundName)) {
          reject(new Error(`Unsupported system sound: ${soundName}`));
          return;
        }
        child = spawn('afplay', [`/System/Library/Sounds/${soundName}.aiff`]);
        break;
      }
        
      case 'tts': {
        const { text, voice } = options;
        
        // Validate text length
        if (text.length > MAX_TTS_TEXT_LENGTH) {
          reject(new Error(`Text too long (max ${MAX_TTS_TEXT_LENGTH} characters)`));
          return;
        }
        
        // Validate voice if provided, gracefully fall back to system default
        let finalVoice = voice;
        if (voice !== undefined && !ALLOWED_TTS_VOICES.has(voice)) {
          // Log warning but continue with system default
          console.warn(`Unsupported voice: ${voice}. Using system default voice.`);
          finalVoice = undefined;
        }
        
        const args = finalVoice ? ['-v', finalVoice, text] : [text];
        child = spawn('say', args);
        break;
      }
        
      case 'file': {
        const { path: filePath } = options;
        if (!isAbsolute(filePath)) {
          reject(new Error('File path must be absolute'));
          return;
        }
        try {
          const stats = await stat(filePath);
          if (!stats.isFile()) {
            reject(new Error('Path must point to a file'));
            return;
          }
        } catch (error) {
          reject(new Error(`File not found or inaccessible: ${filePath}`));
          return;
        }
        child = spawn('afplay', [filePath]);
        break;
      }
        
      default: {
        // TypeScript ensures this is unreachable, but keep for runtime safety
        const exhaustiveCheck: never = options;
        reject(new Error(`Unknown sound type: ${(exhaustiveCheck as any).type}`));
        return;
      }
    }
    
    child.on('close', (code: number) => {
      if (code === 0) {
        resolve(`${options.type} sound played successfully`);
      } else {
        reject(new Error(`Sound playback failed with code ${code}`));
      }
    });
    
    child.on('error', (error: Error) => {
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
          oneOf: [
            {
              required: ['type', 'name'],
              properties: {
                type: { const: 'system' },
                name: {
                  type: 'string',
                  enum: ['Basso', 'Blow', 'Bottle', 'Frog', 'Funk', 'Glass', 'Hero', 'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink'],
                  description: 'System sound name'
                }
              }
            },
            {
              required: ['type', 'text'],
              properties: {
                type: { const: 'tts' },
                text: {
                  type: 'string',
                  description: 'Text to speak'
                },
                voice: {
                  type: 'string',
                  description: 'Voice name (optional, uses system default if not specified)'
                }
              }
            },
            {
              required: ['type', 'path'],
              properties: {
                type: { const: 'file' },
                path: {
                  type: 'string',
                  description: 'Absolute path to audio file'
                }
              }
            }
          ],
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

      case 'play_sound': {
        const soundOptions = args as PlaySoundOptions;
        const result = await playCustomSound(soundOptions);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
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
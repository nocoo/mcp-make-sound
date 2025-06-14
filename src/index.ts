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
const PROCESS_TIMEOUT_MS = 10000; // 10 seconds

// Request throttling
const activeRequests = new Set<string>();

// File cache with eviction strategy
interface CacheEntry {
  stats: any;
  timestamp: number;
  lastAccessed: number;
}

const fileStatCache = new Map<string, CacheEntry>();
const FILE_CACHE_TTL = 60000; // 1 minute
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries

// Cache cleanup interval (runs every 5 minutes)
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupCache(): void {
  const now = Date.now();
  const entries = Array.from(fileStatCache.entries());
  
  // Remove expired entries
  let removed = 0;
  for (const [key, entry] of entries) {
    if (now - entry.timestamp > FILE_CACHE_TTL) {
      fileStatCache.delete(key);
      removed++;
    }
  }
  
  // If still over limit, remove LRU entries
  if (fileStatCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(fileStatCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = fileStatCache.size - MAX_CACHE_SIZE;
    for (let i = 0; i < toRemove; i++) {
      fileStatCache.delete(sortedEntries[i][0]);
      removed++;
    }
  }
}

// Set up periodic cache cleanup
setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);

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
  const requestId = `${soundType}-${Date.now()}`;
  
  // Throttle requests to prevent conflicts
  if (activeRequests.has(soundType)) {
    throw new Error(`${soundType} sound already playing`);
  }
  
  activeRequests.add(soundType);
  
  try {
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
      
      // Add timeout
      const timeout = setTimeout(() => {
        afplay.kill();
        reject(new Error('Sound playback timed out'));
      }, PROCESS_TIMEOUT_MS);
      
      afplay.once('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Sound playback failed with code ${code}`));
        }
      });
      
      afplay.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  } finally {
    activeRequests.delete(soundType);
  }
}

async function getCachedFileStat(filePath: string): Promise<any> {
  const now = Date.now();
  const cached = fileStatCache.get(filePath);
  
  if (cached && (now - cached.timestamp) < FILE_CACHE_TTL) {
    // Update last accessed time for LRU
    cached.lastAccessed = now;
    return cached.stats;
  }
  
  try {
    const stats = await stat(filePath);
    
    // Clean up cache if it's getting too large before adding new entry
    if (fileStatCache.size >= MAX_CACHE_SIZE) {
      cleanupCache();
    }
    
    fileStatCache.set(filePath, { 
      stats, 
      timestamp: now, 
      lastAccessed: now 
    });
    return stats;
  } catch (error) {
    fileStatCache.delete(filePath);
    throw error;
  }
}

async function playCustomSound(options: PlaySoundOptions): Promise<string> {
  const requestId = `${options.type}-${Date.now()}`;
  
  // Throttle same type requests
  if (activeRequests.has(options.type)) {
    throw new Error(`${options.type} sound already playing`);
  }
  
  activeRequests.add(options.type);
  
  try {
    let child: ReturnType<typeof spawn>;
    
    // Validate and spawn process
    switch (options.type) {
      case 'system': {
        const { name: soundName } = options;
        if (!ALLOWED_SYSTEM_SOUNDS.has(soundName)) {
          throw new Error(`Unsupported system sound: ${soundName}`);
        }
        child = spawn('afplay', [`/System/Library/Sounds/${soundName}.aiff`]);
        break;
      }
        
      case 'tts': {
        const { text, voice } = options;
        
        // Validate text length
        if (text.length > MAX_TTS_TEXT_LENGTH) {
          throw new Error(`Text too long (max ${MAX_TTS_TEXT_LENGTH} characters)`);
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
          throw new Error('File path must be absolute');
        }
        try {
          const stats = await getCachedFileStat(filePath);
          if (!stats.isFile()) {
            throw new Error('Path must point to a file');
          }
        } catch (error) {
          throw new Error(`File not found or inaccessible: ${filePath}`);
        }
        child = spawn('afplay', [filePath]);
        break;
      }
        
      default: {
        // TypeScript ensures this is unreachable, but keep for runtime safety
        const exhaustiveCheck: never = options;
        throw new Error(`Unknown sound type: ${(exhaustiveCheck as any).type}`);
      }
    }
    
    // Wrap child process lifecycle in Promise with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Sound playback timed out'));
      }, PROCESS_TIMEOUT_MS);
      
      child.once('close', (code: number) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve(`${options.type} sound played successfully`);
        } else {
          reject(new Error(`Sound playback failed with code ${code}`));
        }
      });
      
      child.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  } finally {
    activeRequests.delete(options.type);
  }
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
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              enum: ['system', 'tts', 'file'],
              description: 'Type of sound to play'
            },
            name: {
              type: 'string',
              enum: ['Basso', 'Blow', 'Bottle', 'Frog', 'Funk', 'Glass', 'Hero', 'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink'],
              description: 'System sound name (required when type is "system")'
            },
            text: {
              type: 'string',
              description: 'Text to speak (required when type is "tts")'
            },
            voice: {
              type: 'string',
              description: 'Voice name (optional, used with type "tts", uses system default if not specified)'
            },
            path: {
              type: 'string',
              description: 'Absolute path to audio file (required when type is "file")'
            }
          },
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
        // Validate args exists
        if (!args || typeof args !== 'object') {
          throw new Error('Invalid arguments provided');
        }
        
        // Validate required parameters based on type
        const { type } = args as { type?: string };
        
        if (!type || !['system', 'tts', 'file'].includes(type)) {
          throw new Error('Invalid or missing type. Must be "system", "tts", or "file"');
        }
        
        if (type === 'system' && !(args as any).name) {
          throw new Error('Parameter "name" is required when type is "system"');
        }
        
        if (type === 'tts' && !(args as any).text) {
          throw new Error('Parameter "text" is required when type is "tts"');
        }
        
        if (type === 'file' && !(args as any).path) {
          throw new Error('Parameter "path" is required when type is "file"');
        }
        
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
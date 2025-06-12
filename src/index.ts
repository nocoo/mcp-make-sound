#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';

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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

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
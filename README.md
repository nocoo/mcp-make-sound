# MCP Make Sound

A Model Context Protocol (MCP) server that provides system sound playback capabilities for macOS. This server allows AI assistants and other MCP clients to play different types of system sounds for audio feedback.

## Features

- **Play Info Sound**: Plays the "Glass" system sound for informational notifications
- **Play Warning Sound**: Plays the "Purr" system sound for warnings
- **Play Error Sound**: Plays the "Sosumi" system sound for errors
- Built with TypeScript and the MCP SDK
- Lightweight and easy to integrate

## Requirements

- macOS (uses `afplay` and system sounds)
- Node.js 18+ 
- TypeScript

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd mcp-make-sound
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Running the Server

Start the MCP server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### Available Tools

The server provides three tools:

#### `play_info_sound`
- **Description**: Play an informational system sound
- **Parameters**: None
- **Sound**: Glass.aiff

#### `play_warning_sound`
- **Description**: Play a warning system sound  
- **Parameters**: None
- **Sound**: Purr.aiff

#### `play_error_sound`
- **Description**: Play an error system sound
- **Parameters**: None
- **Sound**: Sosumi.aiff

### Integration with MCP Clients

This server can be integrated with any MCP-compatible client, such as:
- Claude Desktop
- Custom MCP clients
- AI assistants that support MCP

Example tool call:
```json
{
  "name": "play_info_sound",
  "arguments": {}
}
```

## Development

### Project Structure

```
mcp-make-sound/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled JavaScript output
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled server
- `npm run dev` - Development mode with auto-rebuild and restart

### How It Works

1. The server implements the MCP protocol using the official SDK
2. It exposes three tools for different sound types
3. When a tool is called, it uses macOS's `afplay` command to play system sounds
4. Sounds are located in `/System/Library/Sounds/`
5. The server communicates over stdio transport

## Technical Details

- **Transport**: Standard I/O (stdio)
- **Protocol**: Model Context Protocol (MCP)
- **Audio Backend**: macOS `afplay` command
- **Sound Files**: System .aiff files

## Error Handling

The server includes comprehensive error handling:
- Validates tool names
- Handles `afplay` command failures
- Returns appropriate error messages to clients
- Graceful server shutdown on errors

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## System Sounds Used

- **Info**: Glass.aiff - A pleasant chime sound
- **Warning**: Purr.aiff - A gentle alert sound  
- **Error**: Sosumi.aiff - A distinctive error sound

These sounds are built into macOS and provide familiar audio feedback to users.


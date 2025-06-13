# 🔊 MCP Make Sound

A Model Context Protocol (MCP) server that provides comprehensive sound playback capabilities for macOS. This server allows AI assistants and other MCP clients to play system sounds, text-to-speech, and custom audio files for rich audio feedback.

## ✨ Features

- **🔔 Simple Sound Methods**: Pre-configured info, warning, and error sounds
- **🎵 Custom System Sounds**: Play any of the 14 built-in macOS sounds
- **🗣️ Text-to-Speech**: Convert text to speech with customizable voices
- **📁 File Playback**: Play custom audio files from disk
- 🚀 Built with TypeScript and the MCP SDK
- 🪶 Lightweight and easy to integrate

## 📋 Requirements

- 🍎 macOS (uses `afplay` and system sounds)
- 🟢 Node.js 18+ 
- 📝 TypeScript

## 🚀 Installation

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

## 💡 Usage

### 🎵 Running the Server

Start the MCP server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### 🎯 Example: Claude Integration with Warp Terminal

Here's how you can set up the MCP sound server to provide audio feedback when AI tasks complete in Warp terminal:

**Configuration Rule:**
"When AI is done, use mcp-make-sound to play a sound. The MCP supports error, info and success. Play the right sound based on AI task outcome."

This setup allows you to:
- 🔔 Hear a pleasant chime when tasks complete successfully
- ⚠️ Get an alert sound for warnings or partial completions  
- ❌ Receive clear audio feedback for errors or failures

The audio feedback helps you stay focused on other work while knowing immediately when your AI assistant has finished processing your requests.

### 🛠️ Available Tools

The server provides four tools:

#### Simple Sound Methods (Legacy)

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

#### Advanced Sound Method

#### `play_sound`
- **Description**: Play various types of sounds with customizable parameters
- **Parameters**: 
  - `type` (required): `"system"`, `"tts"`, or `"file"`
  - Additional based on type (see examples below)

### 📖 Usage Examples

#### System Sounds
Play any of the 14 built-in macOS sounds:

```json
{
  "name": "play_sound",
  "arguments": {
    "type": "system",
    "name": "Basso"
  }
}
```

**Available system sounds:**
`Basso`, `Blow`, `Bottle`, `Frog`, `Funk`, `Glass`, `Hero`, `Morse`, `Ping`, `Pop`, `Purr`, `Sosumi`, `Submarine`, `Tink`

#### Text-to-Speech
Convert text to speech with optional voice selection:

```json
{
  "name": "play_sound",
  "arguments": {
    "type": "tts",
    "text": "Hello, this is a test message",
    "voice": "Albert"
  }
}
```

Without voice (uses system default):
```json
{
  "name": "play_sound",
  "arguments": {
    "type": "tts",
    "text": "Task completed successfully"
  }
}
```

**Supported voices:**
- **English**: `Albert`, `Alice`, `Bad News`, `Bahh`, `Bells`, `Boing`, `Bruce`, `Bubbles`, `Cellos`, `Daniel`, `Deranged`, `Fred`, `Good News`, `Hysterical`, `Junior`, `Kathy`, `Pipe Organ`, `Princess`, `Ralph`, `Trinoids`, `Whisper`, `Zarvox`
- **International**: `Anna`, `Amélie`, `Daria`, `Eddy`, `Fiona`, `Jorge`, `Juan`, `Luca`, `Marie`, `Moira`, `Nora`, `Rishi`, `Samantha`, `Serena`, `Tessa`, `Thomas`, `Veena`, `Victoria`, `Xander`, `Yelda`, `Zosia`

**Note**: If an unsupported voice is specified, the system will gracefully fall back to the default voice and continue playback.

#### Custom Audio Files
Play audio files from disk:

```json
{
  "name": "play_sound",
  "arguments": {
    "type": "file",
    "path": "/Users/username/Music/notification.mp3"
  }
}
```

Supports common audio formats: `.aiff`, `.wav`, `.mp3`, `.m4a`, etc.

### 🔒 Security & Limitations

- **System Sounds**: Only the 14 official macOS sounds are allowed
- **Text-to-Speech**: 
  - Text limited to 1000 characters maximum
  - Voice validation with graceful fallback to system default
  - Curated list of 43+ supported voices for security
- **File Playback**: Requires absolute paths and validates file existence

### 🔗 Integration with MCP Clients

This server can be integrated with any MCP-compatible client, such as:
- 🤖 Claude Desktop
- 🛠️ Custom MCP clients
- 🧠 AI assistants that support MCP

#### MCP Configuration Example

Add this to your MCP client configuration:

```json
{
  "mcp-make-sound": {
    "command": "node",
    "args": [
      "/Users/nocoo/Workspace/mcp-make-sound/dist/index.js"
    ],
    "env": {},
    "working_directory": "/Users/nocoo/Workspace/mcp-make-sound",
    "start_on_launch": true
  }
}
```

Example tool calls:
```json
{
  "name": "play_info_sound",
  "arguments": {}
}
```

```json
{
  "name": "play_sound",
  "arguments": {
    "type": "system",
    "name": "Hero"
  }
}
```

## 🛠️ Development

### 📁 Project Structure

```
mcp-make-sound/
├── src/
│   ├── index.ts          # Main server implementation
│   └── __tests__/        # Unit tests
│       └── sound.test.ts # Sound system tests
├── dist/                 # Compiled JavaScript output
├── eslint.config.js      # ESLint configuration
├── vitest.config.ts      # Vitest test configuration
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### 📜 Scripts

#### Build & Run
- `npm run build` - 🔨 Compile TypeScript to JavaScript
- `npm start` - ▶️ Run the compiled server
- `npm run dev` - 🔄 Development mode with auto-rebuild and restart
- `npm run kill` - 🛑 Stop all running MCP server instances

#### Code Quality & Testing
- `npm run lint` - 🔍 Check code style and errors
- `npm run lint:fix` - 🔧 Fix auto-fixable linting issues
- `npm run test` - 🧪 Run tests in watch mode
- `npm run test:run` - ✅ Run tests once
- `npm run test:ui` - 🎛️ Run tests with interactive UI

### ⚙️ How It Works

1. The server implements the MCP protocol using the official SDK
2. It exposes four tools for different sound capabilities
3. When a tool is called, it uses macOS commands:
   - `afplay` for audio file playback (system sounds and custom files)
   - `say` for text-to-speech synthesis
4. System sounds are located in `/System/Library/Sounds/`
5. The server communicates over stdio transport

## 🔧 Technical Details

- **🔌 Transport**: Standard I/O (stdio)
- **📡 Protocol**: Model Context Protocol (MCP)
- **🎧 Audio Backend**: macOS `afplay` and `say` commands
- **🎵 Sound Files**: System .aiff files, custom audio files, and synthesized speech

## 🚨 Error Handling

The server includes comprehensive error handling:
- Validates tool names and parameters
- Handles `afplay` and `say` command failures
- Validates required parameters for each sound type
- Returns appropriate error messages to clients
- Graceful server shutdown on errors

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🎼 Sound Capabilities

### Simple Methods (Legacy)
- **🔔 Info**: Glass.aiff - A pleasant chime sound
- **⚠️ Warning**: Purr.aiff - A gentle alert sound  
- **❌ Error**: Sosumi.aiff - A distinctive error sound

### Advanced Method (play_sound)
- **🎵 14 System Sounds**: All built-in macOS sounds available
- **🗣️ 50+ TTS Voices**: Multiple languages and character voices
- **📁 Custom Files**: Support for .aiff, .wav, .mp3, .m4a, and more

These capabilities provide rich audio feedback options for any application need.


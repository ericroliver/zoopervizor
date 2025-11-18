# Changelog

All notable changes to the Zoopervizor extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial development

## [0.1.0] - 2024-01-XX

### Added
- Real-time event monitoring of Roo-Code task lifecycle
- Visual feedback via VSCode status bar
- HTTP REST API server for external agent integration
- WebSocket server for real-time event streaming
- Comprehensive logging to VSCode Output channel
- Configurable settings for all features
- Bytebot adapter for external agent integration
- Task delegation system with concurrent task support
- Question handling for interactive task execution
- Event normalization for external agents
- Task coordinator for managing multiple delegations

### Features
- **Event Monitoring**: Listen to all Roo-Code task events (taskStarted, taskCompleted, message, etc.)
- **API Server**: REST API on port 3737 with endpoints for task control
- **WebSocket**: Real-time event streaming with subscription support
- **Status Bar**: Visual indicator showing Roo-Code activity state
- **Logging**: Detailed logs with configurable levels (debug, info, warn, error)
- **Configuration**: Flexible settings for enabling/disabling features
- **Bytebot Integration**: Optional adapter for external agent communication

### Commands
- `Zoopervizor: Show Output` - Open the output channel
- `Zoopervizor: Toggle Status Bar` - Show/hide status bar item
- `Zoopervizor: Restart API Server` - Restart the API server

### API Endpoints
- `GET /health` - Health check endpoint
- `GET /status` - Get current Roo-Code status
- `POST /tasks/start` - Start a new task
- `POST /tasks/message` - Send message to current task
- `POST /tasks/cancel` - Cancel current task
- `POST /tasks/resume` - Resume a paused task
- `GET /configuration` - Get Roo-Code configuration
- `PUT /configuration` - Update Roo-Code configuration
- `GET /profiles` - List API profiles
- `POST /profiles/active` - Set active profile

### Documentation
- Complete architecture documentation
- API reference documentation
- Implementation guide
- Quick start guide
- Bytebot integration guide

## Release Types

### Major Version (X.0.0)
Breaking changes that require user action:
- API endpoint changes that break existing integrations
- Configuration option removals or renames
- Behavioral changes that affect existing workflows

### Minor Version (0.X.0)
New features and enhancements:
- New API endpoints
- New configuration options
- New event types
- Feature additions

### Patch Version (0.0.X)
Bug fixes and improvements:
- Bug fixes
- Performance improvements
- Documentation updates
- Dependency updates

---

## Template for New Releases

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements or fixes
```

[Unreleased]: https://github.com/your-org/zoopervizor/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/zoopervizor/releases/tag/v0.1.0
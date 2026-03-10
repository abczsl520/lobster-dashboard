# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-11

### Added
- Initial release of Lobster Dashboard
- Real-time WebSocket monitoring for OpenClaw AI agent sessions
- Cyberpunk UI with hex grid particles and force-directed topology
- Push API for external data ingestion
- Token consumption tracking (per-session and aggregate)
- Activity feed with live status changes
- Password-protected login with cookie auth
- Timing-safe password comparison
- Login rate limiting (5 attempts/min per IP)
- Token set capped at 1000 to prevent memory exhaustion
- XSS protection with input sanitization
- Nginx reverse proxy support with configurable base path
- Health check endpoint (`/api/health`)
- macOS launchd example for pusher script
- Comprehensive documentation (README, CONTRIBUTING, CODE_OF_CONDUCT)

### Security
- Timing-safe password comparison using `crypto.timingSafeEqual`
- Login rate limiting to prevent brute force attacks
- Push API rate limiting (1 request per 3 seconds)
- XSS protection: all user input sanitized before rendering
- HttpOnly cookies with optional Secure flag for HTTPS
- WebSocket upgrade requires valid auth token

### Changed
- Replaced deprecated `url.parse` with `new URL()`
- Removed hardcoded CST timezone, now uses system local time
- Default `basePath` set to empty string for out-of-box experience

[1.0.0]: https://github.com/abczsl520/lobster-dashboard/releases/tag/v1.0.0

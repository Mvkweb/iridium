# Iridium - SwiftlyS2 Admin Core Plugin

## Project Context
- **Name**: Iridium
- **Framework**: SwiftlyS2 (Counter-Strike 2)
- **Author/Developer**: Mvk
- **Language**: C# (.NET 10.0 Required)

## SwiftlyS2 Integration
- **Framework Version**: .NET 10.0 SDK is explicitly required.
- **Core Interface**: Use `ISwiftlyCore` (usually via a static `Core` pattern) for all framework access.
- **Event Handling**: Subscribe via `Core.Event.*` delegates.
- **Scheduling**: Use `Core.Scheduler.NextTick()` for synchronous main thread operations (do not use obsolete async `NextTick` overloads).
- **Logging**: Utilize `Core.Logger` for all standard plugin logging.
- **Plugin Metadata**: The main plugin class must use the `[PluginMetadata(...)]` attribute.
- **Unsafe Blocks**: `<AllowUnsafeBlocks>true</AllowUnsafeBlocks>` is required in the `.csproj` file for engine schema access.

## Core Principles & AI Rules
1. **Performance & Zero Overhead**: The server must never stall. Logic in the Tick loop and chat hooks must be strictly `O(1)` with minimal to zero allocations to prevent garbage collection spikes.
2. **Asynchronous Workflows**: All database operations MUST utilize the `Dapper` ORM asynchronously. Synchronous database queries are strictly prohibited as they block the main server thread.
3. **Thread Safety**: Ensure full thread safety when interacting with shared state or CS2 game engine data from async contexts. Always use safe task execution queues if dispatching back to the main thread is required.
4. **Premium UX**: Iridium prides itself on its lightweight in-game UI Menus and intelligent silent chat interceptors. Any new feature should maintain or improve this high standard of user experience.
5. **Code Style & Architecture**:
   - Follow standard C# naming conventions (PascalCase for classes/methods, camelCase for variables).
   - Keep classes modular, separating concerns into appropriate directories (`src/Admin/`, `src/Config/`, `src/Database/`, `src/Utility/`, etc.).
   - Leave clean and descriptive comments for complex or non-obvious logic.

## Directory Structure
- `src/`: Main source code containing modules for Admin features, Config, Database handling, ESP, and generic Utilities.
- `resources/`: Non-code assets, translation strings, or plugin configs.

## Getting Started for AI
- Always review `Iridium.csproj` for dependencies.
- Make sure to review files in `src/Database/` before adding new data structures.
- Rely on SwiftlyS2's native API whenever possible, as defined in their official documentation.

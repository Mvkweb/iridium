<div align="center">
  <img src="https://pan.samyyc.dev/s/VYmMXE" />
  <h2><strong>Iridium</strong></h2>
  <h3>Admin core plugin</h3>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status">
  <img src="https://img.shields.io/github/downloads/Mvk/Iridium/total" alt="Downloads">
  <img src="https://img.shields.io/github/stars/Mvk/Iridium?style=flat&logo=github" alt="Stars">
  <img src="https://img.shields.io/github/license/Mvk/Iridium" alt="License">
</p>

## Overview

**Iridium** is a modern, high-performance moderation plugin built specifically for SwiftlyS2. It utilizes asynchronous workflows and the `Dapper` ORM on top of SwiftlyS2's database layer to guarantee full thread-safety and avoid server stalling. 

Iridium offers a premium UX with its highly integrated, lightweight in-game **UI Menus**, intelligent chat interceptors, and native engine rendering capabilities.

## Features
- **Dynamic UI Menus:** Executing commands without arguments natively triggers SwiftlyS2 UI Menus, elegantly color-coding players based on their teams.
- **Duration Presets:** Automatically handles durations via dedicated menus when left blank.
- **Silent Chat Interceptor:** Pressing `R` opens a custom chat-based prompt where your reason is securely intercepted and parsed without spamming general chat. Abort seamlessly by typing `"cancel"` or literally just **crouching** in-game!
- **Zero Overhead:** The chat hooks and Tick loop logic are strictly `O(1)` allocations—producing zero server overhead.

## Commands

Iridium introduces the following essential moderation commands. Ensure you have granted your admins the requisite permission flags.

| Command | Arguments | Permission | Description |
| :--- | :--- | :--- | :--- |
| `!slay` | `[target]` | `iridium.slay` | Force kills a player. |
| `!kick` | `[target] [reason]` | `iridium.kick` | Disconnects a player from the server. |
| `!mute` | `[target] [minutes] [reason]` | `iridium.mute` | Mutes a player (0 minutes for permanent). |
| `!unmute`| `[target]` | `iridium.mute` | Unmutes a player. |
| `!ban` | `[target] [minutes] [reason]` | `iridium.ban` | Bans a player (0 minutes for permanent). |
| `!lp` | - | `iridium.listplayers` | Prints a beautiful, formatted table of all active players directly to your console, including Bot detection. |

*Note: All arguments are optional. Leaving arguments blank will intelligently load the Interactive UI Menus.*

**Target Options**:
- `@all` - Targets everyone.
- `@me` - Targets yourself.
- `#123` - Targets a specific player ID.
- `PlayerName` - Partial or exact name matching.

## Database Setup

Iridium expects a MySQL database to operate. It connects to the database utilizing SwiftlyS2's global Database Service.

You must configure the `configs/database.jsonc` file in your SwiftlyS2 directory. SwiftlyS2 supports both URI strings and JSON objects for database connection strings.

### Example `configs/database.jsonc`:
```jsonc
{
    "default_connection": "default",
    "connections": {
        "iridium": {
            "driver": "mysql",
            "host": "your_database_host",
            "database": "your_database_name",
            "user": "your_db_user",
            "pass": "your_db_pass",
            "port": 3306
        }
    }
}
```
**Note:** Iridium explicitly looks for a connection named `"iridium"`. If it cannot find one, it will fall back to your `"default_connection"`.

## Architecture & Project Structure
- **`src/`** - Contains all core C# modules (`Admin`, `Config`, `Database`, `ESP`, `Utility`).
- **`resources/`** - Houses translation strings, configuration templates, and non-code assets.

## Installation & Building

1. Ensure the SwiftlyS2 dependencies are properly restored.
2. Build the project:
   ```bash
   dotnet publish -c Release
   ```
3. Drag and drop the built output folder into your server's `plugins/` directory.
4. On the next server start, the `iridium_mutes` and `iridium_bans` tables will be automatically generated.

## Credits

Special thanks to [T3-Admin](https://github.com/a2Labs-cc/T3-Admin) for the initial inspiration and reference code that helped kickstart this plugin!

## Author

Developed and maintained by **Mvk**.

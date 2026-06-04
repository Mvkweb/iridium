using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Dapper;
using Fleck;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Misc;

namespace Iridium.Dashboard
{
    public class DashboardService : IDisposable
    {
        private readonly ISwiftlyCore _core;
        private readonly Iridium _plugin;
        private WebSocketServer _server = null!;
        private readonly ConcurrentDictionary<Guid, DashboardClient> _clients = new();
        private static readonly HttpClient _httpClient = new();

        public DashboardService(ISwiftlyCore core, Iridium plugin)
        {
            _core = core;
            _plugin = plugin;
        }

        public void Initialize()
        {
            if (!_plugin.Config.Dashboard.Enabled) return;

            var host = _plugin.Config.Dashboard.WebSocketHost;
            var port = _plugin.Config.Dashboard.WebSocketPort;

            try
            {
                _server = new WebSocketServer($"ws://{host}:{port}");
                _server.Start(socket =>
                {
                    socket.OnOpen = () =>
                    {
                        var client = new DashboardClient { Socket = socket };
                        _clients.TryAdd(socket.ConnectionInfo.Id, client);
                        _core.Logger.LogInformation($"[Dashboard] Client connected: {socket.ConnectionInfo.ClientIpAddress}");
                    };

                    socket.OnClose = () =>
                    {
                        _clients.TryRemove(socket.ConnectionInfo.Id, out _);
                    };

                    socket.OnMessage = async message =>
                    {
                        if (_clients.TryGetValue(socket.ConnectionInfo.Id, out var client))
                        {
                            await HandleMessageAsync(client, message);
                        }
                    };
                });
                _core.Logger.LogInformation($"[Dashboard] WebSocket server started on ws://{host}:{port}");
            }
            catch (Exception ex)
            {
                _core.Logger.LogError($"[Dashboard] Failed to start WebSocket server: {ex.Message}");
            }
        }

        private async Task HandleMessageAsync(DashboardClient client, string message)
        {
            try
            {
                var doc = JsonDocument.Parse(message);
                var type = doc.RootElement.GetProperty("type").GetString();

                if (type == "auth_verify")
                {
                    var queryParams = doc.RootElement.GetProperty("payload").GetProperty("query").GetString();
                    await HandleAuthVerifyAsync(client, queryParams);
                    return;
                }
                
                if (type == "auth_resume")
                {
                    var token = doc.RootElement.GetProperty("payload").GetProperty("token").GetString();
                    await HandleAuthResumeAsync(client, token);
                    return;
                }

                // Require Auth for all other commands
                if (!client.IsAuthenticated)
                {
                    Send(client, "error", new { message = "Unauthorized." });
                    return;
                }

                if (type == "profiler_enable")
                {
                    _core.Logger.LogInformation($"[Dashboard] Profiler enabled by {client.SteamId}");
                    _core.Scheduler.NextTick(() => _core.Engine.ExecuteCommand("sw profiler enable"));
                }
                else if (type == "profiler_save")
                {
                    _core.Logger.LogInformation($"[Dashboard] Profiler saved by {client.SteamId}");
                    _core.Scheduler.NextTick(() => {
                        _core.Engine.ExecuteCommand("sw profiler save");
                        _core.Engine.ExecuteCommand("sw profiler disable");
                    });
                }
                else if (type == "profiler_list")
                {
                    await HandleProfilerListAsync(client);
                }
                else if (type == "profiler_load")
                {
                    var filename = doc.RootElement.GetProperty("payload").GetProperty("filename").GetString();
                    await HandleProfilerLoadAsync(client, filename);
                }
            }
            catch (Exception ex)
            {
                _core.Logger.LogError($"[Dashboard] Error handling message: {ex.Message}");
            }
        }

        private async Task HandleAuthVerifyAsync(DashboardClient client, string queryParams)
        {
            try
            {
                // Steam OpenID Stateless Validation
                var dict = new Dictionary<string, string>();
                var parts = queryParams.TrimStart('?').Split('&');
                foreach (var part in parts)
                {
                    var kv = part.Split('=', 2);
                    if (kv.Length == 2)
                    {
                        dict[Uri.UnescapeDataString(kv[0])] = Uri.UnescapeDataString(kv[1]);
                    }
                }

                dict["openid.mode"] = "check_authentication";

                var content = new FormUrlEncodedContent(dict);
                var response = await _httpClient.PostAsync("https://steamcommunity.com/openid/login", content);
                var responseStr = await response.Content.ReadAsStringAsync();

                if (responseStr.Contains("is_valid:true"))
                {
                    var claimedId = dict["openid.claimed_id"];
                    var steamId64 = claimedId.Split('/').Last();

                    // Check permissions
                    if (_core.Permission.PlayerHasPermission(ulong.Parse(steamId64), "root"))
                    {
                        var token = GenerateSecureToken();
                        
                        using var conn = _core.Database.GetConnection("iridium");
                        await conn.ExecuteAsync("INSERT INTO iridium_dashboard_sessions (steam_id, token, expires_at) VALUES (@SteamId, @Token, @ExpiresAt)", new
                        {
                            SteamId = steamId64,
                            Token = token,
                            ExpiresAt = DateTime.UtcNow.AddDays(7)
                        });

                        client.IsAuthenticated = true;
                        client.SteamId = steamId64;

                        Send(client, "auth_success", new { token, steamId = steamId64 });
                        _core.Logger.LogInformation($"[Dashboard] Admin {steamId64} authenticated successfully via Steam.");
                    }
                    else
                    {
                        Send(client, "auth_failed", new { message = "You do not have permission to access the dashboard." });
                    }
                }
                else
                {
                    Send(client, "auth_failed", new { message = "Steam validation failed." });
                }
            }
            catch (Exception ex)
            {
                _core.Logger.LogError($"[Dashboard] Auth error: {ex.Message}");
                Send(client, "auth_failed", new { message = "Internal error during authentication." });
            }
        }

        private async Task HandleAuthResumeAsync(DashboardClient client, string token)
        {
            try
            {
                using var conn = _core.Database.GetConnection("iridium");
                var session = await conn.QueryFirstOrDefaultAsync("SELECT * FROM iridium_dashboard_sessions WHERE token = @Token AND is_active = 1", new { Token = token });

                if (session != null)
                {
                    DateTime expiresAt = session.expires_at;
                    if (expiresAt > DateTime.UtcNow)
                    {
                        client.IsAuthenticated = true;
                        client.SteamId = session.steam_id;
                        Send(client, "auth_success", new { steamId = session.steam_id, resumed = true });
                        return;
                    }
                }
                Send(client, "auth_failed", new { message = "Session expired or invalid." });
            }
            catch (Exception ex)
            {
                _core.Logger.LogError($"[Dashboard] Resume auth error: {ex.Message}");
                Send(client, "auth_failed", new { message = "Database error." });
            }
        }

        private async Task HandleProfilerListAsync(DashboardClient client)
        {
            string profilerPath = GetProfilerDirectory();

            if (profilerPath != null && Directory.Exists(profilerPath))
            {
                var files = new DirectoryInfo(profilerPath).GetFiles("*.json")
                    .OrderByDescending(f => f.CreationTime)
                    .Select(f => new { 
                        filename = f.Name, 
                        createdAt = f.CreationTime.ToString("o"),
                        size = f.Length
                    })
                    .ToList();

                Send(client, "profiler_list_data", files);
            }
            else
            {
                Send(client, "error", new { message = "Could not find profiler directory on server." });
            }
        }

        private async Task HandleProfilerLoadAsync(DashboardClient client, string filename)
        {
            if (string.IsNullOrEmpty(filename) || filename.Contains("..") || filename.Contains("/") || filename.Contains("\\"))
            {
                Send(client, "error", new { message = "Invalid filename." });
                return;
            }

            string profilerPath = GetProfilerDirectory();

            if (profilerPath != null && Directory.Exists(profilerPath))
            {
                string filePath = Path.Combine(profilerPath, filename);
                if (File.Exists(filePath))
                {
                    try
                    {
                        var jsonContent = await File.ReadAllTextAsync(filePath);
                        SendRaw(client, $"{{\"type\":\"profiler_data\",\"payload\":{jsonContent}}}");
                        return;
                    }
                    catch (Exception ex)
                    {
                        _core.Logger.LogError($"[Dashboard] Error reading profiler file {filename}: {ex.Message}");
                        Send(client, "error", new { message = $"Error reading file: {ex.Message}" });
                        return;
                    }
                }
            }

            Send(client, "error", new { message = "Failed to load profiler dump. File might have been deleted." });
        }

        private string GetProfilerDirectory()
        {
            string[] possiblePaths = {
                "/home/container/game/csgo/addons/swiftlys2/profilers",
                Path.Combine(Environment.CurrentDirectory, "game", "csgo", "addons", "swiftlys2", "profilers"),
                Path.Combine(Environment.CurrentDirectory, "csgo", "addons", "swiftlys2", "profilers"),
                Path.Combine(AppContext.BaseDirectory, "game", "csgo", "addons", "swiftlys2", "profilers"),
                Path.Combine(AppContext.BaseDirectory, "csgo", "addons", "swiftlys2", "profilers"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "csgo", "addons", "swiftlys2", "profilers")
            };

            foreach (var path in possiblePaths)
            {
                if (Directory.Exists(path))
                {
                    return Path.GetFullPath(path);
                }
            }
            return null;
        }

        private string GenerateSecureToken()
        {
            byte[] bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes);
        }


        private void Send(DashboardClient client, string type, object payload)
        {
            var msg = JsonSerializer.Serialize(new { type, payload });
            client.Socket.Send(msg);
        }

        private void SendRaw(DashboardClient client, string jsonMessage)
        {
            client.Socket.Send(jsonMessage);
        }

        public void Dispose()
        {
            foreach (var client in _clients.Values)
            {
                try 
                { 
                    SendRaw(client, "{\"type\":\"plugin_reloaded\",\"payload\":{}}");
                    client.Socket?.Close(); 
                } 
                catch { }
            }
            _server?.Dispose();
        }
    }

    public class DashboardClient
    {
        public IWebSocketConnection Socket { get; set; } = null!;
        public bool IsAuthenticated { get; set; } = false;
        public string SteamId { get; set; } = string.Empty;
    }
}

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Commands;
using SwiftlyS2.Shared.Players;
using SwiftlyS2.Core.Menus.OptionsBase;

namespace Iridium.Admin
{
    public class MapCommands
    {
        private readonly ISwiftlyCore _core;
        private readonly Iridium _plugin;

        public MapCommands(ISwiftlyCore core, Iridium plugin)
        {
            _core = core;
            _plugin = plugin;
        }

        public void OnMapCommand(ICommandContext context)
        {
            try
            {
                var admin = context.Sender;
                if (admin == null)
                {
                    _ = context.ReplyAsync(" Usage: !adminmap (must be executed in-game to show menu)");
                    return;
                }

                var builder = _core.MenusAPI.CreateBuilder();
                builder.Design.SetMenuTitle($"<span color='#FF5733'>Change Server Map</span>");
                builder.Design.SetCommentVisible(false);

                // Add robust null checking to prevent NullReferenceException
                var availableMaps = _plugin?.Config?.MapsOptions?.Maps;
                if (availableMaps == null || availableMaps.Length == 0)
                {
                    _core.Logger.LogError("[Iridium] Map list is null or empty. Check core.jsonc configuration!");
                    admin.SendChat(" \x02[Iridium]\x01 The map list is currently empty.");
                    return;
                }

                foreach (var mapNameRaw in availableMaps)
                {
                    var mapName = mapNameRaw;
                    string displayMapName = mapName;
                    bool isWorkshop = false;

                    if (mapName.StartsWith("ws:"))
                    {
                        isWorkshop = true;
                        mapName = mapName.Substring(3);
                        displayMapName = $"[WS] {mapName}";
                    }

                    var capturedMapName = mapName;
                    var capturedDisplayName = displayMapName;
                    var capturedIsWorkshop = isWorkshop;

                    var button = new ButtonMenuOption(displayMapName) { CloseAfterClick = true };
                    button.Click += (_, args) =>
                    {
                        var adminPlayer = args.Player;
                        var adminPlayerName = adminPlayer.Controller?.PlayerName ?? "Admin";

                        _core.Scheduler.NextTick(() =>
                        {
                            try
                            {
                                var currentMap = _core.Engine.GlobalVars.MapName.ToString();

                                if (capturedMapName.Equals(currentMap, StringComparison.OrdinalIgnoreCase))
                                {
                                    adminPlayer.SendChat($" \x06Iridium\x01 • The server is already on \x04{capturedDisplayName}\x01.");
                                }
                                else
                                {
                                    foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                                    {
                                        p.SendChat($" \x06Iridium\x01 • \x04{adminPlayerName}\x01 is changing the map to \x04{capturedDisplayName}\x01...");
                                    }

                                    _core.Scheduler.DelayBySeconds(2, () =>
                                    {
                                        if (capturedIsWorkshop)
                                        {
                                            _core.Engine.ExecuteCommand($"host_workshop_map {capturedMapName}");
                                        }
                                        else
                                        {
                                            _core.Engine.ExecuteCommand($"nextlevel {capturedMapName}");
                                            _core.Engine.ExecuteCommand($"changelevel {capturedMapName}");
                                        }
                                    });
                                }
                            }
                            catch (Exception ex)
                            {
                                _core.Logger.LogError($"[Iridium] Map change click error: {ex.Message}\n{ex.StackTrace}");
                            }
                        });
                        return ValueTask.CompletedTask;
                    };
                    builder.AddOption(button);
                }

                _core.MenusAPI.OpenMenuForPlayer(admin, builder.Build());
            }
            catch (Exception ex)
            {
                _core.Logger.LogError($"[Iridium] MapCommand FATAL ERROR: {ex.Message}\n{ex.StackTrace}");
            }
        }
    }
}

using System;
using System.Linq;
using System.Threading.Tasks;
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

        [Command("map", permission: "iridium.map")]
        [CommandAlias("setmap")]
        public async Task OnMapCommandAsync(ICommandContext context)
        {
            var admin = context.Sender;
            if (admin == null)
            {
                await context.ReplyAsync(" Usage: !map (must be executed in-game to show menu)");
                return;
            }

            var builder = _core.MenusAPI.CreateBuilder();
            builder.Design.SetMenuTitle($"<span color='#FF5733'>Change Server Map</span>");
            builder.Design.SetMenuFooterVisible(false);
            builder.Design.SetCommentVisible(true);
            builder.Design.SetDefaultComment("<span color='#CCCCCC'>Move:</span> SHIFT/F | <span color='#CCCCCC'>Select:</span> E | <span color='#CCCCCC'>Exit:</span> TAB");

            var availableMaps = _plugin.Config.MapsOptions.Maps;

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

                var button = new ButtonMenuOption(displayMapName) { CloseAfterClick = true };
                button.Click += (_, args) =>
                {
                    var adminPlayer = args.Player;
                    var adminPlayerName = adminPlayer.Controller?.PlayerName ?? "Admin";
                    var currentMap = _core.Engine.GlobalVars.MapName.ToString();

                    if (mapName.Equals(currentMap, StringComparison.OrdinalIgnoreCase))
                    {
                        _ = adminPlayer.SendChatAsync($" \x06Iridium\x01 • The server is already on \x04{displayMapName}\x01.");
                    }
                    else
                    {
                        foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                        {
                            _ = p.SendChatAsync($" \x06Iridium\x01 • \x04{adminPlayerName}\x01 is changing the map to \x04{displayMapName}\x01...");
                        }

                        _core.Scheduler.NextTick(() =>
                        {
                            if (isWorkshop)
                            {
                                _core.Engine.ExecuteCommand($"host_workshop_map {mapName}");
                            }
                            else
                            {
                                _core.Engine.ExecuteCommand($"map {mapName}");
                            }
                        });
                    }
                    return ValueTask.CompletedTask;
                };
                builder.AddOption(button);
            }

            _core.MenusAPI.OpenMenuForPlayer(admin, builder.Build());
        }
    }
}

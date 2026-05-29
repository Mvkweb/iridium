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

        public MapCommands(ISwiftlyCore core)
        {
            _core = core;
        }

        [Command("map", permission: "iridium.map")]
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

            // Hardcoded list of official/popular CS2 maps
            string[] availableMaps = 
            { 
                "de_dust2", "de_mirage", "de_inferno", "de_nuke", "de_vertigo", 
                "de_overpass", "de_ancient", "de_anubis", "de_cache", "cs_office" 
            };

            foreach (var mapName in availableMaps)
            {
                var button = new ButtonMenuOption(mapName) { CloseAfterClick = true };
                button.Click += (_, args) =>
                {
                    var adminPlayer = args.Player;
                    var adminPlayerName = adminPlayer.Controller?.PlayerName ?? "Admin";
                    var currentMap = _core.Engine.GlobalVars.MapName.ToString();

                    if (mapName.Equals(currentMap, StringComparison.OrdinalIgnoreCase))
                    {
                        _ = adminPlayer.SendChatAsync($" \x02[Iridium]\x01 The server is already on \x04{mapName}\x01.");
                    }
                    else
                    {
                        // Broadcast map change safely to all players
                        foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                        {
                            _ = p.SendChatAsync($" \x02[Iridium]\x01 {adminPlayerName} is changing the map to \x04{mapName}\x01...");
                        }

                        // Queue map change on the main thread for engine safety
                        _core.Scheduler.NextTick(() =>
                        {
                            _core.Engine.ExecuteCommand($"map {mapName}");
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

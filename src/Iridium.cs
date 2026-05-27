using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using SwiftlyS2.Shared.Plugins;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Commands;
using SwiftlyS2.Shared.Events;
using SwiftlyS2.Shared.Misc;
using System.Linq;
using Iridium.Database;
using Iridium.Managers;
using Iridium.Commands;
using Microsoft.Extensions.Logging;

namespace Iridium;

[PluginMetadata(Id = "Iridium", Version = "1.0.0", Name = "Iridium", Author = "Mvk", Description = "Admin core plugin")]
public partial class Iridium : BasePlugin {
  
  private ModerationManager _moderationManager = null!;
  private ModerationCommands _moderationCommands = null!;

  public Iridium(ISwiftlyCore core) : base(core)
  {
  }

  public override void ConfigureSharedInterface(IInterfaceManager interfaceManager) {
  }

  public override void UseSharedInterface(IInterfaceManager interfaceManager) {
  }

  public override void Load(bool hotReload) {
      Core.Logger.LogInformation("[Iridium] Loading plugin...");

      _ = InitializePluginAsync();
  }

  private async Task InitializePluginAsync() 
  {
      try 
      {
          Core.Logger.LogInformation("[Iridium] Initializing database tables...");
          await DatabaseInitializer.InitializeAsync(Core);

          _moderationManager = new ModerationManager(Core);
          _moderationCommands = new ModerationCommands(Core, _moderationManager);

          // Register commands manually with wrappers for async Task methods
          Core.Command.RegisterCommand("slay", (ctx) => { _ = _moderationCommands.OnSlayCommandAsync(ctx); });
          Core.Command.RegisterCommand("kick", (ctx) => { _ = _moderationCommands.OnKickCommandAsync(ctx); });
          Core.Command.RegisterCommand("mute", (ctx) => { _ = _moderationCommands.OnMuteCommandAsync(ctx); });
          Core.Command.RegisterCommand("unmute", (ctx) => { _ = _moderationCommands.OnUnmuteCommandAsync(ctx); });
          Core.Command.RegisterCommand("ban", (ctx) => { _ = _moderationCommands.OnBanCommandAsync(ctx); });
          
          Core.Command.RegisterCommand("lp", (ctx) => { _ = _moderationCommands.OnListPlayersCommandAsync(ctx); });
          Core.Command.RegisterCommand("listplayers", (ctx) => { _ = _moderationCommands.OnListPlayersCommandAsync(ctx); });

          // Register Chat Hook for Owner prefix
          Core.Command.HookClientChat((playerId, text, teamonly) =>
          {
              var player = Core.PlayerManager.GetAllPlayers().FirstOrDefault(p => p.PlayerID == playerId && p.IsValid);
              if (player != null && Core.Permission.PlayerHasPermission(player.SteamID, "root"))
              {
                  // 2 = T (gold), 3 = CT (lightblue), else grey
                  string teamColor = player.Controller?.TeamNum == 2 ? "[gold]" : player.Controller?.TeamNum == 3 ? "[lightblue]" : "[grey]";
                  string teamTag = teamonly ? "[bluegrey](TEAM) " : "";
                  
                  // Using grey[[red]Owner[grey]] PlayerName [default]: message
                  string formattedMessage = $" {teamTag}[grey][[red]Owner[grey]] {teamColor}{player.Controller?.PlayerName} [default]: {text}";

                  if (teamonly)
                  {
                      foreach (var p in Core.PlayerManager.GetAllPlayers().Where(x => x.IsValid && x.Controller?.TeamNum == player.Controller?.TeamNum))
                      {
                          _ = p.SendChatAsync(formattedMessage);
                      }
                  }
                  else
                  {
                      foreach (var p in Core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                      {
                          _ = p.SendChatAsync(formattedMessage);
                      }
                  }
                  return HookResult.Stop; // Block the original message
              }
              return HookResult.Continue; // Let normal players pass through
          });

          Core.Logger.LogInformation("[Iridium] Plugin loaded successfully!");
      }
      catch (Exception ex)
      {
          Core.Logger.LogError("[Iridium] Failed to initialize plugin: {Message}", ex.Message);
      }
  }

  public override void Unload() {
      Core.Logger.LogInformation("[Iridium] Unloading plugin...");
  }
}
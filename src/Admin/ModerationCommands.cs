using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Collections.Generic;
using Iridium.Utils;
using Iridium.ESP;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Commands;
using SwiftlyS2.Shared.Players;
using SwiftlyS2.Shared.Misc;
using SwiftlyS2.Shared.ProtobufDefinitions;
using SwiftlyS2.Shared.Menus;
using SwiftlyS2.Core.Menus.OptionsBase;

namespace Iridium.Admin
{
    public class ModerationCommands
    {
        private readonly ISwiftlyCore _core;
        private readonly ModerationManager _moderationManager;
        private readonly AdminESP _adminESP;

        private class PendingPrompt
        {
            public IPlayer Admin { get; set; } = null!;
            public string ActionType { get; set; } = string.Empty;
            public IPlayer Target { get; set; } = null!;
        }

        private readonly ConcurrentDictionary<ulong, PendingPrompt> _pendingPrompts = new();

        public ModerationCommands(ISwiftlyCore core, ModerationManager moderationManager, AdminESP adminESP)
        {
            _core = core;
            _moderationManager = moderationManager;
            _adminESP = adminESP;

            _core.Command.HookClientChat(OnClientChat);
            _core.Event.OnTick += OnTick;
        }

        private void OnTick()
        {
            if (_pendingPrompts.IsEmpty) return;

            foreach (var kvp in _pendingPrompts)
            {
                var prompt = kvp.Value;
                var admin = prompt.Admin;
                
                if (admin == null || !admin.IsValid)
                {
                    _pendingPrompts.TryRemove(kvp.Key, out _);
                    continue;
                }

                var pawn = admin.PlayerPawn;
                var movement = pawn?.MovementServices;
                float duckAmount = movement?.DuckAmount ?? 0f;

                if (duckAmount > 0f)
                {
                    if (_pendingPrompts.TryRemove(kvp.Key, out _))
                    {
                        admin.SendCenterHTML("<span color='#FFFFFF'>You cancelled the action.</span>", 3);
                    }
                }
            }
        }

        private HookResult OnClientChat(int playerId, string text, bool teamonly)
        {
            if (_pendingPrompts.IsEmpty) return HookResult.Continue;

            var player = _core.PlayerManager.GetPlayer(playerId);
            if (player == null || !player.IsValid) return HookResult.Continue;

            if (_pendingPrompts.TryGetValue(player.SteamID, out var prompt))
            {
                if (text.Equals("cancel", StringComparison.OrdinalIgnoreCase))
                {
                    _pendingPrompts.TryRemove(player.SteamID, out _);
                    player.SendCenterHTML("<span color='#FFFFFF'>You cancelled the action.</span>", 3);
                    return HookResult.Stop;
                }

                _pendingPrompts.TryRemove(player.SteamID, out _);

                var actionType = prompt.ActionType;
                var target = prompt.Target;
                var adminPlayer = player;
                var reason = text;

                _core.Scheduler.NextTick(() =>
                {
                    if (actionType == "slay")
                    {
                        _ = ExecuteSlayAsync(adminPlayer, target);
                    }
                    else if (actionType == "kick")
                    {
                        _ = ExecuteKickAsync(adminPlayer, target, reason);
                    }
                    else if (actionType == "mute" || actionType == "ban")
                    {
                        ShowDurationSelectionMenu(adminPlayer, target, actionType, reason);
                    }
                });

                return HookResult.Stop;
            }

            return HookResult.Continue;
        }

        [Command("slay", permission: "iridium.slay")]
        public async Task OnSlayCommandAsync(ICommandContext context)
        {
            if (context.Args.Length < 1)
            {
                if (context.Sender != null)
                {
                    ShowPlayerSelectionMenu(context.Sender, "slay");
                }
                else
                {
                    await context.ReplyAsync(" Usage: !slay <target>");
                }
                return;
            }

            var targets = PlayerUtils.FindPlayersByTarget(_core, context.Sender, context.Args[0]);
            if (targets.Count == 0)
            {
                await context.ReplyAsync(" No matching players found.");
                return;
            }

            var adminName = context.Sender?.Controller.PlayerName ?? "Console";

            var validTargets = targets.Where(t => t.PlayerPawn?.IsValid == true).ToList();
            int slayedCount = validTargets.Count;

            if (slayedCount > 0)
            {
                _ = _core.Scheduler.NextTickAsync(() =>
                {
                    foreach (var target in validTargets)
                    {
                        if (target.PlayerPawn?.IsValid == true)
                        {
                            target.PlayerPawn.CommitSuicide(false, true);
                        }
                    }
                });

                foreach (var t in validTargets)
                {
                    t.SendChat($" \x02[Iridium]\x01 You were slayed by {adminName}.");
                }
            }

            if (slayedCount > 0)
            {
                var msg = targets.Count == 1 
                    ? $" \x02[Iridium]\x01 {adminName} slayed {targets[0].Controller.PlayerName}."
                    : $" \x02[Iridium]\x01 {adminName} slayed {slayedCount} players.";
                
                _ = _core.Scheduler.NextTickAsync(() =>
                {
                    foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                    {
                        p.SendChat(msg);
                    }
                });
            }
            else
            {
                await context.ReplyAsync(" No valid targets were alive to be slayed.");
            }
        }

        [Command("esp")]
        [CommandAlias("wh")]
        public async Task OnEspCommandAsync(ICommandContext context)
        {
            var admin = context.Sender;
            if (admin == null) return;
            
            _adminESP.ToggleESP(admin);
        }

        [Command("kick", permission: "iridium.kick")]
        public async Task OnKickCommandAsync(ICommandContext context)
        {
            if (context.Args.Length < 1)
            {
                if (context.Sender != null)
                {
                    ShowPlayerSelectionMenu(context.Sender, "kick");
                }
                else
                {
                    await context.ReplyAsync(" Usage: !kick <target> [reason]");
                }
                return;
            }

            var target = PlayerUtils.FindSinglePlayerByTarget(_core, context.Sender, context.Args[0]);
            if (target == null)
            {
                await context.ReplyAsync(" Could not find a unique player matching that target.");
                return;
            }

            var adminName = context.Sender?.Controller.PlayerName ?? "Console";
            var reason = context.Args.Length > 1 ? string.Join(" ", context.Args.Skip(1)) : "No reason provided";
            var targetName = target.Controller.PlayerName;

            foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
            {
                await p.SendChatAsync($" \x02[Iridium]\x01 {adminName} kicked {targetName}. Reason: {reason}");
            }

            await target.KickAsync(reason, ENetworkDisconnectionReason.NETWORK_DISCONNECT_KICKED);
        }

        [Command("mute", permission: "iridium.mute")]
        public async Task OnMuteCommandAsync(ICommandContext context)
        {
            if (context.Args.Length < 1)
            {
                if (context.Sender != null) ShowPlayerSelectionMenu(context.Sender, "mute");
                else await context.ReplyAsync(" Usage: !mute <target> <duration_minutes> [reason]");
                return;
            }

            var target = PlayerUtils.FindSinglePlayerByTarget(_core, context.Sender, context.Args[0]);
            if (target == null)
            {
                await context.ReplyAsync(" Could not find a unique player matching that target.");
                return;
            }

            if (context.Args.Length < 2)
            {
                if (context.Sender != null) ShowDurationSelectionMenu(context.Sender, target, "mute", "Muted by Admin");
                else await context.ReplyAsync(" Usage: !mute <target> <duration_minutes> [reason]");
                return;
            }

            if (!int.TryParse(context.Args[1], out int duration) || duration < 0)
            {
                await context.ReplyAsync(" Invalid duration.");
                return;
            }

            var reason = context.Args.Length > 2 ? string.Join(" ", context.Args.Skip(2)) : "No reason provided";
            await ExecuteMuteAsync(context.Sender, target, reason, duration);
        }

        [Command("unmute", permission: "iridium.mute")]
        public async Task OnUnmuteCommandAsync(ICommandContext context)
        {
            if (context.Args.Length < 1)
            {
                if (context.Sender != null) ShowPlayerSelectionMenu(context.Sender, "unmute");
                else await context.ReplyAsync(" Usage: !unmute <target>");
                return;
            }

            var target = PlayerUtils.FindSinglePlayerByTarget(_core, context.Sender, context.Args[0]);
            if (target == null)
            {
                await context.ReplyAsync(" Could not find a unique player matching that target.");
                return;
            }

            await ExecuteUnmuteAsync(context.Sender, target);
        }

        [Command("ban", permission: "iridium.ban")]
        public async Task OnBanCommandAsync(ICommandContext context)
        {
            if (context.Args.Length < 1)
            {
                if (context.Sender != null) ShowPlayerSelectionMenu(context.Sender, "ban");
                else await context.ReplyAsync(" Usage: !ban <target> <duration_minutes> [reason]");
                return;
            }

            var target = PlayerUtils.FindSinglePlayerByTarget(_core, context.Sender, context.Args[0]);
            if (target == null)
            {
                await context.ReplyAsync(" Could not find a unique player matching that target.");
                return;
            }

            if (context.Args.Length < 2)
            {
                if (context.Sender != null) ShowDurationSelectionMenu(context.Sender, target, "ban", "Banned by Admin");
                else await context.ReplyAsync(" Usage: !ban <target> <duration_minutes> [reason]");
                return;
            }

            if (!int.TryParse(context.Args[1], out int duration) || duration < 0)
            {
                await context.ReplyAsync(" Invalid duration.");
                return;
            }

            var reason = context.Args.Length > 2 ? string.Join(" ", context.Args.Skip(2)) : "No reason provided";
            await ExecuteBanAsync(context.Sender, target, reason, duration);
        }

        [Command("lp", permission: "iridium.listplayers")]
        public async Task OnListPlayersCommandAsync(ICommandContext context)
        {
            var sb = new System.Text.StringBuilder();
            sb.AppendLine(" ");
            sb.AppendLine("===============================================================");
            sb.AppendLine($"{"ID",-5} | {"Name",-32} | {"SteamID64",-20}");
            sb.AppendLine("===============================================================");
            
            int count = 0;
            foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
            {
                string botTag = p.IsFakeClient ? " (Bot)" : "";
                string displayName = p.Controller?.PlayerName + botTag;
                if (displayName.Length > 32) displayName = displayName.Substring(0, 32);
                sb.AppendLine($"{p.PlayerID,-5} | {displayName,-32} | {p.SteamID,-20}");
                count++;
            }
            
            sb.AppendLine("===============================================================");
            sb.AppendLine($" Total Players: {count}");
            sb.AppendLine("===============================================================");

            if (context.Sender != null)
            {
                // Send nicely formatted table to the player's console
                await context.Sender.SendConsoleAsync(sb.ToString());
                await context.ReplyAsync(" \x02[Iridium]\x01 Player list has been printed to your console.");
            }
            else
            {
                // Fallback for when the command is run from the server console directly
                Console.WriteLine(sb.ToString());
            }
        }

        private void ShowPlayerSelectionMenu(IPlayer admin, string actionType)
        {
            var builder = _core.MenusAPI.CreateBuilder();
            builder.Design.SetMenuTitle($"<span color='#FF5733'>Select Player to {char.ToUpper(actionType[0]) + actionType.Substring(1)}</span>");
            builder.Design.SetMenuFooterVisible(false);
            builder.Design.SetCommentVisible(true);
            builder.Design.SetDefaultComment("<span color='#CCCCCC'>Move:</span> SHIFT/F | <span color='#CCCCCC'>Select:</span> E | <span color='#CCCCCC'>Exit:</span> TAB | <span color='#FF5733'>Custom Reason:</span> R");

            var optionToTargetMap = new System.Collections.Generic.Dictionary<IMenuOption, IPlayer>();

            builder.AddExtraButton(KeyBind.R, "Custom Reason", (p, m) =>
            {
                if (actionType == "unmute") return;
                var highlighted = m.GetCurrentOption(p);
                if (highlighted != null && optionToTargetMap.TryGetValue(highlighted, out var target))
                {
                    _core.Scheduler.NextTick(() => OpenCustomReasonMenu(p, target, actionType));
                }
            });

            var allPlayers = _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid).ToList();
            var alivePlayers = allPlayers.Where(x => x.PlayerPawn?.IsValid == true && x.PlayerPawn.Health > 0).ToList();
            var deadPlayers = allPlayers.Where(x => !(x.PlayerPawn?.IsValid == true && x.PlayerPawn.Health > 0)).ToList();

            foreach (var target in alivePlayers.Concat(deadPlayers))
            {
                bool isAlive = target.PlayerPawn?.IsValid == true && target.PlayerPawn.Health > 0;
                string color = isAlive 
                    ? (target.Controller?.TeamNum == 2 ? "#FFD700" : target.Controller?.TeamNum == 3 ? "#ADD8E6" : "#C0C0C0")
                    : "#808080";
                
                var button = new ButtonMenuOption($"<span color='{color}'>{target.Controller?.PlayerName}</span>") { CloseAfterClick = true };
                
                optionToTargetMap[button] = target;

                button.Click += (_, args) =>
                {
                    var adminPlayer = args.Player;
                    _core.Scheduler.NextTick(() =>
                    {
                        if (actionType == "slay")
                        {
                            _ = ExecuteSlayAsync(adminPlayer, target);
                        }
                        else if (actionType == "kick")
                        {
                            _ = ExecuteKickAsync(adminPlayer, target, "Kicked by Admin via Menu");
                        }
                        else if (actionType == "unmute")
                        {
                            _ = ExecuteUnmuteAsync(adminPlayer, target);
                        }
                        else if (actionType == "mute" || actionType == "ban")
                        {
                            ShowDurationSelectionMenu(adminPlayer, target, actionType, $"{char.ToUpper(actionType[0]) + actionType.Substring(1)}ned by Admin via Menu");
                        }
                    });
                    return ValueTask.CompletedTask;
                };
                builder.AddOption(button);
            }

            _core.MenusAPI.OpenMenuForPlayer(admin, builder.Build());
        }

        private void OpenCustomReasonMenu(IPlayer admin, IPlayer target, string actionType)
        {
            _core.MenusAPI.CloseActiveMenu(admin);

            var prompt = new PendingPrompt
            {
                Admin = admin,
                ActionType = actionType,
                Target = target
            };

            _pendingPrompts[admin.SteamID] = prompt;

            string targetColor = target.Controller?.TeamNum == 2 ? "gold" : target.Controller?.TeamNum == 3 ? "lightblue" : "silver";
            
            _ = admin.SendChatAsync($"[bluegrey][Iridium] [default]You are about to [lime]{actionType} [{targetColor}]{target.Controller?.PlayerName}[default].");
            _ = admin.SendChatAsync($"[orange]• [default]Please type your custom reason directly in chat.");
            _ = admin.SendChatAsync($"[orange]• [default]Type [red]\"cancel\" [default]or [red]crouch [default]to abort.");
        }

        private async Task ExecuteSlayAsync(IPlayer adminPlayer, IPlayer target)
        {
            var adminName = adminPlayer.Controller.PlayerName ?? "Console";
            if (target.PlayerPawn?.IsValid == true)
            {
                _ = _core.Scheduler.NextTickAsync(() =>
                {
                    if (target.PlayerPawn?.IsValid == true)
                    {
                        target.PlayerPawn.CommitSuicide(false, true);
                    }
                });
                target.SendChat($" \x02[Iridium]\x01 You were slayed by {adminName}.");
                
                var msg = $" \x02[Iridium]\x01 {adminName} slayed {target.Controller.PlayerName}.";
                _ = _core.Scheduler.NextTickAsync(() =>
                {
                    foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                    {
                        p.SendChat(msg);
                    }
                });
            }
        }

        private async Task ExecuteKickAsync(IPlayer adminPlayer, IPlayer target, string reason)
        {
            var adminName = adminPlayer?.Controller.PlayerName ?? "Console";
            var targetName = target.Controller.PlayerName;

            var msg = $" \x02[Iridium]\x01 {adminName} kicked {targetName}. Reason: {reason}";
            _ = _core.Scheduler.NextTickAsync(() =>
            {
                foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                {
                    p.SendChat(msg);
                }
            });

            await target.KickAsync(reason, ENetworkDisconnectionReason.NETWORK_DISCONNECT_KICKED);
        }

        private async Task ExecuteMuteAsync(IPlayer? adminPlayer, IPlayer target, string reason, int durationMinutes)
        {
            var adminSteamId = adminPlayer?.SteamID ?? 0;
            var adminName = adminPlayer?.Controller.PlayerName ?? "Console";
            var targetName = target.Controller.PlayerName;
            var targetSteamId = target.SteamID;

            if (await _moderationManager.IsPlayerMutedAsync(targetSteamId))
            {
                if (adminPlayer != null) await adminPlayer.SendChatAsync($" \x02[Iridium]\x01 {targetName} is already muted.");
                return;
            }

            await _moderationManager.AddMuteAsync(targetSteamId, adminSteamId, reason, durationMinutes);

            await _core.Scheduler.NextTickAsync(() =>
            {
                if (target.IsValid) target.VoiceFlags = VoiceFlagValue.Muted;
            });

            var durationText = durationMinutes == 0 ? "permanently" : $"for {durationMinutes} minutes";
            var msg = $" \x02[Iridium]\x01 {adminName} muted {targetName} {durationText}. Reason: {reason}";
            _ = _core.Scheduler.NextTickAsync(() =>
            {
                foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                {
                    p.SendChat(msg);
                }
            });
        }

        private async Task ExecuteUnmuteAsync(IPlayer? adminPlayer, IPlayer target)
        {
            var adminName = adminPlayer?.Controller.PlayerName ?? "Console";
            var targetName = target.Controller.PlayerName;
            var targetSteamId = target.SteamID;

            bool wasUnmuted = await _moderationManager.UnmuteAsync(targetSteamId);

            if (wasUnmuted)
            {
                await _core.Scheduler.NextTickAsync(() =>
                {
                    if (target.IsValid) target.VoiceFlags = VoiceFlagValue.Normal;
                });

                var msg = $" \x02[Iridium]\x01 {adminName} unmuted {targetName}.";
                _ = _core.Scheduler.NextTickAsync(() =>
                {
                    foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                    {
                        p.SendChat(msg);
                    }
                });
            }
            else
            {
                if (adminPlayer != null) await adminPlayer.SendChatAsync($" \x02[Iridium]\x01 {targetName} is not muted.");
            }
        }

        private async Task ExecuteBanAsync(IPlayer? adminPlayer, IPlayer target, string reason, int durationMinutes)
        {
            var adminSteamId = adminPlayer?.SteamID ?? 0;
            var adminName = adminPlayer?.Controller.PlayerName ?? "Console";
            var targetName = target.Controller.PlayerName;
            var targetSteamId = target.SteamID;

            if (await _moderationManager.IsPlayerBannedAsync(targetSteamId))
            {
                if (adminPlayer != null) await adminPlayer.SendChatAsync($" \x02[Iridium]\x01 {targetName} is already banned.");
                return;
            }

            await _moderationManager.AddBanAsync(targetSteamId, adminSteamId, reason, durationMinutes);

            var durationText = durationMinutes == 0 ? "permanently" : $"for {durationMinutes} minutes";
            var msg = $" \x02[Iridium]\x01 {adminName} banned {targetName} {durationText}. Reason: {reason}";
            foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
            {
                p.SendChat(msg);
            }

            await target.KickAsync($"Banned {durationText}: {reason}", ENetworkDisconnectionReason.NETWORK_DISCONNECT_KICKED);
        }

        private void ShowDurationSelectionMenu(IPlayer admin, IPlayer target, string actionType, string reason)
        {
            var builder = _core.MenusAPI.CreateBuilder();
            builder.Design.SetMenuTitle($"<span color='#FF5733'>Duration for {char.ToUpper(actionType[0]) + actionType.Substring(1)}ing {target.Controller?.PlayerName}</span>");
            builder.Design.SetMenuFooterVisible(false);
            builder.Design.SetCommentVisible(true);
            builder.Design.SetDefaultComment("<span color='#CCCCCC'>Move:</span> SHIFT/F | <span color='#CCCCCC'>Select:</span> E | <span color='#CCCCCC'>Exit:</span> TAB");

            var durations = new Dictionary<string, int>
            {
                { "10 Minutes", 10 },
                { "30 Minutes", 30 },
                { "1 Hour", 60 },
                { "1 Day", 1440 },
                { "1 Week", 10080 },
                { "Permanent", 0 }
            };

            foreach (var kvp in durations)
            {
                var button = new ButtonMenuOption(kvp.Key) { CloseAfterClick = true };
                int minutes = kvp.Value;
                button.Click += (_, args) =>
                {
                    var adminPlayer = args.Player;
                    _core.Scheduler.NextTick(() =>
                    {
                        if (actionType == "mute")
                        {
                            _ = ExecuteMuteAsync(adminPlayer, target, reason, minutes);
                        }
                        else if (actionType == "ban")
                        {
                            _ = ExecuteBanAsync(adminPlayer, target, reason, minutes);
                        }
                    });
                    return ValueTask.CompletedTask;
                };
                builder.AddOption(button);
            }

            _core.MenusAPI.OpenMenuForPlayer(admin, builder.Build());
        }
    }
}

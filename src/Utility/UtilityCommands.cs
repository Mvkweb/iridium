using System;
using System.Linq;
using System.Threading.Tasks;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Commands;
using SwiftlyS2.Shared.Players;
using SwiftlyS2.Shared.SchemaDefinitions;
using SwiftlyS2.Shared.Natives;
using Iridium.Utils;
using Iridium.Config;

namespace Iridium.Utility
{
    public class UtilityCommands
    {
        private readonly ISwiftlyCore _core;

        public UtilityCommands(ISwiftlyCore core)
        {
            _core = core;
        }

        private async Task GiveGrenadeAsync(ICommandContext context, string commandName, string weaponDesignerName, string prettyName)
        {
            if (context.Args.Length == 0)
            {
                // Give to self
                var admin = context.Sender;
                if (admin == null)
                {
                    await context.ReplyAsync($" Usage: !{commandName} <target>");
                    return;
                }

                if (admin.Controller?.PawnIsAlive == true)
                {
                    _core.Scheduler.NextTick(() =>
                    {
                        if (admin.PlayerPawn?.IsValid == true)
                        {
                            _ = admin.PlayerPawn.ItemServices.GiveItemAsync<CBasePlayerWeapon>(weaponDesignerName);
                            _ = admin.SendChatAsync($" \x02[Iridium]\x01 You gave yourself a {prettyName}.");
                        }
                    });
                }
                else
                {
                    await admin.SendChatAsync($" \x02[Iridium]\x01 You must be alive to receive a {prettyName}.");
                }
                return;
            }

            // Target specified
            var targets = PlayerUtils.FindPlayersByTarget(_core, context.Sender, context.Args[0]);
            if (targets.Count == 0)
            {
                await context.ReplyAsync(" No matching players found.");
                return;
            }

            int givenCount = 0;
            var adminName = context.Sender?.Controller.PlayerName ?? "Console";

            foreach (var target in targets)
            {
                if (target.Controller?.PawnIsAlive == true && target.PlayerPawn?.IsValid == true)
                {
                    _core.Scheduler.NextTick(() =>
                    {
                        if (target.PlayerPawn?.IsValid == true)
                        {
                            _ = target.PlayerPawn.ItemServices.GiveItemAsync<CBasePlayerWeapon>(weaponDesignerName);
                        }
                    });
                    givenCount++;
                }
            }

            if (givenCount > 0)
            {
                var targetName = targets.Count == 1 ? targets[0].Controller.PlayerName : $"{givenCount} players";
                foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                {
                    await p.SendChatAsync($" \x02[Iridium]\x01 {adminName} gave a {prettyName} to {targetName}.");
                }
            }
            else
            {
                await context.ReplyAsync(" No valid targets were alive to receive the item.");
            }
        }

        [Command("smoke", permission: "iridium.utility")]
        public async Task OnSmokeCommandAsync(ICommandContext context)
        {
            if (context.Args.Length > 0 && context.Args[0].Equals("stop", StringComparison.OrdinalIgnoreCase))
            {
                int clearedCount = 0;
                await _core.Scheduler.NextTickAsync(() =>
                {
                    var smokes = _core.EntitySystem.GetAllEntitiesByDesignerName<CBaseEntity>("smokegrenade_projectile");
                    foreach (var smoke in smokes)
                    {
                        if (smoke?.IsValid == true)
                        {
                            smoke.AcceptInput<string>("Kill", null, null, null, 0);
                            clearedCount++;
                        }
                    }
                });

                string adminName = context.Sender?.Controller.PlayerName ?? "Console";
                if (clearedCount > 0)
                {
                    foreach (var p in _core.PlayerManager.GetAllPlayers().Where(x => x.IsValid))
                    {
                        await p.SendChatAsync($" \x02[Iridium]\x01 {adminName} cleared {clearedCount} active smoke(s).");
                    }
                }
                else
                {
                    await context.ReplyAsync($" \x02[Iridium]\x01 No active smokes found on the map.");
                }
                return;
            }

            await GiveGrenadeAsync(context, "smoke", "weapon_smokegrenade", "Smoke Grenade");
        }

        [Command("molotov", permission: "iridium.utility")]
        public async Task OnMolotovCommandAsync(ICommandContext context)
        {
            await GiveGrenadeAsync(context, "molotov", "weapon_molotov", "Molotov");
        }

        [Command("flash", permission: "iridium.utility")]
        [CommandAlias("flashbang")]
        public async Task OnFlashCommandAsync(ICommandContext context)
        {
            await GiveGrenadeAsync(context, "flash", "weapon_flashbang", "Flashbang");
        }

        [Command("hegrenade", permission: "iridium.utility")]
        [CommandAlias("frag")]
        [CommandAlias("nade")]
        public async Task OnHeGrenadeCommandAsync(ICommandContext context)
        {
            await GiveGrenadeAsync(context, "hegrenade", "weapon_hegrenade", "HE Grenade");
        }
    }
}

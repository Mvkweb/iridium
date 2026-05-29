using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Players;
using Iridium.Config;
using Microsoft.Extensions.Logging;
using SwiftlyS2.Shared.GameEventDefinitions;
using SwiftlyS2.Shared.Plugins;
using SwiftlyS2.Shared.Misc;

namespace Iridium.ESP;

public class AdminESP
{
    private readonly ISwiftlyCore _core;
    private readonly Iridium _plugin;
    
    // Tracks admins who have ESP turned ON
    private readonly HashSet<ulong> _activeAdmins = new();
    
    // Tracks the active ESP overlay for each player on the server
    private readonly ConcurrentDictionary<int, PlayerESPTracker> _espTrackers = new();
    private DateTime _nextEspTick = DateTime.UtcNow;

    public AdminESP(ISwiftlyCore core, Iridium plugin)
    {
        _core = core;
        _plugin = plugin;
        
        // Ticks every engine frame, but we throttle to 100ms
        _core.Event.OnTick += () =>
        {
            if (DateTime.UtcNow < _nextEspTick) return;
            _nextEspTick = DateTime.UtcNow.AddMilliseconds(100);

            try
            {
                ProcessESPTick();
            }
            catch (Exception ex)
            {
                _core.Logger.LogError("[Iridium] ESP Tick Error: " + ex.Message);
            }
        };

        // Explicitly destroy all glows before the engine resets the map on round prestart.
        // Failing to do this causes the engine to corrupt the dynamic props attached to pawns that get wiped!
        _core.GameEvent.HookPre<EventRoundPrestart>((@event) =>
        {
            try
            {
                foreach (var tracker in _espTrackers.Values)
                {
                    tracker.Dispose();
                }
                _espTrackers.Clear();
            }
            catch (Exception ex)
            {
                _core.Logger.LogError("[Iridium] ESP RoundPrestart Error: " + ex.Message);
            }
            return HookResult.Continue;
        });
    }

    public void ToggleESP(IPlayer? admin)
    {
        if (admin == null) return;
        
        string espPerm = _plugin.Config.ESP.SpectatorPermission;
        string rootPerm = _plugin.Config.ESP.FullPermission;
        
        if (!string.IsNullOrEmpty(espPerm) && !_core.Permission.PlayerHasPermission(admin.SteamID, espPerm))
        {
            if (!string.IsNullOrEmpty(rootPerm) && !_core.Permission.PlayerHasPermission(admin.SteamID, rootPerm))
            {
                admin.SendChat(" \x02[Iridium]\x01 You do not have permission to use ESP.");
                return;
            }
        }

        if (_activeAdmins.Contains(admin.SteamID))
        {
            _activeAdmins.Remove(admin.SteamID);
            
            // Instantly clear the ESP overlays for this admin
            foreach (var tracker in _espTrackers.Values)
            {
                tracker.UpdateTransmissionState(admin.PlayerID, false, false, false);
            }
            
            admin.SendChat(" \x02[Iridium]\x01 ESP is now \x0F" + "OFF\x01.");
        }
        else
        {
            _activeAdmins.Add(admin.SteamID);
            admin.SendChat(" \x02[Iridium]\x01 ESP is now \x04ON\x01.");
        }
    }

    private void ProcessESPTick()
    {
        var allPlayers = _core.PlayerManager.GetAllPlayers().Where(p => p.IsValid && p.Controller != null).ToList();
        
        // 1. Maintain track of all valid, alive targets
        foreach (var target in allPlayers)
        {
            bool isAlive = target.Controller?.PawnIsAlive == true;
            uint? currentPawnIndex = target.PlayerPawn?.Index;
            
            bool hasTracker = _espTrackers.TryGetValue(target.PlayerID, out var tracker);
            bool isPawnChanged = hasTracker && tracker?.PawnIndex != currentPawnIndex;

            // If their pawn was completely replaced (like on warmup end or round restart)
            // we must recreate the ESP overlays because the old pawn was destroyed by the engine!
            if (isPawnChanged)
            {
                if (_espTrackers.TryRemove(target.PlayerID, out var oldTracker))
                {
                    oldTracker.Dispose();
                }
                hasTracker = false;
            }

            if (isAlive && !hasTracker)
            {
                // Only create the tracker once the engine has assigned a valid model to the pawn
                // This prevents spawning unprecached fallback models which the engine instantly deletes
                string? modelName = target.PlayerPawn?.CBodyComponent?.SceneNode?.GetSkeletonInstance()?.ModelState?.ModelName;
                if (!string.IsNullOrEmpty(modelName))
                {
                    _espTrackers[target.PlayerID] = new PlayerESPTracker(target, _core, _plugin.Config);
                }
            }
            else if (!isAlive && hasTracker)
            {
                if (_espTrackers.TryRemove(target.PlayerID, out var deadTracker))
                {
                    deadTracker.Dispose();
                }
            }
        }

        // Clean up disconnected players
        var activeTargetIds = allPlayers.Select(p => p.PlayerID).ToHashSet();
        foreach (var key in _espTrackers.Keys.ToList())
        {
            if (!activeTargetIds.Contains(key))
            {
                if (_espTrackers.TryRemove(key, out var oldTracker))
                    oldTracker.Dispose();
            }
        }

        // 2. Transmit updates to EVERY viewer on the server to enforce visibility
        foreach (var viewer in allPlayers)
        {
            bool isActiveAdmin = _activeAdmins.Contains(viewer.SteamID);
            bool isRoot = _core.Permission.PlayerHasPermission(viewer.SteamID, "root");
            bool isAlive = viewer.Controller?.PawnIsAlive == true;

            // Strict Permission Enforcement: Non-roots lose ESP while alive
            if (isActiveAdmin && !isRoot && isAlive)
            {
                isActiveAdmin = false;
            }

            foreach (var target in allPlayers)
            {
                if (target.PlayerID == viewer.PlayerID) continue;
                if (!target.IsValid || target.Controller?.PawnIsAlive != true) continue;

                if (_espTrackers.TryGetValue(target.PlayerID, out var tracker))
                {
                    if (!isActiveAdmin)
                    {
                        // Explicitly hide from viewers who don't have ESP active
                        tracker.UpdateTransmissionState(viewer.PlayerID, false, false, false);
                    }
                    else
                    {
                        bool isTeammate = target.Controller.TeamNum == viewer.Controller?.TeamNum;
                        bool isEnemy = !isTeammate && target.Controller?.TeamNum >= 2 && viewer.Controller?.TeamNum >= 2;

                        // Spectator logic
                        if (viewer.Controller?.TeamNum == 1) // Spectator
                        {
                            if (target.Controller.TeamNum == 3) isTeammate = true; 
                            else if (target.Controller.TeamNum == 2) isEnemy = true;
                        }

                        tracker.UpdateTransmissionState(viewer.PlayerID, true, isTeammate, isEnemy);
                    }
                }
            }
        }
    }

    public void RefreshGlowsOnConfigChange()
    {
        // Recreate all trackers with new config colors
        foreach (var tracker in _espTrackers.Values)
        {
            tracker.Dispose();
        }
        _espTrackers.Clear();
    }
}

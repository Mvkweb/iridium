using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Players;
using Iridium.Config;
using Microsoft.Extensions.Logging;

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
            admin.SendChat(" \x02[Iridium]\x01 ESP is now \x0FfOFF\x01.");
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
            
            if (isAlive && !_espTrackers.ContainsKey(target.PlayerID))
            {
                _espTrackers[target.PlayerID] = new PlayerESPTracker(target, _core, _plugin.Config);
            }
            else if (!isAlive && _espTrackers.TryRemove(target.PlayerID, out var deadTracker))
            {
                deadTracker.Dispose();
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

        // 2. Transmit to active admins
        foreach (var adminId in _activeAdmins.ToList())
        {
            var admin = allPlayers.FirstOrDefault(p => p.SteamID == adminId);
            if (admin == null) continue; // Disconnected

            bool isRoot = _core.Permission.PlayerHasPermission(admin.SteamID, "root");
            bool isAlive = admin.Controller?.PawnIsAlive == true;

            // Strict Permission Enforcement: Non-roots lose ESP while alive
            if (!isRoot && isAlive)
            {
                continue;
            }

            // Transmit glows to this admin
            foreach (var target in allPlayers)
            {
                if (target.PlayerID == admin.PlayerID) continue;
                if (!target.IsValid || target.Controller?.PawnIsAlive != true) continue;

                if (_espTrackers.TryGetValue(target.PlayerID, out var tracker))
                {
                    bool isTeammate = target.Controller.TeamNum == admin.Controller?.TeamNum;
                    bool isEnemy = !isTeammate && target.Controller?.TeamNum >= 2 && admin.Controller?.TeamNum >= 2;

                    // Spectator logic
                    if (admin.Controller?.TeamNum == 1) // Spectator
                    {
                        if (target.Controller.TeamNum == 3) isTeammate = true; // CTs are green
                        else if (target.Controller.TeamNum == 2) isEnemy = true; // Ts are red
                    }

                    tracker.UpdateTransmissionState(admin.PlayerID, true, isTeammate, isEnemy);
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

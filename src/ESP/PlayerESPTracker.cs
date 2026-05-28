using SwiftlyS2.Shared.Natives;
using SwiftlyS2.Shared.SchemaDefinitions;
using SwiftlyS2.Shared.Players;
using SwiftlyS2.Shared;
using Iridium.Config;
using System;

namespace Iridium.ESP;

public class PlayerESPTracker : IDisposable
{
    public int TargetPlayerId { get; }
    public string ActiveModelName { get; }

    private CDynamicProp? _proxyRelay;
    private CDynamicProp? _enemyGlowOverlay;
    private CDynamicProp? _teamGlowOverlay;
    
    public bool IsDisposed { get; private set; }

    public PlayerESPTracker(IPlayer target, ISwiftlyCore core, IridiumConfig config)
    {
        TargetPlayerId = target.PlayerID;
        ActiveModelName = ResolveCharacterModel(target);

        InitializeOverlays(target, core, config);
    }

    private string ResolveCharacterModel(IPlayer player)
    {
        if (player.PlayerPawn?.CBodyComponent?.SceneNode?.GetSkeletonInstance()?.ModelState?.ModelName is { } modelName && !string.IsNullOrEmpty(modelName))
        {
            return modelName;
        }

        return player.Controller?.TeamNum == 2 
            ? "characters/models/tm_phoenix/tm_phoenix.vmdl" 
            : "characters/models/ctm_sas/ctm_sas.vmdl";
    }

    private void InitializeOverlays(IPlayer target, ISwiftlyCore core, IridiumConfig config)
    {
        _proxyRelay = core.EntitySystem.CreateEntityByDesignerName<CDynamicProp>("prop_dynamic");
        _enemyGlowOverlay = core.EntitySystem.CreateEntityByDesignerName<CDynamicProp>("prop_dynamic");
        _teamGlowOverlay = core.EntitySystem.CreateEntityByDesignerName<CDynamicProp>("prop_dynamic");

        if (_proxyRelay == null || _enemyGlowOverlay == null || _teamGlowOverlay == null) 
            return;

        // Clear EF_NODRAW flag (bit 2)
        const uint NO_DRAW_FLAG = ~(1u << 2);

        // Setup the Proxy Relay (Invisible bone-merge target)
        if (_proxyRelay.CBodyComponent?.SceneNode?.Owner?.Entity != null)
            _proxyRelay.CBodyComponent.SceneNode.Owner.Entity.Flags &= NO_DRAW_FLAG;
        
        _proxyRelay.SetModel(ActiveModelName);
        _proxyRelay.Spawnflags = 256u; // Bone Merge
        _proxyRelay.RenderMode = RenderMode_t.kRenderNone;
        _proxyRelay.DispatchSpawn();

        // Setup Enemy Overlay (Red)
        ConfigureGlowEntity(_enemyGlowOverlay, ActiveModelName, config.ESP.SlaughterRed);

        // Setup Team Overlay (Green)
        ConfigureGlowEntity(_teamGlowOverlay, ActiveModelName, config.ESP.DopplerGreen);

        // Bind the hierarchy carefully to avoid engine crashes if target despawns
        if (target.Pawn != null)
            _proxyRelay.AcceptInput("FollowEntity", "!activator", target.Pawn, _proxyRelay);
            
        _enemyGlowOverlay.AcceptInput("FollowEntity", "!activator", _proxyRelay, _enemyGlowOverlay);
        _teamGlowOverlay.AcceptInput("FollowEntity", "!activator", _proxyRelay, _teamGlowOverlay);
    }

    private void ConfigureGlowEntity(CDynamicProp overlay, string modelName, GlowColor colorConfig)
    {
        if (overlay.CBodyComponent?.SceneNode?.Owner?.Entity != null)
            overlay.CBodyComponent.SceneNode.Owner.Entity.Flags &= ~(1u << 2);

        overlay.SetModel(modelName);
        overlay.Spawnflags = 256u;
        overlay.DispatchSpawn();

        overlay.Render = new Color(0, 0, 0, 1);
        overlay.Glow.GlowColorOverride = new Color(colorConfig.R, colorConfig.G, colorConfig.B, colorConfig.A);
        overlay.Glow.GlowRange = 5000;
        overlay.Glow.GlowTeam = -1;
        overlay.Glow.GlowType = 3; // Glow outline
        overlay.Glow.GlowRangeMin = 0;
    }

    public void UpdateTransmissionState(int viewerId, bool canTransmit, bool isTeammate, bool isEnemy)
    {
        if (IsDisposed) return;

        // Never transmit to self
        if (viewerId == TargetPlayerId || !canTransmit)
        {
            SetNetworkTransmission(false, false, false, viewerId);
            return;
        }

        // Always transmit relay if ESP is visible
        if (isTeammate)
        {
            SetNetworkTransmission(true, false, true, viewerId); // Only Team Overlay
        }
        else if (isEnemy)
        {
            SetNetworkTransmission(true, true, false, viewerId); // Only Enemy Overlay
        }
    }

    private void SetNetworkTransmission(bool transmitRelay, bool transmitEnemy, bool transmitTeam, int viewerId)
    {
        if (_proxyRelay?.IsValid == true) _proxyRelay.SetTransmitState(transmitRelay, viewerId);
        if (_enemyGlowOverlay?.IsValid == true) _enemyGlowOverlay.SetTransmitState(transmitEnemy, viewerId);
        if (_teamGlowOverlay?.IsValid == true) _teamGlowOverlay.SetTransmitState(transmitTeam, viewerId);
    }

    public void Dispose()
    {
        if (IsDisposed) return;
        IsDisposed = true;

        if (_enemyGlowOverlay?.IsValid == true) _enemyGlowOverlay.Despawn();
        if (_teamGlowOverlay?.IsValid == true) _teamGlowOverlay.Despawn();
        if (_proxyRelay?.IsValid == true) _proxyRelay.Despawn();
    }
}

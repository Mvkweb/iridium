namespace Iridium.Config;

public class IridiumConfig
{
    public ESPConfig ESP { get; set; } = new();
    public ServerConfig Server { get; set; } = new();
}

public class ServerConfig
{
    public string RconPermission { get; set; } = "iridium.rcon";
    public string[] BlockedRconCommands { get; set; } = { "quit", "exit", "killserver", "plugin_unload" };
}

public class ESPConfig
{
    public string FullPermission { get; set; } = "iridium.root";
    public string SpectatorPermission { get; set; } = "iridium.esp";
    public GlowColor SlaughterRed { get; set; } = new() { R = 235, G = 52, B = 52, A = 255 };
    public GlowColor DopplerGreen { get; set; } = new() { R = 52, G = 235, B = 113, A = 255 };
}

public class GlowColor
{
    public int R { get; set; } = 255;
    public int G { get; set; } = 255;
    public int B { get; set; } = 255;
    public int A { get; set; } = 255;
}

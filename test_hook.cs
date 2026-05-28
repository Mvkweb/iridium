using SwiftlyS2.Shared;
using SwiftlyS2.Shared.Players;
public class TestHook {
    public void Test(IPlayer player) {
        player.SendMessage(MessageType.Console, "test");
    }
}

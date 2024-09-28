package net.shellhacks.swag.espe_bridge;

import com.snowflake.snowpark_java.Session;
import net.shellhacks.swag.espe_bridge.requests.AddContrast;
import net.shellhacks.swag.espe_bridge.requests.GetVideoID;
import net.shellhacks.swag.espe_bridge.requests.NewVideo;

import java.util.Map;

/**
 * New request types are added here.
 */
public class RequestDirector {

  private final Session session;

  public RequestDirector(Session session) {
    this.session = session;
  }

  public Response executeRequest(String path, Map<String, String> parameters) {
    // Remove the "/"
    // Could be blank
    String route = path.substring(1);

    switch (route) {
      case NewVideo.ROUTE:
        System.out.println("Received request to create new video in database!");
        return NewVideo.executeRequest(parameters, this.session);
      case GetVideoID.ROUTE:
        System.out.println("Received request to get ID of existing video in database!");
        return GetVideoID.executeRequest(parameters, this.session);
      case AddContrast.ROUTE:
        System.out.println("Received request to add new contrast to database!");
        return AddContrast.executeRequest(parameters, this.session);
      default:
        System.out.println("Received unknown request: \"" + path + "\"");
        return new Response(StatusCode.NOT_FOUND, null);
    }
  }

  /**
   * Shuts down Snowflake connection.
   */
  public void shutdown() {
    this.session.close();
    System.out.println("Shut down Snowflake connection!");
  }

}

package net.shellhacks.swag.espe_bridge;

import java.util.Map;

/**
 * New request types are added here.
 */
public class RequestDirector {

  public static Response executeRequest(String path, Map<String, String> parameters) {


    return new Response(StatusCode.OK, null);
  }

}

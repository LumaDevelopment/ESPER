package net.shellhacks.swag.espe_bridge;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.snowflake.snowpark_java.Session;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.Promise;
import io.vertx.core.http.HttpServerRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

public class MainVerticle extends AbstractVerticle {

  private static final Logger log = LoggerFactory.getLogger(MainVerticle.class);

  private final ObjectMapper mapper;
  private Session session;

  public MainVerticle() {
    this.mapper = new ObjectMapper();
  }

  @Override
  public void start(Promise<Void> startPromise) throws Exception {
    vertx.createHttpServer().requestHandler(req -> {
      // Load parameters into map
      Map<String, String> params = new HashMap<>();
      req.params().forEach(entry -> params.put(entry.getKey(), entry.getValue()));

      // Submit the request to the request director
      Response resp = RequestDirector.executeRequest(
        req.path(),
        params
      );

      String content = null;

      if (!resp.isError()) {
        // Attempt to convert response data to String
        try {
          content = this.mapper.writeValueAsString(resp.getData());
        } catch (JsonProcessingException e) {
          log.error("Failed to convert response content to JSON!", e);
          resp = new Response(StatusCode.INTERNAL_ERROR, null);
        }
      }

      if (!resp.isError() && content != null) {
        // Valid response, send to user
        req.response()
          .putHeader("content-type", "application/json")
          .end(content);
      } else {
        throwError(req, resp.getCode());
      }
    }).listen(8888).onComplete(http -> {
      // Create a new session, using the connection properties
      // specified in a file.
      try {
        this.session = Session.builder().configFile("snowflake.properties").create();
      } catch (Exception e) {
        System.err.println("Snowflake initialization failed, shutting down...");
        startPromise.fail(e);
        return;
      }

      System.out.println("Snowflake successfully initialized!");

      if (http.succeeded()) {
        startPromise.complete();
        System.out.println("HTTP server started on port 8888");
      } else {
        startPromise.fail(http.cause());
      }
    });
  }

  /**
   * Sends the client an error code instead of a
   * normal response.
   */
  private void throwError(HttpServerRequest req, StatusCode code) {
    if (req == null) return;

    // Make sure we don't send OK with empty response
    // back to client
    int num = code.getStatusCode();
    if (num == StatusCode.OK.getStatusCode()) {
      num = StatusCode.INTERNAL_ERROR.getStatusCode();
    }

    // Send response
    req.response().setStatusCode(num).end();
  }

  @Override
  public void stop() throws Exception {
    // Shut down Snowflake connection
    if (this.session != null) {
      this.session.close();
    }
  }

}

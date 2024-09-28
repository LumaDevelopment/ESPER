package net.shellhacks.swag.espe_bridge;

import com.fasterxml.jackson.databind.node.ObjectNode;

public class Response {

  private final StatusCode code;
  private final ObjectNode data;

  public Response(StatusCode code, ObjectNode data) {
    this.code = code;
    this.data = data;
  }

  public StatusCode getCode() {
    return code;
  }

  public ObjectNode getData() {
    return data;
  }

  /**
   * @return Whether this is a response with data
   * or an error code.
   */
  public boolean isError() {
    // If the code exists, and it's OK,
    // and data exists, we say this is
    // not an error
    return !(
      code != null && code.equals(StatusCode.OK) && data != null
    );
  }

}

package net.shellhacks.swag.espe_bridge.requests;

import com.snowflake.snowpark_java.Session;
import net.shellhacks.swag.espe_bridge.MainVerticle;
import net.shellhacks.swag.espe_bridge.Response;
import net.shellhacks.swag.espe_bridge.StatusCode;
import net.shellhacks.swag.espe_bridge.Utils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.Map;

public class AddContrast {

  public static final String ROUTE = "add-contrast";

  public static Response executeRequest(Map<String, String> parameters, Session session) {
    LinkedList<Object[]> sqlParams = new LinkedList<>();

    for (Map.Entry<String, String> param : parameters.entrySet()) {
      // Filtering
      String upperKey = param.getKey().trim().toUpperCase();
      String value = param.getValue().trim();

      // Add to SQL params, if valid
      switch (upperKey) {
        case "VIDEOUUID":
          sqlParams.add(new Object[]{upperKey, value});
          break;
        case "IDX":
          Integer intVal;
          try {
            intVal = Integer.parseInt(value);
          } catch (NumberFormatException e) {
            System.err.println("Invalid index: \"" + value + "\"");
            break;
          }

          sqlParams.add(new Object[]{upperKey, intVal});
          break;
        case "VALUE":
          double doubleVal;
          try {
            doubleVal = Double.parseDouble(value);
          } catch (Exception e) {
            System.err.println("Invalid value: \"" + value + "\"");
            break;
          }

          sqlParams.add(new Object[]{upperKey, doubleVal});
          break;
        default:
          break;
      }
    }

    // We need all three parameters to do this
    if (sqlParams.size() != 3) {
      System.err.println("Missing parameters to add contrast to SQL!");
      return new Response(StatusCode.MALFORMED_REQUEST, null);
    }

    // We've determined we have valid data to throw into
    // SQL. First thing we need is the raw SQL connection
    Connection conn = session.jdbcConnection();

    // Next, we dynamically prepare the first half
    // of the INSERT statement
    String rawStatement = Utils.createRawStatement(
      "ESPE.ESPE_SCHEMA.ESPE_CONTRAST",
      sqlParams
    );

    try {
      // Now, we convert this statement to a PreparedStatement,
      // and fill in the values
      PreparedStatement stmt = conn.prepareStatement(rawStatement);

      // Loop through all parameters
      Iterator<Object[]> it = sqlParams.iterator();
      int i = 1;
      while (it.hasNext()) {
        Object[] keyValue = it.next();

        // set it based on type
        if (keyValue[1] instanceof String) {
          stmt.setString(i, (String) keyValue[1]);
        } else if (keyValue[1] instanceof Integer) {
          stmt.setInt(i, (Integer) keyValue[1]);
        } else if (keyValue[1] instanceof Double) {
          stmt.setDouble(i, (Double) keyValue[1]);
        } else {
          System.err.println(keyValue[0] + " of unknown type " + keyValue[1].getClass().getSimpleName());
        }

        // Increment iterator
        i += 1;
      }

      // Statement has been created. Execute it.
      stmt.executeUpdate();
    } catch (SQLException e) {
      System.err.println("Failed to assemble and execute SQL statement!");
      e.printStackTrace();
      return new Response(StatusCode.INTERNAL_ERROR, null);
    }

    return new Response(StatusCode.OK, MainVerticle.mapper.createObjectNode());
  }

}

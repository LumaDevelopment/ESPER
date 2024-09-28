package net.shellhacks.swag.espe_bridge.requests;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.snowflake.snowpark_java.Session;
import net.shellhacks.swag.espe_bridge.MainVerticle;
import net.shellhacks.swag.espe_bridge.Response;
import net.shellhacks.swag.espe_bridge.StatusCode;
import net.shellhacks.swag.espe_bridge.Utils;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

public class NewVideo {

  public static final String ROUTE = "new-video";

  public static Response executeRequest(Map<String, String> parameters, Session session) {
    LinkedList<Object[]> sqlParams = new LinkedList<>();
    boolean titleFound = false;

    for (Map.Entry<String, String> param : parameters.entrySet()) {
      // Filtering
      String upperKey = param.getKey().trim().toUpperCase();
      String value = param.getValue().trim();

      // Add to SQL params, if valid
      switch (upperKey) {
        case "TITLE":
          titleFound = true;
        case "DESCRIPTION":
        case "YTID":
          sqlParams.add(new Object[]{upperKey, value});
          break;
        case "WHENUPLOADED":
          // Attempt to parse date, if it fails,
          // we don't add parameter to map
          try {
            LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE);
          } catch (DateTimeParseException e) {
            System.err.println("Invalid upload date: \"" + value + "\"");
            break;
          }

          sqlParams.add(new Object[]{upperKey, value});
          break;
        case "FRAMEWIDTH":
        case "FRAMELENGTH":
        case "FRAMERATE":
          // Attempt to parse video dimensions, if it
          // fails, don't add parameter to map
          Integer intVal;
          try {
            intVal = Integer.parseInt(value);
          } catch (NumberFormatException e) {
            System.err.println("Invalid \"" + upperKey + "\": \"" + value + "\"");
            break;
          }

          sqlParams.add(new Object[]{upperKey, intVal});
          break;
        case "CATEGORY":
          if (Utils.validCategories.contains(value)) {
            sqlParams.add(new Object[]{upperKey, value});
          } else {
            System.err.println("Invalid category: \"" + value + "\"");
          }

          break;
        default:
          System.err.println("Invalid field: \"" + upperKey + "\"");
          break;
      }
    }

    // Make sure it at least has a title
    if (!titleFound) {
      System.err.println("No title in new video request!");
      return new Response(StatusCode.MALFORMED_REQUEST, null);
    }

    // Create unique identifier for this video
    // and inject it into SQL parameters
    String uuid = UUID.randomUUID().toString();
    sqlParams.add(new Object[]{"UUID", uuid});

    // We've determined we have valid data to throw into
    // SQL. First thing we need is the raw SQL connection
    Connection conn = session.jdbcConnection();

    // Next, we dynamically prepare the first half
    // of the INSERT statement
    StringBuilder rawStatement = new StringBuilder();
    rawStatement.append("INSERT INTO ESPE.ESPE_SCHEMA.ESPE_VIDEOS (");

    // Put all field names in the statement
    Iterator<Object[]> it = sqlParams.iterator();
    while (it.hasNext()) {
      Object[] keyValue = it.next();

      rawStatement.append((String) keyValue[0]);
      if (it.hasNext()) {
        rawStatement.append(", ");
      }
    }
    rawStatement.append(") VALUES (");

    // Then, we dynamically put in a question mark
    // for each field
    for (int i = 0; i < sqlParams.size(); i++) {
      rawStatement.append("?");
      if (i != (sqlParams.size() - 1)) {
        rawStatement.append(", ");
      }
    }
    rawStatement.append(")");

    try {
      // Now, we convert this statement to a PreparedStatement,
      // and fill in the values
      PreparedStatement stmt = conn.prepareStatement(rawStatement.toString());

      // Loop through all parameters
      it = sqlParams.iterator();
      int i = 1;
      while (it.hasNext()) {
        Object[] keyValue = it.next();

        // set it based on type
        if (keyValue[1] instanceof String) {
          stmt.setString(i, (String) keyValue[1]);
        } else if (keyValue[1] instanceof Integer) {
          stmt.setInt(i, (Integer) keyValue[1]);
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

    // Finally, assemble JSON with new UUID
    ObjectNode returnVal = MainVerticle.mapper.createObjectNode();
    returnVal.put("uuid", uuid);

    return new Response(StatusCode.OK, returnVal);
  }

}

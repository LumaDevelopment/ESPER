package net.shellhacks.swag.espe_bridge.requests;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.snowflake.snowpark_java.DataFrame;
import com.snowflake.snowpark_java.Functions;
import com.snowflake.snowpark_java.Session;
import net.shellhacks.swag.espe_bridge.MainVerticle;
import net.shellhacks.swag.espe_bridge.Response;
import net.shellhacks.swag.espe_bridge.StatusCode;
import net.shellhacks.swag.espe_bridge.Utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.LinkedList;
import java.util.Map;

public class GetVideoID {

  public static final String ROUTE = "get-video-id";

  public static Response executeRequest(Map<String, String> parameters, Session session) {
    LinkedList<Object[]> sqlParams = new LinkedList<>();

    for (Map.Entry<String, String> param : parameters.entrySet()) {
      // Filtering
      String upperKey = param.getKey().trim().toUpperCase();
      String value = param.getValue().trim();

      // Add to SQL params, if valid
      switch (upperKey) {
        case "TITLE":
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

    // If all the parameters got filtered out, end
    if (sqlParams.isEmpty()) {
      System.err.println("No valid fields to get video ID with!");
      return new Response(StatusCode.MALFORMED_REQUEST, null);
    }

    DataFrame df = session.table("ESPE_VIDEOS");

    // Filter by every parameter we have
    for (Object[] keyValue: sqlParams) {
      df = df.where(
        Functions.col((String) keyValue[0])
                 .equal_to(Functions.lit(keyValue[1]))
      );
    }

    ObjectNode returnVal = MainVerticle.mapper.createObjectNode();
    returnVal.put("Number of matches", df.count());

    return new Response(StatusCode.OK, returnVal);
  }

}

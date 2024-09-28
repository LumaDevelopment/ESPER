package net.shellhacks.swag.espe_bridge.requests;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.snowflake.snowpark_java.DataFrame;
import com.snowflake.snowpark_java.Functions;
import com.snowflake.snowpark_java.Row;
import com.snowflake.snowpark_java.Session;
import net.shellhacks.swag.espe_bridge.MainVerticle;
import net.shellhacks.swag.espe_bridge.Response;
import net.shellhacks.swag.espe_bridge.StatusCode;
import net.shellhacks.swag.espe_bridge.Utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.Map;
import java.util.Optional;

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

      if (df.count() <= 1) {
        // Don't need to keep filtering if
        // we already have what we're
        // looking for
        break;
      }
    }

    long dfCount = df.count();

    if (dfCount > 1) {
      // Too many options
      return new Response(StatusCode.MULTIPLE_OPTIONS, null);
    }

    if (dfCount < 1) {
      // No options
      return new Response(StatusCode.NOT_FOUND, null);
    }

    ObjectNode returnVal = MainVerticle.mapper.createObjectNode();
    Optional<Row> first = Arrays.stream(df.collect()).findFirst();

    if (first.isPresent()) {
      // If we do have a singular video which fits this
      // criteria, return its UUID.
      Row row = first.get();
      returnVal.put("uuid", row.getString(0));
      return new Response(StatusCode.OK, returnVal);
    } else {
      // Somehow we have one row but not one row exists...
      System.err.println("Got video ID, but can't get row from DataFrame!");
      return new Response(StatusCode.INTERNAL_ERROR, null);
    }
  }

}

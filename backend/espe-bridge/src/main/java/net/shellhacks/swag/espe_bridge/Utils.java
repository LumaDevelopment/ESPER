package net.shellhacks.swag.espe_bridge;

import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

public class Utils {

  public static final List<String> validCategories = Arrays.asList(
    "Autos & Vehicles",
    "Comedy",
    "Education",
    "Entertainment",
    "Film & Animation",
    "Gaming",
    "Howto & Style",
    "Music",
    "News & Politics",
    "Nonprofits & Activism",
    "People & Blogs",
    "Pets & Animals",
    "Science & Technology",
    "Sports",
    "Travel & Events"
  );

  /**
   * Given the name of a SQL table, and a list of arrays
   * with the following format: [key, value], construct
   * a raw SQL statement to insert those fields as a row
   * in the SQL table, for use with a PreparedStatement.
   */
  public static String createRawStatement(String tableName, LinkedList<Object[]> params) {
    StringBuilder rawStatement = new StringBuilder();
    rawStatement.append("INSERT INTO " + tableName + " (");

    // Put all field names in the statement
    Iterator<Object[]> it = params.iterator();
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
    for (int i = 0; i < params.size(); i++) {
      rawStatement.append("?");
      if (i != (params.size() - 1)) {
        rawStatement.append(", ");
      }
    }
    rawStatement.append(")");

    return rawStatement.toString();
  }

}

package net.shellhacks.swag.espe_bridge;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.Date;

public class Video {

  private String uuid;
  private String title;
  private String description;

  @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd", timezone = "UTC")
  private Date whenUploaded;

  private Integer frameWidth;
  private Integer frameLength;
  private Integer frameRate;
  private String category;

  // Default constructor needed by Jackson for deserialization
  public Video() {
  }

  // Constructor with fields
  public Video(String uuid, String title, String description, Date whenUploaded,
                       Integer frameWidth, Integer frameLength, Integer frameRate, String category) {
    this.uuid = uuid;
    this.title = title;
    this.description = description;
    this.whenUploaded = whenUploaded;
    this.frameWidth = frameWidth;
    this.frameLength = frameLength;
    this.frameRate = frameRate;
    this.category = category;
  }

  // Getters and setters
  public String getUuid() {
    return uuid;
  }

  public void setUuid(String uuid) {
    this.uuid = uuid;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Date getWhenUploaded() {
    return whenUploaded;
  }

  public void setWhenUploaded(Date whenUploaded) {
    this.whenUploaded = whenUploaded;
  }

  public Integer getFrameWidth() {
    return frameWidth;
  }

  public void setFrameWidth(Integer frameWidth) {
    this.frameWidth = frameWidth;
  }

  public Integer getFrameLength() {
    return frameLength;
  }

  public void setFrameLength(Integer frameLength) {
    this.frameLength = frameLength;
  }

  public Integer getFrameRate() {
    return frameRate;
  }

  public void setFrameRate(Integer frameRate) {
    this.frameRate = frameRate;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  // Method to serialize to JSON
  public String toJson() throws JsonProcessingException {
    ObjectMapper objectMapper = new ObjectMapper();
    return objectMapper.writeValueAsString(this);
  }

  // Method to deserialize from JSON
  public static Video fromJson(String json) throws JsonProcessingException {
    ObjectMapper objectMapper = new ObjectMapper();
    return objectMapper.readValue(json, Video.class);
  }

  @Override
  public String toString() {
    return Video.class.getSimpleName() + "{" +
      "uuid='" + uuid + '\'' +
      ", title='" + title + '\'' +
      ", description='" + description + '\'' +
      ", whenUploaded=" + whenUploaded +
      ", frameWidth=" + frameWidth +
      ", frameLength=" + frameLength +
      ", frameRate=" + frameRate +
      ", category='" + category + '\'' +
      '}';
  }
}

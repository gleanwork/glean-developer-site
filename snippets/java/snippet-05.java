@Configuration
@ConfigurationProperties(prefix = "glean")
public class GleanConfig {
  private String apiToken;
  private String serverURL;

  // Getters and setters
  public String getApiToken() { return apiToken; }
  public void setApiToken(String apiToken) { this.apiToken = apiToken; }

  public String getServerURL() { return serverURL; }
  public void setServerURL(String serverURL) { this.serverURL = serverURL; }
}

@Configuration
@EnableConfigurationProperties(GleanConfig.class)
public class GleanAutoConfiguration {

  @Bean
  public Glean gleanClient(GleanConfig config) {
    return Glean.builder()
        .apiToken(config.getApiToken())
        .serverURL(config.getServerURL())
        .build();
  }
}

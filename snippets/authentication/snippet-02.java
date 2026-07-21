import java.util.Base64;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;

public static void verifySignature(String publicKey, String jwtFromHeader) throws IOException {
  byte[] derKey = Base64.getDecoder().decode(publicKey);
  final X509EncodedKeySpec keySpec = new X509EncodedKeySpec(derKey);
  PublicKey rsaOrEcKey;
  try {
    rsaOrEcKey = KeyFactory.getInstance(JWT_ALG).generatePublic(keySpec);
  } catch (NoSuchAlgorithmException e) {
    // This should never happen, since we're using a standard algorithm.
    throw new RuntimeException(e.getMessage());
  } catch (InvalidKeySpecException e) {
    throw new RuntimeException(
        "Unhandled exception during public key setup: " + e.getMessage());
  }

  AlgorithmConstraints constraints =
      new AlgorithmConstraints(AlgorithmConstraints.ConstraintType.WHITELIST, "RS256");

  JwtConsumer jwtConsumer =
      new JwtConsumerBuilder()
          .setRequireExpirationTime()
          .setRequireIssuedAt()
          .setAllowedClockSkewInSeconds(30)
          .setExpectedIssuer("glean")
          .setVerificationKey(rsaOrEcKey)
          .setJwsAlgorithmConstraints(constraints)
          .build();

  try {
    jwtConsumer.processToClaims(jwtFromHeader);
  } catch (InvalidJwtException e) {
    throw new IOException("Failed to verify actions signature: " + e.getMessage());
  }
}

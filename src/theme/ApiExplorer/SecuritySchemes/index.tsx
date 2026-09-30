/**
 * The right panel's "Authorization: <scheme>" summary moved into the
 * endpoint metadata table (src/theme/EndpointMetadata), so render nothing
 * here. The Request panel's Auth input (token field, "Sign in with Glean")
 * is a separate component and is unchanged.
 */
export default function SecuritySchemes(): null {
  return null;
}

import React from 'react';

import { ClosingArrayBracket, OpeningArrayBracket } from '@theme/ArrayBrackets';
import Details from '@theme/Details';
import DiscriminatorTabs from '@theme/DiscriminatorTabs';
import Markdown from '@theme/Markdown';
import SchemaItem from '@theme/SchemaItem';
import SchemaTabs from '@theme/SchemaTabs';
import TabItem from '@theme/TabItem';
// eslint-disable-next-line import/no-extraneous-dependencies
import { merge } from 'allof-merge';
import clsx from 'clsx';
import {
  getQualifierMessage,
  getSchemaName,
} from 'docusaurus-plugin-openapi-docs/lib/markdown/schema';
import { SchemaObject } from 'docusaurus-plugin-openapi-docs/lib/openapi/types';

// eslint-disable-next-line import/no-extraneous-dependencies
// const jsonSchemaMergeAllOf = require("json-schema-merge-allof");

const mergeAllOf = (allOf: any) => {
  const onMergeError = (msg: string) => {
    console.warn(msg);
  };

  const mergedSchemas = merge(allOf, { onMergeError });

  return mergedSchemas;
};

// Helper function to generate anchor IDs for parameters
const generateParameterId = (
  name: string,
  schemaType: 'request' | 'response',
  parentPath: string = '',
) => {
  // Clean the name for use as an ID
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cleanParentPath = parentPath.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fullPath = cleanParentPath
    ? `${cleanParentPath}-${cleanName}`
    : cleanName;
  return `${schemaType}-${fullPath}`;
};

// ---------------------------------------------------------------
// Deep-link handler: sequentially expand nested <details> by ID path
// ---------------------------------------------------------------
if (typeof window !== 'undefined') {
  const HASH_PREFIX_REGEX = /^#(request|response)-.+/;
  const FLASH_DURATION = 2000;

  const flash = (el: HTMLElement) => {
    el.style.animation = 'none';
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.offsetHeight;
    el.style.animation = `highlight-flash ${FLASH_DURATION}ms ease-out`;
  };

  const waitForElement = (
    selector: string,
    timeout = 3000,
  ): Promise<HTMLElement | null> => {
    return new Promise((resolve) => {
      const existing = document.querySelector(selector);
      if (existing) {
        resolve(existing as HTMLElement);
        return;
      }

      const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          observer.disconnect();
          resolve(found as HTMLElement);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  };

  const openParents = (el: HTMLElement) => {
    let p: HTMLElement | null = el.parentElement;
    while (p) {
      if (p.tagName.toLowerCase() === 'details') {
        const detailsEl = p as HTMLDetailsElement;
        if (!detailsEl.open) {
          const summary = detailsEl.querySelector('summary');
          if (summary) {
            (summary as HTMLElement).click(); // let Docusaurus/JS handle state attributes
          } else {
            detailsEl.open = true; // fallback
          }
        }
      }
      p = p.parentElement;
    }
  };

  const openDetailsElement = (detailsEl: HTMLDetailsElement) => {
    if (!detailsEl.open) {
      const summary = detailsEl.querySelector('summary');
      summary ? (summary as HTMLElement).click() : (detailsEl.open = true);
    }
  };

  const runDeepLink = () => {
    const { hash } = window.location;
    // console.log('Deep link triggered with hash:', hash);
    if (!HASH_PREFIX_REGEX.test(hash)) return;

    (async () => {
      const fullId = hash.slice(1); // remove '#'
      const parts = fullId.split('-');
      // console.log('Hash parts:', parts);
      if (parts.length < 2) return;

      const schemaType = parts[0];
      const segments = parts.slice(1); // the rest of the path

      let cumulative = schemaType;

      for (let i = 0; i < segments.length; i += 1) {
        cumulative += `-${segments[i]}`;
        const selector = `#${cumulative}`;
        // console.log(`Looking for element: ${selector}`);
        const el = await waitForElement(selector);
        // console.log(`Found element for ${selector}:`, el);
        if (!el) break;

        if (i < segments.length - 1) {
          // Not yet at target → ensure its details container is open
          const details = el.closest('details') as HTMLDetailsElement | null;
          // console.log(`Details container for ${selector}:`, details);
          if (details) {
            // console.log(`Opening details for ${selector}, was open:`, details.open);
            openDetailsElement(details);
            // Wait for the details to fully expand and render nested content
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        } else {
          // This is the final target
          // console.log('Final target reached, opening parents and scrolling');
          openParents(el as HTMLElement);
          await new Promise((resolve) => setTimeout(resolve, 200));

          // First scroll attempt
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          flash(el as HTMLElement);

          // Second scroll attempt after a delay to ensure proper positioning
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 600);
        }
      }
    })();
  };

  // Run on initial page load and whenever the hash changes.
  window.addEventListener('load', runDeepLink);
  window.addEventListener('hashchange', runDeepLink);

  // Also listen for any navigation events
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    setTimeout(runDeepLink, 50);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    setTimeout(runDeepLink, 50);
  };

  // Also run when DOM is ready (for SPA navigation)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDeepLink);
  } else {
    // DOM is already ready
    setTimeout(runDeepLink, 0);
  }
}

interface MarkdownProps {
  text: string | undefined;
}

// Renders string as markdown, useful for descriptions and qualifiers
const MarkdownWrapper: React.FC<MarkdownProps> = ({ text }) => {
  return (
    <div style={{ marginTop: '.5rem', marginBottom: '.5rem' }}>
      <Markdown>{text}</Markdown>
    </div>
  );
};

interface SummaryProps {
  name: string;
  schemaName: string | undefined;
  schema: {
    deprecated?: boolean;
    nullable?: boolean;
  };
  required?: boolean | string[];
  schemaType?: 'request' | 'response';
  parentPath?: string;
}

const Summary: React.FC<SummaryProps> = ({
  name,
  schemaName,
  schema,
  required,
  schemaType,
  parentPath = '',
}) => {
  const { deprecated, nullable } = schema;
  const parameterId = schemaType
    ? generateParameterId(name, schemaType, parentPath)
    : undefined;

  const isRequired = Array.isArray(required)
    ? required.includes(name)
    : required === true;

  return (
    <summary id={parameterId}>
      <span className="openapi-schema__container">
        <strong
          className={clsx('openapi-schema__property', {
            'openapi-schema__strikethrough': deprecated,
          })}
        >
          {name}
        </strong>
        <span className="openapi-schema__name"> {schemaName}</span>
        {(isRequired || deprecated || nullable) && (
          <span className="openapi-schema__divider" />
        )}
        {nullable && <span className="openapi-schema__nullable">nullable</span>}
        {isRequired && (
          <span className="openapi-schema__required">required</span>
        )}
        {deprecated && (
          <span className="openapi-schema__deprecated">deprecated</span>
        )}
      </span>
    </summary>
  );
};

// Common props interface
interface SchemaProps {
  schema: SchemaObject;
  schemaType: 'request' | 'response';
  parentPath?: string;
}

const AnyOneOf: React.FC<SchemaProps> = ({
  schema,
  schemaType,
  parentPath = '',
}) => {
  const type = schema.oneOf ? 'oneOf' : 'anyOf';
  return (
    <>
      <span className="badge badge--info" style={{ marginBottom: '1rem' }}>
        {type}
      </span>
      <SchemaTabs>
        {schema[type]?.map((anyOneSchema: any, index: number) => {
          const label = anyOneSchema.title || `MOD${index + 1}`;
          return (
            // @ts-ignore
            <TabItem
              key={index}
              label={label}
              value={`${index}-item-properties`}
            >
              {/* Handle primitive types directly */}
              {['string', 'number', 'integer', 'boolean'].includes(
                anyOneSchema.type,
              ) && (
                <SchemaItem
                  collapsible={false}
                  name={undefined}
                  schemaName={anyOneSchema.type}
                  qualifierMessage={getQualifierMessage(anyOneSchema)}
                  schema={anyOneSchema}
                  discriminator={false}
                  children={null}
                />
              )}

              {/* Handle empty object as a primitive type */}
              {anyOneSchema.type === 'object' &&
                !anyOneSchema.properties &&
                !anyOneSchema.allOf &&
                !anyOneSchema.oneOf &&
                !anyOneSchema.anyOf && (
                  <SchemaItem
                    collapsible={false}
                    name={undefined}
                    schemaName={anyOneSchema.type}
                    qualifierMessage={getQualifierMessage(anyOneSchema)}
                    schema={anyOneSchema}
                    discriminator={false}
                    children={null}
                  />
                )}

              {/* Handle actual object types with properties or nested schemas */}
              {anyOneSchema.type === 'object' && anyOneSchema.properties && (
                <Properties
                  schema={anyOneSchema}
                  schemaType={schemaType}
                  parentPath={parentPath}
                />
              )}
              {anyOneSchema.allOf && (
                <SchemaNode
                  schema={anyOneSchema}
                  schemaType={schemaType}
                  parentPath={parentPath}
                />
              )}
              {anyOneSchema.oneOf && (
                <SchemaNode
                  schema={anyOneSchema}
                  schemaType={schemaType}
                  parentPath={parentPath}
                />
              )}
              {anyOneSchema.anyOf && (
                <SchemaNode
                  schema={anyOneSchema}
                  schemaType={schemaType}
                  parentPath={parentPath}
                />
              )}
              {anyOneSchema.items && (
                <Items
                  schema={anyOneSchema}
                  schemaType={schemaType}
                  parentPath={parentPath}
                />
              )}
            </TabItem>
          );
        })}
      </SchemaTabs>
    </>
  );
};

const Properties: React.FC<SchemaProps> = ({
  schema,
  schemaType,
  parentPath = '',
}) => {
  const discriminator = schema.discriminator;
  if (discriminator && !discriminator.mapping) {
    const anyOneOf = schema.oneOf ?? schema.anyOf ?? {};
    const inferredMapping = {} as any;
    Object.entries(anyOneOf).map(([_, anyOneSchema]: [string, any]) => {
      // ensure discriminated property only renders once
      if (
        schema.properties![discriminator.propertyName] &&
        anyOneSchema.properties[discriminator.propertyName]
      )
        delete anyOneSchema.properties[discriminator.propertyName];
      return (inferredMapping[anyOneSchema.title] = anyOneSchema);
    });
    discriminator['mapping'] = inferredMapping;
  }
  if (Object.keys(schema.properties as {}).length === 0) {
    return (
      <SchemaItem
        collapsible={false}
        name=""
        required={false}
        schemaName="object"
        qualifierMessage={undefined}
        schema={{}}
      />
    );
  }

  return (
    <>
      {Object.entries(schema.properties as {}).map(
        ([key, val]: [string, any]) => (
          <SchemaEdge
            key={key}
            name={key}
            schema={val}
            required={
              Array.isArray(schema.required)
                ? schema.required.includes(key)
                : false
            }
            discriminator={discriminator}
            schemaType={schemaType}
            parentPath={parentPath}
          />
        ),
      )}
    </>
  );
};

const PropertyDiscriminator: React.FC<SchemaEdgeProps> = ({
  name,
  schemaName,
  schema,
  schemaType,
  discriminator,
  required,
  parentPath = '',
}) => {
  if (!schema) {
    return null;
  }

  const parameterId = generateParameterId(name, schemaType, parentPath);

  return (
    <>
      <div
        className="openapi-discriminator__item openapi-schema__list-item"
        id={parameterId}
      >
        <div>
          <span className="openapi-schema__container">
            <strong className="openapi-discriminator__name openapi-schema__property">
              {name}
            </strong>
            {schemaName && (
              <span className="openapi-schema__name"> {schemaName}</span>
            )}
            {required && <span className="openapi-schema__divider"></span>}
            {required && (
              <span className="openapi-schema__required">required</span>
            )}
          </span>
          <div style={{ marginLeft: '1rem' }}>
            {schema.description && (
              <MarkdownWrapper text={schema.description} />
            )}
            {getQualifierMessage(discriminator) && (
              <MarkdownWrapper text={getQualifierMessage(discriminator)} />
            )}
          </div>
          <DiscriminatorTabs className="openapi-tabs__discriminator">
            {Object.keys(discriminator.mapping).map((key, index) => (
              // @ts-ignore
              <TabItem
                key={index}
                label={key}
                value={`${index}-item-discriminator`}
              >
                <SchemaNode
                  schema={discriminator.mapping[key]}
                  schemaType={schemaType}
                  parentPath={parentPath ? `${parentPath}-${name}` : name}
                />
              </TabItem>
            ))}
          </DiscriminatorTabs>
        </div>
      </div>
      {schema.properties &&
        Object.entries(schema.properties as {}).map(
          ([key, val]: [string, any]) =>
            key !== discriminator.propertyName && (
              <SchemaEdge
                key={key}
                name={key}
                schema={val}
                required={
                  Array.isArray(schema.required)
                    ? schema.required.includes(key)
                    : false
                }
                discriminator={false}
                schemaType={schemaType}
                parentPath={parentPath ? `${parentPath}-${name}` : name}
              />
            ),
        )}
    </>
  );
};

interface DiscriminatorNodeProps {
  discriminator: any;
  schema: SchemaObject;
  schemaType: 'request' | 'response';
  parentPath?: string;
}

const DiscriminatorNode: React.FC<DiscriminatorNodeProps> = ({
  discriminator,
  schema,
  schemaType,
  parentPath = '',
}) => {
  let discriminatedSchemas: any = {};
  let inferredMapping: any = {};

  // default to empty object if no parent-level properties exist
  const discriminatorProperty = schema.properties
    ? schema.properties![discriminator.propertyName]
    : {};

  if (schema.allOf) {
    const mergedSchemas = mergeAllOf(schema) as SchemaObject;
    if (mergedSchemas.oneOf || mergedSchemas.anyOf) {
      discriminatedSchemas = mergedSchemas.oneOf || mergedSchemas.anyOf;
    }
  } else if (schema.oneOf || schema.anyOf) {
    discriminatedSchemas = schema.oneOf || schema.anyOf;
  }

  // Handle case where no mapping is defined
  if (!discriminator.mapping) {
    Object.entries(discriminatedSchemas).forEach(
      ([_, subschema]: [string, any], index) => {
        inferredMapping[subschema.title ?? `PROP${index}`] = subschema;
      },
    );
    discriminator.mapping = inferredMapping;
  }

  // Merge sub schema discriminator property with parent
  Object.keys(discriminator.mapping).forEach((key) => {
    const subSchema = discriminator.mapping[key];

    // Handle discriminated schema with allOf
    let mergedSubSchema = {} as SchemaObject;
    if (subSchema.allOf) {
      mergedSubSchema = mergeAllOf(subSchema) as SchemaObject;
    }

    const subProperties = subSchema.properties || mergedSubSchema.properties;
    // Add a safeguard check to avoid referencing subProperties if it's undefined
    if (subProperties && subProperties[discriminator.propertyName]) {
      if (schema.properties) {
        schema.properties![discriminator.propertyName] = {
          ...schema.properties![discriminator.propertyName],
          ...subProperties[discriminator.propertyName],
        };
        if (subSchema.required && !schema.required) {
          schema.required = subSchema.required;
        }
        // Avoid duplicating property
        delete subProperties[discriminator.propertyName];
      } else {
        schema.properties = {};
        schema.properties[discriminator.propertyName] =
          subProperties[discriminator.propertyName];
        // Avoid duplicating property
        delete subProperties[discriminator.propertyName];
      }
    }
  });

  const name = discriminator.propertyName;
  const schemaName = getSchemaName(discriminatorProperty);
  // Default case for discriminator without oneOf/anyOf/allOf
  return (
    <PropertyDiscriminator
      name={name}
      schemaName={schemaName}
      schema={schema}
      schemaType={schemaType}
      discriminator={discriminator}
      required={
        Array.isArray(schema.required)
          ? schema.required.includes(name)
          : schema.required
      }
      parentPath={parentPath}
    />
  );
};

const AdditionalProperties: React.FC<SchemaProps> = ({
  schema,
  schemaType,
  parentPath = '',
}) => {
  const additionalProperties = schema.additionalProperties;

  if (!additionalProperties) return null;

  // Handle free-form objects
  if (additionalProperties === true || isEmpty(additionalProperties)) {
    return (
      <SchemaItem
        name="property"
        required={false}
        schemaName="any"
        qualifierMessage={getQualifierMessage(schema)}
        schema={schema}
        collapsible={false}
        discriminator={false}
      />
    );
  }

  // Handle objects, arrays, complex schemas
  if (
    additionalProperties.properties ||
    additionalProperties.items ||
    additionalProperties.allOf ||
    additionalProperties.additionalProperties ||
    additionalProperties.oneOf ||
    additionalProperties.anyOf
  ) {
    const title =
      additionalProperties.title || getSchemaName(additionalProperties);
    const required = schema.required || false;
    return (
      <SchemaNodeDetails
        name="property"
        schemaName={title}
        required={required}
        nullable={schema.nullable}
        schema={additionalProperties}
        schemaType={schemaType}
        parentPath={parentPath}
      />
    );
  }

  // Handle primitive types
  if (
    additionalProperties.type === 'string' ||
    additionalProperties.type === 'boolean' ||
    additionalProperties.type === 'integer' ||
    additionalProperties.type === 'number' ||
    additionalProperties.type === 'object'
  ) {
    const schemaName = getSchemaName(additionalProperties);
    return (
      <SchemaItem
        name="property"
        required={false}
        schemaName={schemaName}
        qualifierMessage={getQualifierMessage(schema)}
        schema={additionalProperties}
        collapsible={false}
        discriminator={false}
        children={null}
      />
    );
  }

  // Unknown type
  return null;
};

const SchemaNodeDetails: React.FC<SchemaEdgeProps> = ({
  name,
  schemaName,
  schema,
  required,
  schemaType,
  parentPath = '',
}) => {
  const parameterId = generateParameterId(name, schemaType, parentPath);

  return (
    <div id={parameterId}>
      <SchemaItem collapsible={true}>
        <Details
          className="openapi-markdown__details"
          summary={
            <Summary
              name={name}
              schemaName={schemaName}
              schema={schema}
              required={required}
              schemaType={schemaType}
              parentPath={parentPath}
            />
          }
        >
          <div style={{ marginLeft: '1rem' }}>
            {schema.description && (
              <MarkdownWrapper text={schema.description} />
            )}
            {getQualifierMessage(schema) && (
              <MarkdownWrapper text={getQualifierMessage(schema)} />
            )}
            <SchemaNode
              schema={schema}
              schemaType={schemaType}
              parentPath={parentPath ? `${parentPath}-${name}` : name}
            />
          </div>
        </Details>
      </SchemaItem>
    </div>
  );
};

const Items: React.FC<{
  schema: any;
  schemaType: 'request' | 'response';
  parentPath?: string;
}> = ({ schema, schemaType, parentPath = '' }) => {
  // Handles case when schema.items has properties
  if (schema.items?.properties) {
    return (
      <>
        <OpeningArrayBracket />
        <Properties
          schema={schema.items}
          schemaType={schemaType}
          parentPath={parentPath}
        />
        <ClosingArrayBracket />
      </>
    );
  }

  // Handles case when schema.items has additionalProperties
  if (schema.items?.additionalProperties) {
    return (
      <>
        <OpeningArrayBracket />
        <AdditionalProperties
          schema={schema.items}
          schemaType={schemaType}
          parentPath={parentPath}
        />
        <ClosingArrayBracket />
      </>
    );
  }

  // Handles case when schema.items has oneOf or anyOf
  if (schema.items?.oneOf || schema.items?.anyOf) {
    return (
      <>
        <OpeningArrayBracket />
        <AnyOneOf
          schema={schema.items}
          schemaType={schemaType}
          parentPath={parentPath}
        />
        <ClosingArrayBracket />
      </>
    );
  }

  // Handles case when schema.items has allOf
  if (schema.items?.allOf) {
    const mergedSchemas = mergeAllOf(schema.items) as SchemaObject;

    // Handles combo anyOf/oneOf + properties
    if (
      (mergedSchemas.oneOf || mergedSchemas.anyOf) &&
      mergedSchemas.properties
    ) {
      return (
        <>
          <OpeningArrayBracket />
          <AnyOneOf
            schema={mergedSchemas}
            schemaType={schemaType}
            parentPath={parentPath}
          />
          <Properties
            schema={mergedSchemas}
            schemaType={schemaType}
            parentPath={parentPath}
          />
          <ClosingArrayBracket />
        </>
      );
    }

    // Handles only anyOf/oneOf
    if (mergedSchemas.oneOf || mergedSchemas.anyOf) {
      return (
        <>
          <OpeningArrayBracket />
          <AnyOneOf
            schema={mergedSchemas}
            schemaType={schemaType}
            parentPath={parentPath}
          />
          <ClosingArrayBracket />
        </>
      );
    }

    // Handles properties
    if (mergedSchemas.properties) {
      return (
        <>
          <OpeningArrayBracket />
          <Properties
            schema={mergedSchemas}
            schemaType={schemaType}
            parentPath={parentPath}
          />
          <ClosingArrayBracket />
        </>
      );
    }
  }

  // Handles basic types (string, number, integer, boolean, object)
  if (
    schema.items?.type === 'string' ||
    schema.items?.type === 'number' ||
    schema.items?.type === 'integer' ||
    schema.items?.type === 'boolean' ||
    schema.items?.type === 'object'
  ) {
    return (
      <div style={{ marginLeft: '.5rem' }}>
        <OpeningArrayBracket />
        <SchemaItem
          collapsible={false}
          name="" // No name for array items
          schemaName={getSchemaName(schema.items)}
          qualifierMessage={getQualifierMessage(schema.items)}
          schema={schema.items}
          discriminator={false}
          children={null}
        />
        <ClosingArrayBracket />
      </div>
    );
  }

  // Handles fallback case (use createEdges logic)
  return (
    <>
      <OpeningArrayBracket />
      {Object.entries(schema.items || {}).map(([key, val]: [string, any]) => (
        <SchemaEdge
          key={key}
          name={key}
          schema={val}
          schemaType={schemaType}
          required={
            Array.isArray(schema.required)
              ? schema.required.includes(key)
              : false
          }
          parentPath={parentPath}
        />
      ))}
      <ClosingArrayBracket />
    </>
  );
};

interface SchemaEdgeProps {
  name: string;
  schemaName?: string;
  schema: SchemaObject;
  required?: boolean | string[];
  nullable?: boolean | undefined;
  discriminator?: any;
  schemaType: 'request' | 'response';
  parentPath?: string;
}

const SchemaEdge: React.FC<SchemaEdgeProps> = ({
  name,
  schema,
  required,
  discriminator,
  schemaType,
  parentPath = '',
}) => {
  if (
    (schemaType === 'request' && schema.readOnly) ||
    (schemaType === 'response' && schema.writeOnly)
  ) {
    return null;
  }

  const schemaName = getSchemaName(schema);

  if (discriminator && discriminator.propertyName === name) {
    return (
      <PropertyDiscriminator
        name={name}
        schemaName={schemaName}
        schema={schema}
        schemaType={schemaType}
        discriminator={discriminator}
        required={required}
        parentPath={parentPath}
      />
    );
  }

  if (schema.oneOf || schema.anyOf) {
    // return <AnyOneOf schema={schema} schemaType={schemaType} />;
    return (
      <SchemaNodeDetails
        name={name}
        schemaName={schemaName}
        schemaType={schemaType}
        required={required}
        schema={schema}
        nullable={schema.nullable}
        parentPath={parentPath}
      />
    );
  }

  if (schema.properties) {
    return (
      <SchemaNodeDetails
        name={name}
        schemaName={schemaName}
        schemaType={schemaType}
        required={required}
        schema={schema}
        nullable={schema.nullable}
        parentPath={parentPath}
      />
    );
  }

  if (schema.additionalProperties) {
    return (
      <SchemaNodeDetails
        name={name}
        schemaName={schemaName}
        schemaType={schemaType}
        required={required}
        schema={schema}
        nullable={schema.nullable}
        parentPath={parentPath}
      />
    );
  }

  if (schema.items?.properties) {
    return (
      <SchemaNodeDetails
        name={name}
        schemaName={schemaName}
        required={required}
        nullable={schema.nullable}
        schema={schema}
        schemaType={schemaType}
        parentPath={parentPath}
      />
    );
  }

  if (schema.items?.anyOf || schema.items?.oneOf) {
    return (
      <SchemaNodeDetails
        name={name}
        schemaName={schemaName}
        required={required}
        nullable={schema.nullable}
        schema={schema}
        schemaType={schemaType}
        parentPath={parentPath}
      />
    );
  }

  if (schema.allOf) {
    // handle circular properties
    if (
      schema.allOf &&
      schema.allOf.length &&
      schema.allOf.length === 1 &&
      typeof schema.allOf[0] === 'string'
    ) {
      const parameterId = generateParameterId(name, schemaType, parentPath);
      return (
        <div id={parameterId}>
          <SchemaItem
            collapsible={false}
            name={name}
            required={
              Array.isArray(required) ? required.includes(name) : required
            }
            schemaName={schema.allOf[0]}
            qualifierMessage={undefined}
            schema={schema.allOf[0]}
            discriminator={false}
            children={null}
          />
        </div>
      );
    }
    const mergedSchemas = mergeAllOf(schema) as SchemaObject;

    if (
      (schemaType === 'request' && mergedSchemas.readOnly) ||
      (schemaType === 'response' && mergedSchemas.writeOnly)
    ) {
      return null;
    }

    const mergedSchemaName = getSchemaName(mergedSchemas);

    if (mergedSchemas.oneOf || mergedSchemas.anyOf) {
      return (
        <SchemaNodeDetails
          name={name}
          schemaName={mergedSchemaName}
          required={
            Array.isArray(mergedSchemas.required)
              ? mergedSchemas.required.includes(name)
              : mergedSchemas.required
          }
          nullable={mergedSchemas.nullable}
          schema={mergedSchemas}
          schemaType={schemaType}
          parentPath={parentPath}
        />
      );
    }

    if (mergedSchemas.properties !== undefined) {
      return (
        <SchemaNodeDetails
          name={name}
          schemaName={mergedSchemaName}
          required={
            Array.isArray(mergedSchemas.required)
              ? mergedSchemas.required.includes(name)
              : mergedSchemas.required
          }
          nullable={mergedSchemas.nullable}
          schema={mergedSchemas}
          schemaType={schemaType}
          parentPath={parentPath}
        />
      );
    }

    if (mergedSchemas.items?.properties) {
      <SchemaNodeDetails
        name={name}
        schemaName={mergedSchemaName}
        required={
          Array.isArray(mergedSchemas.required)
            ? mergedSchemas.required.includes(name)
            : mergedSchemas.required
        }
        nullable={mergedSchemas.nullable}
        schema={mergedSchemas}
        schemaType={schemaType}
        parentPath={parentPath}
      />;
    }

    const parameterId = generateParameterId(name, schemaType, parentPath);
    return (
      <div id={parameterId}>
        <SchemaItem
          collapsible={false}
          name={name}
          required={
            Array.isArray(required) ? required.includes(name) : required
          }
          schemaName={mergedSchemaName}
          qualifierMessage={getQualifierMessage(mergedSchemas)}
          schema={mergedSchemas}
          discriminator={false}
          children={null}
        />
      </div>
    );
  }

  const parameterId = generateParameterId(name, schemaType, parentPath);
  return (
    <div id={parameterId}>
      <SchemaItem
        collapsible={false}
        name={name}
        required={Array.isArray(required) ? required.includes(name) : required}
        schemaName={schemaName}
        qualifierMessage={getQualifierMessage(schema)}
        schema={schema}
        discriminator={false}
        children={null}
      />
    </div>
  );
};

function renderChildren(
  schema: SchemaObject,
  schemaType: 'request' | 'response',
  parentPath: string = '',
) {
  return (
    <>
      {schema.oneOf && (
        <AnyOneOf
          schema={schema}
          schemaType={schemaType}
          parentPath={parentPath}
        />
      )}
      {schema.anyOf && (
        <AnyOneOf
          schema={schema}
          schemaType={schemaType}
          parentPath={parentPath}
        />
      )}
      {schema.properties && (
        <Properties
          schema={schema}
          schemaType={schemaType}
          parentPath={parentPath}
        />
      )}
      {schema.additionalProperties && (
        <AdditionalProperties
          schema={schema}
          schemaType={schemaType}
          parentPath={parentPath}
        />
      )}
      {schema.items && (
        <Items
          schema={schema}
          schemaType={schemaType}
          parentPath={parentPath}
        />
      )}
    </>
  );
}

const SchemaNode: React.FC<SchemaProps> = ({
  schema,
  schemaType,
  parentPath = '',
}) => {
  if (
    (schemaType === 'request' && schema.readOnly) ||
    (schemaType === 'response' && schema.writeOnly)
  ) {
    return null;
  }

  if (schema.discriminator) {
    const { discriminator } = schema;
    return (
      <DiscriminatorNode
        discriminator={discriminator}
        schema={schema}
        schemaType={schemaType}
        parentPath={parentPath}
      />
    );
  }

  // Handle allOf, oneOf, anyOf without discriminators
  if (schema.allOf) {
    const mergedSchemas = mergeAllOf(schema) as SchemaObject;

    if (
      (schemaType === 'request' && mergedSchemas.readOnly) ||
      (schemaType === 'response' && mergedSchemas.writeOnly)
    ) {
      return null;
    }

    return (
      <div>
        {mergedSchemas.oneOf && (
          <AnyOneOf
            schema={mergedSchemas}
            schemaType={schemaType}
            parentPath={parentPath}
          />
        )}
        {mergedSchemas.anyOf && (
          <AnyOneOf
            schema={mergedSchemas}
            schemaType={schemaType}
            parentPath={parentPath}
          />
        )}
        {mergedSchemas.properties && (
          <Properties
            schema={mergedSchemas}
            schemaType={schemaType}
            parentPath={parentPath}
          />
        )}
        {mergedSchemas.items && (
          <Items
            schema={mergedSchemas}
            schemaType={schemaType}
            parentPath={parentPath}
          />
        )}
      </div>
    );
  }

  // Handle primitives
  if (
    schema.type &&
    !schema.oneOf &&
    !schema.anyOf &&
    !schema.properties &&
    !schema.allOf &&
    !schema.items &&
    !schema.additionalProperties
  ) {
    const schemaName = getSchemaName(schema);
    return (
      <SchemaItem
        collapsible={false}
        name={schema.type}
        required={Boolean(schema.required)}
        schemaName={schemaName}
        qualifierMessage={getQualifierMessage(schema)}
        schema={schema}
        discriminator={false}
        children={null}
      />
    );
  }

  return renderChildren(schema, schemaType, parentPath);
};
function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

export default SchemaNode;

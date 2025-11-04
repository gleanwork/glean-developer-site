import type { ContextualChange, EndpointContext } from './openapi-context.js';

export type ChangeCategory = 'endpoints' | 'fields' | 'parameters';

export type AnalyzedChanges = {
  categories: Set<ChangeCategory>;
  summary: string;
  details: Array<string>;
  breaking: boolean;
};

type EndpointKey = string;

type GroupedChanges = Map<
  EndpointKey,
  {
    endpoint: EndpointContext;
    changes: Array<ContextualChange>;
  }
>;

export function analyzeOpenApiChangesWithContext(
  contextualChanges: Array<ContextualChange>,
): AnalyzedChanges {
  if (contextualChanges.length === 0) {
    return {
      categories: new Set(),
      summary: 'OpenAPI specification updated',
      details: [],
      breaking: false,
    };
  }

  const grouped: GroupedChanges = new Map();
  const categories = new Set<ChangeCategory>();
  let breaking = false;

  for (const change of contextualChanges) {
    if (change.breaking) breaking = true;

    if (change.itemType === 'endpoint') {
      categories.add('endpoints');
    } else if (change.itemType === 'field') {
      categories.add('fields');
    } else if (change.itemType === 'parameter') {
      categories.add('parameters');
    }

    const key = `${change.endpoint.method} ${change.endpoint.path}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        endpoint: change.endpoint,
        changes: [],
      });
    }
    grouped.get(key)!.changes.push(change);
  }

  const stats = {
    endpointsAdded: 0,
    endpointsRemoved: 0,
    endpointsModified: 0,
    fieldsAdded: 0,
    fieldsRemoved: 0,
    fieldsModified: 0,
    parametersAdded: 0,
    parametersRemoved: 0,
    parametersModified: 0,
  };

  for (const change of contextualChanges) {
    if (change.itemType === 'endpoint') {
      if (change.changeType === 'added') stats.endpointsAdded++;
      else if (change.changeType === 'removed') stats.endpointsRemoved++;
      else stats.endpointsModified++;
    } else if (change.itemType === 'field') {
      if (change.changeType === 'added') stats.fieldsAdded++;
      else if (change.changeType === 'removed') stats.fieldsRemoved++;
      else stats.fieldsModified++;
    } else if (change.itemType === 'parameter') {
      if (change.changeType === 'added') stats.parametersAdded++;
      else if (change.changeType === 'removed') stats.parametersRemoved++;
      else stats.parametersModified++;
    }
  }

  const summary = generateSummary(stats, breaking);
  const details = generateGroupedDetails(grouped);

  return {
    categories,
    summary,
    details,
    breaking,
  };
}

function generateGroupedDetails(grouped: GroupedChanges): Array<string> {
  const details: Array<string> = [];

  const sortedEntries = Array.from(grouped.entries()).sort((a, b) => {
    if (a[1].endpoint.path < b[1].endpoint.path) return -1;
    if (a[1].endpoint.path > b[1].endpoint.path) return 1;
    return a[1].endpoint.method.localeCompare(b[1].endpoint.method);
  });

  for (const [key, { endpoint, changes }] of sortedEntries) {
    if (endpoint.method === 'ALL') {
      for (const change of changes) {
        const action =
          change.changeType === 'added'
            ? 'Added'
            : change.changeType === 'removed'
              ? 'Removed'
              : 'Modified';
        const breakingMark = change.breaking ? ' ⚠️' : '';
        details.push(`${action} endpoint: ${change.itemName}${breakingMark}`);
      }
    } else {
      details.push(`\n**${endpoint.method} ${endpoint.path}**`);

      for (const change of changes) {
        const action =
          change.changeType === 'added'
            ? 'Added'
            : change.changeType === 'removed'
              ? 'Removed'
              : 'Modified';
        const locationStr =
          endpoint.location !== 'unknown' ? ` (${endpoint.location})` : '';
        const breakingMark = change.breaking ? ' ⚠️' : '';

        if (change.itemType === 'field') {
          details.push(
            `  - ${action} field: \`${change.itemName}\`${locationStr}${breakingMark}`,
          );
        } else if (change.itemType === 'parameter') {
          details.push(
            `  - ${action} parameter: \`${change.itemName}\`${breakingMark}`,
          );
        }
      }
    }
  }

  return details;
}

export function analyzeOpenApiChanges(diff: any): AnalyzedChanges {
  const categories = new Set<ChangeCategory>();
  const details: Array<string> = [];
  let breaking = false;

  if (!diff || !Array.isArray(diff.changes)) {
    return {
      categories: new Set(),
      summary: 'OpenAPI specification updated',
      details: ['Specification changes detected'],
      breaking: false,
    };
  }

  const changes = diff.changes as Array<any>;
  const stats = {
    endpointsAdded: 0,
    endpointsRemoved: 0,
    endpointsModified: 0,
    parametersAdded: 0,
    parametersRemoved: 0,
    parametersModified: 0,
    fieldsAdded: 0,
    fieldsRemoved: 0,
    fieldsModified: 0,
  };

  for (const change of changes) {
    const property = change.property || '';
    const changeText = change.changeText || '';
    const isBreaking = change.breaking === true;

    if (isBreaking) {
      breaking = true;
    }

    if (property === 'path') {
      categories.add('endpoints');
      if (changeText.includes('added')) {
        stats.endpointsAdded++;
        if (change.new) details.push(`Added endpoint: ${change.new}`);
      } else if (changeText.includes('removed')) {
        stats.endpointsRemoved++;
        if (change.original)
          details.push(`Removed endpoint: ${change.original}`);
      } else {
        stats.endpointsModified++;
        if (change.new || change.original) {
          details.push(`Modified endpoint: ${change.new || change.original}`);
        }
      }
    } else if (property === 'parameters' || property.includes('parameter')) {
      categories.add('parameters');
      if (changeText.includes('added')) {
        stats.parametersAdded++;
        if (change.new) details.push(`Added parameter: ${change.new}`);
      } else if (changeText.includes('removed')) {
        stats.parametersRemoved++;
        if (change.original)
          details.push(`Removed parameter: ${change.original}`);
      } else {
        stats.parametersModified++;
        if (change.new || change.original) {
          details.push(`Modified parameter: ${change.new || change.original}`);
        }
      }
    } else if (
      property === 'properties' ||
      property === 'schema' ||
      property.includes('response') ||
      property.includes('request')
    ) {
      categories.add('fields');
      if (changeText.includes('added')) {
        stats.fieldsAdded++;
        if (change.new) details.push(`Added field: ${change.new}`);
      } else if (changeText.includes('removed')) {
        stats.fieldsRemoved++;
        if (change.original) details.push(`Removed field: ${change.original}`);
      } else {
        stats.fieldsModified++;
        if (change.new || change.original) {
          details.push(`Modified field: ${change.new || change.original}`);
        }
      }
    }
  }

  const summary = generateSummary(stats, breaking);

  return {
    categories,
    summary,
    details: details.slice(0, 10),
    breaking,
  };
}

function generateSummary(
  stats: {
    endpointsAdded: number;
    endpointsRemoved: number;
    endpointsModified: number;
    parametersAdded: number;
    parametersRemoved: number;
    parametersModified: number;
    fieldsAdded: number;
    fieldsRemoved: number;
    fieldsModified: number;
  },
  breaking: boolean,
): string {
  const parts: Array<string> = [];

  if (stats.endpointsAdded > 0) {
    parts.push(
      `${stats.endpointsAdded} endpoint${stats.endpointsAdded > 1 ? 's' : ''} added`,
    );
  }
  if (stats.endpointsRemoved > 0) {
    parts.push(
      `${stats.endpointsRemoved} endpoint${stats.endpointsRemoved > 1 ? 's' : ''} removed`,
    );
  }
  if (stats.endpointsModified > 0) {
    parts.push(
      `${stats.endpointsModified} endpoint${stats.endpointsModified > 1 ? 's' : ''} modified`,
    );
  }

  if (stats.fieldsAdded > 0) {
    parts.push(
      `${stats.fieldsAdded} field${stats.fieldsAdded > 1 ? 's' : ''} added`,
    );
  }
  if (stats.fieldsRemoved > 0) {
    parts.push(
      `${stats.fieldsRemoved} field${stats.fieldsRemoved > 1 ? 's' : ''} removed`,
    );
  }
  if (stats.fieldsModified > 0) {
    parts.push(
      `${stats.fieldsModified} field${stats.fieldsModified > 1 ? 's' : ''} modified`,
    );
  }

  if (stats.parametersAdded > 0) {
    parts.push(
      `${stats.parametersAdded} parameter${stats.parametersAdded > 1 ? 's' : ''} added`,
    );
  }
  if (stats.parametersRemoved > 0) {
    parts.push(
      `${stats.parametersRemoved} parameter${stats.parametersRemoved > 1 ? 's' : ''} removed`,
    );
  }
  if (stats.parametersModified > 0) {
    parts.push(
      `${stats.parametersModified} parameter${stats.parametersModified > 1 ? 's' : ''} modified`,
    );
  }

  if (parts.length === 0) {
    return 'OpenAPI specification updated';
  }

  const summary = parts.join(', ');
  return breaking ? `⚠️ Breaking: ${summary}` : summary;
}

export function formatChangeCategories(
  categories: Set<ChangeCategory>,
): string {
  if (categories.size === 0) {
    return 'schema';
  }

  const order: ChangeCategory[] = ['endpoints', 'fields', 'parameters'];
  const sorted = order.filter((cat) => categories.has(cat));

  return sorted.join(', ');
}

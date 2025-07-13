import yaml
import requests
from typing import Dict, Set, List

class OpenAPIAnalyzer:
    def __init__(self):
        self.schema_graph = {}
        self.circular_refs = set()
        self.resolved_cache = {}

    def extract_schema_references(self, schema: Dict, refs: Set = None) -> Set:
        """Extract all $ref references from a schema"""
        if refs is None:
            refs = set()
            
        if not isinstance(schema, dict):
            return refs
            
        if '$ref' in schema and schema['$ref'].startswith('#/components/schemas/'):
            ref_name = schema['$ref'].replace('#/components/schemas/', '')
            refs.add(ref_name)
            
        for value in schema.values():
            if isinstance(value, list):
                for item in value:
                    self.extract_schema_references(item, refs)
            elif isinstance(value, dict):
                self.extract_schema_references(value, refs)
                
        return refs

    def build_schema_graph(self, schemas: Dict):
        """Build dependency graph of schemas"""
        self.schema_graph = {}
        
        for schema_name, schema in schemas.items():
            refs = self.extract_schema_references(schema)
            self.schema_graph[schema_name] = sorted(refs)

    def detect_circular_refs(self, schemas: Dict):
        """Detect all circular references and save their paths. Also track all traversed paths."""
        self.build_schema_graph(schemas)
        visited_global = set()
        circular_schemas = set()
        self.circular_paths = {}  # schema_name -> list of cycle paths
        self.all_paths = {}       # schema_name -> set of tuple paths (all traversed paths)
        self.unique_cycles = set()  # set of tuple cycles to avoid duplicates

        def dfs(node: str, path: List, visited: Set, origin: str):
            # Track all traversed paths from origin
            self.all_paths.setdefault(origin, set()).add(tuple(path + [node]))
            if node in visited:
                cycle_start = path.index(node)
                cycle = set(path[cycle_start:])
                circular_schemas.update(cycle)
                cycle_path = path[cycle_start:] + [node]
                
                # Normalize cycle to avoid duplicates (start from lexicographically smallest)
                normalized_cycle = self._normalize_cycle(cycle_path)
                self.unique_cycles.add(normalized_cycle)
                
                for schema in cycle:
                    self.circular_paths.setdefault(schema, []).append(cycle_path)
                return

            visited.add(node)
            path.append(node)

            deps = self.schema_graph.get(node, [])
            for dep in sorted(deps):
                if dep in self.schema_graph:
                    dfs(dep, path[:], set(visited), origin)

            visited.remove(node)
            path.pop()

        for schema_name in sorted(schemas.keys()):
            if schema_name not in visited_global:
                dfs(schema_name, [], set(), schema_name)
                visited_global.add(schema_name)

        # Check direct self-refs
        for schema_name, schema in schemas.items():
            refs = self.extract_schema_references(schema)
            if schema_name in refs:
                circular_schemas.add(schema_name)
                cycle_path = [schema_name, schema_name]
                normalized_cycle = self._normalize_cycle(cycle_path)
                self.unique_cycles.add(normalized_cycle)
                self.circular_paths.setdefault(schema_name, []).append(cycle_path)
                self.all_paths.setdefault(schema_name, set()).add((schema_name, schema_name))

        return circular_schemas, self.circular_paths, self.all_paths

    def _normalize_cycle(self, cycle_path: List) -> tuple:
        """Normalize a cycle path to avoid duplicates by starting from lexicographically smallest node"""
        if len(cycle_path) <= 1:
            return tuple(cycle_path)
        
        # Remove the duplicate end node for normalization
        cycle_without_end = cycle_path[:-1]
        
        # Find the lexicographically smallest starting point
        min_idx = cycle_without_end.index(min(cycle_without_end))
        
        # Rotate the cycle to start from the smallest element
        normalized = cycle_without_end[min_idx:] + cycle_without_end[:min_idx]
        
        # Add the end node back
        normalized.append(normalized[0])
        
        return tuple(normalized)

    def print_schema_graph(self):
        """Print the schema dependency graph"""
        print("\nSchema Dependency Graph:")
        for parent, children in sorted(self.schema_graph.items()):
            print(f"- {parent}: [{', '.join(children)}]")

def analyze_openapi(url: str):
    """Analyze OpenAPI spec for circular references and print paths/counts as requested"""
    # Fetch and parse YAML
    response = requests.get(url)
    api_spec = yaml.safe_load(response.text)

    # Extract schemas
    schemas = api_spec.get('components', {}).get('schemas', {})

    # Create analyzer and detect circular refs
    analyzer = OpenAPIAnalyzer()
    circular_refs, circular_paths, all_paths = analyzer.detect_circular_refs(schemas)

    # Print results
    analyzer.print_schema_graph()
    
    # Print unique circular paths
    print("\nUnique Circular Paths:")
    unique_cycles = sorted(analyzer.unique_cycles)
    for cycle in unique_cycles:
        print(f"  {' -> '.join(cycle)}")
    
    print("\nSchema Path Analysis:")
    for schema in sorted(schemas.keys()):
        if schema in circular_refs:
            print(f"- {schema} (circular reference)")
        else:
            count = len(all_paths.get(schema, set()))
            print(f"- {schema}: {count} unique paths traversed (no circular reference)")

    # Print summary of total circular references
    print(f"\nTotal schemas with circular references detected: {len(circular_refs)}")
    print(f"Total unique circular paths: {len(unique_cycles)}")

if __name__ == "__main__":
    url = "https://gleanwork.github.io/open-api/specs/final/client_rest.yaml"
    analyze_openapi(url)

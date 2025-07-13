#!/usr/bin/env python3

"""
FIXED Split-first approach: Split OpenAPI by tags first, then resolve circular references per-tag
This version fixes the caching bug that caused exponential inlining
"""

import os
import sys
import json
import yaml
import argparse
import re
import copy
from collections import OrderedDict
from typing import Dict, Set, List, Any, Optional
from urllib.request import urlopen

class NoAliasDumper(yaml.SafeDumper):
    def ignore_aliases(self, data):
        return True

def capitalize_language_name(lang: str) -> str:
    """Common programming languages and their proper capitalization"""
    language_map = {
        'python': 'Python',
        'java': 'Java',
        'javascript': 'JavaScript',
        'typescript': 'JavaScript',
        'go': 'Go',
        'ruby': 'Ruby',
        'php': 'PHP',
        'csharp': 'C#',
        'cpp': 'C++',
        'c': 'C',
        'rust': 'Rust',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'dart': 'Dart',
        'scala': 'Scala',
        'r': 'R',
        'matlab': 'MATLAB',
        'shell': 'Shell',
        'bash': 'Bash',
        'powershell': 'PowerShell',
        'sql': 'SQL',
        'html': 'HTML',
        'css': 'CSS',
        'xml': 'XML',
        'json': 'JSON',
        'yaml': 'YAML',
        'markdown': 'Markdown',
        'latex': 'LaTeX',
        'dockerfile': 'Dockerfile',
    }
    return language_map.get(lang.lower(), lang.title())

def fetch_from_url(url: str) -> str:
    """Fetch content from URL"""
    try:
        with urlopen(url) as response:
            if response.status >= 200 and response.status < 300:
                return response.read().decode('utf-8')
            else:
                raise Exception(f"HTTP {response.status}: {response.reason}")
    except Exception as e:
        raise Exception(f"Error fetching from URL: {e}")


def read_content(input_path: str) -> str:
    """Read content from file or URL"""
    if input_path.startswith('http://') or input_path.startswith('https://'):
        return fetch_from_url(input_path)
    else:
        # print(f"📖 Reading local file: {input_path}...")
        with open(input_path, 'r', encoding='utf-8') as f:
            return f.read()


def collect_schema_refs(obj: Any, refs: Set[str]) -> None:
    """Collect all schema references from an object"""
    if not isinstance(obj, dict):
        return
    
    if '$ref' in obj and obj['$ref'].startswith('#/components/schemas/'):
        refs.add(obj['$ref'])
    
    for value in obj.values():
        if isinstance(value, dict):
            collect_schema_refs(value, refs)
        elif isinstance(value, list):
            for item in value:
                collect_schema_refs(item, refs)


def collect_all_referenced_schemas(tagged_paths: Dict[str, Any], all_schemas: Dict[str, Any]) -> Dict[str, Any]:
    """Collect all schemas referenced by the tagged paths, following $ref chains"""
    # Get all direct schema references
    used_schema_refs = set()
    
    for path_item in tagged_paths.values():
        for operation in path_item.values():
            collect_schema_refs(operation, used_schema_refs)
    
    if not used_schema_refs:
        return {}
    
    # Convert refs to schema names
    direct_schemas = set()
    for ref in used_schema_refs:
        schema_name = ref.replace('#/components/schemas/', '')
        direct_schemas.add(schema_name)
    
    # Now collect all schemas that are referenced by these schemas (following $ref chains)
    all_needed_schemas = set()
    to_process = list(direct_schemas)
    
    while to_process:
        schema_name = to_process.pop(0)
        if schema_name in all_needed_schemas or schema_name not in all_schemas:
            continue
        
        all_needed_schemas.add(schema_name)
        
        # Find all schemas referenced by this schema
        schema_refs = set()
        collect_schema_refs(all_schemas[schema_name], schema_refs)
        
        for ref in schema_refs:
            ref_name = ref.replace('#/components/schemas/', '')
            if ref_name not in all_needed_schemas:
                to_process.append(ref_name)
    
    # Return all needed schemas
    needed_schemas = {}
    for schema_name in all_needed_schemas:
        if schema_name in all_schemas:
            needed_schemas[schema_name] = all_schemas[schema_name]
    
    return needed_schemas


class FixedTagFirstCircularResolver:
    """FIXED: Split by tags first, then resolve circular references per-tag with proper caching"""
    
    def __init__(self):
        self.schema_graph: Dict[str, Set[str]] = {}
        self.circular_refs: Set[str] = set()
        # FIX: Add global resolution cache to prevent exponential inlining
        self.resolved_cache: Dict[str, Any] = {}
    
    def extract_schema_references(self, schema: Any, refs: Optional[Set[str]] = None) -> Set[str]:
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
    
    def build_schema_graph(self, schemas: Dict[str, Any]) -> None:
        """Build dependency graph of schemas"""
        self.schema_graph.clear()
        
        for schema_name, schema in schemas.items():
            self.schema_graph[schema_name] = self.extract_schema_references(schema)
    
    def detect_circular_references(self, schemas: Dict[str, Any]) -> Set[str]:
        """Detect all circular references using improved DFS that explores all paths"""
        self.build_schema_graph(schemas)
        visited_global = set()
        circular_schemas = set()
        
        def dfs_all_paths(node: str, path: list, visited_in_path: set) -> None:
            """DFS that explores ALL paths, not just first cycles found"""
            if node in visited_in_path:
                # Found a cycle - mark all schemas in the current path as circular
                cycle_start_idx = path.index(node)
                cycle_schemas = set(path[cycle_start_idx:])
                circular_schemas.update(cycle_schemas)
                return
            
            # Continue exploring even if we've visited this node in other paths
            visited_in_path.add(node)
            path.append(node)
            
            dependencies = self.schema_graph.get(node, set())
            for dep in dependencies:
                if dep in self.schema_graph:  # Only follow refs to schemas that exist
                    dfs_all_paths(dep, path.copy(), visited_in_path.copy())
            
            visited_in_path.remove(node)
            path.pop()
        
        # Start DFS from every schema to ensure we find all cycles
        for schema_name in schemas.keys():
            if schema_name not in visited_global:
                dfs_all_paths(schema_name, [], set())
                visited_global.add(schema_name)
        
        # Also check for direct self-references
        for schema_name, schema in schemas.items():
            refs = self.extract_schema_references(schema)
            if schema_name in refs:
                circular_schemas.add(schema_name)
        
        return circular_schemas
    
    def get_schemas_used_by_tag(self, api_spec: Dict[str, Any], tag: str) -> Dict[str, Any]:
        """Get all schemas used by a specific tag"""
        # Get all paths for this tag
        tagged_paths = {}
        paths = api_spec.get('paths', {})
        for path_name, path_item in paths.items():
            for method, operation in path_item.items():
                if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']:
                    operation_tags = operation.get('tags', [])
                    if tag in operation_tags:
                        if path_name not in tagged_paths:
                            tagged_paths[path_name] = {}
                        tagged_paths[path_name][method] = operation
        
        all_schemas = api_spec.get('components', {}).get('schemas', {})
        return collect_all_referenced_schemas(tagged_paths, all_schemas)
    
    def resolve_schema_with_selective_inlining(self, schema_name: str, all_schemas: Dict[str, Any], 
                                             visited: Set[str], depth: int = 0) -> Dict[str, Any]:
        """Resolve a schema with selective inlining of circular references only - WITH CACHING"""
        
        # FIX: Check cache first to prevent re-resolving the same schema
        if schema_name in self.resolved_cache:
            return self.resolved_cache[schema_name]
        
        # Prevent infinite recursion
        if depth > 50:
            placeholder = {
                'type': 'object',
                'description': f'{schema_name} object (max depth reached)'
            }
            self.resolved_cache[schema_name] = placeholder
            return placeholder
        
        # Check if we're in a circular reference
        if schema_name in visited:
            placeholder = {
                'type': 'object',
                'description': f'{schema_name} object (circular reference)'
            }
            self.resolved_cache[schema_name] = placeholder
            return placeholder
        
        schema = all_schemas.get(schema_name)
        if not schema:
            placeholder = {
                'type': 'object',
                'description': f'Schema {schema_name} not found'
            }
            self.resolved_cache[schema_name] = placeholder
            return placeholder
        
        # Add to visited set to detect circular references
        visited.add(schema_name)
        
        try:
            resolved = self.resolve_schema_object_selectively(schema, all_schemas, visited, depth)
            visited.remove(schema_name)
            
            # FIX: Cache the resolved schema
            self.resolved_cache[schema_name] = resolved
            return resolved
        except Exception as e:
            visited.remove(schema_name)
            placeholder = {
                'type': 'object',
                'description': f'Error resolving {schema_name}: {e}'
            }
            self.resolved_cache[schema_name] = placeholder
            return placeholder
    
    def resolve_schema_object_selectively(self, obj: Any, all_schemas: Dict[str, Any], 
                                        visited: Set[str], depth: int = 0) -> Any:
        """Resolve schema object, only inlining circular references"""
        if not isinstance(obj, dict):
            return obj
        
        # Handle $ref - only inline if it's part of a circular reference
        if '$ref' in obj and obj['$ref'].startswith('#/components/schemas/'):
            ref_name = obj['$ref'].replace('#/components/schemas/', '')
            
            # If this reference is NOT part of a circular chain, keep it as $ref
            if ref_name not in self.circular_refs:
                return obj  # Keep as $ref
            
            # Otherwise, inline it
            return self.resolve_schema_with_selective_inlining(ref_name, all_schemas, visited, depth + 1)
        
        resolved = {}
        
        # Copy primitive properties first
        for key, value in obj.items():
            if key not in ['properties', 'items', 'allOf', 'oneOf', 'anyOf']:
                resolved[key] = value
        
        # Handle arrays
        if obj.get('type') == 'array' and 'items' in obj:
            resolved['type'] = 'array'
            resolved_items = self.resolve_schema_object_selectively(obj['items'], all_schemas, visited, depth + 1)
            if 'properties' in resolved_items and 'type' not in resolved_items:
                resolved_items['type'] = 'object'
            resolved['items'] = resolved_items
        elif 'items' in obj:
            resolved_items = self.resolve_schema_object_selectively(obj['items'], all_schemas, visited, depth + 1)
            if 'properties' in resolved_items and 'type' not in resolved_items:
                resolved_items['type'] = 'object'
            resolved['items'] = resolved_items
            if 'type' not in resolved:
                resolved['type'] = 'array'
        
        # Handle properties
        if 'properties' in obj:
            resolved['properties'] = {}
            for prop_name, prop_def in obj['properties'].items():
                try:
                    resolved['properties'][prop_name] = self.resolve_schema_object_selectively(
                        prop_def, all_schemas, visited, depth + 1
                    )
                except Exception as e:
                    print(f"     Error resolving property {prop_name}: {e}")
                    resolved['properties'][prop_name] = {
                        'type': 'object',
                        'description': f'Error resolving property {prop_name}'
                    }
        
        # Handle allOf - merge properties
        if 'allOf' in obj:
            merged_props = {}
            merged_required = []
            
            for i, sub_schema in enumerate(obj['allOf']):
                try:
                    resolved_sub = self.resolve_schema_object_selectively(sub_schema, all_schemas, visited, depth + 1)
                    if 'properties' in resolved_sub:
                        merged_props.update(resolved_sub['properties'])
                    if 'required' in resolved_sub:
                        merged_required.extend(resolved_sub['required'])
                    
                    # Copy other properties
                    for prop in ['description', 'format', 'example', 'enum', 'minimum', 'maximum']:
                        if prop in resolved_sub and prop not in resolved:
                            resolved[prop] = resolved_sub[prop]
                    
                    if 'type' in resolved_sub and 'type' not in resolved:
                        resolved['type'] = resolved_sub['type']
                except Exception as e:
                    print(f"     Error resolving allOf[{i}]: {e}")
            
            resolved['properties'] = {**merged_props, **resolved.get('properties', {})}
            if merged_required:
                resolved['required'] = list(set(merged_required + resolved.get('required', [])))
        
        # Handle oneOf/anyOf - keep structure but resolve references selectively
        if 'oneOf' in obj:
            resolved['oneOf'] = []
            for i, sub_schema in enumerate(obj['oneOf']):
                try:
                    resolved['oneOf'].append(self.resolve_schema_object_selectively(sub_schema, all_schemas, visited, depth + 1))
                except Exception as e:
                    print(f"     Error resolving oneOf[{i}]: {e}")
                    resolved['oneOf'].append({
                        'type': 'object',
                        'description': f'Error resolving oneOf[{i}]'
                    })
        
        if 'anyOf' in obj:
            resolved['anyOf'] = []
            for i, sub_schema in enumerate(obj['anyOf']):
                try:
                    resolved['anyOf'].append(self.resolve_schema_object_selectively(sub_schema, all_schemas, visited, depth + 1))
                except Exception as e:
                    print(f"     Error resolving anyOf[{i}]: {e}")
                    resolved['anyOf'].append({
                        'type': 'object',
                        'description': f'Error resolving anyOf[{i}]'
                    })
        
        # Ensure schemas with properties have object type
        if 'type' not in resolved and 'properties' in resolved:
            resolved['type'] = 'object'
        
        return resolved
    
    def resolve_circular_references_in_tag(self, tag_spec: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve circular references within a single tag's API spec - FIXED VERSION"""
        schemas = tag_spec.get('components', {}).get('schemas', {})
        
        if not schemas:
            print(f"   No schemas found in this tag")
            return tag_spec
        
        # Detect circular references within this tag's schemas
        self.circular_refs = self.detect_circular_references(schemas)
        
        if not self.circular_refs:
            print(f"   No circular references found in this tag")
            return tag_spec
        
        print(f"   Found {len(self.circular_refs)} circular schemas: {sorted(self.circular_refs)}")
        
        # FIX: Clear cache for this tag to ensure fresh resolution
        self.resolved_cache.clear()
        
        # Create a copy to work with
        resolved_schemas = copy.deepcopy(schemas)
        
        # FIX: Use a SHARED visited set for all resolutions to enable proper caching
        shared_visited = set()
        
        # Only resolve schemas that are part of circular references
        for schema_name in self.circular_refs:
            try:
                # FIX: Use shared visited set instead of fresh set() each time
                resolved_schemas[schema_name] = self.resolve_schema_with_selective_inlining(
                    schema_name, schemas, shared_visited
                )
            except Exception as e:
                print(f"   Warning: Failed to resolve schema {schema_name}: {e}")
                resolved_schemas[schema_name] = {
                    'type': 'object',
                    'description': f'Failed to resolve {schema_name}: {e}'
                }
        
        # Update the tag spec with resolved schemas
        result = tag_spec.copy()
        if 'components' not in result:
            result['components'] = {}
        result['components']['schemas'] = resolved_schemas
        
        return result
    
    def split_by_tags_first(self, api_spec: Dict[str, Any], output_dir: str) -> None:
        """Split API spec by tags first, then resolve circular references per tag"""
        
        # Collect all tags
        tags = set()
        paths = api_spec.get('paths', {})
        
        for path_name, path_item in paths.items():
            for method, operation in path_item.items():
                if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']:
                    operation_tags = operation.get('tags', [])
                    tags.update(operation_tags)
        
        print(f"📊 Found {len(tags)} tag(s): {', '.join(sorted(tags))}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Process each tag
        for tag in sorted(tags):
            tag_filename = f"{tag.lower()}-api.yaml"
            print(f"\n🏷️  Processing tag: {tag}")
            
            # Create tag-specific API spec
            tag_spec = {
                'openapi': api_spec.get('openapi', '3.0.0'),
                'info': {
                    'title': f"{api_spec.get('info', {}).get('title', 'API')} - {capitalize_language_name(tag)}",
                    'version': api_spec.get('info', {}).get('version', '1.0.0'),
                    'description': f"API endpoints for {capitalize_language_name(tag)}"
                },
                'servers': api_spec.get('servers', []),
                'paths': {},
                'components': {
                    'schemas': {},
                    'securitySchemes': api_spec.get('components', {}).get('securitySchemes', {})
                }
            }
            
            # Add paths for this tag
            for path_name, path_item in paths.items():
                tag_path_item = {}
                for method, operation in path_item.items():
                    if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']:
                        operation_tags = operation.get('tags', [])
                        if tag in operation_tags:
                            tag_path_item[method] = operation
                
                if tag_path_item:
                    tag_spec['paths'][path_name] = tag_path_item
            
            # Get schemas used by this tag
            used_schemas = self.get_schemas_used_by_tag(api_spec, tag)
            
            # Add only the schemas used by this tag
            tag_spec['components']['schemas'] = used_schemas
            
            print(f"   Tag uses {len(used_schemas)} schemas")
            
            # Resolve circular references within this tag's context
            resolved_tag_spec = self.resolve_circular_references_in_tag(tag_spec)
            
            # Write the tag file
            output_path = os.path.join(output_dir, tag_filename)
            with open(output_path, 'w', encoding='utf-8') as f:
                yaml.dump(resolved_tag_spec, f, default_flow_style=False, sort_keys=False, allow_unicode=True, width=float('inf'))
            
            print(f"📄 Created {tag_filename} with {len(resolved_tag_spec['paths'])} path(s)")


def main():
    parser = argparse.ArgumentParser(description='FIXED Split-first approach: Split by tags first, then resolve circular references per-tag')
    parser.add_argument('input_file', help='Input OpenAPI YAML file')
    parser.add_argument('output_dir', help='Output directory for split files')
    
    args = parser.parse_args()
    
    print("🏷️  FIXED Split-first approach: Tags first, then resolve circular references per-tag")
    print(f"📖 Reading file: {args.input_file}...")
    
    # Read the OpenAPI file
    file_content = read_content(args.input_file)
    api_spec = yaml.safe_load(file_content)

    resolver = FixedTagFirstCircularResolver()
    resolver.split_by_tags_first(api_spec, args.output_dir)
    
    print(f"\n🎉 FIXED Split-first complete! Created tag files in {args.output_dir}")
    print("🔗 Circular references resolved per-tag with proper caching - should be much smaller!")


if __name__ == '__main__':
    main() 
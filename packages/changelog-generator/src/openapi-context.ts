import * as yaml from 'js-yaml';

export type EndpointContext = {
	path: string;
	method: string;
	location: 'request' | 'response' | 'parameter' | 'unknown';
};

export type ContextualChange = {
	endpoint: EndpointContext;
	changeType: 'added' | 'removed' | 'modified';
	itemType: 'endpoint' | 'field' | 'parameter';
	itemName: string;
	breaking: boolean;
};

type LineMap = Map<number, { path: string; method: string; location: 'request' | 'response' | 'parameter' | 'unknown' }>;

function buildLineMap(specYaml: string): LineMap {
	const lineMap: LineMap = new Map();
	const lines = specYaml.split('\n');
	
	let spec: any;
	try {
		spec = yaml.load(specYaml);
	} catch (e) {
		return lineMap;
	}
	
	if (!spec?.paths) return lineMap;
	
	for (const [pathStr, pathObj] of Object.entries(spec.paths)) {
		if (!pathObj || typeof pathObj !== 'object') continue;
		
		for (const [method, methodObj] of Object.entries(pathObj as Record<string, any>)) {
			const httpMethod = method.toLowerCase();
			if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(httpMethod)) {
				continue;
			}
			
			if (!methodObj || typeof methodObj !== 'object') continue;
			
			const pathLineRegex = new RegExp(`^\\s*${pathStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*$`);
			const methodLineRegex = new RegExp(`^\\s*${httpMethod}:\\s*$`);
			
			let pathLineNum = -1;
			let methodLineNum = -1;
			
			for (let i = 0; i < lines.length; i++) {
				if (pathLineNum === -1 && pathLineRegex.test(lines[i])) {
					pathLineNum = i + 1;
				} else if (pathLineNum !== -1 && methodLineNum === -1 && methodLineRegex.test(lines[i])) {
					methodLineNum = i + 1;
					break;
				}
			}
			
			if (methodLineNum === -1) continue;
			
			let requestBodyStart = -1;
			let requestBodyEnd = -1;
			let responsesStart = -1;
			let responsesEnd = -1;
			let parametersStart = -1;
			let parametersEnd = -1;
			
			for (let i = methodLineNum; i < lines.length; i++) {
				const line = lines[i];
				const trimmed = line.trimStart();
				const indent = line.length - trimmed.length;
				
				if (indent <= lines[methodLineNum - 1].length - lines[methodLineNum - 1].trimStart().length && i > methodLineNum) {
					break;
				}
				
				if (trimmed.startsWith('requestBody:')) {
					requestBodyStart = i + 1;
				} else if (requestBodyStart > 0 && requestBodyEnd === -1 && (trimmed.startsWith('responses:') || trimmed.startsWith('parameters:'))) {
					requestBodyEnd = i;
				}
				
				if (trimmed.startsWith('responses:')) {
					responsesStart = i + 1;
					if (requestBodyStart > 0 && requestBodyEnd === -1) {
						requestBodyEnd = i;
					}
				} else if (responsesStart > 0 && responsesEnd === -1 && (trimmed.startsWith('requestBody:') || trimmed.startsWith('parameters:'))) {
					responsesEnd = i;
				}
				
				if (trimmed.startsWith('parameters:')) {
					parametersStart = i + 1;
					if (requestBodyStart > 0 && requestBodyEnd === -1) {
						requestBodyEnd = i;
					}
					if (responsesStart > 0 && responsesEnd === -1) {
						responsesEnd = i;
					}
				}
			}
			
			if (requestBodyEnd === -1 && requestBodyStart > 0) requestBodyEnd = lines.length;
			if (responsesEnd === -1 && responsesStart > 0) responsesEnd = lines.length;
			if (parametersStart > 0 && parametersEnd === -1) parametersEnd = lines.length;
			
			const methodIndent = lines[methodLineNum - 1].length - lines[methodLineNum - 1].trimStart().length;
			let endLine = lines.length;
			
			for (let i = methodLineNum; i < lines.length; i++) {
				const line = lines[i];
				const indent = line.length - line.trimStart().length;
				if (indent <= methodIndent && i > methodLineNum - 1) {
					endLine = i;
					break;
				}
			}
			
			for (let lineNum = methodLineNum; lineNum < endLine; lineNum++) {
				let location: 'request' | 'response' | 'parameter' | 'unknown' = 'unknown';
				if (requestBodyStart > 0 && lineNum >= requestBodyStart && lineNum < requestBodyEnd) {
					location = 'request';
				} else if (responsesStart > 0 && lineNum >= responsesStart && lineNum < responsesEnd) {
					location = 'response';
				} else if (parametersStart > 0 && lineNum >= parametersStart && lineNum < parametersEnd) {
					location = 'parameter';
				}
				
				lineMap.set(lineNum, {
					path: pathStr,
					method: httpMethod.toUpperCase(),
					location,
				});
			}
		}
	}
	
	return lineMap;
}

export function enrichChangesWithContext(
	changes: Array<any>,
	baseYaml: string,
	headYaml: string,
): Array<ContextualChange> {
	const baseLineMap = buildLineMap(baseYaml);
	const headLineMap = buildLineMap(headYaml);

	const contextualChanges: Array<ContextualChange> = [];

	for (const change of changes) {
		const property = change.property || '';
		const changeText = change.changeText || '';
		const isBreaking = change.breaking === true;

		if (property === 'path') {
			const name = change.new || change.original;
			if (!name) continue;

			contextualChanges.push({
				endpoint: { path: name, method: 'ALL', location: 'unknown' },
				changeType: changeText.includes('added')
					? 'added'
					: changeText.includes('removed')
					? 'removed'
					: 'modified',
				itemType: 'endpoint',
				itemName: name,
				breaking: isBreaking,
			});
		} else if (property === 'parameters' || property.includes('parameter')) {
			const name = change.new || change.original;
			if (!name) continue;

			const lineNumber = change.context?.originalLine || change.context?.newLine;
			const lineMap = change.context?.originalLine ? baseLineMap : headLineMap;
			const endpoint = lineNumber ? lineMap.get(lineNumber) : null;

			if (endpoint) {
				contextualChanges.push({
					endpoint,
					changeType: changeText.includes('added')
						? 'added'
						: changeText.includes('removed')
						? 'removed'
						: 'modified',
					itemType: 'parameter',
					itemName: name,
					breaking: isBreaking,
				});
			}
		} else if (
			property === 'properties' ||
			property === 'schema' ||
			property.includes('response') ||
			property.includes('request')
		) {
			const name = change.new || change.original;
			if (!name) continue;

			const lineNumber = change.context?.originalLine || change.context?.newLine;
			const lineMap = change.context?.originalLine ? baseLineMap : headLineMap;
			const endpoint = lineNumber ? lineMap.get(lineNumber) : null;

			if (endpoint) {
				contextualChanges.push({
					endpoint,
					changeType: changeText.includes('added')
						? 'added'
						: changeText.includes('removed')
						? 'removed'
						: 'modified',
					itemType: 'field',
					itemName: name,
					breaking: isBreaking,
				});
			}
		}
	}

	return contextualChanges;
}


#!/usr/bin/env node

/**
 * Test script to demonstrate selective path inlining
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function compareApproaches() {
    console.log('🧪 Testing Selective Path Inlining vs Original Approach');
    console.log('='.repeat(60));
    
    const inputUrl = 'https://gleanwork.github.io/open-api/specs/final/client_rest.yaml';
    const outputDir1 = 'test-output-original';
    const outputDir2 = 'test-output-selective';
    
    console.log('\n🔍 Analyzing with Python script first...');
    try {
        const { stdout } = await execAsync(`python3 scripts/test.py`);
        console.log(stdout);
    } catch (error) {
        console.log('Python analysis failed:', error.message);
    }
    
    console.log('\n📊 Running original approach...');
    try {
        const { stdout: stdout1 } = await execAsync(`node scripts/openapi-break-circular.mjs "${inputUrl}" ${outputDir1}`);
        console.log('Original approach output:');
        console.log(stdout1);
    } catch (error) {
        console.log('Original approach failed:', error.message);
    }
    
    console.log('\n🎯 Running selective path inlining approach...');
    try {
        const { stdout: stdout2 } = await execAsync(`node scripts/openapi-break-circular-paths-only.mjs "${inputUrl}" ${outputDir2}`);
        console.log('Selective path inlining output:');
        console.log(stdout2);
    } catch (error) {
        console.log('Selective approach failed:', error.message);
    }
    
    console.log('\n📋 Comparing results...');
    
    // Compare split-info.json files
    try {
        const info1 = JSON.parse(fs.readFileSync(`${outputDir1}/split-info.json`, 'utf-8'));
        const info2 = JSON.parse(fs.readFileSync(`${outputDir2}/split-info.json`, 'utf-8'));
        
        console.log(`\nOriginal approach: ${info1.tags?.length || 0} tags`);
        console.log(`Selective approach: ${info2.tags?.length || 0} tags (maxDepth: ${info2.maxDepth})`);
        
        if (info2.tags) {
            for (const tag of info2.tags) {
                console.log(`\n📁 Tag: ${tag.name}`);
                console.log(`   - Endpoints: ${tag.endpoints?.length || 0}`);
                console.log(`   - Schemas: ${tag.schemas}`);
                console.log(`   - Circular schemas: ${tag.circularSchemas?.length || 0}`);
                if (tag.circularSchemas && tag.circularSchemas.length > 0) {
                    console.log(`   - Circular schemas: ${tag.circularSchemas.join(', ')}`);
                }
            }
        }
        
    } catch (error) {
        console.log('Failed to compare split-info.json files:', error.message);
    }
    
    console.log('\n🎉 Test complete!');
    console.log('Check the output directories to see the differences:');
    console.log(`  - Original: ${outputDir1}/`);
    console.log(`  - Selective: ${outputDir2}/`);
}

compareApproaches().catch(console.error); 
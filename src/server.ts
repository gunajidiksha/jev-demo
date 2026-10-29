/**
 * API Server - Proper Backend API
 * This creates a real HTTP server that frontend can call
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { exec } from 'child_process';
import { join, extname } from 'path';
import { JevApplication } from './main.js';
import { displayDecisions } from './cli.js';

const PORT = 3000;

const app = new JevApplication();

// MIME types for static files
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml'
};

// Create HTTP server
const server = createServer(async (req, res) => {
  // Enable CORS for frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const url = req.url || '/';
    
    // API Routes
    if (url.startsWith('/api/')) {
      
      // Route: GET /api/decisions - Get current decisions
      if (url === '/api/decisions' && req.method === 'GET') {
        console.log('📊 Processing decision request...');
        
        const decisionPlan = await app.process();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(decisionPlan));
        return;
      }

      // Route: GET /api/input - Get input data
      if (url === '/api/input' && req.method === 'GET') {
        const inputData = app.getInputData();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(inputData));
        return;
      }
      
      // Route: POST /api/analyze - Analyze custom uploaded data
      if (url === '/api/analyze' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const { adSets, events } = JSON.parse(body);
            
            if (!adSets || !Array.isArray(adSets)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid adSets data' }));
              return;
            }
            
            console.log(`📊 Analyzing ${adSets.length} uploaded ad sets...`);
            
            // Process uploaded data
            const customApp = new JevApplication();
            customApp.loadCustomData(adSets, events || []);
            const decisionPlan = await customApp.process();
            
            // Save to output.json
            const { writeFileSync } = await import('fs');
            writeFileSync('./output.json', JSON.stringify(decisionPlan, null, 2));
            console.log('💾 Decision plan saved to output.json');
            
            console.log('✅ Analysis complete');
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              success: true,
              decisionPlan 
            }));
            
          } catch (error) {
            console.error('Analysis error:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              error: 'Failed to analyze data',
              message: error instanceof Error ? error.message : 'Unknown error'
            }));
          }
        });
        
        return;
      }
      
      // API 404
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API route not found' }));
      return;
    }
    
    // Serve static files from public/
    let filePath = url === '/' ? '/index.html' : url;
    filePath = join(process.cwd(), 'public', filePath);
    
    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      const contentType = mimeTypes[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File Not Found</h1>');
    }
    
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
});

server.listen(PORT, async () => {
  console.log(`\n🚀 Jev API Server running at http://localhost:${PORT}`);
  console.log(`\n📍 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/           - Dashboard`);
  console.log(`   GET  http://localhost:${PORT}/api/decisions`);
  console.log(`   GET  http://localhost:${PORT}/api/input`);
  console.log(`   POST http://localhost:${PORT}/api/analyze - Upload custom JSON`);
  console.log(`\n✨ Frontend served at root URL!\n`);
  
  // Show CLI output
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🤖 JEV AI DECISION ENGINE - DEMO OUTPUT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const decisionPlan = await app.process();
  displayDecisions(decisionPlan);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 Opening dashboard in browser...\n');
  
  // Auto-open dashboard at proper URL
  const url = `http://localhost:${PORT}`;
  const openCommand = process.platform === 'darwin' ? 'open' : 
                      process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${openCommand} "${url}"`, (error) => {
    if (error) {
      console.log(`⚠️  Could not auto-open browser. Please open manually:`);
      console.log(`   ${url}\n`);
    } else {
      console.log(`✅ Dashboard opened at ${url}\n`);
    }
  });
});

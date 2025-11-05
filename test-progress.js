// Simple test script to verify progress API endpoint
const fetch = require('node-fetch');

async function testProgressAPI() {
  try {
    console.log('Testing progress API endpoint...');
    
    const response = await fetch('http://localhost:3002/api/database/export/progress');
    
    if (!response.ok) {
      console.error('API responded with status:', response.status);
      const text = await response.text();
      console.error('Response body:', text);
      return;
    }
    
    console.log('Response headers:', response.headers.raw());
    console.log('Content-Type:', response.headers.get('content-type'));
    
    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('Stream completed');
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      console.log('Received chunk:', chunk);
    }
    
  } catch (error) {
    console.error('Error testing progress API:', error);
  }
}

testProgressAPI();
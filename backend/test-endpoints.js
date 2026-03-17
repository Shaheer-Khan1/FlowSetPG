// Test API Endpoints
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const API_BASE = `http://localhost:${process.env.PORT || 3001}`;

async function testEndpoint(method, path, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();
    
    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${method} ${path} - ${response.status}`);
    
    if (!response.ok) {
      console.log('   Error:', data.error || data.message);
    } else if (data.data) {
      const count = Array.isArray(data.data) ? data.data.length : 1;
      console.log(`   Returned: ${count} item(s)`);
    }
    
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${method} ${path} - ERROR`);
    console.log(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n🧪 Testing FlowSet API Endpoints...\n');
  console.log('═══════════════════════════════════════\n');
  
  // Health check
  console.log('📊 System Health:');
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/api/system/stats');
  console.log('');
  
  // Tenants
  console.log('🏢 Tenants:');
  await testEndpoint('GET', '/api/tenants');
  await testEndpoint('GET', '/api/tenants/11111111-1111-1111-1111-111111111111');
  console.log('');
  
  // Users
  console.log('👥 Users:');
  await testEndpoint('GET', '/api/users');
  await testEndpoint('GET', '/api/users?tenant_id=11111111-1111-1111-1111-111111111111');
  await testEndpoint('GET', '/api/users/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  console.log('');
  
  // Teams
  console.log('👨‍👩‍👧‍👦 Teams:');
  await testEndpoint('GET', '/api/teams');
  await testEndpoint('GET', '/api/teams?tenant_id=11111111-1111-1111-1111-111111111111');
  await testEndpoint('GET', '/api/teams/44444444-4444-4444-4444-444444444444/members');
  console.log('');
  
  // Devices
  console.log('🔧 Devices:');
  await testEndpoint('GET', '/api/devices');
  await testEndpoint('GET', '/api/devices?tenant_id=11111111-1111-1111-1111-111111111111');
  await testEndpoint('GET', '/api/devices/77777777-7777-7777-7777-777777777777');
  await testEndpoint('GET', '/api/devices/77777777-7777-7777-7777-777777777777/health');
  await testEndpoint('GET', '/api/devices/77777777-7777-7777-7777-777777777777/data/latest');
  await testEndpoint('GET', '/api/devices/77777777-7777-7777-7777-777777777777/data?limit=5');
  console.log('');
  
  // Installations
  console.log('📍 Installations:');
  await testEndpoint('GET', '/api/installations');
  await testEndpoint('GET', '/api/installations?tenant_id=11111111-1111-1111-1111-111111111111');
  await testEndpoint('GET', '/api/installations/map');
  console.log('');
  
  // Alerts
  console.log('🚨 Alerts:');
  await testEndpoint('GET', '/api/alerts');
  await testEndpoint('GET', '/api/alerts?tenant_id=11111111-1111-1111-1111-111111111111');
  await testEndpoint('GET', '/api/alerts?status=open');
  await testEndpoint('GET', '/api/alerts/stats/summary');
  await testEndpoint('GET', '/api/alerts/rules');
  console.log('');
  
  // Analytics
  console.log('📊 Analytics:');
  await testEndpoint('GET', '/api/analytics/dashboard?tenant_id=11111111-1111-1111-1111-111111111111');
  await testEndpoint('GET', '/api/analytics/device-uptime?tenant_id=11111111-1111-1111-1111-111111111111');
  await testEndpoint('GET', '/api/analytics/alert-trends?tenant_id=11111111-1111-1111-1111-111111111111');
  console.log('');
  
  // Firmware
  console.log('💾 Firmware:');
  await testEndpoint('GET', '/api/firmware/versions');
  await testEndpoint('GET', '/api/firmware/versions?device_type=flood_sensor');
  await testEndpoint('GET', '/api/firmware/jobs');
  console.log('');
  
  console.log('═══════════════════════════════════════');
  console.log('\n✅ API Test Complete!\n');
}

// Wait a bit for server to start if needed
setTimeout(() => {
  runTests().catch(console.error);
}, 1000);

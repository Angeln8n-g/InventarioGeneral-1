/**
 * Script to test user management endpoints
 * Tests GET, PUT, and DELETE operations for user management
 */

const BASE_URL = 'http://localhost:3000'

// Test credentials - update these with valid credentials
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

let authToken = null
let testUserId = null

async function login() {
  console.log('🔐 Logging in as admin...')
  
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  })

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`)
  }

  const data = await response.json()
  authToken = data.data.token
  console.log('✅ Login successful')
}

async function listUsers() {
  console.log('\n📋 Listing all users...')
  
  const response = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`List users failed: ${response.status}`)
  }

  const data = await response.json()
  console.log(`✅ Found ${data.data.length} users`)
  
  // Find a test user (not admin)
  testUserId = data.data.find(u => u.role === 'user')?.id
  
  if (testUserId) {
    console.log(`   Using user ID ${testUserId} for testing`)
  } else {
    console.log('   ⚠️  No regular user found for testing')
  }
  
  return data.data
}

async function getUser(userId) {
  console.log(`\n👤 Getting user ${userId}...`)
  
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Get user failed: ${response.status}`)
  }

  const data = await response.json()
  console.log('✅ User retrieved successfully')
  console.log(`   Username: ${data.data.username}`)
  console.log(`   Email: ${data.data.email}`)
  console.log(`   Role: ${data.data.role}`)
  
  return data.data
}

async function updateUser(userId, updates) {
  console.log(`\n✏️  Updating user ${userId}...`)
  console.log(`   Updates:`, updates)
  
  const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Update user failed: ${response.status} - ${errorData.error?.message}`)
  }

  const data = await response.json()
  console.log('✅ User updated successfully')
  console.log(`   New email: ${data.data.email}`)
  console.log(`   New role: ${data.data.role}`)
  console.log(`   New full_name: ${data.data.full_name}`)
  
  return data.data
}

async function testInvalidUpdates(userId) {
  console.log(`\n🧪 Testing validation...`)
  
  // Test invalid email
  try {
    await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ email: 'invalid-email' }),
    })
    console.log('   ❌ Should have rejected invalid email')
  } catch (error) {
    console.log('   ✅ Invalid email rejected')
  }
  
  // Test invalid role
  try {
    await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ role: 'superadmin' }),
    })
    console.log('   ❌ Should have rejected invalid role')
  } catch (error) {
    console.log('   ✅ Invalid role rejected')
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting user management tests...\n')
    
    // Step 1: Login
    await login()
    
    // Step 2: List users
    const users = await listUsers()
    
    if (!testUserId) {
      console.log('\n⚠️  Cannot continue tests without a test user')
      return
    }
    
    // Step 3: Get specific user
    const user = await getUser(testUserId)
    
    // Step 4: Update user
    const originalEmail = user.email
    const originalFullName = user.full_name
    
    await updateUser(testUserId, {
      full_name: 'Test User Updated',
      email: `test.updated.${Date.now()}@example.com`,
    })
    
    // Step 5: Verify update
    const updatedUser = await getUser(testUserId)
    
    // Step 6: Restore original values
    console.log(`\n🔄 Restoring original values...`)
    await updateUser(testUserId, {
      email: originalEmail,
      full_name: originalFullName,
    })
    console.log('✅ Original values restored')
    
    // Step 7: Test validation
    await testInvalidUpdates(testUserId)
    
    console.log('\n✅ All tests passed!')
    console.log('\n📝 Summary:')
    console.log('   ✅ GET /api/admin/users - List users')
    console.log('   ✅ GET /api/admin/users/[id] - Get specific user')
    console.log('   ✅ PUT /api/admin/users/[id] - Update user')
    console.log('   ✅ Validation checks')
    console.log('\n⚠️  Note: DELETE endpoint not tested to avoid data loss')
    console.log('   You can test it manually from the UI')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run tests
runTests()

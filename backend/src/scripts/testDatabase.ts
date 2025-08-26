import { DatabaseService } from '../services/databaseService';
import { supabase } from '../config/supabase';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log(`📊 Users count: ${count || 0}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
}

async function testUserOperations() {
  console.log('\n👤 Testing user operations...');
  
  try {
    // Test getting users
    const testUser = await DatabaseService.getUserByUsername('admin');
    if (testUser) {
      console.log('✅ Found admin user:', testUser.full_name);
    } else {
      console.log('⚠️  Admin user not found - this is expected if sample data is not loaded');
    }

    // Test getting user by email
    const testUserByEmail = await DatabaseService.getUserByEmail('student1@woodie.com');
    if (testUserByEmail) {
      console.log('✅ Found student by email:', testUserByEmail.full_name);
    } else {
      console.log('⚠️  Student user not found - this is expected if sample data is not loaded');
    }

    console.log('✅ User operations test completed');
    return true;
  } catch (error) {
    console.error('❌ User operations failed:', error);
    return false;
  }
}

async function testProblemOperations() {
  console.log('\n📝 Testing problem operations...');
  
  try {
    // Test getting problems
    const problems = await DatabaseService.getProblems({ limit: 5 });
    console.log(`✅ Retrieved ${problems.data.length} problems`);
    
    if (problems.data.length > 0) {
      const firstProblem = problems.data[0];
      console.log(`📋 First problem: "${firstProblem.title}" (${firstProblem.subject})`);
      
      // Test getting problem by ID
      const problemById = await DatabaseService.getProblemById(firstProblem.id);
      if (problemById) {
        console.log(`✅ Retrieved problem by ID: ${problemById.title}`);
      }
    }

    console.log('✅ Problem operations test completed');
    return true;
  } catch (error) {
    console.error('❌ Problem operations failed:', error);
    return false;
  }
}

async function testProblemSetOperations() {
  console.log('\n📚 Testing problem set operations...');
  
  try {
    // Test getting problem sets
    const problemSets = await DatabaseService.getProblemSets({ limit: 5 });
    console.log(`✅ Retrieved ${problemSets.data.length} problem sets`);
    
    if (problemSets.data.length > 0) {
      const firstProblemSet = problemSets.data[0];
      console.log(`📖 First problem set: "${firstProblemSet.title}" (${firstProblemSet.subject})`);
      
      // Test getting problem set with problems
      const problemSetWithProblems = await DatabaseService.getProblemSetWithProblems(firstProblemSet.id);
      if (problemSetWithProblems) {
        console.log(`✅ Retrieved problem set with ${problemSetWithProblems.problems?.length || 0} problems`);
      }
    }

    console.log('✅ Problem set operations test completed');
    return true;
  } catch (error) {
    console.error('❌ Problem set operations failed:', error);
    return false;
  }
}

async function testSolutionRecords() {
  console.log('\n📊 Testing solution records...');
  
  try {
    // Try to get solution records for a test user
    const testUserId = '550e8400-e29b-41d4-a716-446655440004'; // student1 from sample data
    const solutionRecords = await DatabaseService.getUserSolutionRecords(testUserId, { limit: 5 });
    console.log(`✅ Retrieved ${solutionRecords.data.length} solution records for test user`);
    
    if (solutionRecords.data.length > 0) {
      const firstRecord = solutionRecords.data[0];
      console.log(`📈 Recent solution: ${firstRecord.is_correct ? 'Correct' : 'Incorrect'} answer`);
    }

    console.log('✅ Solution records test completed');
    return true;
  } catch (error) {
    console.error('❌ Solution records test failed:', error);
    return false;
  }
}

async function testReviewSchedules() {
  console.log('\n🔄 Testing review schedules...');
  
  try {
    // Try to get review schedule for a test user
    const testUserId = '550e8400-e29b-41d4-a716-446655440004'; // student1 from sample data
    const today = new Date().toISOString().split('T')[0];
    const reviewSchedule = await DatabaseService.getReviewSchedule(testUserId, today);
    console.log(`✅ Retrieved ${reviewSchedule.length} review items for today`);
    
    if (reviewSchedule.length > 0) {
      const firstReview = reviewSchedule[0];
      console.log(`🔁 Review: "${firstReview.problem?.title}" (Stage ${firstReview.review_stage})`);
    }

    console.log('✅ Review schedules test completed');
    return true;
  } catch (error) {
    console.error('❌ Review schedules test failed:', error);
    return false;
  }
}

async function testUserStats() {
  console.log('\n📈 Testing user statistics...');
  
  try {
    const testUserId = '550e8400-e29b-41d4-a716-446655440004'; // student1 from sample data
    const stats = await DatabaseService.getUserStats(testUserId);
    
    console.log('📊 User Statistics:');
    console.log(`   Total Problems: ${stats.totalProblems}`);
    console.log(`   Solved Problems: ${stats.solvedProblems}`);
    console.log(`   Accuracy: ${stats.accuracy.toFixed(1)}%`);
    console.log(`   Today's Reviews: ${stats.todayReviews}`);
    console.log(`   Streak: ${stats.streak} days`);

    console.log('✅ User statistics test completed');
    return true;
  } catch (error) {
    console.error('❌ User statistics test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting database tests...\n');
  
  const results = {
    connection: await testDatabaseConnection(),
    users: await testUserOperations(),
    problems: await testProblemOperations(),
    problemSets: await testProblemSetOperations(),
    solutionRecords: await testSolutionRecords(),
    reviewSchedules: await testReviewSchedules(),
    userStats: await testUserStats(),
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Database is ready to use.');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
    console.log('💡 Tip: Make sure to run the SQL scripts in Supabase first:');
    console.log('   1. supabase-schema.sql');
    console.log('   2. sample-data.sql');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
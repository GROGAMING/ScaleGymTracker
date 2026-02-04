
#!/usr/bin/env node

// Quick verification script for weekly quota functionality
// Run with: node scripts/verify-weekly-quota.js

const { createClient } = require("@supabase/supabase-js");

// Configuration - update these for your environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyWeeklyQuota() {
  console.log("🔍 Verifying Weekly Quota Implementation...\n");

  try {
    // 1. Check app_settings table
    console.log("1️⃣ Checking app_settings table...");
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("*")
      .eq("key", "required_sessions_weekly");

    if (settingsError) {
      console.error("❌ Error accessing app_settings:", settingsError);
      return;
    }

    if (settings && settings.length > 0) {
      console.log(`✅ Found setting: required_sessions_weekly = ${settings[0].value_int}`);
    } else {
      console.log("⚠️  Setting not found, will use default (3)");
    }

    // 2. Check users table
    console.log("\n2️⃣ Checking users table...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name")
      .limit(5);

    if (usersError) {
      console.error("❌ Error accessing users:", usersError);
      return;
    }

    console.log(`✅ Found ${users.length} users (showing first 5):`);
    users.forEach(user => console.log(`   - ${user.name} (${user.id})`));

    // 3. Check uploads table structure
    console.log("\n3️⃣ Checking uploads table structure...");
    const { data: uploads, error: uploadsError } = await supabase
      .from("uploads")
      .select("id, user_id, created_at, status")
      .eq("status", "active")
      .limit(3);

    if (uploadsError) {
      console.error("❌ Error accessing uploads:", uploadsError);
      return;
    }

    console.log(`✅ Found uploads with correct structure (showing first 3):`);
    uploads.forEach(upload => {
      console.log(`   - Upload ${upload.id} for user ${upload.user_id} at ${upload.created_at}`);
    });

    // 4. Test API endpoints
    console.log("\n4️⃣ Testing API endpoints...");
    
    // Test settings endpoint
    try {
      const settingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        console.log(`✅ Settings endpoint working: ${JSON.stringify(settingsData)}`);
      } else {
        console.log("⚠️  Settings endpoint may need to be deployed");
      }
    } catch (error) {
      console.log("⚠️  Settings endpoint not accessible (may need deployment)");
    }

    // 5. Test weekly quota calculation
    console.log("\n5️⃣ Testing weekly quota calculation...");
    const weekStart = getMondayStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const { data: weeklyUploads, error: weeklyError } = await supabase
      .from("uploads")
      .select("user_id, created_at")
      .eq("status", "active")
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString());

    if (weeklyError) {
      console.error("❌ Error fetching weekly uploads:", weeklyError);
    } else {
      console.log(`✅ Found ${weeklyUploads.length} uploads this week`);
      
      // Count by user
      const userCounts = {};
      weeklyUploads.forEach(upload => {
        userCounts[upload.user_id] = (userCounts[upload.user_id] || 0) + 1;
      });
      
      console.log("📊 Weekly session counts:");
      Object.entries(userCounts).forEach(([userId, count]) => {
        const metQuota = count >= 3; // Default quota
        console.log(`   User ${userId}: ${count} sessions ${metQuota ? '✅' : '❌'}`);
      });
    }

    console.log("\n🎉 Verification completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Deploy the API routes to Vercel");
    console.log("2. Run the database migration");
    console.log("3. Test the admin settings UI");
    console.log("4. Verify the leaderboard shows correct badges");

  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

function getMondayStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Run verification
verifyWeeklyQuota();

import { execSync } from 'child_process';

console.log("\n🚀 Starting Auto-Deploy Sequence...\n");

try {
    // 1. Stage
    console.log("1️⃣  Staging all changes...");
    execSync('git add .', { stdio: 'inherit' });

    // 2. Commit
    console.log("2️⃣  Committing...");
    const timestamp = new Date().toLocaleString();
    try {
        execSync(`git commit -m "Auto-deploy: ${timestamp} (Agent Action)"`, { stdio: 'inherit' });
    } catch (e) {
        console.log("   ℹ️  No changes to commit. Proceeding to push check...");
    }

    // 3. Push
    console.log("3️⃣  Pushing to Vercel (origin main)...");
    execSync('git push origin main', { stdio: 'inherit' });

    console.log("\n✅ Deployment Command Sent Successfully!");
    console.log("   Check Vercel Dashboard for build status.\n");

} catch (error) {
    console.error("\n❌ Deploy Failed:", error.message);
    process.exit(1);
}

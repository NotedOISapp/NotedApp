
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("\n🚀 Starting Auto-Deploy Sequence...\n");

try {
    // 1. Generate Deployment Metadata
    console.log("1️⃣  Generating Deployment Log...");
    const timestamp = new Date().toLocaleString();
    const deployData = {
        timestamp: new Date().toISOString(),
        message: `Auto-deploy: ${timestamp}`,
        summary: "System update applied. Dashboard is consistent with repo."
    };

    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, 'deployment.json'), JSON.stringify(deployData, null, 2));

    // 2. Stage
    console.log("2️⃣  Staging all changes (+ deployment.json)...");
    execSync('git add .', { stdio: 'inherit' });

    // 3. Commit
    console.log("3️⃣  Committing...");
    try {
        execSync(`git commit -m "Auto-deploy: ${timestamp} (Agent Action)"`, { stdio: 'inherit' });
    } catch (e) {
        console.log("   ℹ️  No changes to commit (or only metadata changed).");
    }

    // 4. Push
    console.log("4️⃣  Pushing to Vercel (origin main)...");
    execSync('git push origin main', { stdio: 'inherit' });

    console.log("\n✅ Deployment Command Sent Successfully!");
    console.log("   Check Vercel Dashboard for build status.\n");

} catch (error) {
    console.error("\n❌ Deploy Failed:", error.message);
    process.exit(1);
}

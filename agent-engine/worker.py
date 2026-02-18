
import asyncio
import os
import random
import logging
import json
import google.generativeai as genai
from memory import custodian
from datetime import datetime, timezone

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("worker")

from config import GOOGLE_API_KEY

# AI Setup
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Agent Definitions (Mirroring Route.ts but more detailed)
SYSTEM_PROMPTS = {
    'THE BOSS': "You are **The Boss**. Strategic, commanding. Focus: Fleet coordination, high-level goals. Monitor the inbox and assign tasks.",
    'THE ENGINEER': "You are **The Engineer**. Technical, precise. Focus: Code quality, Vercel deployments, architecture. Check for technical debt.",
    'THE ANALYST': "You are **The Analyst**. Market-aware. Focus: App Store trends, competitors (Mood Trackers), user metrics.",
    'THE CUSTODIAN': "You are **The Custodian**. Protective. Focus: Privacy, backups, database integrity.",
    'THE DEPLOYER': "You are **The Deployer**. Operational. Focus: Git status, CI/CD pipeline health."
}

async def agent_loop():
    """Main worker loop for autonomous agents."""
    logger.info("🤖 Agent Worker Started")
    
    if not GOOGLE_API_KEY:
        logger.error("❌ GOOGLE_API_KEY missing. Worker cannot think.")
        return

    while True:
        try:
            # 1. Check Fleet Status
            if not custodian:
                logger.warning("Supabase not connected. Retrying in 30s...")
                await asyncio.sleep(30)
                continue

            fleet = custodian.get_fleet_status()
            active_agents = [a for a in fleet if a['status'] == 'RUNNING']

            if not active_agents:
                logger.info("💤 No active agents. Pulse check in 60s...")
                await asyncio.sleep(60)
                continue

            # 2. Pick an Agent (Rate Limit Protection: 1 action per 15s)
            agent = random.choice(active_agents)
            logger.info(f"🎲 Selected Agent: {agent['name']}")

            # HEARTBEAT UPDATE (Vital for Dashboard)
            try:
                custodian.db.table("agents").update({
                    "last_heartbeat": datetime.now(timezone.utc).isoformat()
                }).eq("name", agent["name"]).execute()
            except Exception as hb_err:
                logger.error(f"⚠️ Heartbeat Update Failed: {hb_err}")

            # 3. Context & Prompting
            inbox = custodian.get_inbox(status="NEW", limit=5)
            context = custodian.build_context_summary()
            
            prompt = f"""
            Role: {SYSTEM_PROMPTS.get(agent['name'].upper(), "You are a helpful agent.")}
            Current Task: {agent.get('current_task', 'Monitoring system')}
            
            Context:
            {context}
            
            Inbox (New items needing attention):
            {json.dumps(inbox, default=str)}

            Goal:
            Decide on your next immediate action. 
            - If there is a new inbox item relevan to you, address it.
            - If not, make progress on your current task.
            - If idle, define a new task for yourself based on your role.

            Output strictly JSON:
            {{
                "action": "LOG" (general update) | "UPDATE_TASK" (change your task) | "REPLY" (respond to inbox item),
                "content": "The content of the log, new task, or reply",
                "thought": "Why you chose this action",
                "target_id": "ID of inbox item if REPLYing"
            }}
            """




            model = genai.GenerativeModel("gemini-2.0-flash")
            response = await model.generate_content_async(prompt) # Async call if supported, else sync
            # Note: generate_content_async is standard in python sdk
            
            text = response.text
            # Clean json
            text = text.replace("```json", "").replace("```", "").strip()
            
            try:
                decision = json.loads(text)
                
                # Execute Action
                if decision["action"] == "LOG":
                    custodian.save(decision["content"], category=f"{agent['name']} LOG")
                    
                elif decision["action"] == "UPDATE_TASK":
                    custodian.db.table("agents").update({"current_task": decision["content"]}).eq("name", agent["name"]).execute()
                    custodian.save(f"Changed task to: {decision['content']}", category=f"{agent['name']} TASK")
                    
                elif decision["action"] == "REPLY":
                    # Mark inbox item read
                    if decision.get("target_id"):
                        custodian.db.table("inbox_items").update({"status": "READ"}).eq("id", decision.get("target_id")).execute()
                    # Save reply
                    custodian.db.table("inbox_items").insert({
                        "type": "MESSAGE",
                        "source": agent["name"],
                        "title": f"Reply from {agent['name']}",
                        "body": decision["content"],
                        "status": "READ",
                        "priority": "P2"
                    }).execute()

                logger.info(f"✅ {agent['name']} Action: {decision['action']} - {decision['thought']}")

            except json.JSONDecodeError:
                logger.error(f"❌ JSON Parse Error for {agent['name']}: {text}")

        except Exception as e:
            logger.error(f"❌ Worker Loop Error: {e}")

        # Sleep between turns
        from config import MIN_POLL_INTERVAL, MAX_POLL_INTERVAL
        sleep_time = random.randint(MIN_POLL_INTERVAL, MAX_POLL_INTERVAL)
        logger.info(f"⏳ Sleeping {sleep_time}s...")
        await asyncio.sleep(sleep_time)

if __name__ == "__main__":
    # Test Run
    asyncio.run(agent_loop())

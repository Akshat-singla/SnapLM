from sqlalchemy import select
from datetime import datetime
from backend.models.db_models import Node
from backend.crud.summaries import get_latest_summary
from backend.crud.messages import get_messages
from backend.utils.helpers import estimate_token_count
import json

# ============================================================
# CHAT CONTEXT
# ============================================================

async def build_chat_context(session, node_id):
    """
    Builds system prompt + conversation messages for chat.
    Injects structured knowledge from node.inherited_context.
    """

    result = await session.execute(
        select(Node).where(Node.node_id == node_id)
    )
    node = result.scalar_one_or_none()

    if not node:
        return None

    inherited = node.inherited_context or {}
    knowledge = inherited.get("knowledge", {})

    system_prompt = f"""
You are continuing a software architecture discussion.

Inherited knowledge state:

{json.dumps(knowledge, indent=2)}

You must respect this existing design unless explicitly modified.
"""

    messages = await get_messages(session, node_id)

    return {
        "system_prompt": system_prompt,
        "messages": messages
    }


# ============================================================
# KNOWLEDGE UPDATE (AUTO AFTER CHAT)
# ============================================================

async def build_knowledge_update_context(session, node_id):
    """
    Builds prompt to update structured knowledge
    from latest conversation messages.
    """

    messages = await get_messages(session, node_id)

    # Limit context window to avoid timeouts
    messages = messages[-20:]

    conversation = "\n".join(
        f"{m.role.upper()}: {m.content}"
        for m in messages
    )

    return {
        "system_prompt": f"""
You are maintaining a structured knowledge state for a software architecture discussion.

Update the structured state based on the conversation below.

Return STRICT JSON in this format:

{{
  "architecture": {{}},
  "decisions": [],
  "constraints": [],
  "open_questions": []
}}

Conversation:
{conversation}
"""
    }


# ============================================================
# MERGE CONTEXT
# ============================================================

async def build_merge_context(session, source_node_id, target_node_id):
    """
    Builds prompt for merging two structured summaries.
    """

    source_summary = await get_latest_summary(session, source_node_id)
    target_summary = await get_latest_summary(session, target_node_id)

    return {
        "system_prompt": f"""
Merge the following summaries.

TARGET:
{target_summary.summary if target_summary else {}}

SOURCE:
{source_summary.summary if source_summary else {}}

Return STRICT JSON:

{{
  "updated_target_summary": {{}},
  "conflicts": []
}}
"""
    }

# ============================================================
# SUMMARIZE CONTEXT
# ============================================================
async def build_summarize_context(session, node_id):
    """
    Builds a safe, bounded summarization prompt
    from recent conversation messages.
    """

    messages = await get_messages(session, node_id)

    # 🔥 Prevent huge prompts (important)
    MAX_MESSAGES = 20
    messages = messages[-MAX_MESSAGES:]

    conversation = "\n".join(
        f"{m.role.upper()}: {m.content}"
        for m in messages
    )

    return {
        "system_prompt": f"""
        You are summarizing a software architecture discussion.

        Analyze the conversation and extract structured knowledge.

        Return STRICT JSON ONLY.
        Do NOT include explanations.
        Do NOT include markdown.
        Do NOT include backticks.

        Format:

        {{
        "architecture": {{}},
        "decisions": [],
        "constraints": [],
        "open_questions": []
        }}

        Conversation:
        {conversation}
        """
            }

# ============================================================
# SNAPSHOT PARENT CONTEXT
# ============================================================

async def snapshot_parent_context(session, parent_node_id):
    """
    Creates a frozen snapshot of parent's structured knowledge.
    Used during branching.
    """

    parent = await session.get(Node, parent_node_id)
    if not parent:
        return None

    parent_summary = await get_latest_summary(session, parent_node_id)

    summary_data = {}
    if parent_summary and isinstance(parent_summary.summary, dict):
        summary_data = parent_summary.summary

    # Safe lineage depth handling
    parent_inherited = parent.inherited_context or {}
    parent_lineage = parent_inherited.get("lineage", {})
    parent_depth = parent_lineage.get("lineage_depth", 0)

    lineage_depth = parent_depth + 1

    snapshot = {
        "version": 1,
        "lineage": {
            "parent_node_id": str(parent.node_id),
            "parent_title": parent.title,
            "lineage_depth": lineage_depth,
            "snapshot_at": datetime.utcnow().isoformat()
        },
        "knowledge": summary_data,
        "entities": [],
        "summary_ref": {
            "summary_id": str(parent_summary.summary_id)
            if parent_summary else None
        },
        "token_estimate": estimate_token_count(str(summary_data))
    }

    return snapshot


# ============================================================
# APPLY KNOWLEDGE UPDATE (CALL THIS AFTER CHAT)
# ============================================================

async def apply_knowledge_update(session, node, updated_summary):
    """
    Applies updated structured knowledge to node.
    Stores it both in summaries table and inherited_context.
    """

    from backend.crud.summaries import create_summary

    summary_obj = await create_summary(
        session,
        node.node_id,
        updated_summary
    )

    inherited = node.inherited_context or {}

    node.inherited_context = {
        "version": 1,
        "lineage": inherited.get("lineage", {}),
        "knowledge": updated_summary,
        "entities": [],
        "summary_ref": {
            "summary_id": str(summary_obj.summary_id)
        },
        "token_estimate": estimate_token_count(str(updated_summary))
    }

    session.add(node)
    await session.commit()

    return summary_obj
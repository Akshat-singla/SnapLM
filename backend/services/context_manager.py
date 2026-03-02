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
from crud.nodes import get_node_lineage, get_node
from crud.messages import get_last_n_messages, get_messages
from crud.summaries import get_latest_summary
from services.graph_service import get_node_graph, get_parent_graph
from utils.constants import (CHAT_SYSTEM_PROMPT, SUMMARIZER_SYSTEM_PROMPT,
                              GRAPH_BUILDER_SYSTEM_PROMPT, MERGE_SYSTEM_PROMPT)
from utils.helpers import format_summary, format_graph, format_messages, extract_key_points
from config import settings
import json

class ContextManager:

    async def snapshot_parent_context(self, session, parent_id: str) -> dict:
        """
        Create a frozen snapshot of parent's essential context.
        This is stored on the child node at creation time to ensure
        important details are never lost across branches.
        
        Returns a dict with:
        - facts: List of key facts from parent and ancestors
        - decisions: List of confirmed decisions
        - key_entities: Important entities from knowledge graph
        - open_questions: Unresolved questions
        - lineage_depth: How many ancestors contributed
        """
        if not parent_id:
            return None
            
        parent = await get_node(session, parent_id)
        if not parent:
            return None
            
        lineage = await get_node_lineage(session, parent_id)
        
        all_facts = []
        all_decisions = []
        all_questions = []
        key_entities = set()
        
        for i, ancestor in enumerate(lineage):
            summary = await get_latest_summary(session, ancestor.node_id)
            if summary and isinstance(summary.summary, dict):
                s = summary.summary

                if "FACTS" in s and isinstance(s["FACTS"], list):
                    for fact in s["FACTS"]:
                        if isinstance(fact, dict):
                            fact_copy = fact.copy()
                            fact_copy["lineage_depth"] = i
                            fact_copy["source_node_id"] = str(ancestor.node_id)
                            all_facts.append(fact_copy)
                        else:
                            all_facts.append({
                                "fact": str(fact),
                                "lineage_depth": i,
                                "source_node_id": str(ancestor.node_id)
                            })
                
                if "DECISIONS" in s and isinstance(s["DECISIONS"], list):
                    for dec in s["DECISIONS"]:
                        if isinstance(dec, dict):
                            dec_copy = dec.copy()
                            dec_copy["lineage_depth"] = i
                            dec_copy["source_node_id"] = str(ancestor.node_id)
                            all_decisions.append(dec_copy)
                        else:
                            all_decisions.append({
                                "decision": str(dec),
                                "lineage_depth": i,
                                "source_node_id": str(ancestor.node_id)
                            })
                
                if "OPEN QUESTIONS" in s and isinstance(s["OPEN QUESTIONS"], list):
                    all_questions.extend(s["OPEN QUESTIONS"])
            
            # Get key entities from knowledge graph
            graph_edges = await get_node_graph(session, ancestor.node_id)
            if graph_edges:
                for edge in graph_edges:
                    key_entities.add(edge.get("from_entity", ""))
                    key_entities.add(edge.get("to_entity", ""))
        
        #  If no summaries exist, extract context from raw messages
        # This ensures context transfer works even without explicit summarization
        conversation_context = []
        if not all_facts and not all_decisions:
            for i, ancestor in enumerate(lineage):
                messages = await get_messages(session, ancestor.node_id)
                if messages:
                    # Extract meaningful content from messages (limit to avoid token explosion)
                    for msg in messages[-10:]:  
                        if msg.role in ("user", "assistant") and msg.content:
                            content = msg.content[:500] + "..." if len(msg.content) > 500 else msg.content
                            conversation_context.append({
                                "role": msg.role,
                                "content": content,
                                "source_node_id": str(ancestor.node_id),
                                "source_node_title": ancestor.title,
                                "lineage_depth": i
                            })
        
        snapshot = {
            "facts": all_facts,
            "decisions": all_decisions,
            "open_questions": list(set(all_questions)),  
            "key_entities": list(key_entities - {""}),  
            "conversation_history": conversation_context,  
            "lineage_depth": len(lineage),
            "parent_title": parent.title,
            "parent_node_id": str(parent_id)
        }
        
        return snapshot

    async def build_chat_context(self, session, node_id: str) -> dict:
        """Returns {"system_prompt": str, "user_content": str} for chat agent."""
        node = await get_node(session, node_id)
        lineage = await get_node_lineage(session, node_id)

        # PRIORITY 1: Use stored inherited_context if available (frozen snapshot)
        inherited_summary = ""
        if node and node.inherited_context:
            ctx = node.inherited_context
            
            if ctx.get("facts"):
                inherited_summary += "=== INHERITED FACTS ===\n"
                for fact in ctx["facts"]:
                    f = fact.get("fact", str(fact)) if isinstance(fact, dict) else str(fact)
                    inherited_summary += f"- {f}\n"
            
            if ctx.get("decisions"):
                inherited_summary += "\n=== CONFIRMED DECISIONS ===\n"
                for dec in ctx["decisions"]:
                    d = dec.get("decision", str(dec)) if isinstance(dec, dict) else str(dec)
                    inherited_summary += f"- [DECISION] {d}\n"
            
            if ctx.get("key_entities"):
                inherited_summary += f"\n=== KEY ENTITIES ===\n{', '.join(ctx['key_entities'][:20])}\n"
            
            if ctx.get("open_questions"):
                inherited_summary += "\n=== OPEN QUESTIONS ===\n"
                for q in ctx["open_questions"][:5]:
                    inherited_summary += f"- {q}\n"
            
            # If no structured data, use conversation history
            if ctx.get("conversation_history") and not ctx.get("facts") and not ctx.get("decisions"):
                inherited_summary += "\n=== PREVIOUS CONVERSATION (from parent branch) ===\n"
                parent_title = ctx.get("parent_title", "Parent")
                inherited_summary += f"Context from: {parent_title}\n\n"
                for msg in ctx["conversation_history"]:
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    inherited_summary += f"[{role}]: {content}\n\n"
        else:
            has_any_context = False
            for ancestor in reversed(lineage[1:]):  
                summary = await get_latest_summary(session, ancestor.node_id)
                if summary:
                    inherited_summary += extract_key_points(summary.summary) + "\n"
                    has_any_context = True
            
            if not has_any_context and len(lineage) > 1:
                parent = lineage[1]
                parent_messages = await get_messages(session, parent.node_id)
                if parent_messages:
                    inherited_summary += f"\n=== PREVIOUS CONVERSATION (from {parent.title}) ===\n"
                    for msg in parent_messages[-10:]:  
                        if msg.role in ("user", "assistant"):
                            content = msg.content[:500] + "..." if len(msg.content) > 500 else msg.content
                            inherited_summary += f"[{msg.role}]: {content}\n\n"

        node_summary = await get_latest_summary(session, node_id)
        node_graph = await get_node_graph(session, node_id)
        recent = await get_last_n_messages(session, node_id, n=settings.CHAT_RECENT_MESSAGES)

        system_prompt = CHAT_SYSTEM_PROMPT.format(
            inherited_summary=inherited_summary or "(This is the root of the conversation tree - no parent context exists yet)",
            node_summary=format_summary(node_summary.summary) if node_summary else "No summary yet.",
            node_graph=format_graph(node_graph) if node_graph else "No graph yet.",
            last_n_messages=format_messages(recent),
            node_title=node.title if node else "Unknown",
            node_type=node.node_type if node else "standard"
        )
        return {"system_prompt": system_prompt, "user_content": ""}

    async def build_summarize_context(self, session, node_id: str) -> dict:
        """Returns context for summarizer agent."""
        lineage = await get_node_lineage(session, node_id)
        parent_summary = ""
        if len(lineage) > 1:
            ps = await get_latest_summary(session, lineage[1].node_id)
            if ps:
                parent_summary = format_summary(ps.summary)

        all_messages = await get_messages(session, node_id)
        existing_graph = await get_node_graph(session, node_id)

        system_prompt = SUMMARIZER_SYSTEM_PROMPT.format(
            parent_summary=parent_summary or "No parent context.",
            all_messages=format_messages(all_messages),
            existing_graph=format_graph(existing_graph) if existing_graph else "No existing graph."
        )
        return {"system_prompt": system_prompt, "user_content": ""}

    async def build_graph_context(self, session, node_id: str, new_summary: dict) -> dict:
        """Returns context for graph-builder agent."""
        current_graph = await get_node_graph(session, node_id)
        parent_graph = await get_parent_graph(session, node_id)

        system_prompt = GRAPH_BUILDER_SYSTEM_PROMPT.format(
            node_summary=format_summary(new_summary),
            current_graph=format_graph(current_graph) if current_graph else "No existing graph.",
            parent_graph=format_graph(parent_graph) if parent_graph else "No parent graph."
        )
        return {"system_prompt": system_prompt, "user_content": ""}

    async def build_merge_context(self, session, source_id: str, target_id: str) -> dict:
        """Returns context for merge arbiter agent."""
        target_summary = await get_latest_summary(session, target_id)
        target_graph = await get_node_graph(session, target_id)
        source_summary = await get_latest_summary(session, source_id)
        source_graph = await get_node_graph(session, source_id)
        source_recent = await get_last_n_messages(session, source_id, n=settings.CHAT_RECENT_MESSAGES)

        system_prompt = MERGE_SYSTEM_PROMPT.format(
            target_summary=format_summary(target_summary.summary) if target_summary else "No target summary.",
            target_graph=format_graph(target_graph) if target_graph else "No target graph.",
            source_summary=format_summary(source_summary.summary) if source_summary else "No source summary.",
            source_graph=format_graph(source_graph) if source_graph else "No source graph.",
            source_recent_chats=format_messages(source_recent) if source_recent else "No recent chats."
        )
        return {"system_prompt": system_prompt, "user_content": ""}

context_manager = ContextManager()

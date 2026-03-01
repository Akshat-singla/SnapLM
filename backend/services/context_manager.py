from backend.database import AsyncSessionLocal as SessionLocal
from backend.models.db_models import Node, NodeEvent
from sqlalchemy import select, func

async def build_chat_context(session, node_id: str):
    """Fetches the inherited context for a given node by traversing up the parent lineage."""
    try:
        # Example: Fetch a node and its inherited context
        node_id = node_id  # This would come from your function parameters
        result = await session.execute(
            select(Node).where(Node.node_id == node_id)
        )
        node = result.scalar_one_or_none()

        if not node:
            return None  # Or raise an exception

        # Traverse up the parent lineage to gather inherited context
        inherited_context = {"system_prompt": [], "user_messages": [], "assistant_messages": []}
        current_node = node
        while current_node.parent_id:
            parent_result = session.execute(
                select(Node).where(Node.node_id == current_node.parent_id)
            )
            parent_node = parent_result.scalar_one_or_none()
            if parent_node:
                inherited_context["system_prompt"].extend(parent_node.inherited_context.get("system_prompt", []))
                inherited_context["user_messages"].extend(parent_node.inherited_context.get("user_messages", []))
                inherited_context["assistant_messages"].extend(parent_node.inherited_context.get("assistant_messages", []))
                current_node = parent_node
            else:
                break

        return inherited_context
    finally: 
        await session.close()

async def build_summarize_context(session, node_id: str):
    """Builds context for summarization by fetching relevant messages and summaries."""


async def build_graph_context(session, node_id: str):
    """Builds context for knowledge graph extraction by fetching relevant messages, summaries, and existing graph"""

async def build_merge_context(session, target_node_id: str, source_node_id: str):
    """Builds context for merging two nodes by fetching their messages, summaries, and graph context."""

async def snapshot_parent_context(session, node_id: str):
    """Creates a frozen snapshot of the parent context at the time of branch creation."""

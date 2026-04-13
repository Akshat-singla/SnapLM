import uuid
import json
import re
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from database import get_db
from models.db_models import Node, Message, KnowledgeGraph
from models.api_models import (
    CreateNodeRequest,
    SendMessageRequest,
    MergeRequest,
    DeleteRequest,
    CopyRequest,
    NodeResponse,
    MessageResponse,
    SummarizeResponse,
    MergeResponse,
    DeleteResponse,
    TreeNodeResponse,
    GraphEdge,
    GraphResponse,
)
from crud.nodes import (
    create_node,
    get_node,
    get_node_by_id_or_404,
    get_all_descendants,
    get_tree,
    update_node_status,
)
from crud.messages import create_message, get_messages
from crud.summaries import create_summary, get_latest_summary
from services.context_manager import context_manager
from services.llm_service import llm_service
from services.graph_service import (
    store_graph_edges,
    get_node_graph,
    merge_graphs,
    soft_delete_edges,
)
from services.event_processor import record_event
from utils.helpers import estimate_token_count

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nodes", tags=["Nodes"])


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _parse_llm_json(raw: str) -> dict:
    """Strip optional markdown fences and parse JSON from LLM output."""
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text.strip())
    return json.loads(text)


def _node_response(node: Node) -> NodeResponse:
    return NodeResponse(
        node_id=node.node_id,
        project_id=node.project_id,
        parent_id=node.parent_id,
        title=node.title,
        node_type=node.node_type,
        status=node.status,
        position={"x": node.position_x, "y": node.position_y},
        created_at=node.created_at,
        created_by=node.created_by,
        metadata=node.metadata_ or {},
    )


def _msg_response(msg: Message, **extra) -> MessageResponse:
    return MessageResponse(
        message_id=msg.message_id,
        node_id=msg.node_id,
        role=msg.role,
        content=msg.content,
        timestamp=msg.timestamp,
        token_count=msg.token_count,
        metadata=msg.metadata_ or {},
        **extra,
    )


def _build_tree(flat: list, parent_id=None) -> list[TreeNodeResponse]:
    result = []
    for n in flat:
        if n.parent_id == parent_id:
            result.append(
                TreeNodeResponse(
                    node_id=n.node_id,
                    title=n.title,
                    status=n.status,
                    node_type=n.node_type,
                    message_count=getattr(n, "_msg_count", 0),
                    has_summary=getattr(n, "_has_summary", False),
                    merge_parent_id=n.merge_parent_id,
                    position={"x": n.position_x, "y": n.position_y},
                    children=_build_tree(flat, n.node_id),
                )
            )
    return result


async def _calculate_position(
    db: AsyncSession, parent_id: uuid.UUID | None
) -> tuple[float, float]:
    """Place child below its parent, offset horizontally by sibling count."""
    if not parent_id:
        # Root: space out horizontally by existing root count
        r = await db.execute(
            select(func.count()).select_from(Node).where(Node.parent_id.is_(None))
        )
        root_count = r.scalar_one()
        return float(root_count * 300), 0.0

    parent = await get_node(db, parent_id)
    if not parent:
        return 0.0, 0.0

    r = await db.execute(
        select(func.count()).select_from(Node).where(Node.parent_id == parent_id)
    )
    sibling_count = r.scalar_one()
    return parent.position_x + (sibling_count * 250.0), parent.position_y + 200.0


# ─────────────────────────────────────────────────────────────────────────────
# GET /nodes/tree  — must be registered BEFORE /{node_id} routes
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/tree", response_model=list[TreeNodeResponse])
async def get_nodes_tree(db: AsyncSession = Depends(get_db)):
    nodes_list = await get_tree(db)

    for node in nodes_list:
        msg_r = await db.execute(
            select(func.count())
            .select_from(Message)
            .where(Message.node_id == node.node_id)
        )
        node._msg_count = msg_r.scalar_one()
        summary = await get_latest_summary(db, node.node_id)
        node._has_summary = summary is not None

    return _build_tree(nodes_list)


# ─────────────────────────────────────────────────────────────────────────────
# POST /nodes
# ─────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=NodeResponse, status_code=201)
async def create_node_route(
    data: CreateNodeRequest, db: AsyncSession = Depends(get_db)
):
    pos_x, pos_y = await _calculate_position(db, data.parent_id)

    # Snapshot parent context at branch time
    inherited_ctx = None
    if data.parent_id:
        try:
            inherited_ctx = await context_manager.snapshot_parent_context(
                db, data.parent_id
            )
        except Exception as e:
            logger.warning(f"Could not snapshot parent context: {e}")

    node_data = {
        "project_id": data.project_id,
        "parent_id": data.parent_id,
        "title": data.title,
        "node_type": data.node_type,
        "status": "active",
        "position_x": pos_x,
        "position_y": pos_y,
        "inherited_context": inherited_ctx,
        "metadata_": {},
    }

    node = await create_node(db, node_data)
    await db.flush()

    await record_event(
        db,
        node.node_id,
        "node_created",
        {"title": data.title, "node_type": data.node_type, "parent_id": str(data.parent_id) if data.parent_id else None},
    )

    # If an initial message was provided, generate an LLM reply immediately
    if data.initial_message and data.initial_message.strip():
        user_msg = await create_message(
            db,
            node.node_id,
            role="user",
            content=data.initial_message,
            token_count=estimate_token_count(data.initial_message),
        )
        try:
            ctx = await context_manager.build_chat_context(db, node.node_id)
            reply = await llm_service.chat(
                system_prompt=ctx["system_prompt"],
                user_content=data.initial_message,
            )
            await create_message(
                db,
                node.node_id,
                role="assistant",
                content=reply,
                token_count=estimate_token_count(reply),
                metadata={"agent": "main-reasoner"},
            )
            await record_event(
                db, node.node_id, "initial_message_replied", {"token_count": estimate_token_count(reply)}
            )
        except Exception as e:
            logger.error(f"Initial message LLM call failed: {e}")

    await db.commit()
    await db.refresh(node)
    return _node_response(node)


# ─────────────────────────────────────────────────────────────────────────────
# POST /nodes/merge  — static path, must be BEFORE /{node_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/merge", response_model=MergeResponse)
async def merge_nodes(data: MergeRequest, db: AsyncSession = Depends(get_db)):
    source = await get_node_by_id_or_404(db, data.source_node_id)
    target = await get_node_by_id_or_404(db, data.target_node_id)

    # Build merge context and call LLM
    ctx = await context_manager.build_merge_context(
        db, str(data.source_node_id), str(data.target_node_id)
    )
    raw = await llm_service.merge(
        system_prompt=ctx["system_prompt"],
        user_content="Merge the two branches now.",
    )

    # Parse merged summary JSON
    conflicts: list[str] = []
    merged_summary: dict = {}
    try:
        parsed = _parse_llm_json(raw)
        merged_summary = parsed.get("MERGED_SUMMARY") or parsed
        conflicts = parsed.get("CONFLICTS") or []
        if isinstance(conflicts, str):
            conflicts = [conflicts]
    except Exception as e:
        logger.error(f"Merge JSON parse failed: {e}. Raw: {raw[:300]}")
        merged_summary = {"raw": raw}

    # Save merged summary on target
    saved_summary = await create_summary(db, target.node_id, merged_summary)

    # Merge knowledge graphs
    kg_updates: dict = {}
    try:
        await merge_graphs(db, data.source_node_id, data.target_node_id)
        target_graph = await get_node_graph(db, target.node_id)
        kg_updates = {"edges_after_merge": len(target_graph)}
    except Exception as e:
        logger.error(f"Graph merge failed: {e}")
        kg_updates = {"error": str(e)}

    # Mark source as frozen, set merge_parent_id on target
    await update_node_status(db, data.source_node_id, "frozen")
    await db.execute(
        update(Node)
        .where(Node.node_id == data.target_node_id)
        .values(merge_parent_id=data.source_node_id)
    )
    await db.commit()

    await record_event(
        db,
        target.node_id,
        "merge_completed",
        {
            "source_node_id": str(data.source_node_id),
            "conflicts": conflicts,
        },
    )

    return MergeResponse(
        target_node_id=target.node_id,
        source_node_id=source.node_id,
        updated_summary=merged_summary,
        conflicts=conflicts,
        knowledge_graph_updates=kg_updates,
        source_node_status="frozen",
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /nodes/{node_id}/messages
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{node_id}/messages", response_model=list[MessageResponse])
async def get_node_messages(node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await get_node_by_id_or_404(db, node_id)
    messages = await get_messages(db, node_id)
    return [_msg_response(m) for m in messages]


# ─────────────────────────────────────────────────────────────────────────────
# POST /nodes/{node_id}/messages
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{node_id}/messages", response_model=MessageResponse)
async def send_message(
    node_id: uuid.UUID,
    data: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    node = await get_node_by_id_or_404(db, node_id)

    if node.status == "frozen":
        raise HTTPException(status_code=400, detail="Cannot send messages to a frozen node.")

    # Save user message
    user_msg = await create_message(
        db,
        node_id,
        role="user",
        content=data.content,
        token_count=estimate_token_count(data.content),
    )

    # Build context and call main-reasoner
    ctx = await context_manager.build_chat_context(db, node_id)
    agent_used = "main-reasoner"
    fallback_from = None

    if node.node_type == "exploration":
        reply, fallback_from = await llm_service.exploration_chat(
            system_prompt=ctx["system_prompt"],
            user_content=data.content,
        )
        if fallback_from:
            agent_used = "main-reasoner"
    else:
        reply = await llm_service.chat(
            system_prompt=ctx["system_prompt"],
            user_content=data.content,
        )

    # Save assistant reply
    assistant_msg = await create_message(
        db,
        node_id,
        role="assistant",
        content=reply,
        token_count=estimate_token_count(reply),
        metadata={"agent": agent_used, "fallback_from": fallback_from},
    )

    await record_event(
        db,
        node_id,
        "message_sent",
        {"user_tokens": user_msg.token_count, "reply_tokens": assistant_msg.token_count},
    )

    await db.commit()
    await db.refresh(assistant_msg)
    return _msg_response(assistant_msg, agent_used=agent_used, fallback_from=fallback_from)


# ─────────────────────────────────────────────────────────────────────────────
# POST /nodes/{node_id}/summarize
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{node_id}/summarize", response_model=SummarizeResponse)
async def summarize_node(node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await get_node_by_id_or_404(db, node_id)

    # Build summarize context and call LLM
    ctx = await context_manager.build_summarize_context(db, node_id)
    raw_summary = await llm_service.summarize(
        system_prompt=ctx["system_prompt"],
        user_content="Summarize this conversation now.",
    )

    summary_dict: dict = {}
    try:
        summary_dict = _parse_llm_json(raw_summary)
    except Exception as e:
        logger.error(f"Summary JSON parse failed: {e}. Raw: {raw_summary[:300]}")
        summary_dict = {"raw": raw_summary}

    saved = await create_summary(db, node_id, summary_dict)
    await db.flush()

    await record_event(db, node_id, "node_summarized", {"summary_id": str(saved.summary_id)})

    # Extract knowledge graph
    graph_status = "success"
    graph_error = None
    graph_counts: dict | None = None

    try:
        graph_ctx = await context_manager.build_graph_context(db, node_id, summary_dict)
        raw_graph = await llm_service.extract_graph(
            system_prompt=graph_ctx["system_prompt"],
            user_content="Extract the knowledge graph now.",
        )
        parsed_graph = _parse_llm_json(raw_graph)
        entities = parsed_graph.get("entities", [])
        relations = parsed_graph.get("relations", [])
        count = await store_graph_edges(db, node_id, entities, relations)
        graph_counts = {"entities": len(entities), "new_edges": count}
        await record_event(
            db, node_id, "graph_extracted", {"new_edges": count}
        )
    except Exception as e:
        logger.error(f"Graph extraction failed: {e}")
        graph_status = "failed"
        graph_error = str(e)

    await db.commit()
    await db.refresh(saved)
    return SummarizeResponse(
        summary_id=saved.summary_id,
        node_id=node_id,
        summary=summary_dict,
        graph_extraction_status=graph_status,
        knowledge_graph=graph_counts,
        graph_extraction_error=graph_error,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /nodes/{node_id}/delete
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{node_id}/delete", response_model=DeleteResponse)
async def delete_node(
    node_id: uuid.UUID,
    data: DeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    node = await get_node_by_id_or_404(db, node_id)

    descendants = await get_all_descendants(db, node_id)
    affected_ids = [d.node_id for d in descendants]

    if data.cascade:
        # Soft-delete all descendants and their graph edges
        for d in descendants:
            try:
                await soft_delete_edges(db, d.node_id)
            except Exception:
                pass
            await update_node_status(db, d.node_id, "deleted")

        await soft_delete_edges(db, node_id)
        await update_node_status(db, node_id, "deleted")
    else:
        # Re-parent direct children to this node's parent
        await db.execute(
            update(Node)
            .where(Node.parent_id == node_id)
            .values(parent_id=node.parent_id)
        )
        await db.commit()

        await soft_delete_edges(db, node_id)
        await update_node_status(db, node_id, "deleted")

    await db.commit()
    edges_removed = len(affected_ids) + 1  # approximate

    return DeleteResponse(
        node_id=node_id,
        status="deleted",
        affected_descendants=affected_ids,
        recomputed=not data.cascade,
        graph_edges_removed=edges_removed,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /nodes/{node_id}/copy
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/{node_id}/copy", response_model=NodeResponse)
async def copy_node(
    node_id: uuid.UUID,
    data: CopyRequest,
    db: AsyncSession = Depends(get_db),
):
    original = await get_node_by_id_or_404(db, node_id)
    new_parent_id = data.new_parent_id or original.parent_id

    pos_x, pos_y = await _calculate_position(db, new_parent_id)

    inherited_ctx = None
    if new_parent_id:
        try:
            inherited_ctx = await context_manager.snapshot_parent_context(db, new_parent_id)
        except Exception as e:
            logger.warning(f"Context snapshot failed on copy: {e}")

    node_data = {
        "project_id": original.project_id,
        "parent_id": new_parent_id,
        "title": f"{original.title} (copy)",
        "node_type": original.node_type,
        "status": "active",
        "position_x": pos_x,
        "position_y": pos_y,
        "inherited_context": inherited_ctx,
        "metadata_": original.metadata_ or {},
    }

    new_node = await create_node(db, node_data)

    await record_event(
        db,
        new_node.node_id,
        "node_copied",
        {"copied_from": str(node_id)},
    )

    await db.commit()
    await db.refresh(new_node)
    return _node_response(new_node)


# ─────────────────────────────────────────────────────────────────────────────
# GET /nodes/{node_id}/graph
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/{node_id}/graph", response_model=GraphResponse)
async def get_graph(node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await get_node_by_id_or_404(db, node_id)
    edges = await get_node_graph(db, node_id)

    entities: set[str] = set()
    relations: list[GraphEdge] = []
    for e in edges:
        entities.add(e["from_entity"])
        entities.add(e["to_entity"])
        relations.append(
            GraphEdge(
                from_entity=e["from_entity"],
                to_entity=e["to_entity"],
                relation_type=e["relation_type"],
                confidence=e["confidence"],
                source_node=node_id,
            )
        )

    return GraphResponse(
        node_id=node_id,
        entities=sorted(entities),
        relations=relations,
    )

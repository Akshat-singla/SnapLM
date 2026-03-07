import uuid

from models.db_models import NodeEvent
from sqlalchemy.ext.asyncio import AsyncSession


async def insert_event(
    session: AsyncSession,
    node_id: uuid.UUID,
    event_type: str,
    payload: dict,
    user_id: str = None,
) -> NodeEvent:
    event = NodeEvent(
        node_id=node_id, event_type=event_type, payload=payload, user_id=user_id
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event

import uuid

from database import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=True) # Temporarily nullable to avoid issues with existing users if any
    is_2fa_enabled = Column(Boolean, default=False, server_default="false", nullable=False)
    totp_secret = Column(String(32), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"

    project_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_archived = Column(Boolean, nullable=False, default=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    metadata_ = Column("metadata", JSON, default={})

    owner = relationship("User", back_populates="projects")
    nodes = relationship("Node", back_populates="project", cascade="all, delete-orphan")


class Node(Base):
    __tablename__ = "nodes"

    node_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.project_id", ondelete="CASCADE"),
        nullable=True,
    )
    parent_id = Column(UUID(as_uuid=True), ForeignKey("nodes.node_id"), nullable=True)
    merge_parent_id = Column(
        UUID(as_uuid=True), ForeignKey("nodes.node_id"), nullable=True
    )  # Secondary parent from merge
    title = Column(String, nullable=False)
    node_type = Column(
        String, default="standard", nullable=False
    )  # Check constraint handled by validator or DB enum if strict
    status = Column(String, default="active", nullable=False)
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, nullable=True)
    metadata_ = Column("metadata", JSON, default={})
    # Frozen snapshot of parent context at branch creation - ensures important details aren't lost
    inherited_context = Column(JSON, default=None, nullable=True)

    project = relationship("Project", back_populates="nodes")
    parent = relationship(
        "Node", remote_side=[node_id], foreign_keys=[parent_id], backref="children"
    )
    messages = relationship(
        "Message", back_populates="node", cascade="all, delete-orphan"
    )
    summaries = relationship("NodeSummary", back_populates="node")
    events = relationship("NodeEvent", back_populates="node")


class NodeEvent(Base):
    __tablename__ = "node_events"

    event_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.node_id"), nullable=False)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(String, nullable=True)

    node = relationship("Node", back_populates="events")


class Message(Base):
    __tablename__ = "messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_id = Column(
        UUID(as_uuid=True),
        ForeignKey("nodes.node_id", ondelete="CASCADE"),
        nullable=False,
    )
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    token_count = Column(Integer, nullable=True)
    metadata_ = Column("metadata", JSON, default={})

    node = relationship("Node", back_populates="messages")


class NodeSummary(Base):
    __tablename__ = "node_summaries"

    summary_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    node_id = Column(UUID(as_uuid=True), ForeignKey("nodes.node_id"), nullable=False)
    summary = Column(JSON, nullable=False)
    generated_from_event = Column(
        UUID(as_uuid=True), ForeignKey("node_events.event_id"), nullable=True
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_latest = Column(Boolean, default=True)

    node = relationship("Node", back_populates="summaries")
    event = relationship("NodeEvent")


class WorkspaceShare(Base):
    __tablename__ = "workspace_shares"

    share_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.project_id", ondelete="CASCADE"),
        nullable=False,
    )
    share_token = Column(String(128), nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, nullable=False)

    project = relationship("Project")


class SharedProject(Base):
    """Snapshot of a single branch (root node + descendants) shared with another user."""

    __tablename__ = "shared_projects"

    share_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.project_id", ondelete="CASCADE"),
        nullable=False,
    )
    root_node_id = Column(
        UUID(as_uuid=True),
        ForeignKey("nodes.node_id", ondelete="CASCADE"),
        nullable=False,
    )
    graph_data = Column(JSON, nullable=False)
    shared_with_user = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project")


class KnowledgeGraph(Base):
    __tablename__ = "knowledge_graph"

    edge_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_entity = Column(String, nullable=False)
    to_entity = Column(String, nullable=False)
    relation_type = Column(String, nullable=False)
    source_node = Column(
        UUID(as_uuid=True), ForeignKey("nodes.node_id"), nullable=False
    )
    confidence = Column(Float, default=1.0)
    metadata_ = Column("metadata", JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    node = relationship("Node")

    __table_args__ = (
        UniqueConstraint(
            "from_entity",
            "to_entity",
            "relation_type",
            "source_node",
            name="uix_graph_edge",
        ),
    )

"""Unit tests for branch share subgraph extraction (merge + backward closure)."""

from __future__ import annotations

import uuid
from types import SimpleNamespace

from services import branch_share_service as bss


def _node(
    nid: uuid.UUID,
    parent_id: uuid.UUID | None = None,
    merge_parent_id: uuid.UUID | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        node_id=nid,
        parent_id=parent_id,
        merge_parent_id=merge_parent_id,
        title="t",
        status="active",
        node_type="chat",
        inherited_context=None,
        position_x=0.0,
        position_y=0.0,
    )


def test_merge_select_d_excludes_e_and_keeps_both_incoming_edges():
    """
    1 → 2 → 3 → 4 → d
    a → b → c → d → e

    Select d → ancestors only; e must not appear; 4→d and c→d both in edges.
    """
    n1, n2, n3, n4 = uuid.uuid4(), uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    na, nb, nc = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    nd, ne = uuid.uuid4(), uuid.uuid4()

    # Primary chain into d via 4; second branch via merge_parent c; e child of d
    nodes = [
        _node(n1),
        _node(n2, parent_id=n1),
        _node(n3, parent_id=n2),
        _node(n4, parent_id=n3),
        _node(nd, parent_id=n4, merge_parent_id=nc),
        _node(na),
        _node(nb, parent_id=na),
        _node(nc, parent_id=nb),
        _node(ne, parent_id=nd),
    ]

    all_edges = bss._edges_from_project_nodes(nodes)
    contributing = bss._contributing_node_ids(nd, all_edges)
    edges, ctx_src, mrg_src = bss._filter_subgraph_edges(all_edges, contributing)

    assert contributing == {n1, n2, n3, n4, na, nb, nc, nd}
    assert ne not in contributing

    edge_pairs = {(e["source"], e["target"], e["type"]) for e in edges}
    assert (str(n4), str(nd), "context") in edge_pairs
    assert (str(nc), str(nd), "merge") in edge_pairs
    assert (str(nd), str(ne), "context") not in edge_pairs

    expected_pairs = {
        (str(n1), str(n2), "context"),
        (str(n2), str(n3), "context"),
        (str(n3), str(n4), "context"),
        (str(n4), str(nd), "context"),
        (str(na), str(nb), "context"),
        (str(nb), str(nc), "context"),
        (str(nc), str(nd), "merge"),
    }
    assert edge_pairs == expected_pairs

    node_by_id = {n.node_id: n for n in nodes}
    exported_d = bss._export_node(
        node_by_id[nd], contributing, ctx_src, mrg_src
    )
    # Exactly one primary parent and one merge parent on the merge node
    assert exported_d["parent_id"] == str(n4)
    assert exported_d["merge_parent_id"] == str(nc)
    assert sum(1 for k in ("parent_id", "merge_parent_id") if exported_d[k]) == 2


def test_merge_node_export_never_lists_two_context_or_two_merge_ids():
    """Exported dict has at most one string parent_id and one merge_parent_id."""
    n4, nc, nd = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    nodes = [
        _node(n4),
        _node(nc),
        _node(nd, parent_id=n4, merge_parent_id=nc),
    ]

    all_edges = bss._edges_from_project_nodes(nodes)
    contributing = bss._contributing_node_ids(nd, all_edges)
    _, ctx_src, mrg_src = bss._filter_subgraph_edges(all_edges, contributing)
    out = bss._export_node(
        next(n for n in nodes if n.node_id == nd), contributing, ctx_src, mrg_src
    )
    assert out["parent_id"] is not None
    assert out["merge_parent_id"] is not None
    assert out["parent_id"] != out["merge_parent_id"]

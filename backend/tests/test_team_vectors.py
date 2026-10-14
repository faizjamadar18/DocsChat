"""Team vectors contract (TDD — written before implementation).

Highest break-risk area: Qdrant filter change.
- query_workspace_documents filters workspace_id ONLY (all members share
  corpus regardless of uploader user_id).
- delete_source_vectors filters source_id only.
- delete_workspace_vectors filters workspace_id only.
Qdrant client + embeddings are faked; filter assertions prove the contract.
"""
from types import SimpleNamespace
from unittest.mock import patch
from bson import ObjectId

OWNER_ID = str(ObjectId())
MEMBER_ID = str(ObjectId())
WS_ID = str(ObjectId())
SRC_ID = str(ObjectId())


class FakePoints:
    def __init__(self):
        self.query_filter = None
        self.deleted_filter = None
        self.upserted = []


class FakeQdrant:
    def __init__(self, box):
        self.box = box

    def query_points(self, collection_name, query, query_filter, limit, with_payload):
        self.box.query_filter = query_filter
        pt = SimpleNamespace(payload={"page_content": "shared text",
                                      "source_id": SRC_ID,
                                      "workspace_id": WS_ID},
                             score=0.9)
        return SimpleNamespace(points=[pt])

    def delete(self, collection_name, points_selector):
        self.box.deleted_filter = points_selector.filter
        return None


def _must_values(flt):
    """Extract {key: value-or-set} from a qdrant Filter(must=[...])."""
    out = {}
    for cond in flt.must:
        match = cond.match
        v = getattr(match, "value", None)
        if v is None:
            v = set(getattr(match, "any", []) or [])
        out[cond.key] = v
    return out


def test_query_shared_corpus_ignores_uploader():
    import app.services.vector_store as vs
    box = FakePoints()
    with patch.object(vs, "_qdrant_client", FakeQdrant(box)), \
         patch.object(vs, "_ensure_collection_exists", lambda: None), \
         patch("app.services.vector_store.generate_single_embedding",
               return_value=[0.0, 0.0, 0.0]):
        # Member queries corpus stored under owner's user_id: must still hit.
        res = vs.query_workspace_documents(
            user_id=MEMBER_ID, workspace_id=WS_ID, query="roadmap", top_k=5)
        assert len(res) == 1
        assert res[0]["document"] == "shared text"
        conds = _must_values(box.query_filter)
        assert conds.get("workspace_id") == WS_ID
        assert "user_id" not in conds
        assert "source_id" not in conds


def test_query_scope_ids_still_filter():
    import app.services.vector_store as vs
    box = FakePoints()
    with patch.object(vs, "_qdrant_client", FakeQdrant(box)), \
         patch.object(vs, "_ensure_collection_exists", lambda: None), \
         patch("app.services.vector_store.generate_single_embedding",
               return_value=[0.0, 0.0, 0.0]):
        vs.query_workspace_documents(
            user_id=MEMBER_ID, workspace_id=WS_ID, query="q",
            scope_ids=[SRC_ID], top_k=5)
        conds = _must_values(box.query_filter)
        assert conds.get("workspace_id") == WS_ID
        assert SRC_ID in conds.get("source_id", set())


def test_delete_source_vectors_source_scoped_only():
    import app.services.vector_store as vs
    box = FakePoints()
    with patch.object(vs, "_qdrant_client", FakeQdrant(box)), \
         patch.object(vs, "_ensure_collection_exists", lambda: None):
        # Deleter differs from uploader: delete must still work by source_id.
        assert vs.delete_source_vectors(user_id=MEMBER_ID, source_id=SRC_ID) == 1
        conds = _must_values(box.deleted_filter)
        assert conds.get("source_id") == SRC_ID
        assert "user_id" not in conds


def test_delete_workspace_vectors_workspace_scoped_only():
    import app.services.vector_store as vs
    box = FakePoints()
    with patch.object(vs, "_qdrant_client", FakeQdrant(box)), \
         patch.object(vs, "_ensure_collection_exists", lambda: None):
        assert vs.delete_workspace_vectors(user_id=MEMBER_ID, workspace_id=WS_ID) == 1
        conds = _must_values(box.deleted_filter)
        assert conds.get("workspace_id") == WS_ID
        assert "user_id" not in conds

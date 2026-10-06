from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase
from datetime import datetime, timezone
import re
from app.config import get_settings

settings = get_settings()


class DatabaseNotReadyError(RuntimeError):
    """Raised when a database operation is attempted before init_db() completes."""


client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None
users_collection: AsyncIOMotorCollection | None = None
workspaces_collection: AsyncIOMotorCollection | None = None
documents_collection: AsyncIOMotorCollection | None = None
sources_collection: AsyncIOMotorCollection | None = None
messages_collection: AsyncIOMotorCollection | None = None


def slugify(text: str) -> str:
    """Generate a clean URL-friendly slug."""
    text = (text or "workspace").lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-") or "workspace"


async def run_migrations():
    """Migrate existing users and data to multi-workspace architecture."""
    if users_collection is None or workspaces_collection is None:
        return

    cursor = users_collection.find({
        "$or": [
            {"active_workspace_id": None},
            {"active_workspace_id": {"$exists": False}}
        ]
    })
    async for user in cursor:
        user_id_str = str(user["_id"])
        workspace = await workspaces_collection.find_one({"owner_id": user_id_str})
        if not workspace:
            name = f"{user.get('username') or 'My'} HQ"
            base_slug = slugify(user.get("username") or "my-hq")
            slug = base_slug
            count = 1
            while await workspaces_collection.find_one({"owner_id": user_id_str, "slug": slug}):
                count += 1
                slug = f"{base_slug}-{count}"

            now = datetime.now(timezone.utc)
            ws_doc = {
                "owner_id": user_id_str,
                "name": name,
                "slug": slug,
                "description": "Default workspace",
                "logo_url": None,
                "created_at": now,
                "updated_at": now,
            }
            res = await workspaces_collection.insert_one(ws_doc)
            ws_id_str = str(res.inserted_id)
        else:
            ws_id_str = str(workspace["_id"])

        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"active_workspace_id": ws_id_str}}
        )

        if sources_collection is not None:
            await sources_collection.update_many(
                {"user_id": user_id_str, "$or": [{"workspace_id": None}, {"workspace_id": {"$exists": False}}]},
                {"$set": {"workspace_id": ws_id_str}}
            )

        if messages_collection is not None:
            await messages_collection.update_many(
                {"user_id": user_id_str, "$or": [{"workspace_id": None}, {"workspace_id": {"$exists": False}}]},
                {"$set": {"workspace_id": ws_id_str}}
            )

        try:
            from app.services.vector_store import set_user_vectors_workspace
            set_user_vectors_workspace(user_id_str, ws_id_str)
        except Exception:
            pass


async def init_db():
    """Connect to MongoDB, create indexes, and run migration hooks."""
    global client, db, users_collection, workspaces_collection, documents_collection, sources_collection, messages_collection

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]

    users_collection = db["users"]
    workspaces_collection = db["workspaces"]
    documents_collection = db["documents"]
    sources_collection = db["sources"]
    messages_collection = db["messages"]

    await users_collection.create_index("email", unique=True)
    await workspaces_collection.create_index([("owner_id", 1), ("slug", 1)], unique=True)
    await documents_collection.create_index([("workspace_id", 1), ("updated_at", -1)])
    await sources_collection.create_index([("workspace_id", 1), ("uploaded_at", -1)])
    await messages_collection.create_index([("workspace_id", 1), ("created_at", 1)])

    # Run auto-migration hook for existing records
    await run_migrations()


def check_db():
    """Raise DatabaseNotReadyError if database is not initialized (init_db not called)."""
    if users_collection is None:
        raise DatabaseNotReadyError(
            "Database not initialized. Ensure init_db() has been called on startup."
        )


async def close_db():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()
        client = None

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection, AsyncIOMotorDatabase
from app.config import get_settings

settings = get_settings()


class DatabaseNotReadyError(RuntimeError):
    """Raised when a database operation is attempted before init_db() completes."""


client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None
users_collection: AsyncIOMotorCollection | None = None
sources_collection: AsyncIOMotorCollection | None = None
messages_collection: AsyncIOMotorCollection | None = None


async def init_db():
    """Connect to MongoDB and create indexes."""
    global client, db, users_collection, sources_collection, messages_collection

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]

    users_collection = db["users"]
    sources_collection = db["sources"]
    messages_collection = db["messages"]

    await users_collection.create_index("email", unique=True)
    await sources_collection.create_index([("user_id", 1), ("uploaded_at", -1)])
    await messages_collection.create_index([("user_id", 1), ("created_at", 1)])


def check_db():
    """Raise DatabaseNotReadyError if any collection is None (init_db not called)."""
    if users_collection is None or sources_collection is None or messages_collection is None:
        raise DatabaseNotReadyError(
            "Database not initialized. Ensure init_db() has been called on startup."
        )


async def close_db():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()
        client = None

from app.core.database import Base, engine


from app.models.conversation import Session, Message
from app.models.user import User


print("Creating CINQ database tables...")

Base.metadata.create_all(
    bind=engine
)

print("Tables created successfully.")
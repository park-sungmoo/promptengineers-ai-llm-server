import os
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import LONGTEXT

## APP
APP_ENV = os.environ.get("APP_ENV", "local")
APP_VERSION = os.environ.get("APP_VERSION", "0.0.1")
APP_SECRET = os.environ.get("APP_SECRET")
APP_LOG_LEVEL = os.environ.get("APP_LOG_LEVEL", "INFO")
APP_ALGORITHM = os.environ.get("APP_ALGORITHM", "HS256")
APP_WORKERS = os.environ.get("APP_WORKERS", 1)
APP_ADMIN_EMAIL = os.environ.get("APP_ADMIN_EMAIL", "admin@example.com")
APP_ADMIN_PASS= os.environ.get("APP_ADMIN_PASS", "test1234")

## DB
DATABASE_URL = os.environ.get("DATABASE_URL", 'sqlite+aiosqlite:///./data/test.sqlite')
PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY')
PINECONE_ENV = os.environ.get('PINECONE_ENV', 'us-east1-gcp')
PINECONE_INDEX = os.environ.get('PINECONE_INDEX', 'default')
REDIS_URL = os.environ.get("REDIS_URL", 'redis://localhost:6379/0')

## LLM
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

## Storage
TEST_USER_ID = os.environ.get("TEST_USER_ID", "000000000000000000000000")
MINIO_HOST = os.environ.get("MINIO_HOST")
BUCKET = os.environ.get("BUCKET", 'pe-oss-bucket')
S3_REGION = os.environ.get("S3_REGION", 'us-east-1')
ACCESS_KEY_ID = os.environ.get("ACCESS_KEY_ID", '')
ACCESS_SECRET_KEY = os.environ.get("ACCESS_SECRET_KEY", '')

default_app_tokens = {
    'OPENAI_API_KEY': OPENAI_API_KEY,
    # 'OLLAMA_BASE_URL': OLLAMA_BASE_URL,
    # 'MONGO_CONNECTION': MONGO_CONNECTION,
    # 'MONGO_DB_NAME': MONGO_DB_NAME,
    'REDIS_URL': REDIS_URL,
    'BUCKET': BUCKET,
    'S3_REGION': S3_REGION,
    'ACCESS_KEY_ID': ACCESS_KEY_ID,
    'ACCESS_SECRET_KEY': ACCESS_SECRET_KEY,
    'MINIO_HOST': MINIO_HOST,
    'PINECONE_API_KEY': PINECONE_API_KEY,
    'PINECONE_ENV': PINECONE_ENV,
    'PINECONE_INDEX': PINECONE_INDEX,
}

def retrieve_defaults(keys):
    """
    Extracts a sub-dictionary from the given default dictionary based on the specified keys.

    :param default_dict: The original dictionary from which to extract the keys.
    :param keys: A set or list of keys to extract from the default dictionary.
    :return: A new dictionary containing only the keys present in the keys argument.
    """
    return {k: default_app_tokens[k] for k in keys if k in default_app_tokens}

def database_engine():
    if 'mysql' in DATABASE_URL:
        return 'mysql'
    elif 'postgresql' in DATABASE_URL:
        return 'postgresql'
    else:
        return 'sqlite'
    
def database_type(field_type: str):
    if field_type == 'TEXT':
        if database_engine() == 'mysql':
            return LONGTEXT
        else:
            return sa.TEXT()
        
    if field_type == 'DATE':
        if database_engine() == 'postgresql':
            return sa.TIMESTAMP()
        else:
            return sa.DATETIME()
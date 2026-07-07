import gzip
import pickle
from io import BytesIO, StringIO

import pandas as pd


def encode_dataframe(df: pd.DataFrame) -> bytes:
    return gzip.compress(pickle.dumps(df, protocol=pickle.HIGHEST_PROTOCOL))


def decode_dataframe(raw: bytes) -> pd.DataFrame:
    try:
        inner = gzip.decompress(raw)
    except (OSError, EOFError):
        inner = None
    if inner is not None:
        try:
            return pickle.loads(inner)
        except Exception:
            pass
        try:
            return pd.read_json(StringIO(inner.decode()), orient="split")
        except Exception:
            pass
    return pd.read_csv(BytesIO(raw))

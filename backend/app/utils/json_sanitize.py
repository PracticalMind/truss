import math
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any

import numpy as np
import pandas as pd


def _clean_float(value: float) -> float | None:
    return None if math.isnan(value) or math.isinf(value) else value


def sanitize_for_json(obj: Any) -> Any:
    if obj is None or obj is pd.NaT:
        return None

    if isinstance(obj, bool):
        return obj
    if isinstance(obj, float):
        return _clean_float(obj)
    if isinstance(obj, (int, str)):
        return obj

    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return _clean_float(float(obj))
    if isinstance(obj, Decimal):
        return _clean_float(float(obj))

    if isinstance(obj, (pd.Timestamp, datetime, date, time)):
        return obj.isoformat()
    if isinstance(obj, np.datetime64):
        ts = pd.Timestamp(obj)
        return None if ts is pd.NaT else ts.isoformat()
    if isinstance(obj, pd.Timedelta):
        return obj.isoformat()

    if isinstance(obj, np.ndarray):
        return [sanitize_for_json(x) for x in obj.tolist()]

    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [sanitize_for_json(x) for x in obj]

    if isinstance(obj, bytes):
        return obj.decode(errors="replace")

    return obj

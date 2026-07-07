import math
from datetime import datetime

import numpy as np
import pandas as pd

from app.utils.json_sanitize import sanitize_for_json


def test_nan_becomes_none():
    assert sanitize_for_json(float("nan")) is None


def test_inf_becomes_none():
    assert sanitize_for_json(float("inf")) is None
    assert sanitize_for_json(float("-inf")) is None


def test_normal_float_unchanged():
    assert sanitize_for_json(3.14) == 3.14


def test_none_unchanged():
    assert sanitize_for_json(None) is None


def test_string_unchanged():
    assert sanitize_for_json("hello") == "hello"


def test_int_unchanged():
    assert sanitize_for_json(42) == 42


def test_nested_dict():
    result = sanitize_for_json({"a": float("nan"), "b": 1.0})
    assert result == {"a": None, "b": 1.0}


def test_nested_list():
    result = sanitize_for_json([float("inf"), 2, "x"])
    assert result == [None, 2, "x"]


def test_deeply_nested():
    result = sanitize_for_json({"rows": [{"v": float("nan")}, {"v": 5.0}]})
    assert result == {"rows": [{"v": None}, {"v": 5.0}]}


def test_numpy_scalars():
    assert sanitize_for_json(np.int64(7)) == 7
    assert isinstance(sanitize_for_json(np.int64(7)), int)
    assert sanitize_for_json(np.float64(1.5)) == 1.5
    assert sanitize_for_json(np.bool_(True)) is True
    assert sanitize_for_json(np.float32("nan")) is None
    assert sanitize_for_json(np.float64("inf")) is None


def test_numpy_array():
    assert sanitize_for_json(np.array([1, 2, 3])) == [1, 2, 3]


def test_datetime_values():
    assert sanitize_for_json(datetime(2026, 1, 2, 3, 4, 5)) == "2026-01-02T03:04:05"
    assert sanitize_for_json(pd.Timestamp("2026-01-02")) == "2026-01-02T00:00:00"
    assert sanitize_for_json(np.datetime64("2026-01-02")) == "2026-01-02T00:00:00"


def test_nat_becomes_none():
    assert sanitize_for_json(pd.NaT) is None
    assert sanitize_for_json(pd.Timestamp("NaT")) is None


def test_datetime_inside_payload():
    payload = {"cols": ["d"], "data": [[pd.Timestamp("2026-01-02")], [pd.NaT]]}
    result = sanitize_for_json(payload)
    assert result == {"cols": ["d"], "data": [["2026-01-02T00:00:00"], [None]]}

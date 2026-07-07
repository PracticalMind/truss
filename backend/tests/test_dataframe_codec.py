import gzip

import numpy as np
import pandas as pd
from pandas.testing import assert_frame_equal

from app.core.dataframe_codec import encode_dataframe, decode_dataframe


def _sample() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "i": pd.Series([1, 2, 3], dtype="int64"),
            "f": pd.Series([1.5, np.nan, 3.0], dtype="float64"),
            "b": pd.Series([True, False, True], dtype="bool"),
            "s": pd.Series(["a", None, "c"], dtype="object"),
            "cat": pd.Series(["x", "y", "x"], dtype="category"),
            "dt": pd.to_datetime(["2026-01-01", "2026-06-15", "2026-12-31"]),
        }
    )


def test_roundtrip_preserves_dtypes_and_values():
    df = _sample()
    out = decode_dataframe(encode_dataframe(df))
    assert_frame_equal(df, out)
    assert list(df.dtypes) == list(out.dtypes)


def test_decode_legacy_json_split():
    df = pd.DataFrame({"a": [1, 2], "b": ["x", "y"]})
    legacy = gzip.compress(df.to_json(orient="split").encode())
    out = decode_dataframe(legacy)
    assert list(out.columns) == ["a", "b"]
    assert out["a"].tolist() == [1, 2]


def test_decode_legacy_csv():
    df = pd.DataFrame({"a": [1, 2], "b": ["x", "y"]})
    legacy = df.to_csv(index=False).encode()
    out = decode_dataframe(legacy)
    assert list(out.columns) == ["a", "b"]
    assert out["a"].tolist() == [1, 2]

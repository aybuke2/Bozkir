
"""Offline tests for crop profile metadata and FAO reference plumbing."""

from crop_profiles import get_crop_profiles


def test_profiles_have_explicit_provenance():
    profiles = get_crop_profiles()

    assert {p["id"] for p in profiles} == {
        "wheat", "barley", "chickpea", "lentil"
    }

    for profile in profiles:
        assert profile["kc_mid_reference"] > 0
        assert profile["kc_end_reference"] >= 0
        assert (
            profile["kc_initial_status"]
            == "illustrative_wetness_dependent_assumption"
        )
        assert profile["calendar_status"] == "requires_local_validation"
        assert "fao.org" in profile["kc_source"].lower()


def test_distinct_legume_coefficients():
    profiles = {
        p["id"]: p
        for p in get_crop_profiles()
    }

    assert (
        profiles["chickpea"]["kc_mid_reference"]
        != profiles["lentil"]["kc_mid_reference"]
    )

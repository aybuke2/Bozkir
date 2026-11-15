
from crop_data import CROPS

FAO56_SOURCE = "https://www.fao.org/4/X0490E/X0490E00.htm"
FAO_STAGE_SOURCE = "https://www.fao.org/4/s2022e/s2022e07.htm"

# Kc mid/end: FAO-56 Table 12.
# Stage lengths: FAO Irrigation Water Needs, Table 7.
# These are general reference cases, not global means.
# Chickpea stage lengths are a provisional lentil-based proxy.

CROP_PROFILES = {
    "wheat": {
        "kc_mid": 1.15,
        "kc_end": 0.25,
        "stage_days": (15, 25, 50, 30),
        "stage_basis": "FAO cereal group reference",
    },
    "barley": {
        "kc_mid": 1.15,
        "kc_end": 0.25,
        "stage_days": (15, 25, 50, 30),
        "stage_basis": "FAO cereal group reference",
    },
    "chickpea": {
        "kc_mid": 1.00,
        "kc_end": 0.35,
        "stage_days": (20, 30, 60, 40),
        "stage_basis": (
            "Provisional proxy from FAO lentil durations; "
            "not chickpea-specific"
        ),
    },
    "lentil": {
        "kc_mid": 1.10,
        "kc_end": 0.30,
        "stage_days": (20, 30, 60, 40),
        "stage_basis": "FAO lentil reference",
    },
}


def get_crop_profiles():
    results = []

    for crop_id, crop in CROPS.items():
        profile = CROP_PROFILES[crop_id]
        ini, dev, mid, late = profile["stage_days"]

        results.append({
            "id": crop_id,
            "name": crop.name,
            "family": crop.family,
            "is_legume": crop.is_legume,
            "kc_initial_scenario": 0.4,
            "kc_initial_status": (
                "FAO group reference; soil wetness dependent"
            ),
            "kc_mid_reference": profile["kc_mid"],
            "kc_end_reference": profile["kc_end"],
            "kc_source": FAO56_SOURCE,
            "initial_days": ini,
            "development_days": dev,
            "mid_days": mid,
            "late_days": late,
            "stage_lengths_source": FAO_STAGE_SOURCE,
            "stage_lengths_basis": profile["stage_basis"],
            "calendar_status": "requires_local_validation",
            "note": (
                "Reference stage lengths are not location-specific. "
                "ETc is not irrigation demand."
            ),
        })

    return results

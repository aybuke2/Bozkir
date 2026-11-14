
from crop_data import CROPS


FAO56_SOURCE = (
    "https://www.fao.org/4/X0490E/X0490E00.htm"
)

CROP_PROFILES = {
    "wheat": {
        "kc_mid": 1.15,
        "kc_end": 0.25,
        "calendar_status": "requires_local_validation",
    },
    "barley": {
        "kc_mid": 1.15,
        "kc_end": 0.25,
        "calendar_status": "requires_local_validation",
    },
    "chickpea": {
        "kc_mid": 1.00,
        "kc_end": 0.35,
        "calendar_status": "requires_local_validation",
    },
    "lentil": {
        "kc_mid": 1.10,
        "kc_end": 0.30,
        "calendar_status": "requires_local_validation",
    },
}


def get_crop_profiles():
    results = []

    for crop_id, crop in CROPS.items():
        profile = CROP_PROFILES[crop_id]

        results.append({
            "id": crop_id,
            "name": crop.name,
            "family": crop.family,
            "is_legume": crop.is_legume,
            "kc_mid_reference": profile["kc_mid"],
            "kc_end_reference": profile["kc_end"],
            "calendar_status": profile["calendar_status"],
            "kc_source": FAO56_SOURCE,
            "note": (
                "Kc referans değerleri tek başına "
                "su ihtiyacını vermez. ETo, gelişme "
                "dönemleri ve yerel koşullar gerekir."
            ),
        })

    return results

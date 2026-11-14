
from dataclasses import dataclass


@dataclass(frozen=True)
class Crop:
    id: str
    name: str
    family: str
    is_legume: bool


CROPS = {
    "wheat": Crop(
        "wheat", "Buğday", "Poaceae", False
    ),
    "barley": Crop(
        "barley", "Arpa", "Poaceae", False
    ),
    "chickpea": Crop(
        "chickpea", "Nohut", "Fabaceae", True
    ),
    "lentil": Crop(
        "lentil", "Mercimek", "Fabaceae", True
    ),
}


def get_crop(crop_id):
    if crop_id not in CROPS:
        raise ValueError(
            f"Tanımlanmamış ürün: {crop_id}"
        )

    return CROPS[crop_id]

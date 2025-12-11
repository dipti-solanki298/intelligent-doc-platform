from doctr.io import DocumentFile
from doctr.models import ocr_predictor
import numpy as np
import cv2

# Load DocTR OCR (best available model)
doctr_model = ocr_predictor(pretrained=True)

def doctr_ocr_image(image_bytes):
    """
    Runs DocTR OCR on image bytes and returns extracted text.
    Works for scanned invoices, photos, stamps, low-quality images.
    """

    # Convert bytes → NumPy image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return ""

    # DocTR expects list of images (as numpy arrays)
    doc = DocumentFile.from_images([img])

    result = doctr_model(doc)
    text = result.render()

    return text.strip()

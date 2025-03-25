import re
import contractions

def clean_text(text):
    text = contractions.fix(text)
    text = text.lower()
    text = re.sub(r'[^A-Za-z0-9]+', ' ', text)
    return text.strip()

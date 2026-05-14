from deep_translator import GoogleTranslator
import json, time

t = GoogleTranslator(source='ko', target='en')

with open('unique_ko_texts.json', 'r', encoding='utf-8') as f:
    texts = json.load(f)

print(f'Total to translate: {len(texts)}')

translations = {}
for i, text in enumerate(texts):
    try:
        result = t.translate(text)
        if result:
            translations[text] = result
        else:
            translations[text] = text
    except Exception as e:
        print(f'  [{i+1}] Error: {e}')
        translations[text] = text
    if (i+1) % 50 == 0:
        print(f'  Progress: {i+1}/{len(texts)}')
    if (i+1) % 20 == 0:
        time.sleep(0.3)

with open('translations.json', 'w', encoding='utf-8') as f:
    json.dump(translations, f, ensure_ascii=False, indent=2)
print('Done! Saved translations.json')

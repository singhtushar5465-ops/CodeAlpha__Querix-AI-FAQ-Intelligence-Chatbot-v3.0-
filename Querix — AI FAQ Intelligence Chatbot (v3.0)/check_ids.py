import re

with open('frontend/index.html', encoding='utf-8') as f:
    html = f.read()

with open('frontend/app.js', encoding='utf-8') as f:
    js = f.read()

js_ids = set(re.findall(r"getElementById\(['\"]([^'\"]+)['\"]", js))
html_ids = set(re.findall(r"id=['\"]([^'\"]+)['\"]", html))

missing = js_ids - html_ids
print("Missing IDs:", missing)

# Check all addEventListener on missing IDs
for m in missing:
    if f"{m}.addEventListener" in js:
        print("CRITICAL: addEventListener on missing ID:", m)

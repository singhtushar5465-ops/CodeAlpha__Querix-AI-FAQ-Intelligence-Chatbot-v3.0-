import urllib.request

try:
    content = urllib.request.urlopen('http://localhost:8000/app.js').read().decode('utf-8')
    lines = content.split('\n')
    print(f"Total lines served: {len(lines)}")
    for i in range(1240, min(1255, len(lines))):
        print(f"{i+1}: {lines[i]}")
    with open("served_output.txt", "w", encoding="utf-8") as f:
        f.write("\n".join([f"{i+1}: {lines[i]}" for i in range(len(lines))]))
    print("Saved served_output.txt")
except Exception as e:
    print("Error:", e)

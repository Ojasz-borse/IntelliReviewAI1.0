import csv
from collections import Counter

crops = ['Tomato', 'Onion', 'Soybean', 'Cotton']
stats = {c: {'markets': Counter(), 'varieties': Counter()} for c in crops}

try:
    with open('data/Dataset.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            for crop in crops:
                if crop.lower() in row['Commodity'].lower():
                    stats[crop]['markets'][row['Market']] += 1
                    stats[crop]['varieties'][row['Variety']] += 1

    for crop in crops:
        print(f"--- {crop} ---")
        print("Top 5 Markets:", stats[crop]['markets'].most_common(5))
        print("Varieties:", stats[crop]['varieties'].most_common(5))
        print("\n")

except FileNotFoundError:
    print("data/Dataset.csv not found")

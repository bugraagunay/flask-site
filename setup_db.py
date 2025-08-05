import pandas as pd
import sqlite3

df = pd.read_excel('data/income_groups_with_years.xlsx')

# Clean column names
df.columns = [col.strip().replace('\n', ' ') for col in df.columns]

# Rename the column
df.rename(columns={'IMF-ADV-EMDE': 'EM and Developed Markets'}, inplace=True)

# Update the values in the renamed column
df['EM and Developed Markets'] = df['EM and Developed Markets'].replace({
    'ADV-E': 'Advanced Economies',
    'EMDE-E': 'Emerging Market and Developing Economies'
})

# Find economic groups
current_group = None
groups = []
for index, row in df.iterrows():
    country_name = str(row['Country'])
    if country_name.isupper():
        current_group = country_name
    groups.append(current_group)

df['economic_group'] = groups

# Remove header rows
df = df[df['Country'] != df['economic_group']]

# Create and connect to the database
conn = sqlite3.connect('income.db')

# Save the DataFrame to the SQLite database
df.to_sql('income_data', conn, if_exists='replace', index=False)

conn.close()

print("Database 'income.db' created successfully with 'income_data' table.")
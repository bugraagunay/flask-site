import sqlite3
import pandas as pd

conn = sqlite3.connect('income.db')
df = pd.read_sql_query("SELECT * FROM income_data WHERE Country = 'Türkiye' AND Year = 2022", conn)
conn.close()

print(df.to_string())

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import pandas as pd
import logging
import os

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

def get_db_connection():
    conn = sqlite3.connect('income.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_dataset_map():
    conn = get_db_connection()
    table_info = pd.read_sql_query("PRAGMA table_info(income_data)", conn)
    conn.close()
    # Dynamically create the map from the column names, stripping whitespace
    dataset_map = {col.strip(): col.strip() for col in table_info['name']}
    return dataset_map

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/countries')
def get_countries():
    conn = get_db_connection()
    countries = pd.read_sql_query("SELECT DISTINCT Country FROM income_data ORDER BY Country", conn)['Country'].tolist()
    conn.close()
    return jsonify(countries)

@app.route('/datasets')
def get_datasets():
    conn = get_db_connection()
    table_info = pd.read_sql_query("PRAGMA table_info(income_data)", conn)
    excluded_columns = ['Country', 'economic_group', 'EM and Developed Markets', 'Code', 'code-2', 'Year']
    datasets = table_info[~table_info['name'].isin(excluded_columns)]['name'].tolist()
    conn.close()
    return jsonify(datasets)

@app.route('/years')
def get_years():
    country = request.args.get('country')
    conn = get_db_connection()
    if country:
        years = pd.read_sql_query(f"SELECT DISTINCT Year FROM income_data WHERE Country = ? ORDER BY Year", conn, params=(country,))['Year'].tolist()
    else:
        years = pd.read_sql_query("SELECT DISTINCT Year FROM income_data ORDER BY Year", conn)['Year'].tolist()
    conn.close()
    return jsonify(years)

@app.route('/data')
def get_data():
    country = request.args.get('country')
    year = request.args.get('year')
    dataset = request.args.get('dataset')

    conn = get_db_connection()
    query = "SELECT * FROM income_data"
    params = []
    conditions = []

    if country:
        conditions.append("Country = ?")
        params.append(country)
    
    if year:
        conditions.append("Year = ?")
        params.append(year)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    df = pd.read_sql_query(query, conn, params=tuple(params))
    df.columns = [col.strip() for col in df.columns]
    conn.close()

    dataset_map = get_dataset_map()
    mapped_dataset = dataset_map.get(dataset, dataset)

    results = []
    if mapped_dataset not in df.columns:
        logging.error(f"Dataset '{dataset}' mapped to '{mapped_dataset}' not found in DataFrame columns: {df.columns.tolist()}")
    else:
        for index, row in df.iterrows():
            results.append({
                'Country': row['Country'],
                'Income Group': row['economic_group'],
                'EM and Developed Markets': row['EM and Developed Markets'],
                'Year': row['Year'],
                'Dataset': dataset,
                'Value': row[mapped_dataset] if pd.notnull(row[mapped_dataset]) else None
            })

    return jsonify(results)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
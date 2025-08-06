from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import sqlite3
import pandas as pd
import logging
import os

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

DATABASE = os.path.join(os.path.dirname(__file__), 'income.db')

def get_db_connection():
    conn = None
    try:
        conn = sqlite3.connect(DATABASE, check_same_thread=False)
        conn.row_factory = sqlite3.Row
    except sqlite3.Error as e:
        logging.error(f"Database connection error: {e}")
    return conn

def get_dataset_map():
    conn = get_db_connection()
    if conn:
        try:
            table_info = pd.read_sql_query("PRAGMA table_info(income_data)", conn)
            conn.close()
            dataset_map = {col.strip(): col.strip() for col in table_info['name']}
            return dataset_map
        except pd.io.sql.DatabaseError as e:
            logging.error(f"Error reading table info from database: {e}")
            return {}
    return {}

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/filters')
def get_filters():
    conn = get_db_connection()
    if conn:
        try:
            countries = pd.read_sql_query("SELECT DISTINCT Country FROM income_data ORDER BY Country", conn)['Country'].tolist()
            
            table_info = pd.read_sql_query("PRAGMA table_info(income_data)", conn)
            excluded_columns = ['Country', 'economic_group', 'EM and Developed Markets', 'Code', 'code-2', 'Year']
            datasets = table_info[~table_info['name'].isin(excluded_columns)]['name'].tolist()
            
            years = pd.read_sql_query("SELECT DISTINCT Year FROM income_data ORDER BY Year", conn)['Year'].tolist()
            
            conn.close()
            
            return jsonify({
                'countries': countries,
                'datasets': datasets,
                'years': years
            })
        except pd.io.sql.DatabaseError as e:
            logging.error(f"Error fetching filters from database: {e}")
            return jsonify({'countries': [], 'datasets': [], 'years': []})
    return jsonify({'countries': [], 'datasets': [], 'years': []})

@app.route('/data')
def get_data():
    country = request.args.get('country')
    year = request.args.get('year')
    dataset = request.args.get('dataset')

    conn = get_db_connection()
    if conn:
        try:
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
        except pd.io.sql.DatabaseError as e:
            logging.error(f"Error fetching data from database: {e}")
            return jsonify([])
    return jsonify([])

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

import os
import sqlite3
import pandas as pd
from flask import Flask, jsonify, render_template, request

# Initialize Flask app
app = Flask(__name__)

# --- Database Configuration ---
# Construct the absolute path to the database file.
# This ensures that the app can find the database file regardless of where the script is run from.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'income.db')

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# --- Routes ---
@app.route('/')
def index():
    """Serves the main HTML page."""
    # Renders the index.html file from the 'templates' folder.
    return render_template('index.html')

@app.route('/filters')
def get_filters():
    """Provides the data for the dropdown filters."""
    conn = get_db_connection()
    
    # Fetch distinct countries, years, and dataset names
    countries = pd.read_sql_query("SELECT DISTINCT Country FROM income_data ORDER BY Country", conn)['Country'].tolist()
    years = pd.read_sql_query("SELECT DISTINCT Year FROM income_data ORDER BY Year", conn)['Year'].tolist()
    
    # Fetch all column names and exclude the non-dataset ones
    table_info = pd.read_sql_query("PRAGMA table_info(income_data)", conn)
    excluded_columns = {'Country', 'economic_group', 'EM and Developed Markets', 'Code', 'code-2', 'Year'}
    datasets = [col for col in table_info['name'] if col not in excluded_columns]
    
    conn.close()
    
    return jsonify({
        'countries': countries,
        'datasets': datasets,
        'years': years
    })

@app.route('/data')
def get_data():
    """Provides the main data for the table based on user selections."""
    country = request.args.get('country')
    year = request.args.get('year')
    dataset = request.args.get('dataset')

    conn = get_db_connection()
    
    # Base query
    query = "SELECT * FROM income_data WHERE Country = ? AND Year = ?"
    params = [country, year]
    
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()

    # Prepare results
    results = []
    if not df.empty and dataset in df.columns:
        for _, row in df.iterrows():
            results.append({
                'Country': row['Country'],
                'Income Group': row['economic_group'],
                'EM and Developed Markets': row['EM and Developed Markets'],
                'Year': row['Year'],
                'Dataset': dataset,
                'Value': row[dataset] if pd.notna(row[dataset]) else 'N/A'
            })
            
    return jsonify(results)

# --- Main Execution ---
if __name__ == '__main__':
    # Use the PORT environment variable if available, otherwise default to 5001
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
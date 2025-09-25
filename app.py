"""
NanoGPT Model Browser - Flask Backend
A web application to browse and view NanoGPT models
"""

import os
from flask import Flask, jsonify, render_template, request
from dotenv import load_dotenv
import requests
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

class NanoGPTClient:
    """Client for interacting with NanoGPT API"""

    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('NANOGPT_API_KEY')
        self.base_url = 'https://nano-gpt.com/api/v1'
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }

    def get_models(self):
        """Fetch all available models from NanoGPT API"""
        try:
            url = f'{self.base_url}/models'
            response = requests.get(url, headers=self.headers, timeout=30)

            if response.status_code == 200:
                return response.json()
            else:
                print(f"API Error: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"Request Error: {e}")
            return None

    def get_model_details(self, model_id):
        """Get detailed information about a specific model"""
        # For now, we'll return the model info from the list
        # In the future, this could call a dedicated model details endpoint
        models_data = self.get_models()
        if models_data and 'data' in models_data:
            for model in models_data['data']:
                if model['id'] == model_id:
                    return model
        return None

# Initialize NanoGPT client
nanogpt_client = NanoGPTClient()

@app.route('/')
def index():
    """Main page - Model browser interface"""
    return render_template('index.html')

@app.route('/api/models')
def api_models():
    """API endpoint to get all models"""
    try:
        models_data = nanogpt_client.get_models()

        if models_data:
            return jsonify({
                'success': True,
                'data': models_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch models from NanoGPT API'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/models/<model_id>')
def api_model_details(model_id):
    """API endpoint to get specific model details"""
    try:
        model_data = nanogpt_client.get_model_details(model_id)

        if model_data:
            return jsonify({
                'success': True,
                'data': model_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Model not found'
            }), 404

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
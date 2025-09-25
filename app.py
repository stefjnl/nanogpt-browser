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
        self.base_url = 'https://nano-gpt.com/api'
        self.headers = {
            'x-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
        print(f"NanoGPT Client initialized with API key: {self.api_key[:10]}..." if self.api_key else "No API key found")

    def get_models(self, model_type='all'):
        """Fetch models from NanoGPT API with detailed information

        Args:
            model_type (str): Type of models to fetch
                - 'all': All models (default)
                - 'subscription': Subscription-only models
                - 'paid': Paid-only models
        """
        try:
            if model_type == 'subscription':
                url = f'{self.base_url}/subscription/v1/models?detailed=true'
                print(f"Fetching subscription models from: {url}")
            elif model_type == 'paid':
                url = f'{self.base_url}/paid/v1/models?detailed=true'
                print(f"Fetching paid models from: {url}")
            else:
                url = f'{self.base_url}/personalized/v1/models?detailed=true'
                print(f"Fetching all models from: {url}")

            print(f"Using API key: {self.api_key[:10]}..." if self.api_key else "No API key provided")
            response = requests.get(url, headers=self.headers, timeout=30)
            print(f"Response status: {response.status_code}")
            print(f"Response text: {response.text[:200]}...")  # Show first 200 chars

            if response.status_code == 200:
                data = response.json()
                model_count = len(data.get('data', [])) if data else 0
                print(f"Successfully fetched {model_count} models for type: {model_type}")

                # Add model_type to each model for client-side filtering if needed
                if data and 'data' in data:
                    for model in data['data']:
                        model['_requested_type'] = model_type
                return data
            else:
                print(f"API Error: {response.status_code} - {response.text}")
                # If specific endpoint fails, fall back to all models
                if model_type != 'all':
                    print(f"Falling back to all models for {model_type}")
                    return self.get_models('all')
                return None

        except requests.exceptions.RequestException as e:
            print(f"Request Error: {e}")
            # If specific endpoint fails, fall back to all models
            if model_type != 'all':
                print(f"Falling back to all models for {model_type}")
                return self.get_models('all')
            return None

    def get_model_details(self, model_id):
        """Get detailed information about a specific model"""
        try:
            # Try to get the model from the cached models first
            if hasattr(self, '_cached_models'):
                models_data = self._cached_models
            else:
                # Fetch all models and cache them
                models_data = self.get_models('all')
                self._cached_models = models_data

            if models_data and 'data' in models_data:
                for model in models_data['data']:
                    if model['id'] == model_id:
                        print(f"Found model details for: {model_id}")
                        return model

            print(f"Model not found in cache: {model_id}")
            return None

        except Exception as e:
            print(f"Error in get_model_details: {str(e)}")
            return None

class OpenRouterClient:
    """Client for interacting with OpenRouter API"""

    def __init__(self):
        self.base_url = 'https://openrouter.ai/api/v1'
        self.headers = {
            'Content-Type': 'application/json'
        }

    def get_models(self):
        """Fetch models from OpenRouter API"""
        try:
            url = f'{self.base_url}/models'
            print(f"Fetching OpenRouter models from: {url}")

            response = requests.get(url, headers=self.headers, timeout=30)
            print(f"OpenRouter response status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"Successfully fetched {len(data.get('data', []))} OpenRouter models")

                # Transform OpenRouter data to match NanoGPT structure for compatibility
                if data and 'data' in data:
                    transformed_models = []
                    for model in data['data']:
                        transformed_model = self._transform_model_data(model)
                        transformed_models.append(transformed_model)
                    data['data'] = transformed_models

                return data
            else:
                print(f"OpenRouter API Error: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"OpenRouter Request Error: {e}")
            return None

    def _transform_model_data(self, model):
        """Transform OpenRouter model data to match NanoGPT structure"""
        # Extract provider from model ID (format: "provider/model-name")
        model_id = model.get('id', '')
        owned_by = model_id.split('/')[0] if '/' in model_id else 'OpenRouter'

        # Transform pricing structure
        pricing = model.get('pricing', {})
        transformed_pricing = {
            'prompt': float(pricing.get('prompt', 0)),
            'completion': float(pricing.get('completion', 0)),
            'unit': 'per_million_tokens'
        }

        # Transform architecture info
        architecture = model.get('architecture', {})
        capabilities = {}
        if 'image' in architecture.get('input_modalities', []):
            capabilities['vision'] = True

        # Create transformed model
        transformed_model = {
            'id': model.get('canonical_slug', model_id),
            'name': model.get('name', model_id),
            'created': model.get('created', 0),
            'owned_by': owned_by,
            'context_length': model.get('context_length', 0),
            'pricing': transformed_pricing,
            'description': model.get('description', ''),
            'capabilities': capabilities,
            '_original_source': 'openrouter',
            '_supported_parameters': model.get('supported_parameters', [])
        }

        return transformed_model

    def get_model_details(self, model_id):
        """Get detailed information about a specific OpenRouter model"""
        models_data = self.get_models()
        if models_data and 'data' in models_data:
            for model in models_data['data']:
                if model['id'] == model_id:
                    return model
        return None

# Initialize clients
nanogpt_client = NanoGPTClient()
openrouter_client = OpenRouterClient()

@app.route('/')
def index():
    """Main page - Model browser interface"""
    return render_template('index.html')

@app.route('/api/models')
def api_models():
    """API endpoint to get models with optional type filtering"""
    try:
        model_type = request.args.get('type', 'all')
        models_data = nanogpt_client.get_models(model_type)

        if models_data:
            return jsonify({
                'success': True,
                'data': models_data,
                'type': model_type
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

@app.route('/openrouter')
def openrouter_index():
    """OpenRouter models page"""
    return render_template('openrouter.html')

@app.route('/api/openrouter/models')
def api_openrouter_models():
    """API endpoint to get OpenRouter models"""
    try:
        models_data = openrouter_client.get_models()

        if models_data:
            return jsonify({
                'success': True,
                'data': models_data
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to fetch models from OpenRouter API'
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/openrouter/models/<path:model_id>')
def api_openrouter_model_details(model_id):
    """API endpoint to get specific OpenRouter model details"""
    try:
        print(f"Fetching OpenRouter model details for: {model_id}")
        model_data = openrouter_client.get_model_details(model_id)

        if model_data:
            return jsonify({
                'success': True,
                'data': model_data
            })
        else:
            print(f"OpenRouter model not found: {model_id}")
            return jsonify({
                'success': False,
                'error': 'Model not found'
            }), 404

    except Exception as e:
        print(f"Error fetching OpenRouter model details: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@app.route('/api/models/<path:model_id>')
def api_model_details(model_id):
    """API endpoint to get specific model details"""
    try:
        print(f"Fetching details for model: {model_id}")
        model_data = nanogpt_client.get_model_details(model_id)

        if model_data:
            return jsonify({
                'success': True,
                'data': model_data
            })
        else:
            print(f"Model not found: {model_id}")
            return jsonify({
                'success': False,
                'error': 'Model not found'
            }), 404

    except Exception as e:
        print(f"Error fetching model details: {str(e)}")
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

@app.route('/test-endpoints')
def test_endpoints():
    """Test endpoint to verify API connectivity"""
    client = NanoGPTClient()
    results = {}

    # Test all endpoints
    for endpoint_type in ['all', 'subscription', 'paid']:
        try:
            data = client.get_models(endpoint_type)
            if data:
                results[endpoint_type] = {
                    'success': True,
                    'count': len(data.get('data', [])),
                    'message': f'Successfully fetched {len(data.get("data", []))} models'
                }
            else:
                results[endpoint_type] = {
                    'success': False,
                    'count': 0,
                    'message': 'No data returned'
                }
        except Exception as e:
            results[endpoint_type] = {
                'success': False,
                'count': 0,
                'message': f'Error: {str(e)}'
            }

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
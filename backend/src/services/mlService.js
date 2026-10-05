import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function request(path, method = 'get', data = null) {
  try {
    const url = `${ML_SERVICE_URL}${path}`;
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      const detail = error.response.data;
      throw new Error(detail.detail || detail.message || 'ML service error');
    }

    throw new Error('ML service is currently unavailable.');
  }
}

export async function predictAdvertisement(input) {
  return request('/predict', 'post', input);
}

export async function trainModel() {
  return request('/train', 'post', {});
}

export async function getModelInfo() {
  return request('/model-info', 'get');
}

export async function healthCheck() {
  return request('/health', 'get');
}

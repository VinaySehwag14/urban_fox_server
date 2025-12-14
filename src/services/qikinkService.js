const axios = require('axios');
const qs = require('qs');

const getAccessToken = async () => {
  try {
    const data = qs.stringify({
      ClientId: process.env.QIKINK_CLIENT_ID,
      client_secret: process.env.QIKINK_CLIENT_SECRET
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://sandbox.qikink.com/api/token',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error('Error fetching Qikink access token:', error?.response?.data || error.message);
    throw new Error('Failed to authenticate with Qikink');
  }
};

module.exports = {
  getAccessToken
};
